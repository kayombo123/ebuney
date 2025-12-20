# Deploying Ebuney to AWS Amplify

AWS Amplify is an excellent choice for deploying Next.js applications. It supports SSR (Server-Side Rendering) out of the box, works on Windows (builds happen on AWS servers), and automatically detects Next.js apps.

## Prerequisites

1. AWS Account (free tier available)
2. Git repository (GitHub, GitLab, Bitbucket, or AWS CodeCommit)
3. Supabase project URL and API keys

## Step 1: Push Your Code to Git

If you haven't already, push your code to a Git repository:

```bash
git add .
git commit -m "Prepare for AWS Amplify deployment"
git push origin main
```

## Step 2: Deploy via AWS Amplify Console

1. **Go to AWS Amplify Console**
   - Visit https://console.aws.amazon.com/amplify/
   - Sign in to your AWS account (or create one if needed)

2. **Create New App**
   - Click **"New app"** → **"Host web app"**
   - Choose your Git provider (GitHub, GitLab, Bitbucket, or AWS CodeCommit)
   - Authorize AWS Amplify to access your repository

3. **Select Repository**
   - Select your repository (`ebuney`)
   - Select the branch to deploy (usually `main` or `master`)
   - Click **"Next"**

4. **Configure Build Settings**
   
   AWS Amplify will automatically detect Next.js. The build settings should look like this:
   
   **Build command:**
   ```bash
   npm ci && npm run build
   ```
   
   **Output directory:**
   ```
   .next
   ```
   
   **App root directory:** (leave blank if repo root)
   ```
   /
   ```
   
   If auto-detection doesn't work, manually configure:
   ```yaml
   version: 1
   frontend:
     phases:
       preBuild:
         commands:
           - npm ci
       build:
         commands:
           - npm run build
     artifacts:
       baseDirectory: .next
       files:
         - '**/*'
     cache:
       paths:
         - node_modules/**/*
         - .next/cache/**/*
   ```

5. **Add Environment Variables**
   
   Click **"Advanced settings"** → **"Environment variables"** and add:
   
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://grxyvzpapamomhfipjfk.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
   ```

6. **Review and Deploy**
   - Review all settings
   - Click **"Save and deploy"**
   - Wait for the build to complete (usually 5-10 minutes)

## Step 3: Access Your Site

Once deployment completes, your site will be available at:
- **Default domain**: `https://main.xxxxxxxxxx.amplifyapp.com`
- You can customize this in the Amplify console under **"Domain management"**

## Step 4: Configure Custom Domain (Optional)

1. In Amplify console, go to **"Domain management"**
2. Click **"Add domain"**
3. Enter your domain name
4. Follow the DNS configuration instructions
5. AWS will automatically provision SSL certificates

## Step 5: Update Supabase Settings

1. Go to your Supabase project dashboard
2. Navigate to **Settings** → **API**
3. Add your Amplify domain to allowed origins
4. Update **Authentication** → **URL Configuration**:
   - Site URL: Your Amplify domain
   - Redirect URLs: Add `https://your-domain.amplifyapp.com/auth/callback`

## Important Notes

### Next.js 16 Support
- AWS Amplify officially supports Next.js up to v15, but Next.js 16 should work as it's backward compatible
- If you encounter issues, you may need to adjust build settings

### SSR Support
- AWS Amplify automatically handles SSR for Next.js apps
- No special adapter needed (unlike Cloudflare Pages)
- Server-side rendering works out of the box

### Build Optimizations
The build process runs on AWS servers (Linux), so you don't need to worry about:
- Windows compatibility issues
- Bash availability
- Local build environment setup

### Environment Variables
- Use `NEXT_PUBLIC_` prefix for client-side variables
- Environment variables are encrypted at rest
- You can have different variables for different branches

## Troubleshooting

### Build Fails

**Error: "Module not found"**
- Ensure all dependencies are in `package.json`
- Check that `package-lock.json` is committed to Git
- Try running `npm ci` locally to verify dependencies

**Error: "Environment variables not found"**
- Verify environment variables are set in Amplify console
- Ensure variable names match exactly (including `NEXT_PUBLIC_` prefix)
- Redeploy after adding environment variables

### Runtime Errors

**Error: "404 on all routes"**
- This shouldn't happen with Amplify as it handles Next.js routing automatically
- Check that you're using the App Router (not Pages Router)
- Verify build completed successfully

**Error: "Supabase connection failed"**
- Check your Supabase URL and API key
- Verify Supabase allows requests from your Amplify domain
- Check CORS settings in Supabase dashboard

### Performance Issues

**Slow builds**
- Enable caching in build settings (see example above)
- Consider using `npm ci` instead of `npm install` for faster, reproducible builds

## Continuous Deployment

AWS Amplify automatically:
- Deploys on every push to your main branch
- Creates preview deployments for pull requests
- Allows manual deployments from any branch

## Monitoring

- **Build logs**: Available in the Amplify console under each deployment
- **Runtime logs**: Available in CloudWatch (AWS's logging service)
- **Analytics**: Available in Amplify console (basic metrics)

## Cost Considerations

**Free Tier Includes:**
- 1,000 build minutes per month
- 15 GB served per month
- 5 GB stored per month

For most small to medium apps, the free tier is sufficient. Check AWS pricing for details.

## Comparison: Amplify vs Cloudflare Pages

| Feature | AWS Amplify | Cloudflare Pages |
|---------|-------------|------------------|
| Next.js Support | ✅ Native SSR | ⚠️ Requires adapter |
| Windows Build | ✅ Works (builds on AWS) | ❌ Requires Linux/WSL |
| Setup Complexity | ✅ Simple | ⚠️ More complex |
| Free Tier | ✅ Generous | ✅ Generous |
| Global CDN | ✅ CloudFront | ✅ Cloudflare CDN |
| Custom Domain | ✅ Free SSL | ✅ Free SSL |

## Support Resources

- [AWS Amplify Docs](https://docs.aws.amazon.com/amplify/)
- [Next.js on AWS Amplify](https://docs.aws.amazon.com/amplify/latest/userguide/deploy-nextjs-app.html)
- [AWS Amplify Console](https://console.aws.amazon.com/amplify/)

---

**Recommendation**: AWS Amplify is an excellent choice for your Next.js app, especially since you're on Windows. It's simpler than Cloudflare Pages for Next.js and doesn't require special adapters.

