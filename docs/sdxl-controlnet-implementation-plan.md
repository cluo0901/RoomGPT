# SDXL + ControlNet Integration Plan

This document outlines how to replace the current OpenAI image generator with a first-class Stable Diffusion XL (SDXL) + ControlNet workflow while keeping the existing RoomGPT UX. It follows the guidance shared in the ChatGPT summary and breaks the work into incremental deliverables.

## 0. Goals & Constraints
- **Primary goal:** Offer controllable photo-to-design restyling by leveraging SDXL with ControlNet, keeping layout fidelity while changing style.
- **Constraints:**
  - Must run without Replicate (self-host or use available APIs).
  - Should reuse existing prompt structure (general + room + style).
  - Continue supporting the current Next.js frontend with minimal UX disruption.
  - Prefer GPU acceleration (CUDA 12.x) but keep CPU fallback notes.

## 1. Choose the Serving Strategy
Pick one of the two code-first approaches (GUI options noted for experimentation):

### 1A. **Backend microservice (recommended)**
- Implement a Python microservice using `diffusers==0.27.0` and `accelerate`.
- Expose an HTTP endpoint (FastAPI or Flask) that accepts `imageUrl`, `promptSections`, and ControlNet parameters.
- Run the service on a GPU node (self-hosted or cloud VM). For local development, use an environment with ≥12 GB VRAM.
- Pros: fully scriptable, can be containerized, integrate directly with Next.js API route.

### 1B. **Direct invocation via Node (experimental)**
- Use `node-python` bridge (e.g., `child_process` calling a Python script) to keep everything inside the Next.js route.
- Requires provisioning Python and model weights on the same machine as Next.js. Adds deployment complexity; document clearly if selected.

> **GUI references** (ComfyUI or Automatic1111) remain useful for prompt tuning and parameter discovery but are not part of the production pipeline.

## 2. Model Assets & Preprocessing
1. Download SDXL base (and optionally refiner) checkpoints:
   - `stabilityai/stable-diffusion-xl-base-1.0`
   - `stabilityai/stable-diffusion-xl-refiner-1.0` (optional finishing pass)
2. Download ControlNet weights appropriate for rooms:
   - Start with `diffusers/controlnet-canny-sdxl-1.0`
   - Optionally add `diffusers/controlnet-depth-sdxl-1.0`
3. Preprocessors for control maps:
   - Canny: OpenCV `Canny` (threshold 100/200 default).
   - Depth: MiDaS (`DPTForDepthEstimation`) via `transformers`.
4. Store weights in a shared volume or cache; document expected directory layout.

## 3. Python Service Architecture (Option 1A)
- **Dependencies**: `torch`, `diffusers`, `transformers`, `accelerate`, `xformers`, `opencv-python`, `numpy`, `fastapi`, `uvicorn`.
- **Initialization**:
  ```python
  controlnets = [ControlNetModel.from_pretrained(...)]
  pipe = StableDiffusionXLControlNetPipeline.from_pretrained(..., controlnet=controlnets, torch_dtype=torch.float16)
  pipe.to(device)
  pipe.enable_xformers_memory_efficient_attention()
  ```
- **Endpoint `/generate`**:
  - Fetch original image (Bytescale URL) and convert to PIL.
  - Produce control images (Canny, optional Depth).
  - Run `pipe()` with parameters: `prompt`, `negative_prompt`, `image`, `control_image`, `strength`, `guidance_scale`, `controlnet_conditioning_scale`, `num_inference_steps`, `generator`.
  - Return base64 image or store to Bytescale/S3 and return URL.
- **Config knobs** (pass via JSON or env): guidance, denoise strength, control scales, sampler (if switching to `Euler` etc.), seed.

## 4. Next.js API Route Updates
1. Replace current OpenAI call with an HTTP request to the Python service.
2. Request payload:
   ```json
   {
     "imageUrl": "...",
     "promptSections": { "general": "...", "room": "...", "theme": "..." },
     "negativePrompt": "low quality, blurry, ...",
     "strength": 0.35,
     "guidanceScale": 6,
     "controlnet": {
       "canny": { "enabled": true, "scale": 0.75 },
       "depth": { "enabled": false, "scale": 0.55 }
     }
   }
   ```
3. Handle streaming/progress (optional): poll for completion if the backend queues jobs.
4. Continue returning `{ original, generated, prompt }` so the UI stays unchanged.

## 5. Frontend Enhancements
- Add a ControlNet configuration drawer (optional) so users can tweak strength, guidance, and choose control sources.
- Display seed and parameter summary alongside the prompt breakdown for repeatability.
- Provide “Re-run with same seed” shortcut for variant generation.

## 6. Environment & Deployment
- `.env.local` entries:
  ```
  CONTROL_SERVICE_URL=http://localhost:8000
  CONTROL_SERVICE_TOKEN=... (if secured)
  CONTROL_DEFAULT_NEGATIVE="low quality, blurry, overexposed, extra furniture, warped walls"
  ```
- Document GPU requirements and instructions for installing CUDA/cuDNN.
- Create Dockerfiles (optional):
  - `Dockerfile.control` for the Python service.
  - `Dockerfile.web` for Next.js.
- Add start scripts (`npm run control:dev`, `npm run web:dev`).

## 7. Testing Strategy
- **Unit tests**: prompt builder (already covered) and request payload schema.
- **Integration tests**: mock the Python service with recorded responses.
- **Manual QA**: run sample rooms/styles, inspect ControlNet outputs, check prompt panel, confirm layout preservation.

## 8. Rollout Plan
1. Implement Python service and run locally with sample images.
2. Update Next.js route to talk to the new service behind a feature flag (`SDXL_ENABLED`).
3. Gate release behind env flag until GPU infrastructure is ready.
4. Add documentation and commit to a dedicated branch (`feature/sdxl-controlnet-service`).
5. Once stable, merge into main and retire OpenAI-only implementation if desired.

## 9. Future Enhancements
- Support multiple ControlNets simultaneously (Canny + Depth).
- Integrate SDXL refiner pass or ESRGAN upscaling.
- Offer queueing/async job handling for longer generations.
- Cache outputs keyed by (image digest, room, theme, parameters) for quick replays.

---

**Next Action Recommendation:** Stand up the Python ControlNet service (Step 3) locally, validate with a single room photo, then wire the Next.js route to call it under a feature flag. Once that works, iterate on UI controls and deployment.
