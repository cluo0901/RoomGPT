import { SupabaseAdapter } from "@auth/supabase-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import EmailProvider from "next-auth/providers/email";
import GithubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import type { NextAuthOptions, User } from "next-auth";
import type { Provider } from "next-auth/providers";
import { getServerSession } from "next-auth/next";
import { getSupabaseAdminClient } from "./lib/supabaseAdmin";

const {
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  NEXTAUTH_SECRET,
  GITHUB_ID,
  GITHUB_SECRET,
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  EMAIL_SERVER,
  EMAIL_FROM,
} = process.env;

function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  const allowlistRaw = process.env.ADMIN_EMAILS ?? "";
  const normalized = allowlistRaw
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
  const isAdmin = normalized.includes(email.toLowerCase());
  if (process.env.NODE_ENV !== "production") {
    console.log("[auth] Admin allowlist:", normalized, "checking", email, "=>", isAdmin);
  }
  return isAdmin;
}

console.log("[auth] Loaded ADMIN_EMAILS:", process.env.ADMIN_EMAILS);

const isProduction = process.env.NODE_ENV === "production";

const supabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY);

if (!supabaseConfigured && isProduction) {
  console.warn(
    "Supabase credentials are missing. Billing and credit enforcement will be disabled until SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are provided."
  );
}

if (!NEXTAUTH_SECRET && isProduction) {
  console.warn(
    "NEXTAUTH_SECRET is missing. Falling back to an insecure development secret; set NEXTAUTH_SECRET in production."
  );
}

const resolvedSecret = NEXTAUTH_SECRET ?? "development-nextauth-secret";

const providers: Provider[] = [];

if (GITHUB_ID && GITHUB_SECRET) {
  providers.push(
    GithubProvider({
      clientId: GITHUB_ID,
      clientSecret: GITHUB_SECRET,
    })
  );
}

if (GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          prompt: "select_account",
        },
      },
    })
  );
}

if (EMAIL_SERVER && EMAIL_FROM) {
  providers.push(
    EmailProvider({
      server: EMAIL_SERVER,
      from: EMAIL_FROM,
    })
  );
}

if (supabaseConfigured) {
  providers.push(
    CredentialsProvider({
      id: "credentials",
      name: "Email & Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const supabase = getSupabaseAdminClient();
        if (!supabase) {
          console.error("Supabase client unavailable for credentials sign-in");
          return null;
        }

        const email = credentials?.email?.toLowerCase().trim();
        const password = credentials?.password ?? "";

        if (!email || !password) {
          return null;
        }

        try {
          const nextAuth = supabase.schema("next_auth");
          const { data: user, error } = await nextAuth
            .from("users")
            .select("id, email, name, password_hash")
            .eq("email", email)
            .maybeSingle();

          if (error) {
            console.error("Failed to fetch credentials user", error);
            return null;
          }

          if (!user || !user.password_hash) {
            return null;
          }

          const valid = await bcrypt.compare(password, user.password_hash);
          if (!valid) {
            return null;
          }

          const result: User = {
            id: user.id,
            email: user.email,
            name: user.name ?? undefined,
            isAdmin: isAdminEmail(user.email),
          } as User;
          if (process.env.NODE_ENV !== "production") {
            console.log("[auth] credentials authorize result", result);
          }
          return result;
        } catch (error) {
          console.error("Credentials authorize error", error);
          return null;
        }
      },
    })
  );
} else if (providers.length === 0) {
  console.warn(
    "No OAuth/email providers configured. Falling back to a developer credentials provider."
  );

  providers.push(
    CredentialsProvider({
      name: "Developer Login",
      credentials: {
        email: {
          label: "Email",
          type: "email",
          placeholder: "dev@example.com",
        },
      },
      authorize: async (credentials) => {
        const email = credentials?.email ?? "dev@example.com";
        const result: User = {
          id: "dev-user",
          email,
          isAdmin: isAdminEmail(email),
        } as User;
        if (process.env.NODE_ENV !== "production") {
          console.log("[auth] fallback authorize result", result);
        }
        return result;
      },
    })
  );
}

export const authOptions: NextAuthOptions = {
  adapter: supabaseConfigured
    ? SupabaseAdapter({
        url: SUPABASE_URL!,
        secret: SUPABASE_SERVICE_ROLE_KEY!,
      })
    : undefined,
  session: {
    strategy: supabaseConfigured ? "database" : "jwt",
  },
  secret: resolvedSecret,
  providers,
  pages: {
    signIn: "/auth/signin",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.email = user.email ?? token.email;
        token.stripeCustomerId = (user as any)?.stripe_customer_id ?? null;
        if (typeof user.isAdmin === "boolean") {
          token.isAdmin = user.isAdmin;
        }
      }

      const email =
        typeof token.email === "string"
          ? token.email.toLowerCase()
          : user?.email?.toLowerCase();

      const isAdmin = email ? isAdminEmail(email) : token.isAdmin ?? false;
      token.isAdmin = isAdmin;

      if (process.env.NODE_ENV !== "production") {
        console.log("[auth] jwt callback", {
          email,
          tokenIsAdmin: token.isAdmin,
        });
      }

      return token;
    },
    async session({ session, user, token }) {
      if (session.user) {
        if (user) {
          session.user.id = user.id;
          session.user.stripeCustomerId = (user as any)?.stripe_customer_id ?? null;
        } else if (token?.sub) {
          session.user.id = token.sub;
          session.user.stripeCustomerId = token.stripeCustomerId ?? null;
        }
        if (session.user.email) {
          session.user.isAdmin = isAdminEmail(session.user.email);
        } else {
          session.user.isAdmin = token?.isAdmin ?? false;
        }
        if (process.env.NODE_ENV !== "production") {
          console.log("[auth] session callback", {
            email: session.user.email,
            sessionIsAdmin: session.user.isAdmin,
          });
        }
      }
      return session;
    },
  },
};

export async function getAuthSession() {
  return getServerSession(authOptions);
}
