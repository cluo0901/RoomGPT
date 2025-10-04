# [RoomGPT](https://roomGPT.io) - redesign your room with AI

This is the previous and open source version of RoomGPT.io (a paid SaaS product). It's the very first version of roomGPT without the auth, payments, or additional features and it's simple to clone, deploy, and play around with.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Nutlope/roomGPT&env=REPLICATE_API_KEY&project-name=room-GPT&repo-name=roomGPT)

[![Room GPT](./public/screenshot.png)](https://roomGPT.io)

## How it works

It uses the [OpenAI Images](https://platform.openai.com/docs/guides/images) API to generate room redesign concepts based on the theme and room type you select. This application lets you upload a photo of any room, sends your request through a Next.js API route, and returns an AI-generated concept image. [Bytescale](https://www.bytescale.com/) is used for image storage.

## Running Locally

### Cloning the repository the local machine.

```bash
git clone https://github.com/Nutlope/roomGPT
```

### Creating an OpenAI account to get an API key.

1. Go to [OpenAI](https://platform.openai.com/) to make an account.
2. Open the dashboard's API Keys page and create a new secret key.
3. Copy the key (it starts with `sk-` or `sk-proj-`).

### Storing the API keys in .env

Create a file in root directory of project with env. And store your API key in it, as shown in the .example.env file.

```
OPENAI_API_KEY=your-openai-key
OPENAI_IMAGE_MODEL=gpt-image-1  # optional; use e.g. dall-e-2 if your org lacks access
NEXT_PUBLIC_UPLOAD_API_KEY=optional-bytescale-key
```

If you see an error about verifying your organization for `gpt-image-1`, either complete the verification steps in the OpenAI dashboard or set `OPENAI_IMAGE_MODEL=dall-e-2` (or another image-capable model you have access to) and restart the dev server.

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
