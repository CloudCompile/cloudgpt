# CloudGPT Community Provider API - Optimization Guide

This guide explains how OpenRelay's community-driven provider system works and how to use it efficiently.

## System Architecture

OpenRelay is a **community-powered AI gateway** where users donate their free API keys from multiple providers. The system intelligently routes requests across these donated keys with automatic failover and load balancing.

### How It Works

1. **Users donate keys** via `/donate` endpoint
2. **Keys are validated** to ensure they work
3. **Keys are encrypted** and stored in Redis
4. **Requests route** to available keys across 9+ providers
5. **Failed keys** are automatically tracked and avoided
6. **System deduplicates** concurrent identical requests

## Using the API

### Basic Chat Request

```bash
curl https://api.openrelay.dev/v1/chat/completions \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4o-free",
    "messages": [{"role": "user", "content": "Hello"}]
  }'
```

### Request Models

All models are free and community-supported:

- **Groq**: `groq/llama-3.3-70b-versatile` (fastest)
- **Cerebras**: `cerebras/llama-3.3-70b` (1M tokens/day)
- **Pollinations**: `pollinations/nova-fast`, `pollinations/mistral`
- **VoidAI**: `voidai/mistral-large`
- **Airforce**: `airforce/auto`
- **AIHorde**: `aihorde/llama-3.3-70b`
- **TokenReply**: `tokenreply/deepseek-v4-flash`
- **NagaAI**: `nagaai/grok-4.20-fast`
- **Happupy**: `happupy/deepseek`

### Provider-Specific Routing

Request a specific provider:

```bash
# Use Groq explicitly
"model": "groq/llama-3.3-70b-versatile"

# Use Cerebras with automatic fallback
"model": "cerebras/llama-3.3-70b"
```

### Image Generation

```bash
curl https://api.openrelay.dev/v1/images/generations \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "A beautiful sunset over mountains",
    "model": "pollinations/flux",
    "n": 1,
    "size": "1024x1024"
  }'
```

## Performance Best Practices

### 1. Batch Requests

Make multiple requests in a single connection:

```javascript
const messages = [
  "What is 2+2?",
  "What is 3+3?",
  "What is 4+4?"
];

for (const msg of messages) {
  const response = await fetch('/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'pollinations/nova-fast',
      messages: [{role: 'user', content: msg}]
    })
  });
  // Process response
}
```

### 2. Use Streaming for Long Responses

Enable streaming for large responses to reduce memory:

```bash
curl https://api.openrelay.dev/v1/chat/completions \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "groq/llama-3.3-70b-versatile",
    "messages": [{"role": "user", "content": "Write a story"}],
    "stream": true
  }'
```

### 3. Cache Results

Cache responses locally to avoid duplicate API calls:

```javascript
const cache = new Map();

async function query(prompt) {
  const key = hashPrompt(prompt);
  if (cache.has(key)) return cache.get(key);

  const response = await fetchFromAPI(prompt);
  cache.set(key, response);
  return response;
}
```

### 4. Respect Rate Limits

- Each contributed key has different rate limits
- System automatically distributes load across available keys
- If rate-limited, wait and retry (exponential backoff)

### 5. Monitor Key Health

Check system health at `/api/admin/metrics` (admin only):

```bash
curl https://api.openrelay.dev/api/admin/metrics \
  -H "Authorization: Bearer ADMIN_KEY"
```

Response includes:
- Cache hit rate
- Failure rate
- Average response time
- Available keys per provider

## Contributing Keys

### How to Donate

1. Sign up for a free provider account (no credit card needed):
   - **Groq**: https://console.groq.com
   - **Cerebras**: https://cloud.cerebras.ai
   - **Pollinations**: https://pollinations.ai
   - Others at `/donate`

2. Get your API key from the provider dashboard

3. Visit `/donate` and submit your key

4. See your key's impact at `/contributor`

### Monitoring Your Keys

After donating, view your contributions:

- **Dashboard**: `/contributor`
- **Real-time status**: See if keys are working/rate-limited
- **Impact metrics**: How many requests used your key today
- **Error tracking**: Recent failures from your keys

### Removing Keys

Revoke any key at any time from `/contributor` dashboard. Key removal is immediate across all servers.

## Advanced Usage

### Virtual Models

Create custom models that split requests across multiple providers:

```bash
POST /api/admin/virtual-models
{
  "id": "my-model",
  "providers": [
    {"provider": "Groq", "modelId": "llama-3.3-70b-versatile", "type": "text"},
    {"provider": "Cerebras", "modelId": "llama-3.3-70b", "type": "text"}
  ]
}
```

Then use: `"model": "my-model"`

### Fallback Handling

The system automatically tries providers in this order:
1. Specified provider (if explicitly requested)
2. Provider's recommended model
3. Fallback chain: Pollinations → VoidAI → Airforce → Cerebras → Groq → AIHorde

## Troubleshooting

### "Key validation failed"

The key you provided doesn't work or is invalid:
- Verify the key is correct (copy-paste again)
- Check the provider is accepting new requests
- Try generating a fresh key from the provider

### "Rate limited"

Provider's rate limit reached:
- The system will automatically try other keys
- Wait 60 seconds and retry
- Consider donating keys from multiple accounts

### "All providers failed"

All available keys are currently unavailable:
- Check `/api/admin/metrics` for system status
- Try again in a few moments
- Consider donating more keys to improve reliability

### Slow Responses

If responses are taking too long:
- Use `groq/` prefix for fastest responses (Groq is fastest)
- Enable streaming for large responses
- Avoid peak hours if possible
- Check cache hit rate at `/api/admin/metrics`

## System Statistics

Updated in real-time at `/api/admin/metrics`:

- **Total Requests**: Cumulative requests processed
- **Total Tokens**: Cumulative tokens consumed
- **Cache Hit Rate**: % of requests served from cache
- **Failure Rate**: % of requests that failed
- **Average Response Time**: Median latency
- **Active Keys**: Per-provider key counts

## Support

- **Issues**: Report at https://github.com/CloudCompile/cloudgpt/issues
- **Discord**: Join our community
- **Documentation**: https://docs.openrelay.dev
- **Status**: https://status.openrelay.dev

## Legal & Privacy

- **Keys are encrypted**: AES-256 encrypted at rest
- **No logging**: Raw API keys are never logged
- **Open source**: Code is publicly available for audit
- **Community-owned**: Users control their keys (revoke anytime)

---

**Last Updated**: May 2026
**System Version**: 2.0 (Optimized for Vercel Free Tier)
