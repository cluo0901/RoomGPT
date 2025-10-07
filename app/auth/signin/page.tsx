import { redirect } from "next/navigation";
import Footer from "../../../components/Footer";
import Header from "../../../components/Header";
import { getAuthSession } from "../../../auth";
import SignInProviders from "./SignInProviders";
import { copy } from "../../../content/copy";

const authCopy = copy.auth.signInPage;
const ERROR_MESSAGES: Record<string, string> = authCopy.errors;

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
    ? ERROR_MESSAGES[rawError] ?? authCopy.errors.default
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
    <div className="min-h-screen bg-slate-950 text-slate-100 antialiased">
      <Header />
      <main className="mx-auto flex w-full max-w-5xl flex-col items-center gap-10 px-4 pb-24 pt-24 sm:px-6">
        <div className="space-y-4 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-300">
            {authCopy.badge ?? "Welcome back"}
          </span>
          <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            {authCopy.title}
          </h1>
          <p className="mx-auto max-w-xl text-sm text-slate-300 sm:text-base">
            {authCopy.subtitle}
          </p>
        </div>
        <div className="w-full max-w-lg space-y-6 rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur">
          <h2 className="text-lg font-semibold text-white text-center">
            {authCopy.chooseMethod}
          </h2>
          <SignInProviders
            oauthProviders={oauthProviders}
            callbackUrl={callbackUrl}
            errorMessage={errorMessage}
          />
        </div>
      </main>
      <Footer />
    </div>
  );
}
