'use client';

import { useState } from 'react';

export default function DocsPage() {
  const [expandedSection, setExpandedSection] = useState('getting-started');

  const sections = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      content: `
        <h3>Create an Account</h3>
        <p>Sign up for free at OpenRelay to get started with 150+ AI models.</p>

        <h3>Generate API Key</h3>
        <p>Once logged in, go to your dashboard and create an API key. You'll use this to authenticate your requests.</p>

        <h3>Choose a Model</h3>
        <p>Browse our <a href="/models">models page</a> to see all available options. Each model has a unique ID that you'll use in API requests.</p>
      `
    },
    {
      id: 'api-reference',
      title: 'API Reference',
      content: `
        <h3>Base URL</h3>
        <p><code>https://www.cjhauser.me/v1</code></p>

        <h3>Authentication</h3>
        <p>Include your API key in the Authorization header:</p>
        <p><code>Authorization: Bearer or_YOUR_KEY_HERE</code></p>

        <h3>Endpoints</h3>
        <ul>
          <li><code>POST /chat/completions</code> - Chat with LLMs</li>
          <li><code>POST /images/generations</code> - Generate images</li>
          <li><code>POST /videos/generations</code> - Generate videos</li>
          <li><code>POST /audio/speech</code> - Text-to-speech</li>
          <li><code>POST /audio/transcriptions</code> - Speech-to-text</li>
          <li><code>POST /embeddings</code> - Generate embeddings</li>
          <li><code>GET /models</code> - List available models</li>
        </ul>
      `
    },
    {
      id: 'chat-completions',
      title: 'Chat Completions',
      content: `
        <h3>Request</h3>
        <p><code>POST /chat/completions</code></p>

        <p><strong>Parameters:</strong></p>
        <ul>
          <li><code>model</code> (string, required) - Model ID from /models endpoint</li>
          <li><code>messages</code> (array, required) - Array of message objects with role and content</li>
          <li><code>temperature</code> (number, 0-2) - Randomness (default: 0.7)</li>
          <li><code>max_tokens</code> (number) - Max response length</li>
          <li><code>stream</code> (boolean) - Stream response tokens</li>
        </ul>

        <h3>Example</h3>
        <pre>curl https://www.cjhauser.me/v1/chat/completions \\
  -H "Authorization: Bearer or_YOUR_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "groq/llama-3.3-70b-versatile",
    "messages": [{"role": "user", "content": "What is 2+2?"}],
    "temperature": 0.7
  }'</pre>

        <h3>Model Selection</h3>
        <p>Specify models with their provider prefix for guaranteed routing:</p>
        <ul>
          <li><code>groq/llama-3.3-70b-versatile</code> - Use Groq</li>
          <li><code>cerebras/llama-3.3-70b</code> - Use Cerebras</li>
          <li><code>pollinations/openai</code> - Use Pollinations</li>
        </ul>
        <p>Without a prefix, OpenRelay automatically selects the best available provider.</p>
      `
    },
    {
      id: 'image-generation',
      title: 'Image Generation',
      content: `
        <h3>Request</h3>
        <p><code>POST /images/generations</code></p>

        <p><strong>Parameters:</strong></p>
        <ul>
          <li><code>model</code> (string, required) - Image model ID</li>
          <li><code>prompt</code> (string, required) - What to generate</li>
          <li><code>n</code> (number) - Number of images (default: 1)</li>
          <li><code>size</code> (string) - Image dimensions (e.g., "1024x1024")</li>
          <li><code>quality</code> (string) - "standard" or "hd"</li>
        </ul>

        <h3>Available Models</h3>
        <p>Popular image models:</p>
        <ul>
          <li><code>pollinations/flux</code> - High-quality image generation</li>
          <li><code>pollinations/gptimage</code> - OpenAI-style images</li>
          <li><code>pollinations/qwen-image</code> - Qwen image generation</li>
        </ul>
      `
    },
    {
      id: 'provider-limits',
      title: 'Provider Rate Limits',
      content: `
        <h3>Groq</h3>
        <p>High-speed models with per-model rate limits:</p>
        <ul>
          <li><code>llama-3.3-70b-versatile</code>: 30 req/min, 1K req/day</li>
          <li><code>llama-3.1-8b-instant</code>: 30 req/min, 14.4K req/day</li>
          <li><code>qwen/qwen3-32b</code>: 60 req/min, 1K req/day</li>
        </ul>

        <h3>Cerebras</h3>
        <p>1M tokens/day per key, automatic key rotation</p>

        <h3>Others</h3>
        <p>Rate limits scale with number of API keys configured. More keys = higher throughput.</p>
      `
    },
    {
      id: 'code-examples',
      title: 'Code Examples',
      content: `
        <h3>Python</h3>
        <pre>from openai import OpenAI

client = OpenAI(
  api_key="or_YOUR_KEY",
  base_url="https://www.cjhauser.me/v1"
)

response = client.chat.completions.create(
  model="groq/llama-3.3-70b-versatile",
  messages=[{"role": "user", "content": "Hello!"}]
)

print(response.choices[0].message.content)</pre>

        <h3>JavaScript/Node.js</h3>
        <pre>import OpenAI from "openai";

const client = new OpenAI({
  apiKey: "or_YOUR_KEY",
  baseURL: "https://www.cjhauser.me/v1"
});

const response = await client.chat.completions.create({
  model: "groq/llama-3.3-70b-versatile",
  messages: [{ role: "user", content: "Hello!" }]
});

console.log(response.choices[0].message.content);</pre>

        <h3>cURL</h3>
        <pre>curl https://www.cjhauser.me/v1/chat/completions \\
  -H "Authorization: Bearer or_YOUR_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "groq/llama-3.3-70b-versatile",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'</pre>
      `
    },
    {
      id: 'error-handling',
      title: 'Error Handling',
      content: `
        <h3>Common Status Codes</h3>
        <ul>
          <li><code>200</code> - Success</li>
          <li><code>400</code> - Bad request (check your parameters)</li>
          <li><code>401</code> - Unauthorized (invalid or missing API key)</li>
          <li><code>429</code> - Rate limited (wait before retrying)</li>
          <li><code>500</code> - Server error (we're working on it)</li>
        </ul>

        <h3>Retry Strategy</h3>
        <p>Implement exponential backoff for 429 and 5xx errors:</p>
        <ul>
          <li>First retry: wait 1 second</li>
          <li>Second retry: wait 2 seconds</li>
          <li>Third retry: wait 4 seconds</li>
          <li>Maximum 3 retries</li>
        </ul>
      `
    },
    {
      id: 'best-practices',
      title: 'Best Practices',
      content: `
        <h3>Model Selection</h3>
        <ul>
          <li>Use <code>groq/llama-3.3-70b-versatile</code> for balanced speed and quality</li>
          <li>Use <code>groq/llama-3.1-8b-instant</code> for fast responses with higher rate limits</li>
          <li>Specify provider explicitly for guaranteed routing</li>
        </ul>

        <h3>Performance</h3>
        <ul>
          <li>Use streaming for long responses to improve perceived latency</li>
          <li>Set reasonable <code>max_tokens</code> limits</li>
          <li>Batch requests when possible</li>
          <li>Implement caching for repeated queries</li>
        </ul>

        <h3>Reliability</h3>
        <ul>
          <li>Always implement retry logic with exponential backoff</li>
          <li>Monitor your rate limit headers</li>
          <li>Set up alerts for 401 errors (key issues)</li>
          <li>Test with different models before production</li>
        </ul>
      `
    }
  ];

  return (
    <main className="container" style={{ paddingTop: '60px', paddingBottom: '80px', maxWidth: '1200px' }}>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '12px' }}>Documentation</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '40px', fontSize: '1.05rem' }}>
        Complete guide to using OpenRelay's API with 150+ free AI models
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
                borderRadius: '12px 8px 10px 14px',
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
                dangerouslySetInnerHTML={{ __html: section.content }}
                style={{
                  color: 'var(--text-secondary)',
                  lineHeight: '1.8',
                }}
              />
              <style>{`
                h3 {
                  color: var(--fg);
                  font-size: 1.2rem;
                  margin-top: 24px;
                  margin-bottom: 12px;
                  font-weight: 600;
                }
                h3:first-child {
                  margin-top: 0;
                }
                p {
                  margin-bottom: 16px;
                }
                ul {
                  margin-left: 20px;
                  margin-bottom: 16px;
                }
                li {
                  margin-bottom: 8px;
                }
                code {
                  background: var(--bg-secondary);
                  padding: 2px 6px;
                  border-radius: 4px;
                  font-family: monospace;
                  font-size: 0.9em;
                  color: var(--accent);
                }
                pre {
                  background: var(--bg-secondary);
                  padding: 16px;
                  border-radius: 12px;
                  border: 1px solid var(--border);
                  overflow-x: auto;
                  margin-bottom: 16px;
                  font-size: 0.85rem;
                  line-height: 1.5;
                }
                a {
                  color: var(--accent);
                  text-decoration: none;
                }
                a:hover {
                  text-decoration: underline;
                }
              `}</style>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
