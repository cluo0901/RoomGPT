import { redirect } from "next/navigation";
import { getAuthSession } from "../../../auth";
import SignInProviders from "./SignInProviders";

const ERROR_MESSAGES: Record<string, string> = {
  OAuthAccountNotLinked:
    "That email is already linked to another login method. Try signing in with the provider you used previously or create a password for email login.",
  CredentialsSignin: "Invalid email or password. Please try again.",
  Callback: "We couldn't complete the login flow. Try again or use a different method.",
};

export default async function SignInPage({
  searchParams,
}: {
  searchParams?: any;
}) {
  const session = await getAuthSession();
  if (session) {
    redirect("/dream");
  }

  const resolvedParams = searchParams
    ? typeof searchParams.then === "function"
      ? await searchParams
      : searchParams
    : {};

  const callbackUrl =
    typeof resolvedParams?.callbackUrl === "string"
      ? resolvedParams.callbackUrl
      : "/dream";

  const rawError =
    typeof resolvedParams?.error === "string"
      ? resolvedParams.error
      : undefined;
  const errorMessage = rawError
    ? ERROR_MESSAGES[rawError] ?? "Sign-in failed. Please try again."
    : null;

  const oauthProviders: Array<{ id: string }> = [];

  if (process.env.GITHUB_ID && process.env.GITHUB_SECRET) {
    oauthProviders.push({ id: "github" });
  }

  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    oauthProviders.push({ id: "google" });
  }

  if (process.env.EMAIL_SERVER && process.env.EMAIL_FROM) {
    oauthProviders.push({ id: "email" });
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#17181C] text-white px-6">
      <div className="w-full max-w-md space-y-6 rounded-xl border border-slate-700 p-8 shadow-xl bg-[#1F2025]">
        <h1 className="text-2xl font-semibold text-center">Sign in</h1>
        <p className="text-sm text-slate-300 text-center">
          Continue with Google or use email and password.
        </p>
        <SignInProviders
          oauthProviders={oauthProviders}
          callbackUrl={callbackUrl}
          errorMessage={errorMessage}
        />
      </div>
    </div>
  );
}
