"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { signIn, signOut } from "next-auth/react";
import { copy } from "../content/copy";

const headerCopy = copy.header;
const NAV_LINKS = [
  { href: "#how-it-works", label: headerCopy.nav.howItWorks },
  { href: "#styles", label: headerCopy.nav.styles },
  { href: "#pricing", label: headerCopy.nav.pricing },
];

export default function Header() {
  const pathname = usePathname();
  const { status, data } = useSession();

  const isAuthenticated = status === "authenticated";
  const isAdmin = Boolean(data?.user?.isAdmin);
  const isHome = pathname === "/";

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/80 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="text-lg font-semibold tracking-tight text-white">
          {headerCopy.brand}
        </Link>

        <div className="ml-auto hidden items-center gap-7 text-base font-semibold text-white md:flex">
          {NAV_LINKS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className={`tracking-tight transition hover:text-emerald-300 ${!isHome ? "pointer-events-none opacity-50" : ""}`}
            >
              {item.label}
            </a>
          ))}
          {isAuthenticated ? (
            <Link
              href="/dashboard"
              className="hidden rounded-full border border-white/10 px-4 py-2 font-medium text-slate-200 transition hover:bg-white/10 md:inline-flex"
            >
              {headerCopy.nav.dashboard}
            </Link>
          ) : null}
          {isAdmin ? (
            <Link
              href="/admin"
              className="hidden rounded-full border border-emerald-400/40 px-4 py-2 font-medium text-emerald-200 transition hover:bg-emerald-400/10 md:inline-flex"
            >
              {headerCopy.nav.admin}
            </Link>
          ) : null}
          <button
            type="button"
            onClick={() =>
              isAuthenticated
                ? signOut({ callbackUrl: pathname === "/" ? "/" : pathname })
                : signIn()
            }
            className="rounded-full bg-emerald-400 px-4 py-2 text-base font-semibold text-slate-950 transition hover:bg-emerald-300"
          >
            {isAuthenticated ? headerCopy.nav.signOut : headerCopy.nav.signIn}
          </button>
        </div>
      </div>
    </header>
  );
}
