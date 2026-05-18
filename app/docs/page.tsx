'use client';

import { useState } from 'react';

export default function DocsPage() {
  const [expandedSection, setExpandedSection] = useState('getting-started');

  const sections = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      content: `
        <h3>What is OpenRelay?</h3>
        <p>OpenRelay is a free, open API gateway that gives you instant access to 357+ AI models from 9 leading providers. No credit card required, no rate limiting, no lock-in.</p>
        <p>Simply authenticate with an API key and start making requests to state-of-the-art models for chat, images, video, audio, and more — all through a single OpenAI-compatible interface.</p>

        <h3>Quick Start (2 minutes)</h3>
        <ol>
          <li><a href="/dashboard">Create a free account</a> and generate an API key</li>
          <li>Choose a model from the <a href="/models">models page</a></li>
          <li>Make your first request using your preferred SDK or cURL</li>
        </ol>

        <h3>Your API Key</h3>
        <p>API keys start with <code>or_</code> and are 32 characters long. Keep them secure — never commit them to version control or expose them in client-side code.</p>
        <p>You can create multiple keys for different applications in your dashboard. Each key is rate-limited independently.</p>

        <h3>Supported Models</h3>
        <p>Access models across all categories:</p>
        <ul>
          <li><strong>Text/Chat:</strong> Llama 3.1 (70B, 8B), QwQ, Phi, Mistral, and more</li>
          <li><strong>Images:</strong> Flux, DALL-E compatible models, Qwen</li>
          <li><strong>Video:</strong> Fast video generation with multiple providers</li>
          <li><strong>Audio:</strong> TTS and speech-to-text</li>
          <li><strong>Embeddings:</strong> Text embeddings for semantic search</li>
        </ul>
      `
    },
    {
      id: 'authentication',
      title: 'Authentication',
      content: `
        <h3>Bearer Token Authentication</h3>
        <p>All API requests require authentication via Bearer token in the Authorization header:</p>
        <pre>Authorization: Bearer or_YOUR_API_KEY</pre>

        <h3>Include in Requests</h3>
        <p>Add the header to every request you make:</p>
        <pre>curl https://www.cjhauser.me/v1/chat/completions \\
  -H "Authorization: Bearer or_abc123..." \\
  -H "Content-Type: application/json" \\
  -d '{"model": "gpt-4", "messages": [...]}'</pre>

        <h3>Managing Keys</h3>
        <ul>
          <li>Generate new keys in your <a href="/dashboard">dashboard</a></li>
          <li>Delete unused keys anytime</li>
          <li>Each key is independent with separate usage tracking</li>
          <li>Keys are encrypted and never logged in plaintext</li>
        </ul>

        <h3>Security Best Practices</h3>
        <ul>
          <li><strong>Never hardcode keys:</strong> Use environment variables</li>
          <li><strong>Rotate regularly:</strong> Delete old keys and create new ones periodically</li>
          <li><strong>Use different keys per environment:</strong> Separate dev, staging, and production keys</li>
          <li><strong>Monitor usage:</strong> Check your dashboard for unusual activity</li>
        </ul>
      `
    },
    {
      id: 'api-reference',
      title: 'API Reference',
      content: `
        <h3>Base URL</h3>
        <pre>https://www.cjhauser.me/v1</pre>

        <h3>Available Endpoints</h3>
        <ul>
          <li><code>POST /chat/completions</code> - Chat with language models</li>
          <li><code>POST /images/generations</code> - Generate images from text</li>
          <li><code>POST /videos/generations</code> - Generate videos from text</li>
          <li><code>POST /audio/speech</code> - Convert text to speech</li>
          <li><code>POST /audio/transcriptions</code> - Convert speech to text</li>
          <li><code>POST /embeddings</code> - Generate text embeddings</li>
          <li><code>GET /models</code> - List all available models</li>
        </ul>

        <h3>Response Format</h3>
        <p>All responses are JSON. Successful requests return 200-299 status codes with data in the response body. Errors return 4xx or 5xx status codes with an error message.</p>

        <h3>Streaming Responses</h3>
        <p>For chat endpoints, set <code>"stream": true</code> to receive tokens as they're generated. The response will be newline-delimited JSON with partial data.</p>
      `
    },
    {
      id: 'chat-completions',
      title: 'Chat Completions',
      content: `
        <h3>Endpoint</h3>
        <pre>POST /chat/completions</pre>

        <h3>Request Body</h3>
        <pre>{
  "model": "groq/llama-3.3-70b-versatile",
  "messages": [
    {"role": "system", "content": "You are a helpful assistant."},
    {"role": "user", "content": "What is 2+2?"}
  ],
  "temperature": 0.7,
  "max_tokens": 1024,
  "top_p": 1.0,
  "stream": false
}</pre>

        <h3>Parameters</h3>
        <ul>
          <li><code>model</code> (string, required) - Model ID, optionally with provider prefix like <code>groq/llama-3.3-70b-versatile</code></li>
          <li><code>messages</code> (array, required) - Array of message objects with <code>role</code> (system/user/assistant) and <code>content</code></li>
          <li><code>temperature</code> (number, 0-2, default: 0.7) - Randomness. Lower = deterministic, higher = creative</li>
          <li><code>max_tokens</code> (number) - Maximum tokens in the response. Limits cost and latency</li>
          <li><code>top_p</code> (number, 0-1, default: 1.0) - Nucleus sampling for diversity</li>
          <li><code>stream</code> (boolean, default: false) - Stream tokens as they're generated</li>
          <li><code>frequency_penalty</code> (number, -2.0 to 2.0) - Reduce token repetition</li>
          <li><code>presence_penalty</code> (number, -2.0 to 2.0) - Encourage new topics</li>
        </ul>

        <h3>Response Example</h3>
        <pre>{
  "id": "chatcmpl-...",
  "object": "chat.completion",
  "created": 1234567890,
  "model": "groq/llama-3.3-70b-versatile",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "2 + 2 = 4"
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 45,
    "completion_tokens": 15,
    "total_tokens": 60
  }
}</pre>

        <h3>Model Selection Guide</h3>
        <ul>
          <li><strong>Fast & Cheap:</strong> <code>groq/llama-3.1-8b-instant</code> - Best for simple tasks</li>
          <li><strong>Balanced:</strong> <code>groq/llama-3.3-70b-versatile</code> - Best all-rounder</li>
          <li><strong>Best Quality:</strong> <code>cerebras/llama-3.3-70b</code> - For complex reasoning</li>
          <li><strong>Auto-selection:</strong> Omit provider prefix to let OpenRelay choose the best available model</li>
        </ul>

        <h3>Streaming Example</h3>
        <pre>const response = await fetch('https://www.cjhauser.me/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer or_YOUR_KEY',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    model: 'groq/llama-3.3-70b-versatile',
    messages: [{ role: 'user', content: 'Hi!' }],
    stream: true,
  }),
});

const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;

  const chunk = decoder.decode(value);
  const lines = chunk.split('\\n').filter(l => l.trim());

  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const data = JSON.parse(line.slice(6));
      if (data.choices?.[0]?.delta?.content) {
        process.stdout.write(data.choices[0].delta.content);
      }
    }
  }
}</pre>
      `
    },
    {
      id: 'image-generation',
      title: 'Image Generation',
      content: `
        <h3>Endpoint</h3>
        <pre>POST /images/generations</pre>

        <h3>Request Body</h3>
        <pre>{
  "model": "pollinations/flux",
  "prompt": "A serene mountain landscape at sunset, photorealistic, 8k",
  "n": 1,
  "size": "1024x1024",
  "quality": "hd"
}</pre>

        <h3>Parameters</h3>
        <ul>
          <li><code>model</code> (string, required) - Image model ID</li>
          <li><code>prompt</code> (string, required) - Detailed description of what to generate</li>
          <li><code>n</code> (number, default: 1, max: 4) - Number of images to generate</li>
          <li><code>size</code> (string) - Image dimensions. Common: "1024x1024", "1024x1792", "1792x1024"</li>
          <li><code>quality</code> (string) - "standard" or "hd" for higher quality</li>
          <li><code>style</code> (string, optional) - Artistic style modifier</li>
        </ul>

        <h3>Popular Image Models</h3>
        <ul>
          <li><strong>flux:</strong> <code>pollinations/flux</code> - Highest quality, realistic images</li>
          <li><strong>DALL-E compatible:</strong> <code>pollinations/gptimage</code> - Fast, diverse styles</li>
          <li><strong>Qwen:</strong> <code>pollinations/qwen-image</code> - Fast, good for varied prompts</li>
        </ul>

        <h3>Response Example</h3>
        <pre>{
  "created": 1234567890,
  "data": [
    {
      "url": "https://cjhauser.me/image-xyz.png"
    }
  ]
}</pre>

        <h3>Prompt Tips</h3>
        <ul>
          <li><strong>Be specific:</strong> Include colors, style, composition, lighting</li>
          <li><strong>Add quality markers:</strong> "photorealistic", "4k", "cinematic", "oil painting"</li>
          <li><strong>Specify composition:</strong> "wide shot", "close-up", "symmetrical", "rule of thirds"</li>
          <li><strong>Include artist references:</strong> "in the style of Artstation", "concept art"</li>
        </ul>
      `
    },
    {
      id: 'embeddings',
      title: 'Embeddings',
      content: `
        <h3>Endpoint</h3>
        <pre>POST /embeddings</pre>

        <h3>Request Body</h3>
        <pre>{
  "model": "text-embedding-ada-002",
  "input": "The quick brown fox jumps over the lazy dog"
}</pre>

        <h3>Parameters</h3>
        <ul>
          <li><code>model</code> (string, required) - Embedding model ID</li>
          <li><code>input</code> (string or array, required) - Text(s) to embed. Can be single string or array of strings</li>
          <li><code>encoding_format</code> (string, default: "float") - "float" or "base64"</li>
        </ul>

        <h3>Response Example</h3>
        <pre>{
  "object": "list",
  "data": [
    {
      "object": "embedding",
      "embedding": [0.0023, -0.0142, 0.0234, ...],
      "index": 0
    }
  ],
  "model": "text-embedding-ada-002",
  "usage": {
    "prompt_tokens": 12,
    "total_tokens": 12
  }
}</pre>

        <h3>Use Cases</h3>
        <ul>
          <li><strong>Semantic Search:</strong> Find similar documents by comparing embeddings</li>
          <li><strong>Clustering:</strong> Group similar texts together</li>
          <li><strong>Recommendations:</strong> Find related products or content</li>
          <li><strong>Duplicate Detection:</strong> Identify near-duplicate texts</li>
        </ul>
      `
    },
    {
      id: 'error-handling',
      title: 'Error Handling',
      content: `
        <h3>HTTP Status Codes</h3>
        <ul>
          <li><code>200-299</code> - Success. Response contains the requested data</li>
          <li><code>400</code> - Bad Request. Invalid parameters or malformed JSON</li>
          <li><code>401</code> - Unauthorized. Invalid or missing API key</li>
          <li><code>403</code> - Forbidden. Your account doesn't have access to this resource</li>
          <li><code>429</code> - Too Many Requests. Rate limited. Retry after a delay</li>
          <li><code>500</code> - Server Error. We're experiencing issues. Retry with exponential backoff</li>
          <li><code>503</code> - Service Unavailable. The API is temporarily down</li>
        </ul>

        <h3>Error Response Format</h3>
        <pre>{
  "error": {
    "message": "Invalid API key provided",
    "type": "invalid_request_error",
    "code": "invalid_api_key"
  }
}</pre>

        <h3>Retry Strategy</h3>
        <p>Implement exponential backoff for transient errors (429, 5xx):</p>
        <ul>
          <li>Retry after 1 second for the first attempt</li>
          <li>Retry after 2 seconds for the second attempt</li>
          <li>Retry after 4 seconds for the third attempt</li>
          <li>Stop after 3 failed retries</li>
        </ul>

        <h3>Common Issues</h3>
        <ul>
          <li><strong>401 Unauthorized:</strong> Check your API key is correct and starts with <code>or_</code></li>
          <li><strong>429 Rate Limited:</strong> You've exceeded rate limits. Implement backoff and try again</li>
          <li><strong>400 Bad Request:</strong> Review your request parameters. Check JSON formatting</li>
          <li><strong>Model not found:</strong> The model doesn't exist or you mistyped the name</li>
        </ul>

        <h3>Error Handling Example (JavaScript)</h3>
        <pre>async function makeRequest(endpoint, payload) {
  let retries = 0;
  const maxRetries = 3;

  while (retries < maxRetries) {
    try {
      const response = await fetch(\`https://www.cjhauser.me/v1\${endpoint}\`, {
        method: 'POST',
        headers: {
          'Authorization': \`Bearer \${process.env.CLOUDGPT_API_KEY}\`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        return await response.json();
      }

      if (response.status === 429 || response.status >= 500) {
        // Exponential backoff
        const delay = Math.pow(2, retries) * 1000;
        await new Promise(r => setTimeout(r, delay));
        retries++;
        continue;
      }

      // Non-retryable error
      throw new Error(\`HTTP \${response.status}\`);
    } catch (error) {
      if (retries === maxRetries - 1) throw error;
      retries++;
    }
  }
}</pre>
      `
    },
    {
      id: 'code-examples',
      title: 'Code Examples',
      content: `
        <h3>Python</h3>
        <pre>from openai import OpenAI

client = OpenAI(
    api_key="or_YOUR_API_KEY",
    base_url="https://www.cjhauser.me/v1"
)

# Simple chat
response = client.chat.completions.create(
    model="groq/llama-3.3-70b-versatile",
    messages=[
        {"role": "system", "content": "You are a helpful coding assistant."},
        {"role": "user", "content": "Write a Python function to calculate Fibonacci numbers"}
    ],
    temperature=0.7,
    max_tokens=1024
)

print(response.choices[0].message.content)

# With streaming
with client.chat.completions.create(
    model="groq/llama-3.3-70b-versatile",
    messages=[{"role": "user", "content": "Hello!"}],
    stream=True
) as stream:
    for text in stream.text_stream:
        print(text, end="", flush=True)

# Image generation
image_response = client.images.generate(
    model="pollinations/flux",
    prompt="A serene mountain landscape",
    n=1,
    size="1024x1024"
)

print(image_response.data[0].url)</pre>

        <h3>JavaScript / Node.js</h3>
        <pre>import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.CLOUDGPT_API_KEY,
  baseURL: "https://www.cjhauser.me/v1"
});

// Simple chat
const completion = await client.chat.completions.create({
  model: "groq/llama-3.3-70b-versatile",
  messages: [
    { role: "system", content: "You are helpful." },
    { role: "user", content: "Hello!" }
  ],
  temperature: 0.7,
  max_tokens: 1024
});

console.log(completion.choices[0].message.content);

// With streaming
const stream = await client.chat.completions.create({
  model: "groq/llama-3.3-70b-versatile",
  messages: [{ role: "user", content: "Write a poem about code" }],
  stream: true
});

for await (const chunk of stream) {
  process.stdout.write(chunk.choices[0]?.delta?.content || "");
}

// Image generation
const image = await client.images.generate({
  model: "pollinations/flux",
  prompt: "A futuristic city at night",
  n: 1,
  size: "1024x1024"
});

console.log(image.data[0].url);</pre>

        <h3>cURL</h3>
        <pre>curl https://www.cjhauser.me/v1/chat/completions \\
  -H "Authorization: Bearer or_YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "groq/llama-3.3-70b-versatile",
    "messages": [
      {"role": "user", "content": "What is the capital of France?"}
    ],
    "temperature": 0.7,
    "max_tokens": 100
  }'

# Image generation
curl https://www.cjhauser.me/v1/images/generations \\
  -H "Authorization: Bearer or_YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "pollinations/flux",
    "prompt": "A beautiful sunset over mountains",
    "n": 1,
    "size": "1024x1024"
  }'

# Get embeddings
curl https://www.cjhauser.me/v1/embeddings \\
  -H "Authorization: Bearer or_YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "text-embedding-ada-002",
    "input": "Hello world"
  }'</pre>
      `
    },
    {
      id: 'rate-limits',
      title: 'Rate Limits & Provider Info',
      content: `
        <h3>How Rate Limiting Works</h3>
        <p>Rate limits are applied per API key. If you exceed limits, you'll receive a 429 response. The limit varies based on the provider you're using.</p>

        <h3>Provider Details</h3>

        <h4>Groq</h4>
        <p>Fast inference with per-model rate limits:</p>
        <ul>
          <li><code>llama-3.3-70b-versatile</code>: 30 req/min, 1K req/day</li>
          <li><code>llama-3.1-8b-instant</code>: 30 req/min, 14.4K req/day</li>
          <li><code>mixtral-8x7b-32768</code>: 30 req/min, 1K req/day</li>
        </ul>

        <h4>Cerebras</h4>
        <p>High token throughput with 1M tokens/day per key. Automatic key rotation ensures you stay within limits.</p>

        <h4>Pollinations</h4>
        <p>40+ models for text, images, and more. High rate limits with automatic fallback.</p>

        <h4>Others (VoidAI, Airforce, AIHorde)</h4>
        <p>Rate limits scale with the number of API keys you configure. More keys = higher throughput.</p>

        <h3>Increasing Limits</h3>
        <p>Want higher limits? <a href="/contributor">Become a contributor</a> by donating API keys. Contributors get:</p>
        <ul>
          <li>Higher rate limits</li>
          <li>Priority access to new providers</li>
          <li>Visibility into system performance</li>
          <li>Exclusive Discord role</li>
        </ul>
      `
    },
    {
      id: 'best-practices',
      title: 'Best Practices',
      content: `
        <h3>API Key Security</h3>
        <ul>
          <li>Store keys in environment variables, never in code</li>
          <li>Use different keys for different environments (dev, staging, prod)</li>
          <li>Rotate keys periodically (monthly recommended)</li>
          <li>Revoke keys immediately if compromised</li>
          <li>Use a secrets manager (AWS Secrets Manager, HashiCorp Vault, etc.)</li>
        </ul>

        <h3>Performance Optimization</h3>
        <ul>
          <li><strong>Use streaming:</strong> For chat endpoints, enable streaming to get tokens as soon as they're generated</li>
          <li><strong>Set reasonable max_tokens:</strong> Don't request more tokens than needed</li>
          <li><strong>Batch requests:</strong> Send multiple texts for embeddings in one request</li>
          <li><strong>Choose the right model:</strong> Smaller models are faster and cheaper. Use the smallest model that works for your task</li>
          <li><strong>Cache responses:</strong> Store embeddings and frequently-requested data to reduce API calls</li>
        </ul>

        <h3>Reliability & Error Handling</h3>
        <ul>
          <li><strong>Always implement retry logic:</strong> Use exponential backoff for 429 and 5xx errors</li>
          <li><strong>Set request timeouts:</strong> Prevent requests from hanging indefinitely</li>
          <li><strong>Monitor your usage:</strong> Check your dashboard regularly for anomalies</li>
          <li><strong>Test before production:</strong> Try different models to find the best fit for your use case</li>
          <li><strong>Handle gracefully:</strong> Set up alerts for authentication errors (401)</li>
        </ul>

        <h3>Cost Optimization</h3>
        <ul>
          <li>The API is free with no rate limits during beta, so optimize for performance first</li>
          <li>Use smaller models when possible (e.g., 8B instead of 70B)</li>
          <li>Request only the tokens you need</li>
          <li>Cache embeddings for frequently-searched documents</li>
        </ul>

        <h3>Model Selection Flowchart</h3>
        <ul>
          <li><strong>Need the fastest response?</strong> → <code>groq/llama-3.1-8b-instant</code></li>
          <li><strong>Need the best quality?</strong> → <code>cerebras/llama-3.3-70b</code></li>
          <li><strong>Don't know?</strong> → <code>groq/llama-3.3-70b-versatile</code></li>
          <li><strong>Want OpenRelay to choose?</strong> → Omit the provider prefix (e.g., <code>llama-3.3-70b-versatile</code>)</li>
        </ul>
      `
    }
  ];

  return (
    <main className="container" style={{ paddingTop: '60px', paddingBottom: '80px', maxWidth: '1200px' }}>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '12px' }}>Documentation</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '40px', fontSize: '1.05rem' }}>
        Complete guide to using OpenRelay's free AI API with 357+ models from 10 providers
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '250px 1fr', gap: '32px', minHeight: '500px' }}>
        {/* Sidebar */}
        <nav style={{
          position: 'sticky',
          top: '20px',
          height: 'fit-content',
        }}>
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setExpandedSection(section.id)}
              style={{
                display: 'block',
                width: '100%',
                padding: '12px 16px',
                marginBottom: '8px',
                borderRadius: 'var(--radius)',
                border: expandedSection === section.id ? '2px solid var(--accent)' : '1px solid var(--border)',
                background: expandedSection === section.id ? 'rgba(124, 58, 237, 0.1)' : 'transparent',
                color: expandedSection === section.id ? 'var(--accent)' : 'var(--text-secondary)',
                cursor: 'pointer',
                textAlign: 'left',
                fontSize: '0.95rem',
                fontWeight: expandedSection === section.id ? '600' : '500',
                transition: 'all 0.2s ease',
              }}
            >
              {section.title}
            </button>
          ))}
        </nav>

        {/* Content */}
        <div>
          {sections.map((section) => (
            <div
              key={section.id}
              style={{ display: expandedSection === section.id ? 'block' : 'none' }}
            >
              <div
                className="docs-content"
                dangerouslySetInnerHTML={{ __html: section.content }}
                style={{
                  color: 'var(--text-secondary)',
                  lineHeight: '1.8',
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
