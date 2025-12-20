# Quick Guide: Deploying to Cloudflare Pages (Windows)

## The Problem

When deploying Next.js to Cloudflare Pages on Windows, the `@cloudflare/next-on-pages` adapter requires bash (not available on Windows), which causes the build to fail.

## Solution: Use Git-Based Deployment (Recommended)

This is the **easiest and recommended approach** - Cloudflare will build your app on their Linux servers automatically.

### Steps:

1. **Push your code to GitHub** (if not already done):
   ```bash
   git add .
   git commit -m "Prepare for Cloudflare deployment"
   git push origin main
   ```

2. **Deploy via Cloudflare Dashboard**:
   - Go to https://dash.cloudflare.com/
   - Navigate to **Workers & Pages** → **Create application** → **Pages** → **Connect to Git**
   - Select your repository (`ebuney`)
   - Configure build settings:
     - **Build command**: `npm run build:cloudflare`
     - **Build output directory**: `.vercel/output/static`
     - **Root directory**: `/` (default)
   - Add environment variables:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Click **Save and Deploy**

3. **Your site will be available at**: `https://ebuneyzm.pages.dev` (or your custom domain)

---

## Alternative: Manual Deployment (Requires WSL or Linux)

If you need to deploy manually from Windows, you have two options:

### Option A: Use Windows Subsystem for Linux (WSL)

1. Install WSL (if not already installed):
   ```powershell
   wsl --install
   ```

2. In WSL, navigate to your project and build:
   ```bash
   cd /mnt/c/Users/USER/ebuney
   npm install
   npm run build:cloudflare
   ```

3. Deploy the output:
   ```bash
   npx wrangler pages deploy .vercel/output/static --project-name=ebuneyzm
   ```

### Option B: Use GitHub Actions (Automated)

Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy to Cloudflare Pages

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run build:cloudflare
      - uses: cloudflare/pages-action@v1
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          projectName: ebuneyzm
          directory: .vercel/output/static
```

---

## Why Your Current Deployment Shows 404

You deployed the **source directory** (`./ebuney`) instead of the **build output** (`.vercel/output/static`). 

The source code doesn't include:
- Compiled Next.js pages
- Cloudflare Pages adapter files
- Proper routing configuration

That's why you see a 404 error - Cloudflare Pages doesn't know how to serve your Next.js app without the adapter output.

---

## Quick Fix: Deploy via Git (Easiest)

The fastest solution is to use Git-based deployment. Cloudflare will:
- ✅ Build your app on Linux (where bash is available)
- ✅ Run the adapter automatically
- ✅ Deploy the correct output directory
- ✅ Handle environment variables
- ✅ Auto-deploy on every push

Just push to GitHub and connect your repo in the Cloudflare dashboard!

