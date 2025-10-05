import base64
import io
import logging
import os
import random
import time
from typing import List, Literal, Optional

import numpy as np
import torch
import uvicorn
from diffusers import ControlNetModel, StableDiffusionXLControlNetPipeline
from fastapi import Depends, FastAPI, Header, HTTPException, status
from httpx import AsyncClient
from PIL import Image
from pydantic import BaseModel, Field, HttpUrl

try:
    import cv2
except ImportError as exc:  # pragma: no cover - import guard
    raise RuntimeError(
        "opencv-python is required for ControlNet preprocessing."
    ) from exc


logger = logging.getLogger("controlnet-service")
logging.basicConfig(level=os.getenv("LOG_LEVEL", "INFO"))


class PromptSections(BaseModel):
    general: str
    room: str
    theme: str
    full: str


class ControlNetConfig(BaseModel):
    type: Literal["canny"] = "canny"
    conditioning_scale: float = Field(0.75, ge=0.0, le=2.0)
    low_threshold: int = Field(100, ge=0, le=255)
    high_threshold: int = Field(200, ge=0, le=255)


class GenerateRequest(BaseModel):
    image_url: HttpUrl = Field(..., description="Source image to restyle")
    prompt_sections: PromptSections
    negative_prompt: Optional[str] = Field(
        default=os.getenv(
            "CONTROL_DEFAULT_NEGATIVE",
            "low quality, blurry, distorted, extra furniture, warped walls, overexposed",
        )
    )
    strength: float = Field(0.35, ge=0.0, le=1.0)
    guidance_scale: float = Field(6.0, ge=1.0, le=30.0)
    num_inference_steps: int = Field(30, ge=10, le=150)
    seed: Optional[int] = Field(default=None, ge=0)
    controlnets: List[ControlNetConfig] = Field(
        default_factory=lambda: [ControlNetConfig()]
    )
    output_format: Literal["base64", "data-url"] = "data-url"
    target_size: int = Field(
        default=int(os.getenv("CONTROL_TARGET_SIZE", "1024")),
        ge=256,
        le=2048,
    )


class ControlNetSummary(BaseModel):
    type: str
    conditioning_scale: float
    low_threshold: int
    high_threshold: int


class GenerateResponse(BaseModel):
    image: str
    seed: int
    prompt: PromptSections
    strength: float
    guidance_scale: float
    num_inference_steps: int
    controlnets: List[ControlNetSummary]
    inference_seconds: float


app = FastAPI(title="SDXL ControlNet Service")


DEVICE = os.getenv("CONTROL_DEVICE") or (
    "cuda"
    if torch.cuda.is_available()
    else "mps"
    if getattr(torch.backends, "mps", None) and torch.backends.mps.is_available()
    else "cpu"
)


def _dtype_for_device(device: str) -> torch.dtype:
    if device.startswith("cuda"):
        return torch.float16
    return torch.float32


BASE_MODEL_ID = os.getenv(
    "SDXL_BASE_MODEL_ID", "stabilityai/stable-diffusion-xl-base-1.0"
)
CONTROLNET_CANNY_ID = os.getenv(
    "CONTROLNET_CANNY_MODEL_ID", "diffusers/controlnet-canny-sdxl-1.0"
)

PIPELINE: Optional[StableDiffusionXLControlNetPipeline] = None
ASYNC_CLIENT: Optional[AsyncClient] = None


def create_async_client() -> AsyncClient:
    global ASYNC_CLIENT
    if ASYNC_CLIENT is None:
        ASYNC_CLIENT = AsyncClient(timeout=float(os.getenv("CONTROL_HTTP_TIMEOUT", "120")))
    return ASYNC_CLIENT


def load_pipeline() -> StableDiffusionXLControlNetPipeline:
    global PIPELINE
    if PIPELINE is not None:
        return PIPELINE

    logger.info("Loading SDXL base model: %s", BASE_MODEL_ID)
    dtype = _dtype_for_device(DEVICE)

    controlnet = ControlNetModel.from_pretrained(
        CONTROLNET_CANNY_ID,
        torch_dtype=dtype,
    )

    pipe = StableDiffusionXLControlNetPipeline.from_pretrained(
        BASE_MODEL_ID,
        controlnet=controlnet,
        torch_dtype=dtype,
    )

    if DEVICE == "cuda":
        pipe.to(DEVICE)
        try:  # pragma: no cover - xformers optional
            pipe.enable_xformers_memory_efficient_attention()
        except Exception as exc:
            logger.warning("xFormers not available: %s", exc)
    elif DEVICE == "mps":
        pipe.to("mps")
    else:
        pipe.to("cpu")
        pipe.enable_sequential_cpu_offload()
        pipe.enable_attention_slicing()

    PIPELINE = pipe
    return PIPELINE


