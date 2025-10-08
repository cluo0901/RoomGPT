"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { UrlBuilder } from "@bytescale/sdk";
import { UploadWidgetConfig } from "@bytescale/upload-widget";
import { UploadDropzone } from "@bytescale/upload-widget-react";
import Footer from "../../components/Footer";
import Header from "../../components/Header";
import LoadingDots from "../../components/LoadingDots";
import ResizablePanel from "../../components/ResizablePanel";
import appendNewToName from "../../utils/appendNewToName";
import downloadPhoto from "../../utils/downloadPhoto";
import DropDown from "../../components/DropDown";
import { roomType, rooms, themeType, themes } from "../../utils/dropdownTypes";
import { signIn, useSession } from "next-auth/react";
import { copy } from "../../content/copy";

const options: UploadWidgetConfig = {
  apiKey: !!process.env.NEXT_PUBLIC_UPLOAD_API_KEY
      ? process.env.NEXT_PUBLIC_UPLOAD_API_KEY
      : "free",
  maxFileCount: 1,
  mimeTypes: ["image/jpeg", "image/png", "image/jpg"],
  editor: { images: { crop: false } },
  styles: {
    colors: {
      primary: "#2563EB",
      error: "#d23f4d",
      shade100: "#fff",
      shade200: "#fffe",
      shade300: "#fffd",
      shade400: "#fffc",
      shade500: "#fff9",
      shade600: "#fff7",
      shade700: "#fff2",
      shade800: "#fff1",
      shade900: "#ffff",
    },
  },
};

const dreamCopy = copy.dream;
const stepIndicators = [
  { number: "1", label: dreamCopy.uploadStep },
  { number: "2", label: `${dreamCopy.roomStep} · ${dreamCopy.styleStep}` },
  { number: "3", label: dreamCopy.generateButton },
];

