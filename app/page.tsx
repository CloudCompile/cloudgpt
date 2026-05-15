import { SignedIn, SignedOut, SignUpButton } from '@clerk/nextjs';

export default function Home() {
  return (
    <main>
      <section className="hero container">
        <h1>OpenRelay</h1>
        <p>Free AI API gateway for everyone</p>

        <div className="base-url">
          https://www.cjhauser.me/v1
        </div>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginBottom: '40px', flexWrap: 'wrap' }}>
          <SignedOut>
            <SignUpButton>
              <button className="button">Get Started Free</button>
            </SignUpButton>
          </SignedOut>
          <SignedIn>
            <a href="/dashboard" className="button">Dashboard</a>
          </SignedIn>
          <a href="/models" className="button secondary">Browse Models</a>
        </div>
      </section>

      <section className="steps container">
        <h2>Get Started in Minutes</h2>
        <div className="steps-grid">
          <div className="step-item">
            <div className="step-number">1</div>
            <h3>Create Account</h3>
            <p>Sign up for free and access 100+ AI models instantly</p>
          </div>
          <div className="step-item">
            <div className="step-number">2</div>
            <h3>Generate API Key</h3>
            <p>Create an API key from your dashboard in seconds</p>
          </div>
          <div className="step-item">
            <div className="step-number">3</div>
            <h3>Start Building</h3>
            <p>Use any OpenAI-compatible client with your API key</p>
          </div>
        </div>
      </section>

      <section className="example-section">
        <div className="container">
          <h2>Simple & Powerful</h2>
          <p style={{ marginBottom: '40px', color: 'var(--text-secondary)', fontSize: '1.05rem' }}>
            OpenRelay is fully OpenAI-compatible. Works with any client that supports the OpenAI API. Access models from <strong style={{ color: 'var(--fg)' }}>AIHubMix, Pollinations, VoidAI, Airforce, and Cerebras</strong>.
          </p>

          <h3>cURL</h3>
          <div className="curl-example">{`curl https://www.cjhauser.me/v1/chat/completions \\
  -H "Authorization: Bearer or_YOUR_KEY_HERE" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "gpt-4o-free",
    "messages": [
      {"role": "user", "content": "Hello!"}
    ]
  }'`}</div>

          <h3>Python</h3>
          <div className="curl-example">{`from openai import OpenAI

client = OpenAI(
  api_key="or_YOUR_KEY_HERE",
  base_url="https://www.cjhauser.me/v1"
)

response = client.chat.completions.create(
  model="gpt-4o-free",
  messages=[{"role": "user", "content": "What's 2+2?"}]
)

print(response.choices[0].message.content)`}</div>

          <h3>JavaScript / Node.js</h3>
          <div className="curl-example">{`import OpenAI from "openai";

const client = new OpenAI({
  apiKey: "or_YOUR_KEY_HERE",
  baseURL: "https://www.cjhauser.me/v1"
});

const response = await client.chat.completions.create({
  model: "gpt-4o-free",
  messages: [{ role: "user", content: "Hello!" }]
});

console.log(response.choices[0].message.content);`}</div>

          <div style={{ marginTop: '40px', padding: '20px', background: 'rgba(124, 58, 237, 0.06)', borderRadius: '22px 14px 18px 24px', border: '1px solid rgba(124, 58, 237, 0.25)' }}>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '12px' }}>
              💡 <strong style={{ color: 'var(--fg)' }}>Tip:</strong> Use any model from the <a href="/models">models list</a>. Replace model names in your requests to access different providers and capabilities.
            </p>
          </div>
        </div>
      </section>

      <section className="quick-links container">
        <div style={{ paddingTop: '60px', paddingBottom: '60px', borderRadius: '32px 20px 28px 24px', padding: '60px 40px', background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.1) 0%, rgba(79, 70, 229, 0.06) 50%, rgba(59, 130, 246, 0.04) 100%)', border: '1px solid rgba(124, 58, 237, 0.25)', textAlign: 'center' }}>
          <h2 style={{ marginBottom: '30px', fontSize: '2rem' }}>Ready to Build?</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '40px', fontSize: '1.05rem', maxWidth: '600px', margin: '0 auto 40px' }}>
            Get access to 100+ free AI models and start building with OpenAI-compatible API endpoints.
          </p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <SignedIn>
              <a href="/dashboard" className="button">Go to Dashboard</a>
            </SignedIn>
            <SignedOut>
              <SignUpButton>
                <button className="button">Sign Up Free</button>
              </SignUpButton>
            </SignedOut>
            <a href="/models" className="button secondary">View All Models</a>
          </div>
        </div>
      </section>

      <footer className="footer container">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
          <span>OpenRelay — Free AI API Gateway</span>
          <span style={{ color: 'var(--border-light)' }}>•</span>
          <a href="https://github.com/CloudCompile/cloudgpt" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            GitHub
          </a>
        </div>
      </footer>
    </main>
  );
}
