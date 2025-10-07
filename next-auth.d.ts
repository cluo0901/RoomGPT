import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      stripeCustomerId?: string | null;
      isAdmin?: boolean;
    };
  }

  interface User {
    stripe_customer_id?: string | null;
    isAdmin?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    stripeCustomerId?: string | null;
    isAdmin?: boolean;
  }
}
