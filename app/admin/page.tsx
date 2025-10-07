import { redirect } from "next/navigation";
import Footer from "../../components/Footer";
import Header from "../../components/Header";
import { getAuthSession } from "../../auth";
import AdminPanel from "./AdminPanel";
import { copy } from "../../content/copy";

export default async function AdminPage({
  searchParams,
}: {
  searchParams?: any;
}) {
  const adminCopy = copy.admin;
  const session = await getAuthSession();

  if (!session?.user?.isAdmin) {
    redirect(
      `/auth/signin?callbackUrl=${encodeURIComponent("/admin")}&error=Callback`
    );
  }

  const resolvedParams = searchParams
    ? typeof searchParams.then === "function"
      ? await searchParams
      : searchParams
    : {};
  const emailFromQuery =
    typeof resolvedParams.email === "string"
      ? resolvedParams.email
      : undefined;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 antialiased">
      <Header />
      <main className="mx-auto w-full max-w-5xl px-4 pb-24 pt-24 sm:px-6 lg:px-8">
        <div className="space-y-8">
          <header className="space-y-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-300">
              {adminCopy.badge ?? "Admin"}
            </span>
            <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              {adminCopy.title}
            </h1>
            <p className="text-sm text-slate-300 sm:text-base">
              {adminCopy.subtitle} <code className="rounded-md bg-white/10 px-1.5 py-0.5 text-xs text-emerald-200">ADMIN_EMAILS</code>.
            </p>
          </header>
          <AdminPanel initialEmail={emailFromQuery} />
        </div>
      </main>
      <Footer />
    </div>
  );
}
