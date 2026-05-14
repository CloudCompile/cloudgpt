export default function ModelsPage() {
  return (
    <main>
      <section className="container" style={{ paddingTop: '80px', paddingBottom: '80px', textAlign: 'center' }}>
        <h1 style={{ marginBottom: '20px' }}>Available Models</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', marginBottom: '40px' }}>
          Models coming soon — providers are being configured
        </p>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '40px' }}>
          Check back soon for live model listings, or{' '}
          <a href="https://github.com/CloudCompile/cloudgpt" target="_blank" rel="noopener noreferrer">
            follow the project
          </a>
          {' '}for updates.
        </p>
        <a href="/" className="button">Back Home</a>
      </section>
    </main>
  );
}