export default function DreamPage() {
  const { status } = useSession();
  const isAuthenticated = status === "authenticated";

  const [originalPhoto, setOriginalPhoto] = useState<string | null>(null);
  const [restoredImage, setRestoredImage] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [restoredLoaded, setRestoredLoaded] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [photoName, setPhotoName] = useState<string | null>(null);
  const [theme, setTheme] = useState<themeType>("Modern");
  const [room, setRoom] = useState<roomType>("Living Room");
  const [pendingFileUrl, setPendingFileUrl] = useState<string | null>(null);

  const UploadDropZone = () => (
    <div className={!isAuthenticated ? "pointer-events-none opacity-60" : ""}>
      <UploadDropzone
        options={options}
        onUpdate={({ uploadedFiles }) => {
          if (!isAuthenticated) {
            signIn();
            return;
          }
          if (uploadedFiles.length !== 0) {
            const image = uploadedFiles[0];
            const imageName = image.originalFile.originalFileName;
            const imageUrl = UrlBuilder.url({
              accountId: image.accountId,
              filePath: image.filePath,
              options: {
                transformation: "preset",
                transformationPreset: "thumbnail",
              },
            });
            setPhotoName(imageName);
            setOriginalPhoto(imageUrl);
            setPendingFileUrl(imageUrl);
            setRestoredImage(null);
            setRestoredLoaded(false);
            setError(null);
          }
        }}
        width="100%"
        height="260px"
      />
    </div>
  );

  const handleGenerateClick = () => {
    if (loading) {
      return;
    }
    if (!isAuthenticated) {
      signIn();
      return;
    }
    if (!pendingFileUrl) {
      setError(dreamCopy.missingPhotoError);
      return;
    }

    setError(null);
    setRestoredImage(null);
    setRestoredLoaded(false);
    void generatePhoto(pendingFileUrl);
  };

  async function generatePhoto(fileUrl: string) {
    if (!isAuthenticated) {
      signIn();
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, 200));
    setLoading(true);
    setRestoredLoaded(false);
    setError(null);
    const res = await fetch("/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ imageUrl: fileUrl, theme, room }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      let errorMessage = dreamCopy.errorFallback;
      try {
        const parsed = JSON.parse(errorText);
        if (typeof parsed?.error === "string") {
          errorMessage = parsed.error;
        }
      } catch {
        if (errorText) {
          errorMessage = errorText;
        }
      }

      setError(errorMessage);
      setLoading(false);
      return;
    }

    const newPhoto = await res.json();
    const generatedImage =
      newPhoto?.generated ?? newPhoto?.image ?? newPhoto?.[1];

    if (typeof generatedImage === "string") {
      setRestoredImage(generatedImage);
      setError(null);
    } else {
      setError(dreamCopy.errorFallback);
    }

    setTimeout(() => {
      setLoading(false);
    }, 1300);
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 antialiased">
      <Header />
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-16 px-4 pb-24 pt-24 sm:px-6 lg:gap-20">
        <section className="grid items-start gap-12 lg:grid-cols-[1.05fr_1fr]">
          <div className="space-y-6">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-300">
              {dreamCopy.badge}
            </span>
            <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
              {dreamCopy.title}
            </h1>
            <p className="text-base text-slate-300 sm:text-lg">
              {dreamCopy.description}
            </p>
            <ul className="space-y-3 text-sm text-slate-300">
              {dreamCopy.benefits.map((benefit, index) => (
                <li key={benefit.title} className="flex items-start gap-3">
                  <span className="mt-1 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/5 text-xs font-semibold text-emerald-200">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <p className="font-medium text-white">{benefit.title}</p>
                    <p className="text-slate-400">{benefit.description}</p>
                  </div>
                </li>
              ))}
            </ul>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300 backdrop-blur lg:max-w-sm">
              {dreamCopy.billingReminderPrefix}
              <Link href="/dashboard" className="font-semibold text-white underline decoration-emerald-300/70 underline-offset-4">
                {dreamCopy.billingReminderLink}
              </Link>
              {dreamCopy.billingReminderSuffix}
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 -top-10 -z-10 hidden rounded-[2.5rem] bg-gradient-to-br from-emerald-500/20 via-transparent to-blue-600/20 blur-3xl lg:block" />
            <div className="rounded-[2.5rem] border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur">
              {!isAuthenticated && (
                <div className="mb-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-100">
                  {dreamCopy.authBanner}
                </div>
              )}
              <ResizablePanel>
                <AnimatePresence mode="wait">
                  <motion.div className="w-full space-y-6">
                    <ol className="relative grid grid-cols-3 gap-4 sm:gap-6">
                      {stepIndicators.map((step, index) => (
                        <li key={step.number} className="relative flex flex-1 flex-col items-center text-center">
                          <div className="relative flex h-10 w-full items-center justify-center">
                            {index > 0 ? (
                              <span className="absolute left-0 top-1/2 hidden h-[3px] w-1/2 -translate-y-1/2 bg-gradient-to-r from-transparent via-emerald-400/50 to-emerald-400/90 sm:block" />
                            ) : null}
                            {index < stepIndicators.length - 1 ? (
                              <span className="absolute right-0 top-1/2 hidden h-[3px] w-1/2 -translate-y-1/2 bg-gradient-to-r from-emerald-400/90 via-emerald-400/50 to-transparent sm:block" />
                            ) : null}
                            <div className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full border-2 border-emerald-400 bg-slate-950 text-sm font-semibold text-emerald-200 shadow-[0_0_18px_rgba(16,185,129,0.35)]">
                              {step.number}
                            </div>
                          </div>
                          <p className="mt-3 max-w-[8rem] text-[11px] font-medium uppercase tracking-wide text-slate-400">
                            {step.label}
                          </p>
                        </li>
                      ))}
                    </ol>

                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <UploadDropZone />
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-4 sm:space-y-0 sm:gap-4 sm:grid sm:grid-cols-2">
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-white">{dreamCopy.roomStep}</p>
                        <DropDown
                          theme={room}
                          setTheme={(newRoom) => setRoom(newRoom as typeof room)}
                          themes={rooms}
                        />
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-white">{dreamCopy.styleStep}</p>
                        <DropDown
                          theme={theme}
                          setTheme={(newTheme) => setTheme(newTheme as typeof theme)}
                          themes={themes}
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <button
                        type="button"
                        onClick={handleGenerateClick}
                        disabled={loading || !pendingFileUrl}
                        className="inline-flex w-full items-center justify-center rounded-full bg-emerald-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {loading ? <LoadingDots color="black" style="large" /> : dreamCopy.generateButton}
                      </button>
                      {error ? (
                        <div
                          className="w-full rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200"
                          role="alert"
                        >
                          {error}
                        </div>
                      ) : null}
                    </div>
                  </motion.div>
                </AnimatePresence>
              </ResizablePanel>
            </div>
          </div>
        </section>

        {(originalPhoto || restoredImage || loading) && (
          <section className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              {originalPhoto ? (
                <figure className="space-y-4">
                  <figcaption className="text-sm font-semibold uppercase tracking-wide text-slate-400">
                    {dreamCopy.originalLabel}
                  </figcaption>
                  <Image
                    alt="original room"
                    src={originalPhoto}
                    className="aspect-[4/3] w-full rounded-[28px] object-cover"
                    width={768}
                    height={576}
                  />
                </figure>
              ) : null}

              <figure className="space-y-4">
                <figcaption className="text-sm font-semibold uppercase tracking-wide text-slate-400">
                  {dreamCopy.generatedLabel}
                </figcaption>
                {restoredImage ? (
                  <a href={restoredImage} target="_blank" rel="noreferrer">
                    <Image
                      alt="generated room"
                      src={restoredImage}
                      className="aspect-[4/3] w-full cursor-zoom-in rounded-[28px] object-cover"
                      width={768}
                      height={576}
                      onLoadingComplete={() => setRestoredLoaded(true)}
                      unoptimized
                    />
                  </a>
                ) : (
                  <div className="flex aspect-[4/3] w-full items-center justify-center rounded-[28px] border border-dashed border-white/15 bg-white/5">
                    {loading ? <LoadingDots color="white" style="large" /> : <p className="text-sm text-slate-500">{dreamCopy.resultsPlaceholder}</p>}
                  </div>
                )}
              </figure>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              {originalPhoto && !loading ? (
                <button
                  onClick={() => {
                    setOriginalPhoto(null);
                    setRestoredImage(null);
                    setRestoredLoaded(false);
                    setError(null);
                    setPendingFileUrl(null);
                    setPhotoName(null);
                  }}
                  className="inline-flex flex-1 items-center justify-center rounded-full border border-white/15 bg-white/5 px-5 py-2 text-sm font-semibold text-white transition hover:border-white/30 hover:bg-white/10"
                >
                  {dreamCopy.newRoom}
                </button>
              ) : null}
              {restoredLoaded && restoredImage ? (
                <button
                  onClick={() => {
                    downloadPhoto(restoredImage, appendNewToName(photoName ?? "room"));
                  }}
                  className="inline-flex flex-1 items-center justify-center rounded-full bg-emerald-400 px-5 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300"
                >
                  {dreamCopy.download}
                </button>
              ) : null}
            </div>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}
