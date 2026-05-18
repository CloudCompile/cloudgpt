# Bug Reporting System Setup Guide

This guide covers the complete setup for the bug reporting system spanning Discord and the website, with automatic bug classification and Claude Code integration.

## Architecture Overview

The system has three main components:
1. **Discord Bot** (`bot/app.py`) - Slash command to report bugs from Discord
2. **Website UI** (`/report` page) - Form to report bugs from the web
3. **Automated Workflow** - Cron job to classify, email, and trigger fixes

Workflow:
- Users submit bugs via Discord or website → bugs stored in Redis queue
- Hourly cron job checks if 5+ pending bugs exist
- If threshold met: classify bugs → send email digest → wait for approval → trigger Claude Code routine

## Environment Variables

### Vercel Deployment

Add these to your Vercel project settings (Settings → Environment Variables):

**Redis & Database:**
```
REDIS_URL=redis://default:password@host:port
```

**Authentication:**
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

**Email & Bug Services:**
```
RESEND_API_KEY=re_...
POLLINATIONS_KEY_1=your_pollinations_api_key
ADMIN_EMAIL=your.email@example.com
```

**Claude Code Integration:**
```
CLAUDE_CODE_ROUTINE_TOKEN=your_bearer_token
CLAUDE_CODE_ROUTINE_ID=routine_id_from_anthropic
```

**Cron Job Security:**
```
CRON_SECRET=your_random_secret_for_cron_verification
```

### Discord Bot (VPS Deployment)

On your VPS, create a `.env` file in the bot directory:

```bash
# Discord Bot Token (from Discord Developer Portal)
DISCORD_TOKEN=your_discord_bot_token_here

# Redis connection (same as Vercel)
REDIS_URL=redis://default:password@host:port

# Optional: Bot status
BOT_STATUS=✨ CloudGPT Gateway
```

## Setup Steps

### 1. Discord Bot Setup

#### 1a. Create Discord Application
1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application"
3. Name it "CloudGPT" (or your preferred name)
4. Go to "Bot" section, click "Add Bot"
5. Under "TOKEN", click "Copy" - save this as `DISCORD_TOKEN`
6. Enable these "Privileged Gateway Intents":
   - Message Content Intent
   - Server Members Intent (optional, for context)

#### 1b. OAuth2 Setup
1. Go to "OAuth2" → "URL Generator"
2. Select scopes: `bot`, `applications.commands`
3. Select permissions:
   - Send Messages
   - Embed Links
   - Read Messages/View Channels
4. Copy the generated URL and open it to add the bot to your Discord server

#### 1c. Deploy Bot to VPS
1. SSH into your VPS:
```bash
cd /path/to/bot
```

2. Install dependencies:
```bash
pip install -r requirements.txt  # Discord.py, redis
```

3. Create `.env` file with the variables above

4. Run the bot (using systemd or your VPS process manager):
```bash
# Option 1: Direct run (for testing)
python app.py

# Option 2: Systemd service (for production)
sudo nano /etc/systemd/system/cloudgpt-bot.service
```

Systemd service file example:
```ini
[Unit]
Description=CloudGPT Discord Bot
After=network.target

[Service]
Type=simple
User=ubuntu  # Change to your user
WorkingDirectory=/home/ubuntu/cloudgpt/bot
Environment="DISCORD_TOKEN=your_token"
Environment="REDIS_URL=redis://..."
ExecStart=/usr/bin/python3 app.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl daemon-reload
sudo systemctl enable cloudgpt-bot
sudo systemctl start cloudgpt-bot
sudo systemctl status cloudgpt-bot
```

### 2. Website Setup

The website components are already deployed with the Next.js app:
- **Bug Report Page**: `/report` - Login required form
- **Admin Dashboard**: `/admin/bugs` - View all reported bugs
- **Bug Report API**: `/api/bug-report` - REST endpoint for submissions

No additional setup needed for the website.

### 3. Vercel Cron Job Setup

The bug digest workflow runs automatically via a scheduled cron job.

#### 3a. Create the Cron Job

In Vercel, create a scheduled deployment using the cron endpoint:

```bash
# Test it manually first:
curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
  https://your-domain.com/api/cron/bug-digest
```

For automated hourly execution, use a third-party cron service like:
- **EasyCron**: https://www.easycron.com/
- **cron-job.org**: https://cron-job.org/
- **AWS EventBridge** (if using AWS)

Example with EasyCron:
1. Go to EasyCron.com, create account
2. Add a new cron job:
   - **URL**: `https://your-domain.com/api/cron/bug-digest`
   - **HTTP Headers**: Add header `Authorization: Bearer YOUR_CRON_SECRET`
   - **Cron Expression**: `0 * * * *` (every hour)
   - **Timezone**: Your timezone

### 4. Email Configuration

