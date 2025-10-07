"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { copy } from "../../../content/copy";

const authCopy = copy.auth.signInPage;
const providerLabels: Record<string, string> = {
  github: authCopy.github,
  google: authCopy.google,
  email: authCopy.magicLink,
};

type OAuthProvider = { id: string };

export default function SignInProviders({
  oauthProviders,
  callbackUrl,
  errorMessage,
}: {
  oauthProviders: OAuthProvider[];
  callbackUrl: string;
  errorMessage?: string | null;
}) {
  return (
    <div className="space-y-6">
      {errorMessage ? (
        <div className="rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {errorMessage}
        </div>
      ) : null}

      {oauthProviders.length > 0 ? (
        <div className="space-y-3">
          {oauthProviders.map((provider) => (
            <button
              key={provider.id}
              type="button"
              onClick={() => signIn(provider.id, { callbackUrl })}
              className="w-full rounded-full bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300"
            >
              {providerLabels[provider.id] ?? `Continue with ${provider.id}`}
            </button>
          ))}
        </div>
      ) : null}

      <EmailAuthForm callbackUrl={callbackUrl} />
    </div>
  );
}

function EmailAuthForm({ callbackUrl }: { callbackUrl: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const toggleMode = () => {
    setMode((prev) => (prev === "signin" ? "signup" : "signin"));
    setError(null);
    setSuccess(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPending(true);
    setError(null);
    setSuccess(null);

    const formData = new FormData(event.currentTarget);
    const email = formData.get("email")?.toString().trim().toLowerCase();
    const password = formData.get("password")?.toString() ?? "";
    const name = formData.get("name")?.toString().trim() ?? undefined;

    if (!email || !password) {
      setError(authCopy.errorRequired);
      setPending(false);
      return;
    }

    try {
      if (mode === "signup") {
        const response = await fetch("/api/auth/email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, name }),
        });
        const payload = await response.json();
        if (!response.ok) {
          setError(payload?.error ?? authCopy.errors.default);
          setPending(false);
          return;
        }
        setSuccess(authCopy.success);
      }

      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl,
      });

      if (result?.error) {
        setError(authCopy.errorInvalid);
        setPending(false);
        return;
      }

      router.push(callbackUrl || "/dream");
      router.refresh();
    } catch (err) {
      console.error("Email auth error", err);
      setError(authCopy.errorUnexpected);
      setPending(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-100">
          {mode === "signin" ? authCopy.emailTitleSignIn : authCopy.emailTitleSignUp}
        </h2>
        <button
          type="button"
          onClick={toggleMode}
          className="text-xs font-medium text-emerald-300 transition hover:text-emerald-100"
        >
          {mode === "signin" ? authCopy.toggleToSignUp : authCopy.toggleToSignIn}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {mode === "signup" ? (
          <div className="space-y-1">
            <label className="block text-xs uppercase tracking-wide text-slate-400">
              {authCopy.nameLabel}
            </label>
            <input
              name="name"
              type="text"
              autoComplete="name"
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-emerald-400 focus:outline-none"
            />
          </div>
        ) : null}

        <div className="space-y-1">
          <label className="block text-xs uppercase tracking-wide text-slate-400">
            {authCopy.emailLabel}
          </label>
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            className="w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-emerald-400 focus:outline-none"
          />
        </div>

        <div className="space-y-1">
          <label className="block text-xs uppercase tracking-wide text-slate-400">
            {authCopy.passwordLabel}
          </label>
          <input
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            className="w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-emerald-400 focus:outline-none"
          />
        </div>

        {error ? (
          <div className="rounded-2xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-200">
            {error}
          </div>
        ) : null}

        {success ? (
          <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200">
            {success}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-full bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {pending
            ? authCopy.processing
            : mode === "signin"
            ? authCopy.submitSignIn
            : authCopy.submitSignUp}
        </button>
      </form>
    </div>
  );
}
