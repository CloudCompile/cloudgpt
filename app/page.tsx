export default function Home() {
  return (
    <main>
      <section className="hero container">
        <h1>Unified AI API Gateway</h1>
        <p>
          Access multiple AI providers through a single, unified API. Generate text, images, and videos with ease.
        </p>
        <a href="https://vercel.com/new/clone?repository-url=https://github.com/CloudCompile/cloudgpt" className="button" target="_blank" rel="noopener noreferrer">
          Deploy to Vercel
        </a>
      </section>

      <section className="endpoints container">
        <h2>API Endpoints</h2>
        <div className="endpoint-grid">
          <div className="endpoint-card">
            <h3>💬 Chat</h3>
            <p>Generate chat completions with various LLMs</p>
            <code>POST /api/chat</code>
          </div>
          <div className="endpoint-card">
            <h3>🖼️ Image</h3>
            <p>Generate images from text prompts</p>
            <code>POST /api/image</code>
          </div>
          <div className="endpoint-card">
            <h3>🎬 Video</h3>
            <p>Generate videos from text prompts</p>
            <code>POST /api/video</code>
          </div>
          <div className="endpoint-card">
            <h3>📋 Chat Models</h3>
            <p>List available chat models</p>
            <code>GET /api/models/chat</code>
          </div>
          <div className="endpoint-card">
            <h3>📋 Image Models</h3>
            <p>List available image models</p>
            <code>GET /api/models/image</code>
          </div>
          <div className="endpoint-card">
            <h3>📋 Video Models</h3>
            <p>List available video models</p>
            <code>GET /api/models/video</code>
          </div>
        </div>
      </section>

      <section className="features container">
        <h2>Features</h2>
        <div className="feature-grid">
          <div className="feature-item">
            <span style={{ fontSize: '3rem' }}>⚡</span>
            <h3>Edge Runtime</h3>
            <p>Fast responses with Vercel Edge Functions</p>
          </div>
          <div className="feature-item">
            <span style={{ fontSize: '3rem' }}>🔐</span>
            <h3>Authentication</h3>
            <p>Secure user accounts with Clerk</p>
          </div>
          <div className="feature-item">
            <span style={{ fontSize: '3rem' }}>🔑</span>
            <h3>API Keys</h3>
            <p>Manage your API keys from the dashboard</p>
          </div>
          <div className="feature-item">
            <span style={{ fontSize: '3rem' }}>🌐</span>
            <h3>Multi-Provider</h3>
            <p>Access multiple AI providers seamlessly</p>
          </div>
        </div>
      </section>

      <footer className="footer container">
        <p>
          Built with Next.js and deployed on Vercel •{' '}
          <a href="https://github.com/CloudCompile/cloudgpt" target="_blank" rel="noopener noreferrer">
            GitHub
          </a>
        </p>
      </footer>
    </main>
  );
}
