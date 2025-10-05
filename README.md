# [RoomGPT](https://roomGPT.io) - redesign your room with AI

This is the previous and open source version of RoomGPT.io (a paid SaaS product). It's the very first version of roomGPT without the auth, payments, or additional features and it's simple to clone, deploy, and play around with.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Nutlope/roomGPT&env=REPLICATE_API_KEY&project-name=room-GPT&repo-name=roomGPT)

[![Room GPT](./public/screenshot.png)](https://roomGPT.io)

## How it works

On this branch the app uses the [OpenAI Images](https://platform.openai.com/docs/guides/images) API to generate room redesign concepts. Your prompt combines general design guidance with room- and style-specific details. [Bytescale](https://www.bytescale.com/) is used for image storage.

## Running Locally

### Cloning the repository the local machine.

```bash
git clone https://github.com/Nutlope/roomGPT
```

### Getting an OpenAI API key

1. Go to [OpenAI](https://platform.openai.com/) and log into your account.
2. Navigate to **API Keys** and create a new secret key.
3. Copy the key (it starts with `sk-` or `sk-proj-`).

### Storing the API keys in .env

Create a file in root directory of project with env. And store your API key in it, as shown in the .example.env file.

```
OPENAI_API_KEY=your-openai-key
OPENAI_IMAGE_MODEL=gpt-image-1

NEXT_PUBLIC_UPLOAD_API_KEY=optional-bytescale-key
```

If your organization does not yet have access to `gpt-image-1`, either complete the verification steps in the OpenAI dashboard or switch `OPENAI_IMAGE_MODEL` to another image-capable model (for example `dall-e-2`).

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
