# Project Progress Log

## 2025-10-05
- Documented full local setup, testing playbook, and server start/stop procedures.
- Installed ControlNet dependencies (Python 3.12) and resolved `tokenizers` build issue by recreating the venv with Python 3.12.
- Addressed MPS memory exhaustion guidance (resolution overrides, waterline adjustments, CPU fallback).
- Updated deployment pipeline: committed dependency refresh and pushed branch `feature/sdxl-controlnet` to GitHub.
- Added `docs/testing-playbook.md` detailing validation workflows and cleanup steps.
- Implemented configurable `DEFAULT_APPROACH` toggle so OpenAI generation is now the default with optional ControlNet fallback.
- Updated `.example.env`, `README.md`, and testing docs to explain the new toggle and environment expectations.
