# OpenRelay - Free AI API for Everyone

Free AI API gateway. Simple, fast, open.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/CloudCompile/cloudgpt&env=NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,CLERK_SECRET_KEY,KV_REST_API_URL,KV_REST_API_TOKEN,AIHUBMIX_API_KEY&project-name=openrelay&repository-name=openrelay)

## Features

- **🔓 Free** - No payment required, no limits on keys
- **⚡ Fast** - Built on Vercel Edge Functions
- **🔐 Secure** - Clerk authentication + API keys
- **📦 OpenAI-Compatible** - Works with any OpenAI-compatible client
- **🎨 Developer-Focused** - Clean dashboard, simple API

## Quick Start

### Prerequisites

- Node.js 18+
- Clerk account ([clerk.com](https://clerk.com))
- Vercel account ([vercel.com](https://vercel.com)) - optional for deployment

### Deploy to Vercel

The easiest way to deploy:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/CloudCompile/cloudgpt&env=NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,CLERK_SECRET_KEY,KV_REST_API_URL,KV_REST_API_TOKEN,AIHUBMIX_API_KEY&project-name=openrelay&repository-name=openrelay)

You'll need to set these environment variables:
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - From Clerk
- `CLERK_SECRET_KEY` - From Clerk  
- `KV_REST_API_URL` - From Vercel KV
- `KV_REST_API_TOKEN` - From Vercel KV
- `AIHUBMIX_API_KEY` - From [AIHubMix](https://aihubmix.com)

### Local Development

```bash
# Clone
git clone https://github.com/CloudCompile/cloudgpt.git
cd cloudgpt

# Install
npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local with your values

# Run
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## API

### Authentication

All API requests require an API key from the dashboard:

```bash
curl https://your-domain.com/v1/chat/completions \
  -H "Authorization: Bearer or_YOUR_KEY_HERE" \
  -H "Content-Type: application/json" \
  -d '{"model": "gpt-4", "messages": [{"role": "user", "content": "Hello"}]}'
```

API keys have format: `or_[32 random hex chars]`

### Endpoints

All endpoints are proxied through [AIHubMix](https://aihubmix.com), which provides access to 27+ free models:

- `POST /v1/chat/completions` - Chat completions (GPT-4o, Claude, Gemini, etc.)
- `GET /v1/models` - List available models
- `POST /v1/images/generations` - Generate images
- `POST /v1/videos/generations` - Generate videos
- `POST /v1/audio/speech` - Text-to-speech
- `POST /v1/embeddings` - Generate embeddings

See [AIHubMix Models](https://aihubmix.com/models) for available models and their IDs.

## Dashboard

- Sign up or sign in at `/`
- Create API keys at `/dashboard`
- View models at `/models` (placeholder for now)

## Rate Limiting

- **60 requests per minute** per API key
- Rate limit headers in responses:
  - `X-RateLimit-Remaining`
  - `X-RateLimit-Reset`

## Project Structure

```
├── app/
│   ├── api/
│   │   ├── v1/                    # OpenAI-compatible API
│   │   │   ├── chat/completions/  # Chat completions (AIHubMix)
│   │   │   ├── models/            # List models (AIHubMix)
│   │   │   ├── images/generations/ # Image generation (AIHubMix)
│   │   │   ├── videos/generations/ # Video generation (AIHubMix)
│   │   │   ├── audio/speech/      # Text-to-speech (AIHubMix)
│   │   │   └── embeddings/        # Embeddings (AIHubMix)
│   │   └── dashboard/keys/        # API key management
│   ├── dashboard/                 # User dashboard
│   ├── models/                    # Models page
│   ├── layout.tsx
│   ├── page.tsx                   # Home page
│   └── globals.css
├── lib/
│   ├── api-keys.ts                # Key utilities + Vercel KV
│   └── providers.ts               # Provider integration (AIHubMix)
├── tsconfig.json
├── package.json
└── README.md
```

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Auth:** Clerk
- **Storage:** Vercel KV (for API keys + rate limiting)
- **Runtime:** Vercel Edge Functions
- **Language:** TypeScript
- **Styling:** CSS-in-JS + global CSS

## Development

```bash
# Install dependencies
npm install

# Format/lint
npm run lint

# Build
npm run build

# Start production server
npm start
```

## Provider

OpenRelay is currently powered by [AIHubMix](https://aihubmix.com), a unified API gateway providing access to 27+ free AI models including:
- **Text:** GPT-4o, Claude 3.5, Gemini 2.0, DeepSeek, Qwen, and more
- **Images:** DALL-E, Flux, and others
- **Video:** Text-to-video generation
- **Audio:** Text-to-speech
- **Embeddings:** Text embeddings

Future versions may support additional providers.

## Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Links

- [GitHub](https://github.com/CloudCompile/cloudgpt)
- [Clerk Docs](https://clerk.com/docs)
- [Vercel KV Docs](https://vercel.com/docs/storage/vercel-kv)
- [Next.js Docs](https://nextjs.org/docs)
