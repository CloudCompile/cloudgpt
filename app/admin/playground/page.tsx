'use client';

import { useState, useEffect, useRef } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface Model {
  id: string;
  provider?: string;
  type?: string;
}

export default function PlaygroundPage() {
  const [models, setModels] = useState<Model[]>([]);
  const [selectedModel, setSelectedModel] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingModels, setLoadingModels] = useState(true);
  const [error, setError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load models on mount
  useEffect(() => {
    async function loadModels() {
      try {
        const res = await fetch('/api/v1/models');
        if (!res.ok) throw new Error('Failed to load models');
        const data = await res.json();
        const textModels = data.data.filter((m: Model) => m.type === 'text' || (!m.type && !m.id.includes('image') && !m.id.includes('video') && !m.id.includes('audio')));
        setModels(textModels);
        if (textModels.length > 0) setSelectedModel(textModels[0].id);
      } catch (err) {
        setError('Failed to load models');
      } finally {
        setLoadingModels(false);
      }
    }
    loadModels();
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSendMessage() {
    if (!input.trim() || !selectedModel || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-admin-key',
        },
        body: JSON.stringify({
          model: selectedModel,
          messages: [...messages, { role: 'user', content: userMessage }],
          temperature: 0.7,
          max_tokens: 1000,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'API request failed');
      }

      const data = await response.json();
      const assistantMessage = data.choices[0]?.message?.content || 'No response';
      setMessages(prev => [...prev, { role: 'assistant', content: assistantMessage }]);
    } catch (err) {
      setError(String(err));
      setMessages(prev => prev.slice(0, -1)); // Remove the user message if request failed
    } finally {
      setLoading(false);
    }
  }

  function handleClearChat() {
    setMessages([]);
    setError('');
  }

  return (
    <main className="container" style={{ paddingTop: '50px', paddingBottom: '80px', maxWidth: '1000px' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>Model Playground</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '32px', fontSize: '0.95rem' }}>
        Test and chat with available AI models in real-time.
      </p>

      {/* Model selector */}
      <div style={{ marginBottom: '32px' }}>
        <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', marginBottom: '8px', color: 'var(--text-secondary)' }}>
          Select Model
        </label>
        <select
          value={selectedModel}
          onChange={(e) => {
            setSelectedModel(e.target.value);
            setMessages([]);
            setError('');
          }}
          style={{
            width: '100%',
            padding: '10px 12px',
            borderRadius: '12px',
            border: '1px solid var(--border)',
            background: 'var(--bg)',
            color: 'var(--fg)',
            fontSize: '0.95rem',
          }}
        >
          <option value="">Choose a model...</option>
          {models.map((model) => (
            <option key={model.id} value={model.id}>
              {model.id} ({model.provider || 'Unknown'})
            </option>
          ))}
        </select>
      </div>

      {/* Chat container */}
      <div
        style={{
          border: '1px solid var(--border)',
          borderRadius: '16px',
          background: 'var(--bg-secondary)',
          display: 'flex',
          flexDirection: 'column',
          height: '500px',
          marginBottom: '20px',
        }}
      >
        {/* Messages */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          {messages.length === 0 ? (
            <div style={{ color: 'var(--text-tertiary)', textAlign: 'center', marginTop: 'auto', marginBottom: 'auto' }}>
              {loadingModels ? 'Loading models...' : 'No messages yet. Start a conversation!'}
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                }}
              >
                <div
                  style={{
                    maxWidth: '75%',
                    padding: '12px 16px',
                    borderRadius: msg.role === 'user' ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
                    background: msg.role === 'user' ? 'var(--accent)' : 'var(--bg)',
                    color: msg.role === 'user' ? 'white' : 'var(--fg)',
                    border: msg.role === 'assistant' ? '1px solid var(--border)' : 'none',
                    fontSize: '0.95rem',
                    lineHeight: '1.5',
                    wordBreak: 'break-word',
                  }}
                >
                  {msg.content}
                </div>
              </div>
            ))
          )}
          {loading && (
            <div style={{ color: 'var(--text-tertiary)', fontSize: '0.9rem' }}>
              Waiting for response...
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div style={{ borderTop: '1px solid var(--border)', padding: '16px', display: 'flex', gap: '10px' }}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder="Type a message..."
            disabled={!selectedModel || loading || loadingModels}
            style={{
              flex: 1,
              padding: '10px 12px',
              borderRadius: '10px',
              border: '1px solid var(--border)',
              background: 'var(--bg)',
              color: 'var(--fg)',
              fontSize: '0.95rem',
            }}
          />
          <button
            onClick={handleSendMessage}
            disabled={!selectedModel || loading || !input.trim() || loadingModels}
            style={{
              padding: '10px 20px',
              borderRadius: '10px',
              background: selectedModel && !loading && input.trim() ? 'var(--accent)' : 'var(--border)',
              color: selectedModel && !loading && input.trim() ? 'white' : 'var(--text-tertiary)',
              border: 'none',
              cursor: selectedModel && !loading && input.trim() ? 'pointer' : 'not-allowed',
              fontSize: '0.9rem',
              fontWeight: '600',
              transition: 'all 0.2s ease',
            }}
          >
            Send
          </button>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="error" style={{ marginBottom: '20px' }}>
          {error}
        </div>
      )}

      {/* Clear button */}
      {messages.length > 0 && (
        <button
          onClick={handleClearChat}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            fontSize: '0.9rem',
          }}
        >
          Clear Chat
        </button>
      )}

      <div className="info-box" style={{ marginTop: '32px' }}>
        <p>
          <strong>Note:</strong> This playground is for testing and development. Authentication is handled by the admin session.
        </p>
      </div>
    </main>
  );
}
