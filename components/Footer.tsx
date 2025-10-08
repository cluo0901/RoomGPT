import { copy } from "../content/copy";

const footerCopy = copy.footer;

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-slate-950/80">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-slate-400 sm:flex-row sm:px-6">
        <p>© {new Date().getFullYear()} {footerCopy.copyrightSuffix}</p>
        <a
          href={`mailto:${footerCopy.supportEmail}`}
          className="transition hover:text-white"
        >
          {footerCopy.supportEmail}
        </a>
      </div>
    </footer>
  );
}
