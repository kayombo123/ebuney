# Deployment Guide - Ebuney E-Commerce Platform

This guide covers deploying the Ebuney platform to production.

## Prerequisites

1. Supabase account and project
2. Node.js 18+ installed locally
3. Git repository set up
4. Domain name (optional, for production)

## Step 1: Set Up Supabase Database

1. **Create Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Create a new project
   - Note your project URL and anon key

2. **Run Database Schema**
   - Navigate to SQL Editor in Supabase dashboard
   - Copy and execute `supabase/schema.sql`
   - Copy and execute `supabase/rls.sql`

3. **Enable Storage (for product images)**
   - Go to Storage in Supabase dashboard
   - Create a bucket named `product-images`
   - Set it to public (or configure RLS policies)
   - Create additional buckets as needed: `avatars`, `seller-documents`

4. **Configure Authentication**
   - In Authentication → Settings, configure:
     - Site URL: Your production domain
     - Redirect URLs: Add your production domain + `/auth/callback`

## Step 2: Environment Variables

Create `.env.local` (for local development) and set environment variables in your hosting platform:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

**Never commit `.env.local` to Git!**

## Step 3: Build Locally (Test)

```bash
npm install
npm run build
npm start
```

Test that the build works before deploying.

## Step 4: Deploy to Vercel (Recommended)

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Deploy on Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Import your Git repository
   - Add environment variables in Vercel dashboard
   - Deploy

3. **Configure Custom Domain** (Optional)
   - In Vercel project settings, add your domain
   - Update DNS records as instructed
   - Update Supabase auth redirect URLs

## Step 5: Alternative Deployment Options

### Railway

1. Connect your GitHub repository
2. Add environment variables in Railway dashboard
3. Deploy automatically on push

### Render

1. Create a new Web Service
2. Connect your Git repository
3. Set build command: `npm install && npm run build`
4. Set start command: `npm start`
5. Add environment variables

### DigitalOcean App Platform

1. Create new app from GitHub
2. Configure build settings
3. Add environment variables
4. Deploy

## Step 6: Post-Deployment Setup

1. **Create Admin User**
   ```sql
   -- After creating user via Supabase Auth UI, run:
   UPDATE user_profiles 
   SET role = 'admin' 
   WHERE email = 'admin@yourdomain.com';
   ```

2. **Configure Payment Gateways**
   - Integrate payment provider APIs
   - Add API keys to environment variables
   - Test payment flows

3. **Set Up Email Notifications**
   - Configure Supabase Edge Functions for emails
   - Or integrate with SendGrid/Resend/etc.
   - Test order confirmation emails

4. **Configure Image Storage**
   - Update image upload code to use Supabase Storage
   - Test product image uploads
   - Verify image URLs are accessible

## Step 7: Monitoring & Analytics

1. **Set Up Error Tracking**
   - Consider Sentry or similar
   - Configure error reporting

2. **Analytics**
   - Add Google Analytics or Plausible
   - Track key e-commerce events

3. **Performance Monitoring**
   - Use Vercel Analytics (if on Vercel)
   - Monitor Core Web Vitals

## Step 8: Security Checklist

- [ ] Environment variables are secure (not in client code)
- [ ] RLS policies are enabled on all tables
- [ ] HTTPS is enabled
- [ ] API rate limiting configured
- [ ] Input validation on all forms
- [ ] SQL injection prevention (handled by Supabase)
- [ ] XSS prevention (handled by React)
- [ ] CSRF protection (handled by Next.js)

## Step 9: Scaling Considerations

### Database
- Monitor query performance
- Add indexes as needed
- Consider read replicas for high traffic

### Images
- Use CDN for image delivery
- Optimize image sizes
- Implement lazy loading

### Caching
- Configure Next.js caching strategies
- Use Supabase edge caching where applicable
- Consider Redis for session caching

### Load Testing
- Test with tools like k6 or Artillery
- Identify bottlenecks
- Scale resources as needed

## Troubleshooting

### Build Errors
- Check Node.js version matches `.nvmrc` if present
- Verify all environment variables are set
- Check for TypeScript errors: `npm run build`

### Database Connection Issues
- Verify Supabase URL and keys
- Check network access
- Verify RLS policies aren't blocking access

### Image Upload Issues
- Verify Supabase Storage bucket permissions
- Check file size limits
- Verify CORS settings

### Authentication Issues
- Check redirect URLs in Supabase dashboard
- Verify session handling in middleware
- Check cookie settings for your domain

## Support

For deployment issues, check:
- Next.js deployment docs
- Supabase deployment guide
- Vercel/Railway/Render documentation

---

**Important**: Always test in a staging environment before deploying to production!