#### 4a. Resend Setup
1. Go to [Resend.com](https://resend.com)
2. Create account and get API key
3. Add your domain (or use default `onboarding@resend.dev` for testing)
4. Save `RESEND_API_KEY` to Vercel env vars

#### 4b. Email Reply Handling
The system sends digest emails requesting approval ("Reply YES to approve fixes").

**Currently**: Email replies must be manually monitored. Future enhancement: set up Resend webhook to automatically parse replies.

To manually trigger Claude Code after approving an email:
1. Admin receives email digest with bug classification
2. Reply "YES" to the email
3. Manually call `/api/cron/bug-digest` or wait for next scheduled run

### 5. Claude Code Routine Setup

To enable automatic bug fixing:

#### 5a. Create Claude Code Routine
1. Contact Anthropic support or use Claude Code experimental API
2. Create a routine with task: "Fix bugs reported in the OpenRelay system"
3. Get the `CLAUDE_CODE_ROUTINE_ID` and bearer token
4. Save to Vercel env vars as:
   - `CLAUDE_CODE_ROUTINE_ID`
   - `CLAUDE_CODE_ROUTINE_TOKEN`

#### 5b. Verify Integration
Test the routine trigger:
```bash
curl -X POST https://api.anthropic.com/v1/claude_code/routines/{ROUTINE_ID}/fire \
  -H "Authorization: Bearer $CLAUDE_CODE_ROUTINE_TOKEN" \
  -H "anthropic-beta: experimental-cc-routine-2026-04-01" \
  -H "Content-Type: application/json" \
  -d '{"text": "Test: Fix these bugs"}'
```

### 6. Redis Setup

Ensure your Redis instance:
- Is accessible from both Vercel and your VPS
- Has 30+ MB free storage for bug reports and caching
- Uses connection pooling if on Vercel

Test connection from Vercel:
```bash
# In /api/bug-report route.ts, add a test endpoint or check logs
```

## Testing the System

### 1. Test Discord Bot
In your Discord server:
```
/report description: "Button click sometimes unresponsive"
```

Verify:
- Bot responds with confirmation and report ID
- Bug appears in `/admin/bugs` dashboard

### 2. Test Website Form
1. Go to `https://your-domain.com/report`
2. Login with Clerk
3. Submit a bug report
4. Verify it appears in `/admin/bugs`

### 3. Test Bug Classification
Once 5 bugs exist, cron job will:
1. Classify bugs using Pollinations API
2. Send email digest to `ADMIN_EMAIL`
3. Display classification in email (priorities: critical/high/medium/low)

Check email for:
```
Subject: 🐛 Bug Digest: X issues classified

[CRITICAL]
• [Category] Summary

[HIGH]
• ...
```

### 4. Test Claude Code Integration
After approving email, check:
- `/admin/bugs` dashboard for status updates
- Claude Code session URL stored in Redis (key: `bug_fix_session`)
- PR auto-created in GitHub repo with fixes

## Monitoring & Debugging

### Check Redis Queue
```bash
# SSH into VPS or use Redis GUI client
redis-cli

# See pending bugs
LRANGE bug_reports:queue 0 -1

# Check specific bug details
HGETALL bug_report:{reportId}

# See email approval requests
KEYS bug_approval:*
```

### Check Vercel Logs
```bash
# View deployment logs
vercel logs

# Check specific endpoint logs
vercel logs /api/cron/bug-digest
vercel logs /api/bug-report
```

### Discord Bot Status
```bash
# On VPS
sudo systemctl status cloudgpt-bot
sudo journalctl -u cloudgpt-bot -f  # Real-time logs
```

## Troubleshooting

### "Bug reports not appearing in queue"
- Check Redis connection in Vercel logs
- Verify `REDIS_URL` env var is set
- Test Redis connectivity: `redis-cli -u $REDIS_URL ping`

### "Cron job not running"
- Verify EasyCron/cron service is active
- Check Vercel logs for `/api/cron/bug-digest` requests
- Verify `CRON_SECRET` header is being sent correctly

### "Classification email not received"
- Check `RESEND_API_KEY` is valid
- Verify `ADMIN_EMAIL` is correct
- Check Resend dashboard for delivery/bounce status
- Ensure less than 5 bugs (workflow only triggers at threshold)

### "Discord bot offline"
- Check VPS process: `sudo systemctl status cloudgpt-bot`
- Verify `DISCORD_TOKEN` is valid in .env
- Check Redis connection on VPS: `redis-cli -u $REDIS_URL ping`

### "Claude Code routine not triggering"
- Verify `CLAUDE_CODE_ROUTINE_TOKEN` and `CLAUDE_CODE_ROUTINE_ID` are set
- Check Vercel logs for HTTP errors when calling Anthropic API
- Ensure you have approval (replied "YES" to email)

## Production Checklist

- [ ] Discord bot running on VPS with systemd
- [ ] All env vars set in Vercel
- [ ] Redis accessible from both Vercel and VPS
- [ ] Cron job scheduled (EasyCron or alternative)
- [ ] Email configuration tested (sent and received)
- [ ] Claude Code routine created and tested
- [ ] Admin email verified and accessible
- [ ] Monitoring/alerting set up for stuck processes
- [ ] Rate limits configured for Pollinations API
- [ ] Backup plan for email approval (manual override endpoint)

## Support & Documentation

- **Discord.py Docs**: https://discordpy.readthedocs.io
- **Next.js API Routes**: https://nextjs.org/docs/app/building-your-application/routing/route-handlers
- **Resend Email**: https://resend.com/docs
- **Vercel Docs**: https://vercel.com/docs
