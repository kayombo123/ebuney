# Quick Start: Deploy to Cloudflare Pages

## ⚡ Fastest Method: GitHub Actions (Recommended)

This automatically builds and deploys when you push to GitHub - no local build needed!

### Setup (One-time):

1. **Get Cloudflare API Token:**
   - Go to https://dash.cloudflare.com/profile/api-tokens
   - Create token with "Edit Cloudflare Workers" template
   - Add permission: Account → Cloudflare Pages → Edit

2. **Get Account ID:**
   - Go to https://dash.cloudflare.com/
   - Copy Account ID from right sidebar

3. **Add GitHub Secrets:**
   - Go to: https://github.com/kayombo123/ebuney/settings/secrets/actions
   - Click "New repository secret" and add:
     - `CLOUDFLARE_API_TOKEN` = Your API token
     - `CLOUDFLARE_ACCOUNT_ID` = Your Account ID
     - `NEXT_PUBLIC_SUPABASE_URL` = https://grxyvzpapamomhfipjfk.supabase.co
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = Your Supabase key

4. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Add Cloudflare deployment workflow"
   git push origin main
   ```

5. **Check deployment:**
   - Go to: https://github.com/kayombo123/ebuney/actions
   - Watch the workflow run
   - Your site deploys automatically!

## 📦 Manual Deployment (Using WSL)

If you want to deploy manually from Windows:

1. **Install WSL** (if needed):
   ```powershell
   wsl --install
   ```

2. **Open WSL and build:**
   ```bash
   cd /mnt/c/Users/USER/ebuney
   npm ci
   npm run deploy:cloudflare
   ```

3. **Login to Cloudflare** (first time only):
   ```bash
   npx wrangler login
   ```

## 🔧 Configuration Files

All deployment files are configured:

✅ `wrangler.toml` - Cloudflare configuration (project name: ebuneyzm)  
✅ `package.json` - Build and deploy scripts  
✅ `.github/workflows/deploy-cloudflare.yml` - Automated deployment  
✅ Environment variables configured in `wrangler.toml`

## 📝 Important Notes

- **You MUST deploy `.vercel/output/static`**, not source files
- The build process requires bash (available on GitHub Actions or WSL)
- Environment variables are set in `wrangler.toml` but can be overridden in Cloudflare dashboard
- Your site will be at: `https://ebuneyzm.pages.dev`

## 🚀 After Deployment

1. Verify your site loads at the Cloudflare Pages URL
2. Test all routes (home, products, auth, etc.)
3. Set custom domain in Cloudflare dashboard if needed
4. Update Supabase redirect URLs with your domain

For detailed instructions, see [WRANGLER_DEPLOY.md](./WRANGLER_DEPLOY.md)

