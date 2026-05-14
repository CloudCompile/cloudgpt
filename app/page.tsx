import { SignedIn, SignedOut, SignUpButton } from '@clerk/nextjs';

export default function Home() {
  return (
    <main>
      <section className="hero container">
        <h1>OpenRelay</h1>
        <p>Free AI API for everyone</p>

        <div className="base-url">
          https://your-domain.com/v1
        </div>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginBottom: '40px' }}>
          <SignedOut>
            <SignUpButton>
              <button className="button">Get Started</button>
            </SignUpButton>
          </SignedOut>
          <SignedIn>
            <a href="/dashboard" className="button">Go to Dashboard</a>
          </SignedIn>
          <a href="/models" className="button secondary">View Models</a>
        </div>
      </section>

      <section className="steps container">
        <h2>Three Steps to Start</h2>
        <div className="steps-grid">
          <div className="step-item">
            <div className="step-number">1</div>
            <h3>Sign Up</h3>
            <p>Create your free account in seconds</p>
          </div>
          <div className="step-item">
            <div className="step-number">2</div>
            <h3>Get Your API Key</h3>
            <p>Generate an API key from the dashboard</p>
          </div>
          <div className="step-item">
            <div className="step-number">3</div>
            <h3>Start Building</h3>
            <p>Use our OpenAI-compatible API in your app</p>
          </div>
        </div>
      </section>

      <section className="example-section">
        <div className="container">
          <h2>Example Request</h2>
          <p style={{ marginBottom: '20px', color: 'var(--text-secondary)' }}>
            OpenRelay is compatible with the OpenAI SDK and other clients that support OpenAI-compatible APIs.
          </p>
          <div className="curl-example">{`curl https://your-domain.com/v1/chat/completions \\
  -H "Authorization: Bearer or_YOUR_KEY_HERE" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "gpt-4",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'`}</div>

          <h3 style={{ marginTop: '40px', marginBottom: '20px' }}>Python</h3>
          <div className="curl-example">{`from openai import OpenAI

client = OpenAI(
  api_key="or_YOUR_KEY_HERE",
  base_url="https://your-domain.com/v1"
)

response = client.chat.completions.create(
  model="gpt-4",
  messages=[{"role": "user", "content": "Hello!"}]
)

print(response.choices[0].message.content)`}</div>

          <h3 style={{ marginTop: '40px', marginBottom: '20px' }}>Node.js</h3>
          <div className="curl-example">{`import OpenAI from "openai";

const client = new OpenAI({
  apiKey: "or_YOUR_KEY_HERE",
  baseURL: "https://your-domain.com/v1"
});

const response = await client.chat.completions.create({
  model: "gpt-4",
  messages: [{ role: "user", content: "Hello!" }]
});

console.log(response.choices[0].message.content);`}</div>
        </div>
      </section>

      <section className="quick-links container">
        <div style={{ paddingTop: '40px', paddingBottom: '40px' }}>
          <SignedIn>
            <a href="/dashboard" className="button">Dashboard</a>
          </SignedIn>
          <SignedOut>
            <SignUpButton>
              <button className="button">Sign Up</button>
            </SignUpButton>
          </SignedOut>
          <a href="/models" className="button secondary">Models</a>
        </div>
      </section>

      <footer className="footer container">
        <p>
          OpenRelay — Free AI API for everyone •{' '}
          <a href="https://github.com/CloudCompile/cloudgpt" target="_blank" rel="noopener noreferrer">
            GitHub
          </a>
        </p>
      </footer>
    </main>
  );
}
