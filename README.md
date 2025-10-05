# [RoomGPT](https://roomGPT.io) - redesign your room with AI

This is the previous and open source version of RoomGPT.io (a paid SaaS product). It's the very first version of roomGPT without the auth, payments, or additional features and it's simple to clone, deploy, and play around with.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Nutlope/roomGPT&env=REPLICATE_API_KEY&project-name=room-GPT&repo-name=roomGPT)

[![Room GPT](./public/screenshot.png)](https://roomGPT.io)

## How it works

On this branch the app calls an [SDXL ControlNet](https://replicate.com/stability-ai/sdxl) pipeline to generate room redesign concepts. Your input photo is preserved with ControlNet guidance while the prompt combines general design instructions with room- and style-specific details. [Bytescale](https://www.bytescale.com/) is used for image storage.

## Running Locally

### Cloning the repository the local machine.

```bash
git clone https://github.com/Nutlope/roomGPT
```

### Getting an API key for SDXL ControlNet

1. Create an account on [Replicate](https://replicate.com/) (or another provider that exposes the SDXL ControlNet model you want to use).
2. Generate an API token from your account settings and copy it.

You can optionally keep the legacy OpenAI configuration alongside this setup if you want to compare outputs.

### Storing the API keys in .env

Create a file in root directory of project with env. And store your API key in it, as shown in the .example.env file.

```
REPLICATE_API_KEY=your-replicate-token
SDXL_CONTROLNET_MODEL_VERSION=1111111111111111111111111111111111111111111111111111111111111111  # replace with the version hash you want to run
SDXL_GUIDANCE_SCALE=7
SDXL_CONTROLNET_SCALE=0.8
SDXL_SCHEDULER=Heun  # or any scheduler allowed by the model
SDXL_INFERENCE_STEPS=30
SDXL_NEGATIVE_PROMPT=low quality, artifacts, distorted, blurry

# Optional legacy config
OPENAI_API_KEY=
OPENAI_IMAGE_MODEL=

NEXT_PUBLIC_UPLOAD_API_KEY=optional-bytescale-key
```

If you are using a different provider, map the variables above to the fields required by that API and update the defaults in `app/generate/route.ts` accordingly.

If you'd also like to do rate limiting, create an account on UpStash, create a Redis database, and populate the two environment variables in `.env` as well. If you don't want to do rate limiting, you don't need to make any changes.

### Installing the dependencies.

```bash
npm install
```

### Running the application.

Then, run the application in the command line and it will be available at `http://localhost:3000`.

```bash
npm run dev
```

## One-Click Deploy

Deploy the example using [Vercel](https://vercel.com?utm_source=github&utm_medium=readme&utm_campaign=vercel-examples):

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Nutlope/roomGPT&env=REPLICATE_API_KEY&project-name=room-GPT&repo-name=roomGPT)

## License

This repo is MIT licensed.
