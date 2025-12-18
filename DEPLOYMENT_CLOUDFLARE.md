# Deploying Ebuney on Cloudflare Pages

This guide will walk you through deploying your Next.js app (Ebuney) on Cloudflare Pages.

## Prerequisites

- A Cloudflare account (free tier works)
- Your code pushed to a Git repository (GitHub, GitLab, or Bitbucket)
- Supabase project URL and API keys

## Important Note: Next.js 16 Compatibility

This project uses Next.js 16.0.10. The `@cloudflare/next-on-pages` package (v1.13.16) officially supports Next.js up to v15.5.2. However, it may still work with Next.js 16 with some limitations. 

**If you encounter build errors**, you have two options:
1. **Use `--legacy-peer-deps`** when building (recommended for quick testing)
2. **Consider using Vercel** for deployment, which has full Next.js 16 support

The build command uses `npx` to run the adapter, which should work despite the peer dependency warning.

## Step 1: Install Cloudflare Dependencies

The required dependencies are already added to your `package.json`. Install them:

```bash
npm install
```

## Step 2: Prepare Your Environment Variables

Make sure you have your `.env.local` file with these variables:

```
NEXT_PUBLIC_SUPABASE_URL=https://grxyvzpapamomhfipjfk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

**Important**: You'll need to add these to Cloudflare Pages as environment variables in Step 4.

## Step 3: Push Your Code to GitHub

If you haven't already, push your code to a Git repository:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/yourusername/ebuney.git
git push -u origin main
```

## Step 4: Deploy via Cloudflare Dashboard

### Option A: Connect via GitHub (Recommended)

1. **Log in to Cloudflare Dashboard**
   - Go to https://dash.cloudflare.com/
   - Sign in or create an account

2. **Navigate to Pages**
   - Click on "Workers & Pages" in the sidebar
   - Click "Create application"
   - Select "Pages" tab
   - Click "Connect to Git"

3. **Connect Your Repository**
   - Authorize Cloudflare to access your GitHub account
   - Select your repository (`ebuney`)
   - Click "Begin setup"

4. **Configure Build Settings**
   - **Project name**: `ebuney` (or your preferred name)
   - **Production branch**: `main` (or `master`)
   - **Framework preset**: `Next.js` (or `None` if Next.js isn't available)
   - **Build command**: `npm run build:cloudflare`
   - **Build output directory**: `.vercel/output/static`
   - **Root directory**: `/` (leave as default)

5. **Add Environment Variables**
   - Click "Environment variables" section
   - Add the following variables for **Production**:
     ```
     NEXT_PUBLIC_SUPABASE_URL = https://grxyvzpapamomhfipjfk.supabase.co
     NEXT_PUBLIC_SUPABASE_ANON_KEY = your_supabase_anon_key_here
     ```
   - Optionally add the same variables for **Preview** environments

6. **Deploy**
   - Click "Save and Deploy"
   - Cloudflare will start building your project
   - Wait for the build to complete (usually 2-5 minutes)

7. **Access Your Site**
   - Once deployed, you'll get a URL like: `https://ebuney.pages.dev`
   - You can customize the domain in Settings → Custom domains

### Option B: Deploy via Wrangler CLI (Advanced)

1. **Install Wrangler globally** (if not already installed):
   ```bash
   npm install -g wrangler
   ```

2. **Authenticate with Cloudflare**:
   ```bash
   npx wrangler login
   ```

3. **Build for Cloudflare**:
   ```bash
   npm run build:cloudflare
   ```

4. **Deploy**:
   ```bash
   npx wrangler pages deploy .vercel/output/static --project-name=ebuney
   ```

5. **Set Environment Variables** (via Dashboard or CLI):
   ```bash
   npx wrangler pages secret put NEXT_PUBLIC_SUPABASE_URL --project-name=ebuney
   npx wrangler pages secret put NEXT_PUBLIC_SUPABASE_ANON_KEY --project-name=ebuney
   ```

## Step 5: Configure Custom Domain (Optional)

1. In Cloudflare Pages dashboard, go to your project
2. Click "Custom domains" tab
3. Click "Set up a custom domain"
4. Enter your domain (e.g., `ebuney.com`)
5. Follow the DNS configuration instructions

## Step 6: Update Supabase Settings

1. Go to your Supabase project dashboard
2. Navigate to **Settings** → **API**
3. Under "Project URL", make sure your Cloudflare Pages URL is allowed (if you have URL restrictions)
4. Add your Cloudflare Pages domain to allowed origins if needed

## Troubleshooting

### Build Fails

- **Error**: "Build command failed"
  - Check the build logs in Cloudflare dashboard
  - Ensure all dependencies are in `package.json`
  - Try running `npm run build:cloudflare` locally to debug

- **Error**: "Module not found"
  - Make sure all dependencies are listed in `package.json`
  - Run `npm install` to ensure dependencies are installed

### Runtime Errors

- **Error**: "Environment variables not found"
  - Verify environment variables are set in Cloudflare Pages dashboard
  - Ensure variable names match exactly (including `NEXT_PUBLIC_` prefix)
  - Redeploy after adding environment variables

- **Error**: "Supabase connection failed"
  - Check your Supabase URL and API key
  - Verify Supabase allows requests from your Cloudflare Pages domain
  - Check Supabase dashboard for any service issues

### Image Loading Issues

- If images from Supabase Storage aren't loading:
  - Verify `next.config.ts` has the correct `remotePatterns` configuration
  - Check that the Supabase Storage bucket has public access
  - Ensure RLS policies allow public read access

## Post-Deployment Checklist

- [ ] Test authentication (login/signup)
- [ ] Verify product images load correctly
- [ ] Test product search and filtering
- [ ] Test checkout process (without completing payment)
- [ ] Check admin dashboard access
- [ ] Verify mobile responsiveness
- [ ] Test all user flows on different devices

## Continuous Deployment

Cloudflare Pages automatically deploys on every push to your main branch:
- **Production**: Deploys from `main` branch
- **Preview**: Creates preview deployments for pull requests

## Monitoring and Analytics

- Cloudflare Pages provides built-in analytics
- Check "Analytics" tab in your project dashboard
- Monitor build times and deployment status

## Support Resources

- [Cloudflare Pages Docs](https://developers.cloudflare.com/pages/)
- [Next.js on Cloudflare Pages](https://developers.cloudflare.com/pages/framework-guides/nextjs/)
- [@cloudflare/next-on-pages GitHub](https://github.com/cloudflare/next-on-pages)

---

**Note**: Cloudflare Pages free tier includes:
- Unlimited sites
- Unlimited requests
- 500 builds per month
- Global CDN

For production use, consider upgrading to a paid plan for more builds and better performance.

