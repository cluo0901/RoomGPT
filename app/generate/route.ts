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

  if (!process.env.OPENAI_API_KEY) {
    return new Response("Missing OPENAI_API_KEY", { status: 500 });
  }

  if (!imageUrl || !theme || !room) {
    return new Response("Invalid request payload", { status: 400 });
  }

  try {
    const model = process.env.OPENAI_IMAGE_MODEL || "gpt-image-1";
    const promptSections = buildPromptSections(room, theme);

    if (process.env.NODE_ENV !== "production") {
      console.log("Prompt sections", promptSections);
    }

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
    });
  } catch (error: any) {
    console.error("OpenAI image generation error", error);
    const message = error?.message ?? "Image generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
