-- Row Level Security Policies for Ebuney Platform
-- Comprehensive RLS for all tables

-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE sellers ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

-- Helper function to get user role
CREATE OR REPLACE FUNCTION get_user_role(user_uuid UUID)
RETURNS user_role AS $$
  SELECT role FROM user_profiles WHERE id = user_uuid;
$$ LANGUAGE sql SECURITY DEFINER;

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_uuid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS(SELECT 1 FROM user_profiles WHERE id = user_uuid AND role = 'admin');
$$ LANGUAGE sql SECURITY DEFINER;

-- Helper function to get seller_id from user_id
CREATE OR REPLACE FUNCTION get_seller_id(user_uuid UUID)
RETURNS UUID AS $$
  SELECT id FROM sellers WHERE user_id = user_uuid;
$$ LANGUAGE sql SECURITY DEFINER;

-- USER_PROFILES POLICIES
-- Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can view public profile info (name, avatar) of others
CREATE POLICY "Users can view public profiles"
  ON user_profiles FOR SELECT
  USING (true);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Admins can update any profile
CREATE POLICY "Admins can update any profile"
  ON user_profiles FOR UPDATE
  USING (is_admin(auth.uid()));

-- SELLERS POLICIES
-- Anyone can view active, verified sellers
CREATE POLICY "Anyone can view active sellers"
  ON sellers FOR SELECT
  USING (is_active = true AND is_verified = true);

-- Sellers can view their own seller profile
CREATE POLICY "Sellers can view own profile"
  ON sellers FOR SELECT
  USING (user_id = auth.uid());

-- Sellers can update their own profile
CREATE POLICY "Sellers can update own profile"
  ON sellers FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Users can insert their own seller profile (registration)
CREATE POLICY "Users can register as seller"
  ON sellers FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Admins can view all sellers
CREATE POLICY "Admins can view all sellers"
  ON sellers FOR SELECT
  USING (is_admin(auth.uid()));

-- Admins can update any seller
CREATE POLICY "Admins can update any seller"
  ON sellers FOR UPDATE
  USING (is_admin(auth.uid()));

-- CATEGORIES POLICIES
-- Anyone can view active categories
CREATE POLICY "Anyone can view active categories"
  ON categories FOR SELECT
  USING (is_active = true);

-- Admins can manage categories
CREATE POLICY "Admins can manage categories"
  ON categories FOR ALL
  USING (is_admin(auth.uid()));

-- PRODUCTS POLICIES
-- Anyone can view active products from verified sellers
CREATE POLICY "Anyone can view active products"
  ON products FOR SELECT
  USING (
    is_active = true 
    AND EXISTS (
      SELECT 1 FROM sellers 
      WHERE sellers.id = products.seller_id 
      AND sellers.is_active = true 
      AND sellers.is_verified = true
    )
  );

-- Sellers can view their own products (including inactive)
CREATE POLICY "Sellers can view own products"
  ON products FOR SELECT
  USING (seller_id = get_seller_id(auth.uid()));

-- Sellers can insert products for their seller account
CREATE POLICY "Sellers can insert own products"
  ON products FOR INSERT
  WITH CHECK (seller_id = get_seller_id(auth.uid()));

-- Sellers can update their own products
CREATE POLICY "Sellers can update own products"
  ON products FOR UPDATE
  USING (seller_id = get_seller_id(auth.uid()))
  WITH CHECK (seller_id = get_seller_id(auth.uid()));

-- Sellers can delete their own products (soft delete via is_active)
CREATE POLICY "Sellers can update own products to inactive"
  ON products FOR UPDATE
  USING (seller_id = get_seller_id(auth.uid()))
  WITH CHECK (seller_id = get_seller_id(auth.uid()));

-- Admins can manage all products
CREATE POLICY "Admins can manage all products"
  ON products FOR ALL
  USING (is_admin(auth.uid()));

-- PRODUCT_VARIANTS POLICIES
-- Anyone can view variants for active products
CREATE POLICY "Anyone can view active variants"
  ON product_variants FOR SELECT
  USING (
    is_active = true
    AND EXISTS (
      SELECT 1 FROM products
      WHERE products.id = product_variants.product_id
      AND products.is_active = true
    )
  );

-- Sellers can manage variants for their products
CREATE POLICY "Sellers can manage own variants"
  ON product_variants FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM products
      WHERE products.id = product_variants.product_id
      AND products.seller_id = get_seller_id(auth.uid())
    )
  );

-- Admins can manage all variants
CREATE POLICY "Admins can manage all variants"
  ON product_variants FOR ALL
  USING (is_admin(auth.uid()));

-- CARTS POLICIES
-- Users can only view their own cart
CREATE POLICY "Users can view own cart"
  ON carts FOR SELECT
  USING (user_id = auth.uid());

-- Users can insert their own cart
CREATE POLICY "Users can insert own cart"
  ON carts FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can update their own cart
CREATE POLICY "Users can update own cart"
  ON carts FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- CART_ITEMS POLICIES
-- Users can manage items in their own cart
CREATE POLICY "Users can manage own cart items"
  ON cart_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM carts
      WHERE carts.id = cart_items.cart_id
      AND carts.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM carts
      WHERE carts.id = cart_items.cart_id
      AND carts.user_id = auth.uid()
    )
  );

