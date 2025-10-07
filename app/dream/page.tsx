"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { UrlBuilder } from "@bytescale/sdk";
import { UploadWidgetConfig } from "@bytescale/upload-widget";
import { UploadDropzone } from "@bytescale/upload-widget-react";
import { CompareSlider } from "../../components/CompareSlider";
import Footer from "../../components/Footer";
import Header from "../../components/Header";
import LoadingDots from "../../components/LoadingDots";
import ResizablePanel from "../../components/ResizablePanel";
import Toggle from "../../components/Toggle";
import appendNewToName from "../../utils/appendNewToName";
import downloadPhoto from "../../utils/downloadPhoto";
import DropDown from "../../components/DropDown";
import { roomType, rooms, themeType, themes } from "../../utils/dropdownTypes";
import type { PromptSections } from "../../utils/prompts";
import { signIn, useSession } from "next-auth/react";

type GenerationMeta = {
  seed?: number;
  strength?: number;
  guidanceScale?: number;
  numInferenceSteps?: number;
  inferenceSeconds?: number;
  controlnets?: Array<{
    type?: string;
    conditioning_scale?: number;
    low_threshold?: number;
    high_threshold?: number;
  }>;
};

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

export default function DreamPage() {
  const { status } = useSession();
  const isAuthenticated = status === "authenticated";

  const [originalPhoto, setOriginalPhoto] = useState<string | null>(null);
  const [restoredImage, setRestoredImage] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [restoredLoaded, setRestoredLoaded] = useState<boolean>(false);
  const [sideBySide, setSideBySide] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [photoName, setPhotoName] = useState<string | null>(null);
  const [theme, setTheme] = useState<themeType>("Modern");
  const [room, setRoom] = useState<roomType>("Living Room");
  const [promptSections, setPromptSections] = useState<PromptSections | null>(
    null
  );
  const [generationMeta, setGenerationMeta] = useState<GenerationMeta | null>(
    null
  );

  const formatFloat = (value?: number) =>
    typeof value === "number" && !Number.isNaN(value)
      ? value.toFixed(2)
      : "n/a";

  const toNumberOrUndefined = (value: unknown): number | undefined => {
    if (typeof value === "number" && !Number.isNaN(value)) {
      return value;
    }
    if (typeof value === "string" && value.trim() !== "") {
      const parsed = Number(value);
      if (!Number.isNaN(parsed)) {
        return parsed;
      }
    }
    return undefined;
  };

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
            generatePhoto(imageUrl);
          }
        }}
        width="100%"
        height="260px"
      />
    </div>
  );

  async function generatePhoto(fileUrl: string) {
    if (!isAuthenticated) {
      signIn();
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, 200));
    setLoading(true);
    setRestoredLoaded(false);
    setPromptSections(null);
    setGenerationMeta(null);
    const res = await fetch("/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ imageUrl: fileUrl, theme, room }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      let errorMessage = "Image generation failed";
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
      setPromptSections(newPhoto?.prompt ?? null);
      const strengthValue = toNumberOrUndefined(newPhoto?.strength);
      const guidanceValue = toNumberOrUndefined(
        newPhoto?.guidanceScale ?? newPhoto?.guidance_scale
      );
      const inferenceSecondsValue = toNumberOrUndefined(
        newPhoto?.inferenceSeconds ?? newPhoto?.inference_seconds
      );
      const stepsValueRaw =
        typeof newPhoto?.numInferenceSteps === "number"
          ? newPhoto.numInferenceSteps
          : typeof newPhoto?.num_inference_steps === "number"
          ? newPhoto.num_inference_steps
          : toNumberOrUndefined(
              newPhoto?.numInferenceSteps ?? newPhoto?.num_inference_steps
            );
      const stepsValue =
        typeof stepsValueRaw === "number"
          ? Math.round(stepsValueRaw)
          : undefined;
      setGenerationMeta({
        seed: newPhoto?.seed,
        strength: strengthValue,
        guidanceScale: guidanceValue,
        numInferenceSteps: stepsValue,
        inferenceSeconds: inferenceSecondsValue,
        controlnets: newPhoto?.controlnets ?? undefined,
      });
    } else {
      setError("Image generation failed");
      setPromptSections(null);
      setGenerationMeta(null);
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
              Interactive editor
            </span>
            <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
              Generate polished redesigns from any room photo
            </h1>
            <p className="text-base text-slate-300 sm:text-lg">
              Upload a space, choose a vibe, and deliver magazine-worthy renderings in minutes. RoomGPT preserves your layout while refreshing finishes, lighting, and decor.
            </p>
            <ul className="space-y-3 text-sm text-slate-300">
              <li className="flex items-start gap-3">
                <span className="mt-1 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/5 text-xs font-semibold text-emerald-200">
                  01
                </span>
                <div>
                  <p className="font-medium text-white">Upload any room photo</p>
                  <p className="text-slate-400">
                    No staging required—RoomGPT keeps proportions grounded in your source image.
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/5 text-xs font-semibold text-emerald-200">
                  02
                </span>
                <div>
                  <p className="font-medium text-white">Explore curated styles</p>
                  <p className="text-slate-400">
                    Mix presets with custom prompts and iterate until you nail the concept.
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/5 text-xs font-semibold text-emerald-200">
                  03
                </span>
                <div>
                  <p className="font-medium text-white">Share, compare, and download</p>
                  <p className="text-slate-400">
                    Use interactive sliders, export HD renders, and keep the prompt breakdown for reuse.
                  </p>
                </div>
              </li>
            </ul>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300 backdrop-blur lg:max-w-sm">
              Manage billing and credits from your{" "}
              <Link href="/dashboard" className="font-semibold text-white underline decoration-emerald-300/70 underline-offset-4">
                dashboard
              </Link>
              . Unlimited plans unlock faster generations.
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 -top-10 -z-10 hidden rounded-[2.5rem] bg-gradient-to-br from-emerald-500/20 via-transparent to-blue-600/20 blur-3xl lg:block" />
            <div className="rounded-[2.5rem] border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur">
              {!isAuthenticated && (
                <div className="mb-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-100">
                  Sign in to generate rooms and save your progress. Credits and subscriptions live in your dashboard.
                </div>
              )}
              <ResizablePanel>
                <AnimatePresence mode="wait">
                  <motion.div className="flex w-full flex-col items-center gap-6 text-left">
                    {!restoredImage ? (
                      <div className="w-full space-y-6">
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <Image
                              src="/number-1-white.svg"
                              width={30}
                              height={30}
                              alt="Step one"
                            />
                            <p className="text-sm font-medium text-white">
                              Choose your style
                            </p>
                          </div>
                          <DropDown
                            theme={theme}
                            setTheme={(newTheme) =>
                              setTheme(newTheme as typeof theme)
                            }
                            themes={themes}
                          />
                        </div>
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <Image
                              src="/number-2-white.svg"
                              width={30}
                              height={30}
                              alt="Step two"
                            />
                            <p className="text-sm font-medium text-white">
                              Select your room type
                            </p>
                          </div>
                          <DropDown
                            theme={room}
                            setTheme={(newRoom) => setRoom(newRoom as typeof room)}
                            themes={rooms}
                          />
                        </div>
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <Image
                              src="/number-3-white.svg"
                              width={30}
                              height={30}
                              alt="Step three"
                            />
                            <p className="text-sm font-medium text-white">
                              Upload your reference photo
                            </p>
                          </div>
                          <div className="overflow-hidden rounded-2xl border border-dashed border-white/20 bg-white/5 px-4 py-6">
                            <UploadDropZone />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full space-y-2 text-sm text-slate-300">
                        <p>
                          Here's your remodeled{" "}
                          <span className="font-semibold text-white">
                            {room.toLowerCase()}
                          </span>{" "}
                          in the{" "}
                          <span className="font-semibold text-white">
                            {theme.toLowerCase()}
                          </span>{" "}
                          theme.
                        </p>
                        <p className="text-xs text-slate-400">
                          Toggle views or download the HD render below.
                        </p>
                      </div>
                    )}

                    {restoredLoaded ? (
                      <Toggle
                        className="self-stretch rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
                        sideBySide={sideBySide}
                        setSideBySide={(newVal) => setSideBySide(newVal)}
                      />
                    ) : null}

                    {restoredLoaded && sideBySide ? (
                      <CompareSlider original={originalPhoto!} restored={restoredImage!} />
                    ) : null}

                    {originalPhoto && !restoredImage ? (
                      <Image
                        alt="original room"
                        src={originalPhoto}
                        className="h-[420px] w-full rounded-3xl object-cover"
                        width={512}
                        height={512}
                      />
                    ) : null}

                    {restoredImage && originalPhoto && !sideBySide ? (
                      <div className="grid w-full gap-4 sm:grid-cols-2">
                        <figure className="space-y-2">
                          <figcaption className="text-sm font-medium text-slate-200">
                            Original
                          </figcaption>
                          <Image
                            alt="original room"
                            src={originalPhoto}
                            className="h-[260px] w-full rounded-3xl object-cover"
                            width={512}
                            height={512}
                          />
                        </figure>
                        <figure className="space-y-2">
                          <figcaption className="text-sm font-medium text-slate-200">
                            Generated
                          </figcaption>
                          <a href={restoredImage} target="_blank" rel="noreferrer">
                            <Image
                              alt="generated room"
                              src={restoredImage}
                              className="h-[260px] w-full cursor-zoom-in rounded-3xl object-cover"
                              width={512}
                              height={512}
                              onLoadingComplete={() => setRestoredLoaded(true)}
                              unoptimized
                            />
                          </a>
                        </figure>
                      </div>
                    ) : null}

                    {loading ? (
                      <div className="flex w-full items-center justify-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white">
                        <LoadingDots color="white" style="large" />
                      </div>
                    ) : null}

                    {error ? (
                      <div
                        className="w-full rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200"
                        role="alert"
                      >
                        {error}
                      </div>
                    ) : null}

                    <div className="flex w-full flex-col gap-3 sm:flex-row">
                      {originalPhoto && !loading ? (
                        <button
                          onClick={() => {
                            setOriginalPhoto(null);
                            setRestoredImage(null);
                            setRestoredLoaded(false);
                            setError(null);
                            setGenerationMeta(null);
                            setPromptSections(null);
                          }}
                          className="inline-flex flex-1 items-center justify-center rounded-full border border-white/15 bg-white/5 px-5 py-2 text-sm font-semibold text-white transition hover:border-white/30 hover:bg-white/10"
                        >
                          Generate new room
                        </button>
                      ) : null}
                      {restoredLoaded ? (
                        <button
                          onClick={() => {
                            downloadPhoto(restoredImage!, appendNewToName(photoName!));
                          }}
                          className="inline-flex flex-1 items-center justify-center rounded-full bg-emerald-400 px-5 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300"
                        >
                          Download render
                        </button>
                      ) : null}
                    </div>
                  </motion.div>
                </AnimatePresence>
              </ResizablePanel>
            </div>
          </div>
        </section>

        {promptSections ? (
          <section className="rounded-[2.5rem] border border-white/10 bg-white/5 p-8 text-left shadow-2xl backdrop-blur">
            <div className="space-y-6">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
                <h2 className="text-2xl font-semibold text-white">Prompt breakdown</h2>
                {generationMeta?.inferenceSeconds ? (
                  <p className="text-xs uppercase tracking-wide text-slate-400">
                    Generated in {generationMeta.inferenceSeconds.toFixed(1)} seconds
                  </p>
                ) : null}
              </div>
              <div className="grid gap-6 sm:grid-cols-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-400">
                    General
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-200">
                    {promptSections.general}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-400">
                    Room
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-200">
                    {promptSections.room}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-400">
                    Style
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-200">
                    {promptSections.theme}
                  </p>
                </div>
              </div>
              {generationMeta ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200">
                    <p className="text-xs uppercase tracking-wide text-slate-400">Sampling</p>
                    <div className="mt-2 space-y-1.5">
                      <p>Seed: {generationMeta.seed ?? "Random"}</p>
                      <p>Strength: {formatFloat(generationMeta.strength)}</p>
                      <p>Guidance: {formatFloat(generationMeta.guidanceScale)}</p>
                      <p>Steps: {generationMeta.numInferenceSteps ?? "n/a"}</p>
                    </div>
                  </div>
                  {generationMeta.controlnets ? (
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200">
                      <p className="text-xs uppercase tracking-wide text-slate-400">
                        ControlNet
                      </p>
                      <div className="mt-2 space-y-2">
                        {generationMeta.controlnets.map((item, index) => {
                          const conditioningScale =
                            typeof item.conditioning_scale === "number"
                              ? item.conditioning_scale
                              : Number(item.conditioning_scale);

                          return (
                            <div key={`${item.type}-${index}`} className="space-y-1">
                              <p>Type: {item.type ?? "canny"}</p>
                              {item.conditioning_scale !== undefined ? (
                                <p>Scale: {formatFloat(conditioningScale)}</p>
                              ) : null}
                              {item.low_threshold !== undefined ||
                              item.high_threshold !== undefined ? (
                                <p>
                                  Thresholds: {item.low_threshold ?? "?"}/
                                  {item.high_threshold ?? "?"}
                                </p>
                              ) : null}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          </section>
        ) : null}
      </main>
      <Footer />
    </div>
  );
}
