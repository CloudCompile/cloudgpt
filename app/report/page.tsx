'use client';

import { useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';

export default function ReportPage() {
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isLoaded) {
    return (
      <main className="container" style={{ paddingTop: '120px', paddingBottom: '80px', textAlign: 'center' }}>
        <p>Loading...</p>
      </main>
    );
  }

  if (!isSignedIn) {
    return (
      <main className="container" style={{ paddingTop: '120px', paddingBottom: '80px', textAlign: 'center' }}>
        <h1 style={{ marginBottom: '16px' }}>Report a Bug</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Please sign in to report bugs.</p>
      </main>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!description.trim()) {
      setError('Please describe the bug or issue');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/bug-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: description.trim() }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'Failed to submit report');
        return;
      }

      const data = await response.json();
      setSuccess(`✅ Report submitted! Report ID: ${data.id}`);
      setDescription('');
      setTimeout(() => router.push('/dashboard'), 2000);
    } catch (err) {
      setError('Failed to submit report. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="container" style={{ paddingTop: '50px', paddingBottom: '100px', maxWidth: '700px' }}>
      <h1 style={{ marginBottom: '8px', fontSize: '2rem' }}>Report a Bug</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '40px' }}>
        Found an issue with the OpenRelay API? Help us improve by reporting it here.
        We collect bug reports and classify them by priority. Once we have a few reports, we'll send you an email digest and work on fixes.
      </p>

      <form onSubmit={handleSubmit} style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border)',
        borderRadius: '28px 18px 24px 22px',
        padding: '32px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
      }}>
        {error && (
          <div style={{
            padding: '12px 16px',
            background: 'rgba(220, 38, 38, 0.1)',
            border: '1px solid rgba(220, 38, 38, 0.3)',
            borderRadius: '12px',
            color: '#dc2626',
            fontSize: '0.9rem',
          }}>
            {error}
          </div>
        )}

        {success && (
          <div style={{
            padding: '12px 16px',
            background: 'rgba(34, 197, 94, 0.1)',
            border: '1px solid rgba(34, 197, 94, 0.3)',
            borderRadius: '12px',
            color: '#22c55e',
            fontSize: '0.9rem',
          }}>
            {success}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ fontWeight: '600', fontSize: '0.95rem' }}>
            Describe the issue
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What's the bug? Include error messages, API endpoints you tried, and any steps to reproduce..."
            style={{
              minHeight: '200px',
              padding: '12px 16px',
              background: 'var(--bg-primary)',
              border: '1px solid var(--border)',
              borderRadius: '16px 12px 14px 18px',
              color: 'var(--text-primary)',
              fontFamily: 'inherit',
              fontSize: '0.95rem',
              resize: 'vertical',
            }}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="button"
          style={{
            padding: '12px 24px',
            fontSize: '1rem',
            opacity: loading ? 0.6 : 1,
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? 'Submitting...' : 'Submit Report'}
        </button>
      </form>

      <div style={{
        marginTop: '40px',
        padding: '20px 24px',
        background: 'rgba(124, 58, 237, 0.07)',
        border: '1px solid rgba(124, 58, 237, 0.3)',
        borderRadius: '18px 14px 16px 20px',
        fontSize: '0.9rem',
      }}>
        <p style={{ margin: '0 0 8px 0', fontWeight: '600' }}>💡 Tips for better reports:</p>
        <ul style={{ margin: 0, paddingLeft: '20px', color: 'var(--text-secondary)' }}>
          <li>Include the exact error message or status code</li>
          <li>Mention which model you were using</li>
          <li>Describe what you expected vs what happened</li>
          <li>Any steps to reproduce the issue help a lot</li>
        </ul>
      </div>
    </main>
  );
}
