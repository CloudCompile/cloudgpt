# CloudGPT Community Provider - Deployment Guide

This guide provides step-by-step instructions for deploying the optimized community provider API.

## Pre-Deployment Checklist

- [ ] PR #37 is approved and merged to `main`
- [ ] All tests pass in CI/CD pipeline
- [ ] Redis is configured and accessible
- [ ] Vercel deployment is configured
- [ ] Environment variables are set (REDIS_URL, ENCRYPTION_KEY)
- [ ] Backup of current production is available
- [ ] Rollback plan documented and tested

## Deployment Steps

### 1. Deploy to Vercel

```bash
# Pull latest from main
git checkout main
git pull origin main

# Deploy (automatic via GitHub integration)
# OR manual: vercel deploy --prod
```

**Verification**:
```bash
# Check health
curl https://api.cjhauser.me/api/admin/metrics \
  -H "Authorization: Bearer YOUR_ADMIN_KEY"

# Should return system metrics within 5 seconds
```

### 2. Enable Background Health Checks

Health checks are **automatically configured** in `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/admin/health-check",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

**That's it!** Vercel handles:
- ✅ Running the cron every 5 minutes
- ✅ Authentication (admin bearer token from environment)
- ✅ Retries on failure
- ✅ Monitoring and logs

No external services needed. The cron will automatically:
1. Check provider keys health
2. Update Redis with status
3. Remove broken keys from rotation
4. Populate metrics dashboard

**Verify it's running:**
```bash
# Check Vercel logs for cron execution
# Or call the metrics endpoint:
curl https://api.cjhauser.me/api/admin/metrics \
  -H "Authorization: Bearer YOUR_ADMIN_KEY" \
  | jq '.current'
```

### 3. Monitor Initial Metrics

**First 5 minutes**: System bootstraps with cache
**5-30 minutes**: Stabilizes, cache hit rate climbs
**30+ minutes**: Metrics plateau at optimal values

Check real-time metrics:
```bash
# Every minute for first 30 minutes
while true; do
  curl https://api.cjhauser.me/api/admin/metrics \
    -H "Authorization: Bearer YOUR_ADMIN_KEY" | jq '.health'
  sleep 60
done
```

**Expected values**:
- Cache Hit Rate: 85-95%
- Failure Rate: <5%
- Avg Response Time: <500ms

### 4. Verify Cache Invalidation

Test that new keys are immediately available:

```bash
# 1. Get current key count
curl https://api.cjhauser.me/api/admin/metrics \
  -H "Authorization: Bearer YOUR_ADMIN_KEY" \
  | jq '.keyCounts.Groq'

# 2. Add a test key via /donate
# (Use a test account)

# 3. Wait 2 seconds

# 4. Verify new key is available
curl https://api.cjhauser.me/api/admin/metrics \
  -H "Authorization: Bearer YOUR_ADMIN_KEY" \
  | jq '.keyCounts.Groq'
# Should have incremented
```

### 5. Load Testing

Test with realistic load to verify optimizations:

```bash
# Simple load test (100 concurrent requests)
ab -n 100 -c 100 \
  -H "Authorization: Bearer YOUR_API_KEY" \
  https://api.cjhauser.me/v1/models

# Monitor Redis bandwidth during test
# Should see significant reduction vs. pre-optimization
```

## Monitoring & Observability

### Key Metrics to Watch

**Dashboard URL**: `/api/admin/metrics` (requires admin auth)

1. **Cache Hit Rate** (aim for 85%+)
   ```bash
   curl https://api.cjhauser.me/api/admin/metrics | jq '.health.cacheHitRate'
   ```

2. **Failure Rate** (keep below 5%)
   ```bash
   curl https://api.cjhauser.me/api/admin/metrics | jq '.health.failureRate'
   ```

3. **Average Response Time** (should be <500ms)
   ```bash
   curl https://api.cjhauser.me/api/admin/metrics | jq '.health.avgResponseTime'
   ```

4. **Redis Commands/sec**
   - Check Vercel/Redis dashboard
   - Should be 5-10% of pre-optimization values

### Alerting

Set up alerts for:

| Metric | Threshold | Action |
|--------|-----------|--------|
| Failure Rate | >10% | Page on-call |
| Cache Hit Rate | <50% | Investigate cache eviction |
| Response Time | >1000ms | Check provider status |
| Redis Bandwidth | >200MB/hour | Review caching logic |

## Rollback Plan

If issues occur, rollback is simple:

### Immediate Rollback (1 minute)

```bash
# Revert to previous commit
git revert HEAD
git push origin main

