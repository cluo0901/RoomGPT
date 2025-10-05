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

  if (!process.env.CONTROL_SERVICE_URL) {
    return new Response("Missing CONTROL_SERVICE_URL", { status: 500 });
  }

  if (!imageUrl || !theme || !room) {
    return new Response("Invalid request payload", { status: 400 });
  }

  try {
    const promptSections = buildPromptSections(room, theme);

    if (process.env.NODE_ENV !== "production") {
      console.log("Prompt sections", promptSections);
    }

    const serviceUrl = process.env.CONTROL_SERVICE_URL;
    const endpoint = new URL(
      process.env.CONTROL_SERVICE_ENDPOINT ?? "/generate",
      serviceUrl
    );

    const defaultNegative =
      process.env.CONTROL_DEFAULT_NEGATIVE_PROMPT ??
      "low quality, blurry, distorted, extra furniture, warped walls, overexposed";
    const fallbackNumber = (value: number, defaultValue: number) =>
      Number.isFinite(value) ? value : defaultValue;

    const strength = fallbackNumber(
      parseFloat(process.env.CONTROL_DEFAULT_STRENGTH ?? "0.35"),
      0.35
    );
    const guidance = fallbackNumber(
      parseFloat(process.env.CONTROL_DEFAULT_GUIDANCE ?? "6"),
      6
    );
    const inferenceSteps = Math.max(
      1,
      Math.round(
        fallbackNumber(
          parseInt(process.env.CONTROL_DEFAULT_INFERENCE_STEPS ?? "30", 10),
          30
        )
      )
    );
    const cannyScale = fallbackNumber(
      parseFloat(process.env.CONTROL_CANNY_CONDITIONING_SCALE ?? "0.75"),
      0.75
    );
    const cannyLow = Math.max(
      0,
      Math.round(
        fallbackNumber(
          parseInt(process.env.CONTROL_CANNY_LOW_THRESHOLD ?? "100", 10),
          100
        )
      )
    );
    const cannyHigh = Math.max(
      0,
      Math.round(
        fallbackNumber(
          parseInt(process.env.CONTROL_CANNY_HIGH_THRESHOLD ?? "200", 10),
          200
        )
      )
    );

    const payload = {
      image_url: imageUrl,
      prompt_sections: promptSections,
      negative_prompt: defaultNegative,
      strength,
      guidance_scale: guidance,
      num_inference_steps: inferenceSteps,
      controlnets: [
        {
          type: "canny",
          conditioning_scale: cannyScale,
          low_threshold: cannyLow,
          high_threshold: cannyHigh,
        },
      ],
    };

    const headersInit: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (process.env.CONTROL_SERVICE_TOKEN) {
      headersInit["Authorization"] = `Bearer ${process.env.CONTROL_SERVICE_TOKEN}`;
    }

    const controlResponse = await fetch(endpoint.toString(), {
      method: "POST",
      headers: headersInit,
      body: JSON.stringify(payload),
    }).catch((error: any) => {
      console.error("ControlNet service request failed", error);
      throw new Error("Failed to reach ControlNet service");
    });

    const responseJson = await controlResponse
      .json()
      .catch(() => ({ error: "Invalid response from ControlNet service" }));

    if (!controlResponse.ok) {
      console.error("ControlNet service error", responseJson);
      const errorMessage =
        typeof responseJson?.error === "string"
          ? responseJson.error
          : `Generation failed (${controlResponse.status})`;
      return NextResponse.json(
        { error: errorMessage },
        { status: controlResponse.status }
      );
    }

    const generatedImage =
      responseJson?.generated ??
      responseJson?.image ??
      responseJson?.data ??
      null;

    if (!generatedImage) {
      return NextResponse.json(
        { error: "ControlNet service returned no image" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      original: imageUrl,
      generated: generatedImage,
      prompt: responseJson?.prompt ?? promptSections,
      seed: responseJson?.seed,
      strength: responseJson?.strength,
      guidanceScale: responseJson?.guidance_scale ?? responseJson?.guidanceScale,
      numInferenceSteps:
        responseJson?.num_inference_steps ?? responseJson?.numInferenceSteps,
      controlnets: responseJson?.controlnets,
      inferenceSeconds:
        responseJson?.inference_seconds ?? responseJson?.inferenceSeconds,
    });
  } catch (error: any) {
    console.error("ControlNet image generation error", error);
    const message = error?.message ?? "Image generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