async def download_image(url: str) -> Image.Image:
    client = create_async_client()
    try:
        response = await client.get(url)
        response.raise_for_status()
    except Exception as exc:  # pragma: no cover - network specific
        logger.error("Failed to download image: %s", exc)
        raise HTTPException(status_code=400, detail="Failed to download image")

    try:
        return Image.open(io.BytesIO(response.content)).convert("RGB")
    except Exception as exc:  # pragma: no cover - decode safety
        logger.error("Invalid image payload: %s", exc)
        raise HTTPException(status_code=400, detail="Invalid image content")


def resize_image(image: Image.Image, size: int) -> Image.Image:
    if image.width == size and image.height == size:
        return image
    return image.resize((size, size), Image.LANCZOS)


def prepare_canny(image: Image.Image, config: ControlNetConfig) -> Image.Image:
    np_image = np.array(image)
    edges = cv2.Canny(np_image, config.low_threshold, config.high_threshold)
    return Image.fromarray(edges).convert("RGB")


def image_to_data_url(image: Image.Image, include_prefix: bool = True) -> str:
    buffer = io.BytesIO()
    image.save(buffer, format="PNG")
    encoded = base64.b64encode(buffer.getvalue()).decode("utf-8")
    if include_prefix:
        return f"data:image/png;base64,{encoded}"
    return encoded


def verify_token(authorization: Optional[str] = Header(default=None)) -> None:
    expected = os.getenv("CONTROL_SERVICE_TOKEN")
    if not expected:
        return
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unauthorized")
    provided = authorization.split(" ", 1)[1]
    if provided != expected:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")


@app.on_event("shutdown")
async def shutdown_event() -> None:  # pragma: no cover - cleanup
    global ASYNC_CLIENT
    if ASYNC_CLIENT:
        await ASYNC_CLIENT.aclose()
        ASYNC_CLIENT = None


@app.post("/generate", response_model=GenerateResponse)
async def generate(request: GenerateRequest, _: None = Depends(verify_token)):
    if len(request.controlnets) != 1 or request.controlnets[0].type != "canny":
        raise HTTPException(
            status_code=400,
            detail="Only a single Canny ControlNet is supported in this release.",
        )

    pipeline = load_pipeline()

    original_image = await download_image(str(request.image_url))
    original_image = resize_image(original_image, request.target_size)

    control_cfg = request.controlnets[0]
    control_image = prepare_canny(original_image, control_cfg)
    control_image = resize_image(control_image, request.target_size)

    generator_device = "cuda" if DEVICE.startswith("cuda") else "cpu"
    if DEVICE == "mps":
        generator_device = "cpu"

    seed = request.seed or random.randint(0, 2**31 - 1)
    generator = torch.Generator(device=generator_device).manual_seed(seed)

    prompt_text = request.prompt_sections.full or (
        f"General: {request.prompt_sections.general}\n"
        f"Room: {request.prompt_sections.room}\n"
        f"Style: {request.prompt_sections.theme}"
    )

    logger.info(
        "Generating with seed=%s guidance=%.2f strength=%.2f", seed, request.guidance_scale, request.strength
    )

    inference_start = time.perf_counter()
    try:
        result = pipeline(
            prompt=prompt_text,
            negative_prompt=request.negative_prompt,
            image=original_image,
            control_image=control_image,
            strength=request.strength,
            guidance_scale=request.guidance_scale,
            num_inference_steps=request.num_inference_steps,
            controlnet_conditioning_scale=control_cfg.conditioning_scale,
            generator=generator,
        ).images[0]
    except Exception as exc:  # pragma: no cover - runtime failures
        logger.exception("Generation failed: %s", exc)
        raise HTTPException(status_code=500, detail="Image generation failed")

    inference_seconds = time.perf_counter() - inference_start

    image_payload = image_to_data_url(
        result, include_prefix=request.output_format == "data-url"
    )

    return GenerateResponse(
        image=image_payload,
        seed=seed,
        prompt=request.prompt_sections,
        strength=request.strength,
        guidance_scale=request.guidance_scale,
        num_inference_steps=request.num_inference_steps,
        controlnets=[
            ControlNetSummary(
                type=control_cfg.type,
                conditioning_scale=control_cfg.conditioning_scale,
                low_threshold=control_cfg.low_threshold,
                high_threshold=control_cfg.high_threshold,
            )
        ],
        inference_seconds=inference_seconds,
    )


if __name__ == "__main__":  # pragma: no cover - manual launch
    uvicorn.run(
        "controlnet_service.app:app",
        host=os.getenv("UVICORN_HOST", "0.0.0.0"),
        port=int(os.getenv("UVICORN_PORT", "8000")),
        reload=bool(os.getenv("UVICORN_RELOAD", "")),
    )
