export default function ModelsPage() {
  return (
    <main>
      <section className="container" style={{ paddingTop: '80px', paddingBottom: '80px' }}>
        <h1 style={{ marginBottom: '40px', textAlign: 'center' }}>Available Models</h1>

        <div className="info-box">
          <p style={{ marginBottom: '12px' }}>
            <strong>OpenRelay is powered by AIHubMix</strong>
          </p>
          <p style={{ marginBottom: '16px' }}>
            Access 27+ free AI models including GPT-4o, Claude 3.5, Gemini 2.0, and more.
          </p>
          <a href="https://aihubmix.com/models" target="_blank" rel="noopener noreferrer" className="button">
            View All Models on AIHubMix
          </a>
        </div>

        <h2 style={{ marginTop: '60px', marginBottom: '24px' }}>Popular Models</h2>

        <h3 style={{ marginTop: '32px', marginBottom: '16px' }}>Text Models</h3>
        <ul style={{ marginLeft: '20px', color: 'var(--text-secondary)' }}>
          <li>gpt-4o-free — OpenAI GPT-4o</li>
          <li>gpt-4.1-free — OpenAI GPT-4.1</li>
          <li>gpt-4.1-mini-free — OpenAI GPT-4.1 Mini</li>
          <li>coding-glm-5.1-free — Zhipu Coding GLM 5.1</li>
          <li>xiaomi-mimo-v2.5-pro-free — Xiaomi MiMo V2.5 Pro</li>
          <li>gemini-3-flash-preview-free — Google Gemini 3 Flash</li>
          <li>gemini-3.1-flash-image-preview-free — Google Gemini 3.1 Flash</li>
        </ul>

        <h3 style={{ marginTop: '32px', marginBottom: '16px' }}>Image Models</h3>
        <ul style={{ marginLeft: '20px', color: 'var(--text-secondary)' }}>
          <li>gpt-image-2-free — OpenAI DALL-E 3</li>
          <li>flux, turbo, seedream — And more from AIHubMix</li>
        </ul>

        <h3 style={{ marginTop: '32px', marginBottom: '16px' }}>Video Models</h3>
        <ul style={{ marginLeft: '20px', color: 'var(--text-secondary)' }}>
          <li>Video generation available through AIHubMix</li>
        </ul>

        <p style={{ marginTop: '60px', color: 'var(--text-secondary)' }}>
          Visit <a href="https://aihubmix.com/models">AIHubMix Models</a> for the complete list and to copy model IDs.
        </p>

        <div style={{ textAlign: 'center', marginTop: '40px' }}>
          <a href="/" className="button">Back Home</a>
        </div>
      </section>
    </main>
  );
}
