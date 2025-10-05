import { Ratelimit } from "@upstash/ratelimit";
import redis from "../../utils/redis";
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { buildPromptSections } from "../../utils/prompts";
export const runtime = "nodejs";

// Create a new ratelimiter, that allows 5 requests per 24 hours
const ratelimit = redis
  ? new Ratelimit({
      redis: redis,
      limiter: Ratelimit.fixedWindow(5, "1440 m"),
      analytics: true,
    })
  : undefined;

export async function POST(request: Request) {
  // Rate Limiter Code
  if (ratelimit) {
    const headersList = headers();
    const ipIdentifier = headersList.get("x-real-ip");

    const result = await ratelimit.limit(ipIdentifier ?? "");

    if (!result.success) {
      return new Response(
        "Too many uploads in 1 day. Please try again in a 24 hours.",
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": result.limit,
            "X-RateLimit-Remaining": result.remaining,
          } as any,
        }
      );
    }
  }

  const { imageUrl, theme, room } = await request.json();

  if (!process.env.REPLICATE_API_KEY) {
    return new Response("Missing REPLICATE_API_KEY", { status: 500 });
  }

  if (!imageUrl || !theme || !room) {
    return new Response("Invalid request payload", { status: 400 });
  }

  try {
    const promptSections = buildPromptSections(room, theme);

    if (process.env.NODE_ENV !== "production") {
      console.log("Prompt sections", promptSections);
    }

    const modelVersion = process.env.SDXL_CONTROLNET_MODEL_VERSION;

    if (!modelVersion) {
      return NextResponse.json(
        {
          error:
            "Missing SDXL_CONTROLNET_MODEL_VERSION. Set it to the version hash of the ControlNet model you want to use.",
        },
        { status: 500 }
      );
    }

    const guidanceScale = parseFloat(
      process.env.SDXL_GUIDANCE_SCALE ?? "7"
    );
    const controlnetScale = parseFloat(
      process.env.SDXL_CONTROLNET_SCALE ?? "0.8"
    );
    const inferenceSteps = parseInt(
      process.env.SDXL_INFERENCE_STEPS ?? "30",
      10
    );
    const scheduler = process.env.SDXL_SCHEDULER ?? "Heun";
    const negativePrompt =
      process.env.SDXL_NEGATIVE_PROMPT ??
      "low quality, artifacts, distorted, blurry, deformed, oversaturated";

    const replicateHeaders = {
      "Content-Type": "application/json",
      Authorization: `Token ${process.env.REPLICATE_API_KEY}`,
    };

    const startResponse = await fetch(
      "https://api.replicate.com/v1/predictions",
      {
        method: "POST",
        headers: replicateHeaders,
        body: JSON.stringify({
          version: modelVersion,
          input: {
            image: imageUrl,
            prompt: promptSections.full,
            negative_prompt: negativePrompt,
            scheduler,
            guidance_scale: guidanceScale,
            controlnet_conditioning_scale: controlnetScale,
            num_inference_steps: inferenceSteps,
          },
        }),
      }
    );

    const startJson = await startResponse.json();

    if (!startResponse.ok) {
      console.error("Replicate start error", startJson);
      return NextResponse.json(
        { error: startJson?.error ?? "Failed to start ControlNet prediction" },
        { status: startResponse.status }
      );
    }

    const endpointUrl = startJson?.urls?.get;

    if (!endpointUrl) {
      console.error("Missing polling URL", startJson);
      return NextResponse.json(
        { error: "Replicate response missing polling URL" },
        { status: 500 }
      );
    }

    const timeoutMs = 1000 * 60 * 5; // 5 minutes
    const pollIntervalMs = 2000;
    const startTime = Date.now();

    let finalJson: any = null;

    while (Date.now() - startTime < timeoutMs) {
      const finalResponse = await fetch(endpointUrl, {
        headers: replicateHeaders,
      });
      finalJson = await finalResponse.json();

      if (finalResponse.status >= 400) {
        console.error("Replicate polling error", finalJson);
        return NextResponse.json(
          { error: finalJson?.error ?? "Failed while polling prediction" },
          { status: finalResponse.status }
        );
      }

      if (finalJson?.status === "succeeded") {
        break;
      }

      if (finalJson?.status === "failed" || finalJson?.status === "canceled") {
        console.error("Replicate prediction failed", finalJson);
        return NextResponse.json(
          { error: finalJson?.error ?? "Prediction failed" },
          { status: 500 }
        );
      }

      await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
    }

    if (!finalJson || finalJson?.status !== "succeeded") {
      console.error("Replicate prediction timeout", finalJson);
      return NextResponse.json(
        { error: "Prediction timed out" },
        { status: 504 }
      );
    }

    const output = finalJson.output;
    const generatedImage = Array.isArray(output)
      ? output[output.length - 1]
      : output;

    if (typeof generatedImage !== "string") {
      console.error("Unexpected output format", finalJson);
      return NextResponse.json(
        { error: "Unexpected output format from ControlNet" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      original: imageUrl,
      generated: generatedImage,
      prompt: promptSections,
      prediction: {
        id: startJson?.id,
        modelVersion,
        status: finalJson?.status,
      },
    });
  } catch (error: any) {
    console.error("ControlNet generation error", error);
    const message = error?.message ?? "Image generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
