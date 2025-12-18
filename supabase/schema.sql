-- Ebuney Auction Platform Database Schema
-- Single seller auction platform like eBay

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- User roles enum (simplified for buyers and admin)
CREATE TYPE user_role AS ENUM ('buyer', 'admin');
CREATE TYPE auction_status AS ENUM ('active', 'ended', 'cancelled');
CREATE TYPE bid_status AS ENUM ('active', 'outbid', 'won', 'cancelled');
CREATE TYPE order_status AS ENUM ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded');
CREATE TYPE delivery_method AS ENUM ('platform_courier', 'third_party_courier', 'seller_pickup');
CREATE TYPE delivery_status AS ENUM ('pending', 'assigned', 'in_transit', 'delivered', 'failed', 'returned');
CREATE TYPE payment_method AS ENUM ('mobile_money_mtn', 'mobile_money_airtel', 'mobile_money_zamtel', 'card', 'cash_on_delivery');
CREATE TYPE payment_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'refunded');
CREATE TYPE currency AS ENUM ('ZMW', 'USD', 'GBP', 'EUR');

-- User profiles (extends Supabase auth.users)
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  role user_role NOT NULL DEFAULT 'buyer',
  avatar_url TEXT,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Categories
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Products (auctions)
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  short_description TEXT,
  sku TEXT,
  starting_bid NUMERIC(12, 2) NOT NULL CHECK (starting_bid > 0),
  current_bid NUMERIC(12, 2),
  bid_increment NUMERIC(8, 2) DEFAULT 1.00 CHECK (bid_increment > 0),
  reserve_price NUMERIC(12, 2),
  buy_it_now_price NUMERIC(12, 2),
  currency currency NOT NULL DEFAULT 'ZMW',
  auction_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  auction_end TIMESTAMPTZ NOT NULL,
  status auction_status NOT NULL DEFAULT 'active',
  winner_id UUID REFERENCES user_profiles(id),
  total_bids INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  rating_average NUMERIC(3, 2) DEFAULT 0.00 CHECK (rating_average >= 0 AND rating_average <= 5),
  total_reviews INTEGER DEFAULT 0,
  weight_kg NUMERIC(8, 2),
  dimensions_cm TEXT,
  tags TEXT[],
  images TEXT[],
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Bids
CREATE TABLE bids (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  status bid_status NOT NULL DEFAULT 'active',
  is_auto_bid BOOLEAN DEFAULT false,
  max_auto_bid NUMERIC(12, 2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(product_id, user_id, amount) -- Prevent duplicate bids
);

-- Watchlist (favorites)
CREATE TABLE watchlist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, product_id)
);

-- Orders (for won auctions)
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number TEXT NOT NULL UNIQUE,
  buyer_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE RESTRICT,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  winning_bid_id UUID NOT NULL REFERENCES bids(id) ON DELETE RESTRICT,
  final_price NUMERIC(12, 2) NOT NULL CHECK (final_price > 0),
  status order_status NOT NULL DEFAULT 'pending',
  currency currency NOT NULL DEFAULT 'ZMW',
  shipping_address JSONB NOT NULL,
  billing_address JSONB,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  cancelled_at TIMESTAMPTZ,
  cancelled_reason TEXT
);

-- Payments
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
  payment_method payment_method NOT NULL,
  status payment_status NOT NULL DEFAULT 'pending',
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  currency currency NOT NULL DEFAULT 'ZMW',
  transaction_id TEXT,
  mobile_money_number TEXT,
  mobile_money_provider TEXT,
  payment_reference TEXT,
  payment_data JSONB,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Deliveries
CREATE TABLE deliveries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL UNIQUE REFERENCES orders(id) ON DELETE RESTRICT,
  delivery_method delivery_method NOT NULL,
  status delivery_status NOT NULL DEFAULT 'pending',
  tracking_number TEXT UNIQUE,
  courier_name TEXT,
  courier_contact TEXT,
  estimated_delivery_date TIMESTAMPTZ,
  actual_delivery_date TIMESTAMPTZ,
  delivery_address JSONB NOT NULL,
  delivery_notes TEXT,
  recipient_name TEXT,
  recipient_phone TEXT,
  delivery_failed_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Reviews
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  comment TEXT,
  is_verified_purchase BOOLEAN DEFAULT false,
  is_approved BOOLEAN DEFAULT false,
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(order_id, product_id, buyer_id)
);

-- Notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  is_read BOOLEAN DEFAULT false,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Admin audit logs
CREATE TABLE admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE RESTRICT,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  changes JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_user_profiles_role ON user_profiles(role);
CREATE INDEX idx_user_profiles_email ON user_profiles(email);
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_auction_end ON products(auction_end);
CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_name_search ON products USING gin(to_tsvector('english', name));
CREATE INDEX idx_bids_product_id ON bids(product_id);
CREATE INDEX idx_bids_user_id ON bids(user_id);
CREATE INDEX idx_bids_status ON bids(status);
CREATE INDEX idx_watchlist_user_id ON watchlist(user_id);
CREATE INDEX idx_orders_buyer_id ON orders(buyer_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_order_number ON orders(order_number);
CREATE INDEX idx_payments_order_id ON payments(order_id);
CREATE INDEX idx_deliveries_order_id ON deliveries(order_id);
CREATE INDEX idx_deliveries_status ON deliveries(status);
CREATE INDEX idx_reviews_product_id ON reviews(product_id);
CREATE INDEX idx_reviews_buyer_id ON reviews(buyer_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_deliveries_updated_at BEFORE UPDATE ON deliveries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to generate order number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
  new_order_number TEXT;
BEGIN
  new_order_number := 'EB-' || TO_CHAR(now(), 'YYYYMMDD') || '-' || LPAD(nextval('order_number_seq')::TEXT, 6, '0');
  RETURN new_order_number;
END;
$$ LANGUAGE plpgsql;

-- Sequence for order numbers
CREATE SEQUENCE IF NOT EXISTS order_number_seq;

-- Function to update product current_bid and total_bids
CREATE OR REPLACE FUNCTION update_product_bid_info()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE products
  SET
    current_bid = (
      SELECT MAX(amount)
      FROM bids
      WHERE product_id = NEW.product_id AND status = 'active'
    ),
    total_bids = (
      SELECT COUNT(*)
      FROM bids
      WHERE product_id = NEW.product_id
    ),
    winner_id = (
      SELECT user_id
      FROM bids
      WHERE product_id = NEW.product_id AND status = 'active'
      ORDER BY amount DESC, created_at ASC
      LIMIT 1
    )
  WHERE id = NEW.product_id;

  -- Mark other bids as outbid
  UPDATE bids
  SET status = 'outbid'
  WHERE product_id = NEW.product_id
    AND user_id != NEW.user_id
    AND status = 'active'
    AND amount < NEW.amount;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_product_bid_trigger
AFTER INSERT ON bids
FOR EACH ROW
EXECUTE FUNCTION update_product_bid_info();

-- Function to end auctions
CREATE OR REPLACE FUNCTION end_expired_auctions()
RETURNS VOID AS $$
BEGIN
  -- End auctions where auction_end has passed
  UPDATE products
  SET status = 'ended'
  WHERE status = 'active' AND auction_end <= now();

  -- Update winning bids
  UPDATE bids
  SET status = 'won'
  WHERE product_id IN (
    SELECT id FROM products WHERE status = 'ended'
  ) AND user_id = (
    SELECT winner_id FROM products WHERE id = bids.product_id
  );
END;
$$ LANGUAGE plpgsql;

-- Function to update product rating after review
CREATE OR REPLACE FUNCTION update_product_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE products
  SET
    rating_average = (
      SELECT COALESCE(AVG(rating)::NUMERIC(3,2), 0)
      FROM reviews
      WHERE product_id = NEW.product_id AND is_approved = true
    ),
    total_reviews = (
      SELECT COUNT(*)
      FROM reviews
      WHERE product_id = NEW.product_id AND is_approved = true
    )
  WHERE id = NEW.product_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_product_rating_trigger
AFTER INSERT OR UPDATE ON reviews
FOR EACH ROW
WHEN (NEW.is_approved = true)
EXECUTE FUNCTION update_product_rating();