# Vercel automatically redeploys on push
# Takes ~2-3 minutes for full rollback
```

### What Gets Rolled Back

- ✅ Key caching returns to baseline
- ✅ Cache invalidation logic removed
- ✅ Health checks stop running
- ✅ Metrics endpoint disabled
- ✅ Request deduplication disabled

### What Stays the Same

- ✅ All data in Redis (keys, donations, etc.)
- ✅ User auth and api keys
- ✅ Contributor status
- ✅ Provider configurations

## Post-Deployment Checklist

- [ ] System metrics show expected values (85%+ cache hit rate)
- [ ] No error spikes in logs
- [ ] Response times improved
- [ ] Redis bandwidth reduced
- [ ] Health check cron running every 5 minutes
- [ ] All API endpoints responding normally
- [ ] No new errors in error tracking
- [ ] Community keys functioning normally

## Optimization Verification

Run these verification steps 1 hour after deployment:

```bash
#!/bin/bash

echo "=== Deployment Verification ==="

# 1. Check cache hit rate
echo "Cache Hit Rate:"
curl -s https://api.cjhauser.me/api/admin/metrics \
  -H "Authorization: Bearer $ADMIN_KEY" \
  | jq '.health.cacheHitRate'

# 2. Check failure rate
echo "Failure Rate:"
curl -s https://api.cjhauser.me/api/admin/metrics \
  -H "Authorization: Bearer $ADMIN_KEY" \
  | jq '.health.failureRate'

# 3. Check total requests
echo "Total Requests:"
curl -s https://api.cjhauser.me/api/admin/metrics \
  -H "Authorization: Bearer $ADMIN_KEY" \
  | jq '.current.totalRequests'

# 4. Check available keys per provider
echo "Available Keys:"
curl -s https://api.cjhauser.me/api/admin/metrics \
  -H "Authorization: Bearer $ADMIN_KEY" \
  | jq '.keyCounts'

# 5. Test basic functionality
echo "API Test:"
curl -s https://api.cjhauser.me/v1/models \
  -H "Authorization: Bearer $USER_API_KEY" \
  | jq '.object' | head -c 50
echo ""

echo "=== Verification Complete ==="
```

## Performance Benchmarks

Expected improvements after optimization:

### Response Time
- **Before**: 50-200ms (cold cache)
- **After**: 20-50ms (hot cache)
- **Improvement**: 60-75% faster for cache hits

### Redis Bandwidth
- **Before**: 10-20 requests/sec per provider key
- **After**: 1-2 requests/sec per provider key
- **Improvement**: 85-90% reduction

### Cost
- **Before**: $X per month (baseline)
- **After**: ~$0.15X per month
- **Savings**: ~85% reduction in Redis/compute costs

## Troubleshooting

### Issue: Cache hit rate is low (<50%)

**Possible causes**:
- Cache TTL too short
- Provider keys changing frequently
- Request patterns vary too much

**Solutions**:
- Check if keys are being invalidated constantly (logs)
- Increase cache TTL in keypool.ts if appropriate
- Review request patterns for inconsistencies

### Issue: Health check cron not running

**Verification**:
```bash
# Check recent health check calls
curl https://api.cjhauser.me/api/admin/metrics \
  | jq '.current.lastHealthCheck'
```

**Solutions**:
- Verify cron is properly configured in Vercel/GitHub
- Check authorization header has admin permission
- Review function logs for errors

### Issue: Increased error rate after deployment

**Diagnosis**:
```bash
# Get error details
curl https://api.cjhauser.me/api/admin/metrics | jq '.health'

# Check recent errors
# Look for errors in:
# - Provider key validation
# - Cache invalidation
# - Health checks
```

**Solutions**:
- Check provider status (are they up?)
- Verify Redis connectivity
- Look for configuration issues
- Consider rollback if errors persist

## Support

For deployment issues:
- GitHub Issues: https://github.com/CloudCompile/cloudgpt/issues
- Documentation: `/OPTIMIZATION_GUIDE.md`
- Status Page: https://status.openrelay.dev

---

**Last Updated**: May 2026  
**Version**: 2.0  
**Deployment Risk**: 🟢 Low (fully backward compatible)
