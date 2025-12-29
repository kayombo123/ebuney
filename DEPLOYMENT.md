# Deployment Guide - Ebuney E-Commerce Platform

This guide covers deploying the Ebuney platform to production on Render.

## Prerequisites

1. **Supabase account and project**
   - Create a project at [supabase.com](https://supabase.com)
   - Note your project URL and anon key

2. **Render account**
   - Sign up at [render.com](https://render.com) (free tier available)

3. **Git repository**
   - Push your code to GitHub, GitLab, or Bitbucket

4. **Domain name** (optional, for production)

## Step 1: Set Up Supabase Database

### 1.1 Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Wait for the project to be provisioned (takes ~2 minutes)
4. Note your project URL and anon key:
   - Go to Settings → API
   - Copy "Project URL" (format: `https://xxxxx.supabase.co`)
   - Copy "anon" / "public" key (starts with `eyJ...` or `sb_...`)

### 1.2 Run Database Schema

1. Navigate to SQL Editor in Supabase dashboard
2. Copy and execute `supabase/schema.sql`
   - This creates all required tables, enums, indexes, and triggers
3. Copy and execute `supabase/rls.sql`
   - This enables Row Level Security and sets up access policies

### 1.3 Enable Storage (for product images)

1. Go to Storage in Supabase dashboard
2. Create buckets:
   - `product-images` (public or with RLS policies)
   - `avatars` (optional)
   - `seller-documents` (optional)
3. Configure bucket policies as needed

### 1.4 Configure Authentication

1. In Authentication → Settings, configure:
   - **Site URL**: Your Render production URL (or `http://localhost:3000` for development)
   - **Redirect URLs**: 
     - Add your Render URL + `/auth/callback`
     - Add `http://localhost:3000/auth/callback` for local development
     - Example: `https://ebuney.onrender.com/auth/callback`

## Step 2: Deploy to Render

### 2.1 Connect Repository to Render

1. **Sign in to Render**
   - Go to [dashboard.render.com](https://dashboard.render.com)
   - Sign in with GitHub, GitLab, or Bitbucket

2. **Create New Web Service**
   - Click "New +" → "Web Service"
   - Connect your repository
   - Select the repository containing your Ebuney code

3. **Configure Service**

   Render will automatically detect the `render.yaml` configuration file. However, you can also configure manually:

   - **Name**: `ebuney` (or your preferred name)
   - **Region**: Choose closest to your users (recommended: US East for global, or specific region)
   - **Branch**: `main` (or your production branch)
   - **Root Directory**: Leave empty (or `./` if your app is in a subdirectory)
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: 
     - **Free**: Good for testing (spins down after 15 minutes of inactivity)
     - **Starter ($7/month)**: Always on, better for production
     - **Standard ($25/month)**: Production-ready with more resources

### 2.2 Set Environment Variables

In the Render dashboard, add these environment variables:

1. Go to your service → Environment tab
2. Add the following variables:

   ```
   NODE_ENV=production
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   ```

   **Important Notes:**
   - Replace `your-project` and `your-anon-key-here` with your actual Supabase credentials
   - Environment variables prefixed with `NEXT_PUBLIC_` are exposed to the browser
   - Never add `SUPABASE_SERVICE_ROLE_KEY` here (it's server-only)

3. Click "Save Changes"

### 2.3 Deploy

1. **Automatic Deployment**
   - Render will automatically deploy when you click "Create Web Service"
   - Future deployments happen automatically on every push to the connected branch

2. **Monitor Deployment**
   - Watch the build logs in real-time
   - Build typically takes 3-5 minutes
   - You'll see:
     - ✅ Installing dependencies
     - ✅ Building Next.js application
     - ✅ Starting server

3. **Access Your App**
   - Once deployed, your app will be available at: `https://ebuney.onrender.com` (or your custom name)
   - The URL is shown in the Render dashboard

## Step 3: Post-Deployment Configuration

### 3.1 Update Supabase Redirect URLs

1. Go to Supabase Dashboard → Authentication → Settings
2. Add your Render URL to "Redirect URLs":
   - `https://your-app.onrender.com/auth/callback`
3. Update "Site URL" to your Render URL
4. Save changes

### 3.2 Create Admin User

1. Visit your deployed app
2. Register a new user account
3. Go to Supabase Dashboard → Table Editor → `user_profiles`
4. Find your user and update the `role` column to `admin`:

```sql
UPDATE user_profiles 
SET role = 'admin' 
WHERE email = 'your-email@example.com';
```

### 3.3 Configure Custom Domain (Optional)

1. In Render dashboard → Settings → Custom Domains
2. Click "Add Custom Domain"
3. Enter your domain (e.g., `ebuney.com`)
4. Follow the DNS configuration instructions:
   - Add a CNAME record pointing to your Render URL
   - Or add an A record with Render's IP address
5. Render will automatically provision SSL certificates via Let's Encrypt

6. **Update Supabase Redirect URLs** to include your custom domain:
   - `https://yourdomain.com/auth/callback`

## Step 4: Configuration Files

The project includes a `render.yaml` file for Infrastructure as Code:

```yaml
services:
  - type: web
    name: ebuney
    runtime: node
    plan: starter
    buildCommand: npm install && npm run build
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: NEXT_PUBLIC_SUPABASE_URL
        sync: false  # You'll need to set this in Render dashboard
      - key: NEXT_PUBLIC_SUPABASE_ANON_KEY
        sync: false  # You'll need to set this in Render dashboard
    healthCheckPath: /
    autoDeploy: true
```

**Note:** To use `render.yaml`:
1. Install Render CLI: `npm install -g render-cli`
2. Deploy: `render deploy`
3. Or just use the Render dashboard (recommended for first-time setup)

## Step 5: Monitoring & Maintenance

### 5.1 Health Checks

Render automatically monitors your service at the health check path (`/`). If the health check fails repeatedly, Render will restart your service.

### 5.2 Logs

- View logs in real-time: Render Dashboard → Your Service → Logs
- Logs are retained for a limited time on free tier
- Consider upgrading for longer log retention

### 5.3 Metrics

- Monitor CPU, memory, and request metrics in the Render dashboard
- Set up alerts for service downtime or high resource usage

### 5.4 Automatic Deployments

- Render automatically deploys on every push to your connected branch
- You can also manually trigger deployments from the dashboard
- Preview deployments are available for pull requests (on paid plans)

## Step 6: Production Enhancements

### 6.1 Configure Payment Gateways

1. Integrate payment provider APIs (e.g., Stripe, Flutterwave for Africa)
2. Add API keys as environment variables in Render:
   - `STRIPE_SECRET_KEY` (server-only, not NEXT_PUBLIC_)
   - `FLUTTERWAVE_SECRET_KEY` (server-only)

### 6.2 Set Up Email Notifications

1. Configure email service (SendGrid, Resend, or Supabase Edge Functions)
2. Add email API keys to environment variables
3. Test order confirmation emails

### 6.3 Configure Image Storage

1. Ensure Supabase Storage buckets are properly configured
2. Test product image uploads
3. Verify image URLs are accessible
4. Consider implementing image optimization/compression

### 6.4 Set Up Analytics

1. Add Google Analytics or Plausible
2. Track key e-commerce events
3. Monitor user behavior and conversion rates

## Step 7: Security Checklist

- [ ] Environment variables are set correctly (not hardcoded)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` is never exposed to client
- [ ] RLS policies are enabled on all Supabase tables
- [ ] HTTPS is enabled (automatic on Render)
- [ ] Supabase redirect URLs are properly configured
- [ ] Input validation on all forms
- [ ] SQL injection prevention (handled by Supabase)
- [ ] XSS prevention (handled by React)
- [ ] CSRF protection (handled by Next.js)

## Step 8: Troubleshooting

### Build Fails

**Error: "Module not found"**
- Check `package.json` has all dependencies
- Verify Node.js version (should be 18+)
- Clear Render cache and redeploy

**Error: "Environment variable not found"**
- Verify all `NEXT_PUBLIC_*` variables are set in Render dashboard
- Check for typos in variable names
- Redeploy after adding variables

**Error: "Build timeout"**
- Free tier has build time limits
- Optimize build: remove unused dependencies
- Consider upgrading plan

### App Won't Start

**Error: "Port already in use"**
- Render automatically sets `PORT` environment variable
- Ensure your app uses `process.env.PORT || 3000`

**Error: "Database connection failed"**
- Verify Supabase URL and keys are correct
- Check Supabase project is active
- Verify network access (Supabase allows all IPs by default)

### Authentication Issues

**Users can't log in**
- Check Supabase redirect URLs include your Render URL
- Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set
- Check Supabase Auth settings in dashboard

**Redirects to wrong URL**
- Update Supabase Site URL and Redirect URLs
- Clear browser cookies
- Check middleware configuration

### Performance Issues

**Slow page loads**
- Enable Next.js image optimization
- Implement caching strategies
- Consider upgrading Render plan for more resources
- Use Supabase edge caching where applicable

**Service spins down (Free tier)**
- Free tier services spin down after 15 minutes of inactivity
- First request after spin-down takes 30-60 seconds (cold start)
- Consider upgrading to Starter plan ($7/month) for always-on service

## Step 9: Scaling Considerations

### Database

- Monitor query performance in Supabase dashboard
- Add indexes as needed
- Consider read replicas for high traffic
- Upgrade Supabase plan if needed

### Application

- Upgrade Render plan for more CPU/memory
- Monitor resource usage in Render dashboard
- Consider horizontal scaling (multiple instances) on higher tiers

### Images

- Use CDN for image delivery (Supabase Storage includes CDN)
- Optimize image sizes
- Implement lazy loading
- Use Next.js Image component

### Caching

- Configure Next.js caching strategies
- Use Supabase edge caching where applicable
- Consider Redis for session caching (available on Render)

## Step 10: Cost Optimization

### Free Tier Limitations

- Service spins down after inactivity
- Limited build minutes per month
- Basic support

### Recommended Plan for Production

- **Starter ($7/month)**: Always-on service, suitable for small to medium traffic
- **Standard ($25/month)**: Better performance, more resources, suitable for growing business

### Cost Saving Tips

- Use Supabase free tier (generous limits)
- Optimize images to reduce storage costs
- Monitor and optimize database queries
- Use caching to reduce API calls

## Support

For deployment issues:

1. **Render Documentation**: [render.com/docs](https://render.com/docs)
2. **Render Community**: [community.render.com](https://community.render.com)
3. **Next.js Deployment**: [nextjs.org/docs/deployment](https://nextjs.org/docs/deployment)
4. **Supabase Guides**: [supabase.com/docs/guides](https://supabase.com/docs/guides)

## Additional Resources

- [Render Getting Started Guide](https://render.com/docs/getting-started)
- [Next.js on Render](https://render.com/docs/deploy-nextjs)
- [Supabase Authentication Setup](https://supabase.com/docs/guides/auth)
- [Next.js Deployment Best Practices](https://nextjs.org/docs/deployment)

---

**Important**: Always test in a staging environment before deploying to production!

For local testing, ensure your `.env.local` matches your production environment variables (except use development Supabase project if preferred).
