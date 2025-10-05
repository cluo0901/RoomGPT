import { Ratelimit } from "@upstash/ratelimit";
import redis from "../../utils/redis";
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { buildPromptSections } from "../../utils/prompts";
export const runtime = "nodejs";

type PromptSectionResult = ReturnType<typeof buildPromptSections>;
type GenerationApproach = "controlnet" | "openai";

type GenerationContext = {
  imageUrl: string;
  promptSections: PromptSectionResult;
};

function resolveApproach(value?: string): GenerationApproach {
  const normalized = value?.trim().toLowerCase();
  if (normalized === "controlnet") {
    return "controlnet";
  }
  return "openai";
}

function canUseOpenAI(): boolean {
  return Boolean(process.env.OPENAI_API_KEY);
}

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
    const headersList = await headers();
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

  if (!imageUrl || !theme || !room) {
    return new Response("Invalid request payload", { status: 400 });
  }

  try {
    const promptSections = buildPromptSections(room, theme);

    if (process.env.NODE_ENV !== "production") {
      console.log("Prompt sections", promptSections);
    }
    const approach = resolveApproach(process.env.DEFAULT_APPROACH);

    if (approach === "openai") {
      return await generateWithOpenAI({ imageUrl, promptSections });
    }

    const controlResponse = await generateWithControlNet({
      imageUrl,
      promptSections,
    });

    if (controlResponse.ok || !canUseOpenAI()) {
      return controlResponse;
    }

    console.warn("ControlNet generation failed, falling back to OpenAI.");
    return await generateWithOpenAI({ imageUrl, promptSections });
  } catch (error: any) {
    console.error("Image generation error", error);
    const message = error?.message ?? "Image generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function generateWithControlNet(
  context: GenerationContext
): Promise<Response> {
  const { imageUrl, promptSections } = context;

  if (!process.env.CONTROL_SERVICE_URL) {
    return NextResponse.json(
      { error: "Missing CONTROL_SERVICE_URL" },
      { status: 500 }
    );
  }

  const serviceUrl = process.env.CONTROL_SERVICE_URL;
  const endpoint = new URL(
    process.env.CONTROL_SERVICE_ENDPOINT ?? "/generate",
    serviceUrl
  );

  const fallbackNumber = (value: number, defaultValue: number) =>
    Number.isFinite(value) ? value : defaultValue;

  const defaultNegative =
    process.env.CONTROL_DEFAULT_NEGATIVE_PROMPT ??
    "low quality, blurry, distorted, extra furniture, warped walls, overexposed";

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

  const payload: Record<string, unknown> = {
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

  const controlTargetSize = process.env.CONTROL_TARGET_SIZE;
  if (controlTargetSize) {
    const parsed = parseInt(controlTargetSize, 10);
    if (Number.isFinite(parsed)) {
      payload.target_size = Math.min(2048, Math.max(256, parsed));
    }
  }

  const headersInit: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (process.env.CONTROL_SERVICE_TOKEN) {
    headersInit["Authorization"] = `Bearer ${process.env.CONTROL_SERVICE_TOKEN}`;
  }

  let controlResponse: Response;

  try {
    controlResponse = await fetch(endpoint.toString(), {
      method: "POST",
      headers: headersInit,
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.error("ControlNet service request failed", error);
    return NextResponse.json(
      { error: "Failed to reach ControlNet service" },
      { status: 502 }
    );
  }

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
}

async function generateWithOpenAI(
  context: GenerationContext
): Promise<Response> {
  const { imageUrl, promptSections } = context;

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "Missing OPENAI_API_KEY" },
      { status: 500 }
    );
  }

  const model = process.env.OPENAI_IMAGE_MODEL || "gpt-image-1";

  try {
    const openaiResponse = await fetch(
      "https://api.openai.com/v1/images/generations",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model,
          prompt: promptSections.full,
          size: "1024x1024",
        }),
      }
    );

    const openaiJson = await openaiResponse
      .json()
      .catch(() => ({ error: { message: "Invalid response from OpenAI" } }));

    if (!openaiResponse.ok) {
      console.error("OpenAI API error", openaiJson);
      const errorMessage =
        openaiJson?.error?.message ??
        `Image generation failed (${openaiResponse.status})`;
      return NextResponse.json(
        { error: errorMessage },
        { status: openaiResponse.status }
      );
    }

    const imageBase64 = openaiJson?.data?.[0]?.b64_json;
    const imageUrlFromApi = openaiJson?.data?.[0]?.url;

    if (!imageBase64 && !imageUrlFromApi) {
      return NextResponse.json(
        { error: "Failed to generate image" },
        { status: 500 }
      );
    }

    const imageDataUrl = imageBase64
      ? `data:image/png;base64,${imageBase64}`
      : imageUrlFromApi!;

    return NextResponse.json({
      original: imageUrl,
      generated: imageDataUrl,
      prompt: promptSections,
      provider: "openai",
      model,
    });
  } catch (error: any) {
    console.error("OpenAI image generation error", error);
    const message = error?.message ?? "Image generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
