# ☁️ CloudGPT - Unified AI API Gateway

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/CloudCompile/cloudgpt&env=NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,CLERK_SECRET_KEY,POLLINATIONS_API_KEY&envDescription=API%20keys%20required%20for%20CloudGPT&envLink=https://github.com/CloudCompile/cloudgpt/blob/main/KEYS_SETUP.md&project-name=cloudgpt&repository-name=cloudgpt)

A unified API gateway for AI chat, image, and video generation. Access multiple AI providers through a single, consistent API interface.

## ✨ Features

- **🔗 Unified API** - Single API for chat, image, and video generation
- **⚡ Edge Runtime** - Fast responses with Vercel Edge Functions
- **🔐 Authentication** - Secure user accounts with Clerk
- **🔑 API Keys** - Generate and manage API keys from the dashboard
- **🌐 Multi-Provider** - Access Pollinations AI, MapleAI, and more
- **📱 Responsive** - Works on desktop and mobile devices
- **🎨 Dark Mode** - Automatic dark mode support

## 🚀 Quick Start

### Deploy to Vercel (Recommended)

The easiest way to get started is to deploy to Vercel:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/CloudCompile/cloudgpt&env=NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,CLERK_SECRET_KEY,POLLINATIONS_API_KEY&envDescription=API%20keys%20required%20for%20CloudGPT&envLink=https://github.com/CloudCompile/cloudgpt/blob/main/KEYS_SETUP.md&project-name=cloudgpt&repository-name=cloudgpt)

1. Click the button above
2. Configure the required environment variables (see [KEYS_SETUP.md](./KEYS_SETUP.md))
3. Deploy!

### Local Development

```bash
# Clone the repository
git clone https://github.com/CloudCompile/cloudgpt.git
cd cloudgpt

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your API keys

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## 📡 API Endpoints

### Chat Completions

Generate chat completions using various LLMs.

```bash
POST /api/chat
```

**Request:**
```json
{
  "model": "openai",
  "messages": [
    {"role": "user", "content": "Hello, how are you?"}
  ],
  "temperature": 0.7,
  "max_tokens": 1000
}
```

**Response:**
```json
{
  "id": "chatcmpl-xxx",
  "object": "chat.completion",
  "created": 1234567890,
  "model": "gpt-4o",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "Hello! I'm doing well, thank you for asking."
      },
      "finish_reason": "stop"
    }
  ]
}
```

### Image Generation

Generate images from text prompts.

```bash
POST /api/image
```

**Request:**
```json
{
  "prompt": "A beautiful sunset over mountains",
  "model": "flux",
  "width": 1024,
  "height": 1024
}
```

**Response:** Returns the generated image (PNG/JPEG)

### Video Generation

Generate videos from text prompts.

```bash
POST /api/video
```

**Request:**
```json
{
  "prompt": "A cat playing with a ball",
  "model": "veo",
  "duration": 4
}
```

**Response:** Returns the generated video (MP4)

### Model Listings

Get available models for each modality:

```bash
GET /api/models/chat   # List chat models
GET /api/models/image  # List image models
GET /api/models/video  # List video models
```

## 🔑 Authentication

### User Authentication

The dashboard and API key management require user authentication via Clerk. Sign in to access:
- API key creation and management
- Usage statistics (coming soon)
- Account settings

### API Authentication

Use your API key in the Authorization header:

```bash
curl -X POST https://your-app.vercel.app/api/chat \
  -H "Authorization: Bearer cgpt_xxxxxxxxxxxxxxxxxxxx" \
  -H "Content-Type: application/json" \
  -d '{"model": "openai", "messages": [{"role": "user", "content": "Hello!"}]}'
```

## 📋 Available Models

### Chat Models

| Model ID | Name | Description |
|----------|------|-------------|
| `openai` | OpenAI GPT-4o | OpenAI's flagship model |
| `openai-fast` | GPT-4o Mini | Faster, more economical |
| `openai-large` | GPT-4.5 | Largest OpenAI model |
| `claude` | Claude 3.5 Sonnet | Anthropic's balanced model |
| `claude-fast` | Claude 3 Haiku | Fast Claude responses |
| `gemini` | Gemini 2.0 Flash | Google's fast model |
| `gemini-large` | Gemini 2.5 Pro | Google's advanced model |
| `deepseek` | DeepSeek V3 | DeepSeek's latest |
| `grok` | Grok 3 | xAI's model |
| `mistral` | Mistral Large | Mistral AI's large model |
| `qwen-coder` | Qwen 2.5 Coder | Coding-focused model |

### Image Models

| Model ID | Name | Description |
|----------|------|-------------|
| `flux` | Flux | High-quality generation |
| `turbo` | Turbo | Fast generation |
| `gptimage` | GPT Image | OpenAI DALL-E |
| `kontext` | Kontext | Context-aware |
| `seedream` | Seedream | Creative styles |

### Video Models

| Model ID | Name | Max Duration |
|----------|------|--------------|
| `veo` | Google Veo | 8 seconds |
| `seedance` | Seedance | 10 seconds |

## 🛠️ Configuration

See [KEYS_SETUP.md](./KEYS_SETUP.md) for detailed instructions on setting up:
- Clerk authentication
- Pollinations API key
- MapleAI API key
- Other environment variables

## 📁 Project Structure

```
cloudgpt/
├── app/
│   ├── api/
│   │   ├── chat/route.ts      # Chat completions endpoint
│   │   ├── image/route.ts     # Image generation endpoint
│   │   ├── video/route.ts     # Video generation endpoint
│   │   ├── keys/route.ts      # API key management
│   │   └── models/
│   │       ├── chat/route.ts  # List chat models
│   │       ├── image/route.ts # List image models
│   │       └── video/route.ts # List video models
│   ├── dashboard/
│   │   └── page.tsx           # Dashboard page
│   ├── layout.tsx             # Root layout with Clerk
│   ├── page.tsx               # Home page
│   └── globals.css            # Global styles
├── lib/
│   ├── api-keys.ts            # API key utilities
│   └── providers.ts           # AI provider configs
├── docs/                      # Frontend for GitHub Pages
├── proxy.ts                   # Clerk middleware
├── KEYS_SETUP.md              # Keys setup guide
└── README.md                  # This file
```

## 🌐 GitHub Pages Frontend

The `/docs` folder contains a static frontend that can be deployed to GitHub Pages. It provides:
- API documentation
- Interactive examples
- Getting started guide

To enable GitHub Pages:
1. Go to your repository Settings
2. Navigate to Pages
3. Set Source to "Deploy from a branch"
4. Select the `main` branch and `/docs` folder

## 🔒 Rate Limits

| User Type | Chat | Image | Video |
|-----------|------|-------|-------|
| Anonymous | 10/min | 5/min | 2/min |
| Authenticated | 60/min | 30/min | 10/min |

Rate limit headers are included in responses:
- `X-RateLimit-Remaining`: Requests remaining
- `X-RateLimit-Reset`: Reset timestamp

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Pollinations AI](https://pollinations.ai) - AI generation API
- [MapleAI](https://mapleai.de) - AI provider
- [Clerk](https://clerk.com) - Authentication
- [Vercel](https://vercel.com) - Hosting platform
- [Next.js](https://nextjs.org) - React framework