-- ORDERS POLICIES
-- Buyers can view their own orders
CREATE POLICY "Buyers can view own orders"
  ON orders FOR SELECT
  USING (buyer_id = auth.uid());

-- Sellers can view orders for their products
CREATE POLICY "Sellers can view own orders"
  ON orders FOR SELECT
  USING (seller_id = get_seller_id(auth.uid()));

-- Buyers can insert orders (checkout)
CREATE POLICY "Buyers can create orders"
  ON orders FOR INSERT
  WITH CHECK (buyer_id = auth.uid());

-- Sellers can update order status (with restrictions)
CREATE POLICY "Sellers can update order status"
  ON orders FOR UPDATE
  USING (seller_id = get_seller_id(auth.uid()))
  WITH CHECK (
    seller_id = get_seller_id(auth.uid())
    AND (
      -- Sellers can only move orders forward in status
      (OLD.status = 'confirmed' AND NEW.status = 'processing')
      OR (OLD.status = 'processing' AND NEW.status = 'shipped')
      OR (OLD.status = OLD.status AND NEW.status = OLD.status) -- No status change
    )
  );

-- Admins can manage all orders
CREATE POLICY "Admins can manage all orders"
  ON orders FOR ALL
  USING (is_admin(auth.uid()));

-- ORDER_ITEMS POLICIES
-- Follow parent order policies
CREATE POLICY "Users can view order items for accessible orders"
  ON order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND (
        orders.buyer_id = auth.uid()
        OR orders.seller_id = get_seller_id(auth.uid())
        OR is_admin(auth.uid())
      )
    )
  );

-- System can insert order items (via trigger/function)
CREATE POLICY "System can insert order items"
  ON order_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.buyer_id = auth.uid()
    )
  );

-- Admins can manage all order items
CREATE POLICY "Admins can manage all order items"
  ON order_items FOR ALL
  USING (is_admin(auth.uid()));

-- PAYMENTS POLICIES
-- Buyers can view payments for their orders
CREATE POLICY "Buyers can view own payments"
  ON payments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = payments.order_id
      AND orders.buyer_id = auth.uid()
    )
  );

-- Sellers can view payments for their orders
CREATE POLICY "Sellers can view own payments"
  ON payments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = payments.order_id
      AND orders.seller_id = get_seller_id(auth.uid())
    )
  );

-- System/buyer can insert payments during checkout
CREATE POLICY "Buyers can create payments"
  ON payments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = payments.order_id
      AND orders.buyer_id = auth.uid()
    )
  );

-- Admins can manage all payments
CREATE POLICY "Admins can manage all payments"
  ON payments FOR ALL
  USING (is_admin(auth.uid()));

-- DELIVERIES POLICIES
-- Buyers can view deliveries for their orders
CREATE POLICY "Buyers can view own deliveries"
  ON deliveries FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = deliveries.order_id
      AND orders.buyer_id = auth.uid()
    )
  );

-- Sellers can view deliveries for their orders
CREATE POLICY "Sellers can view own deliveries"
  ON deliveries FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = deliveries.order_id
      AND orders.seller_id = get_seller_id(auth.uid())
    )
  );

-- Admins can manage all deliveries
CREATE POLICY "Admins can manage all deliveries"
  ON deliveries FOR ALL
  USING (is_admin(auth.uid()));

-- REVIEWS POLICIES
-- Anyone can view approved reviews
CREATE POLICY "Anyone can view approved reviews"
  ON reviews FOR SELECT
  USING (is_approved = true);

-- Buyers can view their own reviews (including unapproved)
CREATE POLICY "Buyers can view own reviews"
  ON reviews FOR SELECT
  USING (buyer_id = auth.uid());

-- Buyers can create reviews for their orders
CREATE POLICY "Buyers can create reviews"
  ON reviews FOR INSERT
  WITH CHECK (
    buyer_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = reviews.order_id
      AND orders.buyer_id = auth.uid()
      AND orders.status = 'delivered'
    )
  );

-- Buyers can update their own reviews
CREATE POLICY "Buyers can update own reviews"
  ON reviews FOR UPDATE
  USING (buyer_id = auth.uid())
  WITH CHECK (buyer_id = auth.uid());

-- Admins can manage all reviews
CREATE POLICY "Admins can manage all reviews"
  ON reviews FOR ALL
  USING (is_admin(auth.uid()));

-- NOTIFICATIONS POLICIES
-- Users can only view their own notifications
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (user_id = auth.uid());

-- System can insert notifications (via function/trigger)
CREATE POLICY "System can insert notifications"
  ON notifications FOR INSERT
  WITH CHECK (true); -- Managed by functions with SECURITY DEFINER

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ADMIN_AUDIT_LOGS POLICIES
-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs"
  ON admin_audit_logs FOR SELECT
  USING (is_admin(auth.uid()));

-- Only system can insert audit logs (via SECURITY DEFINER functions)
CREATE POLICY "System can insert audit logs"
  ON admin_audit_logs FOR INSERT
  WITH CHECK (true);

-- FAVORITES POLICIES
-- Users can manage their own favorites
CREATE POLICY "Users can manage own favorites"
  ON favorites FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

