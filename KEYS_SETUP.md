# 🔑 CloudGPT Keys Setup Guide

This guide explains how to set up all the required API keys and environment variables for CloudGPT to function properly.

## Required Environment Variables

Create a `.env.local` file in the root of your project (for local development) or configure these in your Vercel project settings.

```env
# Clerk Authentication (Required)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
CLERK_SECRET_KEY=YOUR_SECRET_KEY

# AI Provider Keys (At least one recommended)
POLLINATIONS_API_KEY=your_pollinations_api_key
MAPLEAI_API_KEY=your_mapleai_api_key
```

## Setting Up Each Service

### 1. Clerk Authentication (Required)

Clerk handles user authentication and account management.

1. Go to [clerk.com](https://clerk.com) and sign up for a free account
2. Create a new application
3. In the Clerk Dashboard, go to **[API Keys](https://dashboard.clerk.com/last-active?path=api-keys)**
4. Copy the **Publishable Key** → `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
5. Copy the **Secret Key** → `CLERK_SECRET_KEY`

**Where to put them:**
- **Local Development**: `.env.local` file
- **Vercel**: Project Settings → Environment Variables

**Important:** Never commit real keys to version control. Only use placeholder values in code examples.

### 2. Pollinations API Key (Recommended)

Pollinations provides text, image, and video generation capabilities.

1. Go to [pollinations.ai](https://pollinations.ai)
2. Create an account at [enter.pollinations.ai](https://enter.pollinations.ai)
3. Navigate to your dashboard
4. Create a new API key (Secret Key `sk_` for server-side use)
5. Copy the key → `POLLINATIONS_API_KEY`

**Note:** The API works without a key but with stricter rate limits.

### 3. MapleAI API Key (Optional)

MapleAI is an alternative/additional AI provider.

1. Go to [mapleai.de](https://mapleai.de)
2. Sign up for an account
3. Navigate to the API section
4. Generate a new API key
5. Copy the key → `MAPLEAI_API_KEY`

## Vercel Deployment Configuration

When deploying to Vercel:

1. Click the "Deploy to Vercel" button in the README
2. Connect your GitHub repository
3. In the deployment configuration, add all environment variables:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`
   - `POLLINATIONS_API_KEY` (optional)
   - `MAPLEAI_API_KEY` (optional)
4. Deploy!

### Environment Variables in Vercel

1. Go to your Vercel project dashboard
2. Click on **Settings**
3. Navigate to **Environment Variables**
4. Add each variable with the appropriate value
5. Make sure to add them for all environments (Production, Preview, Development)

## Security Best Practices

### ⚠️ Important Security Notes

1. **Never commit `.env.local` to version control**
   - The `.gitignore` file should already exclude it
   
2. **Use different keys for development and production**
   - Create separate Clerk applications for dev/prod
   - Use separate API keys where possible

3. **Rotate keys periodically**
   - Regularly rotate your API keys
   - Update them in Vercel after rotation

4. **Monitor usage**
   - Check your Clerk and Pollinations dashboards for unusual activity
   - Set up usage alerts where available

## Troubleshooting

### "Clerk: Missing publishable key"
- Ensure `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is set
- Make sure it starts with `pk_`

### "Clerk: Invalid secret key"
- Verify `CLERK_SECRET_KEY` is correct
- Make sure it starts with `sk_`

### "Rate limit exceeded"
- You may need to add/upgrade your Pollinations API key
- Anonymous requests have stricter limits

### API calls failing
- Check if the API keys are correctly configured
- Verify the keys are valid and not expired
- Check the Vercel function logs for detailed errors

## Example .env.local File

```env
# Copy this file to .env.local and fill in your values

# Clerk (Required)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
CLERK_SECRET_KEY=YOUR_SECRET_KEY

# AI Providers (Optional but recommended)
POLLINATIONS_API_KEY=your_pollinations_key_here
MAPLEAI_API_KEY=your_mapleai_key_here
```

## Need Help?

- [Clerk Documentation](https://clerk.com/docs)
- [Pollinations Documentation](https://pollinations.ai/docs)
- [MapleAI Documentation](https://docs.mapleai.de)
- [Open an Issue](https://github.com/CloudCompile/cloudgpt/issues)
