# Ebuney - E-Commerce Platform for Zambia

A production-ready, multi-vendor e-commerce marketplace platform built specifically for the Zambian and African market. Built with Next.js, TypeScript, Supabase, and Tailwind CSS.

## Features

### Core E-Commerce
- Multi-vendor marketplace
- Product catalog with categories and search
- Shopping cart and checkout
- Order management system
- Reviews and ratings
- Seller storefronts

### Market Localization (Zambia/Africa)
- Mobile-first responsive design
- Mobile Money integration (MTN, Airtel, Zamtel)
- Cash on Delivery support
- Zambian address formats
- Multi-currency support (ZMW primary)
- Low-bandwidth optimizations

### User Roles
- **Buyers**: Browse, search, purchase, track orders
- **Sellers**: Manage products, process orders, view analytics
- **Admins**: Platform moderation, analytics, dispute resolution

### Security
- Row Level Security (RLS) on all tables
- Role-based access control
- Secure authentication via Supabase Auth
- Input validation and sanitization

## Technology Stack

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS 4
- **Backend**: Supabase (PostgreSQL, Auth, RLS, Edge Functions)
- **Hosting**: Vercel-ready (or any Node.js hosting)

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account and project

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd ebuney
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.local.example .env.local
```

Edit `.env.local` and add your Supabase credentials:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Set up the database:

   a. Go to your Supabase project dashboard
   b. Navigate to SQL Editor
   c. Run the schema from `supabase/schema.sql`
   d. Run the RLS policies from `supabase/rls.sql`

5. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database Setup

### 1. Run Schema

Execute the SQL in `supabase/schema.sql` in your Supabase SQL Editor. This creates:
- All required tables (users, sellers, products, orders, payments, deliveries, reviews, etc.)
- Enums for status types
- Indexes for performance
- Triggers for updated_at timestamps
- Functions for order numbers and rating calculations

### 2. Enable Row Level Security

Execute the SQL in `supabase/rls.sql` to enable RLS and set up policies for:
- User profiles and authentication
- Seller access controls
- Product visibility rules
- Order access (buyers see their orders, sellers see their sales)
- Payment and delivery tracking
- Admin-only access areas

### 3. Initial Setup (Optional)

Create an admin user:
```sql
-- After creating a user via Supabase Auth, update their role:
UPDATE user_profiles SET role = 'admin' WHERE email = 'admin@example.com';
```

## Project Structure

```
ebuney/
├── app/                    # Next.js App Router pages
│   ├── auth/              # Authentication pages
│   ├── products/          # Product pages
│   ├── cart/              # Shopping cart
│   ├── checkout/          # Checkout process
│   ├── orders/            # Order management
│   ├── dashboard/         # User dashboard
│   ├── seller/            # Seller dashboard
│   └── admin/             # Admin dashboard
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   ├── layout/           # Layout components
│   └── product/          # Product-specific components
├── lib/                   # Utilities and helpers
│   ├── supabase/         # Supabase client setup
│   ├── utils.ts          # Utility functions
│   └── constants.ts      # App constants
├── supabase/             # Database schema and migrations
│   ├── schema.sql        # Database schema
│   └── rls.sql           # Row Level Security policies
├── types/                # TypeScript type definitions
└── public/               # Static assets
```

## Key Features Implementation

### Authentication
- Supabase Auth handles user registration and login
- User profiles stored in `user_profiles` table
- Middleware protects routes based on authentication

### Products
- Products are seller-specific
- Categories and tags for organization
- Image support via URLs (integrate with Supabase Storage for production)
- Stock tracking and inventory management

### Orders
- Orders are grouped by seller (one order per seller)
- Order status workflow: pending → confirmed → processing → shipped → delivered
- Payment and delivery records linked to orders

### Payments
- Multiple payment methods supported:
  - Mobile Money (MTN, Airtel, Zamtel)
  - Credit/Debit Cards
  - Cash on Delivery
- Payment status tracking

### Delivery
- Multiple delivery methods:
  - Platform courier
  - Third-party courier
  - Seller pickup
- Delivery status tracking and notifications

## Deployment

### Cloudflare Pages (Recommended for Global CDN)

See [DEPLOYMENT_CLOUDFLARE.md](./DEPLOYMENT_CLOUDFLARE.md) for detailed instructions.

Quick steps:
1. Install dependencies: `npm install`
2. Push code to GitHub
3. Connect repository to Cloudflare Pages
4. Set build command: `npm run build:cloudflare`
5. Set build output: `.vercel/output/static`
6. Add environment variables in Cloudflare dashboard
7. Deploy

### Vercel (Alternative)

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Other Platforms

The app can be deployed to any Node.js hosting platform:
- Railway
- Render
- DigitalOcean App Platform
- AWS Amplify

Ensure environment variables are set in your hosting platform.

## Security Considerations

1. **Never expose** `SUPABASE_SERVICE_ROLE_KEY` in client-side code
2. All database access is protected by RLS policies
3. Input validation should be added on forms (consider using Zod)
4. Image uploads should use Supabase Storage with proper permissions
5. Payment processing should integrate with secure payment gateways

## Production Checklist

- [ ] Set up Supabase Storage for product images
- [ ] Configure payment gateway integrations
- [ ] Set up email notifications (Supabase Edge Functions)
- [ ] Configure domain and SSL
- [ ] Set up analytics
- [ ] Configure backup strategy
- [ ] Load testing
- [ ] Security audit
- [ ] Legal pages (Terms, Privacy Policy)

## Support

For issues or questions, please open an issue in the repository.

## License

[Your License Here]

---

Built with ❤️ for the Zambian market
