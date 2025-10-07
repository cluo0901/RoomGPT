import { redirect } from "next/navigation";
import { getAuthSession } from "../../auth";
import AdminPanel from "./AdminPanel";

export default async function AdminPage({
  searchParams,
}: {
  searchParams?: any;
}) {
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
    <div className="min-h-screen bg-[#17181C] text-white">
      <div className="mx-auto w-full max-w-5xl px-6 py-12 space-y-8">
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold">Admin control panel</h1>
          <p className="text-sm text-slate-300">
            Manage user credits, plan status, and review recent usage. Only emails
            listed in <code>ADMIN_EMAILS</code> can access this page.
          </p>
        </header>
        <AdminPanel initialEmail={emailFromQuery} />
      </div>
    </div>
  );
}
