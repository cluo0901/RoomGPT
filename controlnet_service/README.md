# ControlNet Service (SDXL)

This FastAPI microservice wraps the SDXL + ControlNet workflow recommended by ChatGPT for layout-preserving room restyling.

## Features
- Stable Diffusion XL base pipeline with a Canny ControlNet for structural guidance.
- Supports configurable denoise strength, guidance scale, inference steps, and ControlNet strength per request.
- Accepts the same prompt sections (`general`, `room`, `theme`, `full`) that the RoomGPT web app already produces.
- Returns a base64-encoded PNG (or data URL) together with seed and parameter metadata.

## Requirements
- Python ≥ 3.10
- CUDA-capable GPU with ≥ 12 GB VRAM (recommended). CPU fallback works but will be slow.
- Hugging Face authentication (if models require it).

Install dependencies into a virtual environment:

```bash
python -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install -r controlnet_service/requirements.txt
```

Download model weights (first launch will fetch them automatically, but pre-downloading is faster):

```bash
python - <<'PY'
from diffusers import StableDiffusionXLControlNetPipeline, ControlNetModel

base = "stabilityai/stable-diffusion-xl-base-1.0"
control = "diffusers/controlnet-canny-sdxl-1.0"

print("Downloading base pipeline...")
StableDiffusionXLControlNetPipeline.from_pretrained(base)

print("Downloading controlnet model...")
ControlNetModel.from_pretrained(control)
PY
```

## Configuration

| Environment variable | Description | Default |
| --- | --- | --- |
| `SDXL_BASE_MODEL_ID` | SDXL base checkpoint | `stabilityai/stable-diffusion-xl-base-1.0` |
| `SDXL_VAE_ID` | Optional VAE override | *(empty)* |
| `CONTROLNET_CANNY_MODEL_ID` | ControlNet checkpoint for canny edges | `diffusers/controlnet-canny-sdxl-1.0` |
| `CONTROL_SERVICE_TOKEN` | Bearer token required by the API | *(optional)* |
| `CONTROL_DEVICE` | Force device (`cuda`, `cpu`, `mps`) | auto-detect |
| `CONTROL_TARGET_SIZE` | Square resolution for img2img/control images | `1024` |

## Running the service

```bash
uvicorn controlnet_service.app:app --host 0.0.0.0 --port 8000 --reload
```

Then configure the Next.js app with:

```
CONTROL_SERVICE_URL=http://localhost:8000
CONTROL_SERVICE_TOKEN=<token-if-set>
```

## API

`POST /generate`

Request body (partial):

```json
{
  "image_url": "https://.../room.jpg",
  "prompt_sections": {
    "general": "...",
    "room": "...",
    "theme": "...",
    "full": "General: ...\nRoom: ...\nStyle: ..."
  },
  "negative_prompt": "low quality, blurry, ...",
  "strength": 0.35,
  "guidance_scale": 6.0,
  "num_inference_steps": 30,
  "controlnets": [
    {
      "type": "canny",
      "conditioning_scale": 0.75,
      "low_threshold": 100,
      "high_threshold": 200
    }
  ]
}
```

Sample response:

```json
{
  "image": "data:image/png;base64,iVBORw0...",
  "seed": 1234,
  "prompt": { ... },
  "strength": 0.35,
  "guidance_scale": 6.0,
  "num_inference_steps": 30,
  "controlnets": [
    {
      "type": "canny",
      "conditioning_scale": 0.75,
      "low_threshold": 100,
      "high_threshold": 200
    }
  ]
}
```

> **Note:** The current implementation ships with Canny ControlNet only. The architecture allows adding Depth or LineArt variants later by extending the loader and request schema.
