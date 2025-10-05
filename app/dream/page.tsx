"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
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
      primary: "#2563EB", // Primary buttons & links
      error: "#d23f4d", // Error messages
      shade100: "#fff", // Standard text
      shade200: "#fffe", // Secondary button text
      shade300: "#fffd", // Secondary button text (hover)
      shade400: "#fffc", // Welcome text
      shade500: "#fff9", // Modal close button
      shade600: "#fff7", // Border
      shade700: "#fff2", // Progress indicator background
      shade800: "#fff1", // File item background
      shade900: "#ffff", // Various (draggable crop buttons, etc.)
    },
  },
};

export default function DreamPage() {
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
    <UploadDropzone
      options={options}
      onUpdate={({ uploadedFiles }) => {
        if (uploadedFiles.length !== 0) {
          const image = uploadedFiles[0];
          const imageName = image.originalFile.originalFileName;
          const imageUrl = UrlBuilder.url({
            accountId: image.accountId,
            filePath: image.filePath,
            options: {
              transformation: "preset",
              transformationPreset: "thumbnail"
            }
          });
          setPhotoName(imageName);
          setOriginalPhoto(imageUrl);
          generatePhoto(imageUrl);
        }
      }}
      width="670px"
      height="250px"
    />
  );

  async function generatePhoto(fileUrl: string) {
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
    <div className="flex max-w-6xl mx-auto flex-col items-center justify-center py-2 min-h-screen">
      <Header />
      <main className="flex flex-1 w-full flex-col items-center justify-center text-center px-4 mt-4 sm:mb-0 mb-8">
        <h1 className="mx-auto max-w-4xl font-display text-4xl font-bold tracking-normal text-slate-100 sm:text-6xl mb-5">
          Generate your <span className="text-blue-600">dream</span> room
        </h1>
        <ResizablePanel>
          <AnimatePresence mode="wait">
            <motion.div className="flex justify-between items-center w-full flex-col mt-4">
              {!restoredImage && (
                <>
                  <div className="space-y-4 w-full max-w-sm">
                    <div className="flex mt-3 items-center space-x-3">
                      <Image
                        src="/number-1-white.svg"
                        width={30}
                        height={30}
                        alt="1 icon"
                      />
                      <p className="text-left font-medium">
                        Choose your room theme.
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
                  <div className="space-y-4 w-full max-w-sm">
                    <div className="flex mt-10 items-center space-x-3">
                      <Image
                        src="/number-2-white.svg"
                        width={30}
                        height={30}
                        alt="1 icon"
                      />
                      <p className="text-left font-medium">
                        Choose your room type.
                      </p>
                    </div>
                    <DropDown
                      theme={room}
                      setTheme={(newRoom) => setRoom(newRoom as typeof room)}
                      themes={rooms}
                    />
                  </div>
                  <div className="mt-4 w-full max-w-sm">
                    <div className="flex mt-6 w-96 items-center space-x-3">
                      <Image
                        src="/number-3-white.svg"
                        width={30}
                        height={30}
                        alt="1 icon"
                      />
                      <p className="text-left font-medium">
                        Upload a picture of your room.
                      </p>
                    </div>
                  </div>
                </>
              )}
              {restoredImage && (
                <div>
                  Here's your remodeled <b>{room.toLowerCase()}</b> in the{" "}
                  <b>{theme.toLowerCase()}</b> theme!{" "}
                </div>
              )}
              <div
                className={`${
                  restoredLoaded ? "visible mt-6 -ml-8" : "invisible"
                }`}
              >
                <Toggle
                  className={`${restoredLoaded ? "visible mb-6" : "invisible"}`}
                  sideBySide={sideBySide}
                  setSideBySide={(newVal) => setSideBySide(newVal)}
                />
              </div>
              {restoredLoaded && sideBySide && (
                <CompareSlider
                  original={originalPhoto!}
                  restored={restoredImage!}
                />
              )}
              {!originalPhoto && <UploadDropZone />}
              {originalPhoto && !restoredImage && (
                <Image
                  alt="original photo"
                  src={originalPhoto}
                  className="rounded-2xl h-96"
                  width={475}
                  height={475}
                />
              )}
              {restoredImage && originalPhoto && !sideBySide && (
                <div className="flex sm:space-x-4 sm:flex-row flex-col">
                  <div>
                    <h2 className="mb-1 font-medium text-lg">Original Room</h2>
                    <Image
                      alt="original photo"
                      src={originalPhoto}
                      className="rounded-2xl object-cover w-[475px] h-96"
                      width={475}
                      height={475}
                      unoptimized
                    />
                  </div>
                  <div className="sm:mt-0 mt-8">
                    <h2 className="mb-1 font-medium text-lg">Generated Room</h2>
                    <a href={restoredImage} target="_blank" rel="noreferrer">
                      <Image
                        alt="restored photo"
                        src={restoredImage}
                        className="rounded-2xl object-cover sm:mt-0 mt-2 cursor-zoom-in w-[475px] h-96"
                        width={475}
                        height={475}
                        unoptimized
                        onLoadingComplete={() => setRestoredLoaded(true)}
                      />
                    </a>
                  </div>
                </div>
              )}
              {loading && (
                <button
                  disabled
                  className="bg-blue-500 rounded-full text-white font-medium px-4 pt-2 pb-3 mt-8 w-40"
                >
                  <span className="pt-4">
                    <LoadingDots color="white" style="large" />
                  </span>
                </button>
              )}
              {error && (
                <div
                  className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl mt-8"
                  role="alert"
                >
                  <span className="block sm:inline">{error}</span>
                </div>
              )}
              <div className="flex space-x-2 justify-center">
                {originalPhoto && !loading && (
                  <button
                    onClick={() => {
                      setOriginalPhoto(null);
                      setRestoredImage(null);
                      setRestoredLoaded(false);
                      setError(null);
                      setGenerationMeta(null);
                      setPromptSections(null);
                    }}
                    className="bg-blue-500 rounded-full text-white font-medium px-4 py-2 mt-8 hover:bg-blue-500/80 transition"
                  >
                    Generate New Room
                  </button>
                )}
                {restoredLoaded && (
                  <button
                    onClick={() => {
                      downloadPhoto(
                        restoredImage!,
                        appendNewToName(photoName!)
                      );
                    }}
                    className="bg-white rounded-full text-black border font-medium px-4 py-2 mt-8 hover:bg-gray-100 transition"
                  >
                    Download Generated Room
                  </button>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </ResizablePanel>
      </main>
      {promptSections && (
        <section className="w-full max-w-4xl px-6 pb-12">
          <div className="border border-gray-800 rounded-2xl bg-gray-900/60 p-6 text-left space-y-3">
            <h3 className="text-lg font-semibold text-slate-100">
              Prompt Breakdown
            </h3>
            <div>
              <p className="text-sm uppercase tracking-wide text-gray-400">
                General
              </p>
              <p className="text-gray-200 text-sm leading-6">
                {promptSections.general}
              </p>
            </div>
            <div>
              <p className="text-sm uppercase tracking-wide text-gray-400">
                Room
              </p>
              <p className="text-gray-200 text-sm leading-6">
                {promptSections.room}
              </p>
            </div>
            <div>
              <p className="text-sm uppercase tracking-wide text-gray-400">
                Style
              </p>
              <p className="text-gray-200 text-sm leading-6">
                {promptSections.theme}
              </p>
            </div>
            {generationMeta && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 text-gray-300 text-sm">
                <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-4 space-y-1">
                  <p className="uppercase tracking-wide text-[11px] text-gray-400">
                    Sampling
                  </p>
                  <p>Seed: {generationMeta.seed ?? "Random"}</p>
                  <p>
                    Strength: {formatFloat(generationMeta.strength)}
                  </p>
                  <p>
                    Guidance: {formatFloat(generationMeta.guidanceScale)}
                  </p>
                  <p>
                    Steps: {generationMeta.numInferenceSteps ?? "n/a"}
                  </p>
                  {typeof generationMeta.inferenceSeconds === "number" && (
                    <p>
                      Time: {generationMeta.inferenceSeconds.toFixed(1)}s
                    </p>
                  )}
                </div>
                {generationMeta.controlnets && (
                  <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-4 space-y-1">
                    <p className="uppercase tracking-wide text-[11px] text-gray-400">
                      ControlNet
                    </p>
                    {generationMeta.controlnets.map((item, index) => {
                      const conditioningScale =
                        typeof item.conditioning_scale === "number"
                          ? item.conditioning_scale
                          : Number(item.conditioning_scale);

                      return (
                        <div key={`${item.type}-${index}`} className="space-y-0.5">
                          <p>Type: {item.type ?? "canny"}</p>
                          {item.conditioning_scale !== undefined && (
                            <p>Scale: {formatFloat(conditioningScale)}</p>
                          )}
                          {(item.low_threshold !== undefined ||
                            item.high_threshold !== undefined) && (
                            <p>
                              Thresholds: {item.low_threshold ?? "?"}/
                              {item.high_threshold ?? "?"}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      )}
      <Footer />
    </div>
  );
}
