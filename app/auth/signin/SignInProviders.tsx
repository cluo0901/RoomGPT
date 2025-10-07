"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

const providerLabels: Record<string, string> = {
  github: "Continue with GitHub",
  google: "Continue with Google",
  email: "Send magic link",
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
      setError("Email and password are required.");
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
          setError(payload?.error ?? "Failed to create account.");
          setPending(false);
          return;
        }
        setSuccess("Account created. Signing you in...");
      }

      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl,
      });

      if (result?.error) {
        setError("Invalid email or password.");
        setPending(false);
        return;
      }

      router.push(callbackUrl || "/dream");
      router.refresh();
    } catch (err) {
      console.error("Email auth error", err);
      setError("Unexpected error. Please try again.");
      setPending(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-100">
          {mode === "signin" ? "Sign in with email" : "Create an account"}
        </h2>
        <button
          type="button"
          onClick={toggleMode}
          className="text-xs font-medium text-emerald-300 transition hover:text-emerald-100"
        >
          {mode === "signin"
            ? "Need an account? Sign up"
            : "Have an account? Sign in"}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {mode === "signup" ? (
          <div className="space-y-1">
            <label className="block text-xs uppercase tracking-wide text-slate-400">
              Name (optional)
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
            Email
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
            Password
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
            ? "Processing..."
            : mode === "signin"
            ? "Sign in with email"
            : "Create account"}
        </button>
      </form>
    </div>
  );
}
