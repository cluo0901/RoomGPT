import { Analytics } from "@vercel/analytics/react";
import { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "../styles/globals.css";
import AuthProvider from "../components/AuthProvider";

const title = "RoomGPT – Redesign your room with AI";
const description =
  "Upload any room photo and explore photorealistic redesigns in seconds. Compare styles, download HD renders, and manage billing in one place.";
const ogimage = "https://roomgpt.io/og-image.png";
const sitename = "RoomGPT";

const font = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title,
  description,
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    images: [ogimage],
    title,
    description,
    url: "https://roomgpt-demo.vercel.app",
    siteName: sitename,
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    images: [ogimage],
    title,
    description,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${font.className} min-h-screen bg-slate-950 text-slate-100 antialiased`}
      >
        <div className="relative min-h-screen overflow-hidden">
          <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.25),_transparent_55%)]" />
          <div className="pointer-events-none absolute inset-y-0 right-0 -z-10 hidden w-1/2 bg-[radial-gradient(circle_at_center,_rgba(59,130,246,0.2),_transparent_60%)] blur-3xl lg:block" />
          <AuthProvider>{children}</AuthProvider>
        </div>
        <Analytics />
      </body>
    </html>
  );
}
