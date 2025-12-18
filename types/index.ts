import { UserRole, AuctionStatus, BidStatus, OrderStatus, DeliveryMethod, DeliveryStatus, PaymentMethod, PaymentStatus, Currency } from './database'

export type { UserRole, AuctionStatus, BidStatus, OrderStatus, DeliveryMethod, DeliveryStatus, PaymentMethod, PaymentStatus, Currency }

export interface User {
  id: string
  email: string
  full_name: string | null
  phone: string | null
  role: UserRole
  avatar_url: string | null
  is_verified: boolean
}

export interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  parent_id: string | null
  image_url: string | null
  is_active: boolean
  display_order: number
}

export interface Product {
  id: string
  category_id: string | null
  name: string
  slug: string
  description: string | null
  short_description: string | null
  sku: string | null
  starting_bid: number
  current_bid: number | null
  bid_increment: number
  reserve_price: number | null
  buy_it_now_price: number | null
  currency: Currency
  auction_start: string
  auction_end: string
  status: AuctionStatus
  winner_id: string | null
  total_bids: number
  is_featured: boolean
  rating_average: number
  total_reviews: number
  images: string[] | null
  tags: string[] | null
  category?: Category
  bids?: Bid[]
}

export interface Bid {
  id: string
  product_id: string
  user_id: string
  amount: number
  status: BidStatus
  is_auto_bid: boolean
  max_auto_bid: number | null
  created_at: string
  user?: User
}

export interface WatchlistItem {
  id: string
  user_id: string
  product_id: string
  created_at: string
  product?: Product
}

export interface CartItem {
  id: string
  cart_id: string
  product_id: string
  variant_id: string | null
  quantity: number
  product?: Product
}

export interface Order {
  id: string
  order_number: string
  buyer_id: string
  product_id: string
  winning_bid_id: string
  final_price: number
  status: OrderStatus
  currency: Currency
  shipping_address: Record<string, any>
  billing_address: Record<string, any> | null
  notes: string | null
  created_at: string
  updated_at: string
  buyer?: User
  product?: Product
  winning_bid?: Bid
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  variant_id: string | null
  product_name: string
  product_sku: string | null
  variant_name: string | null
  price: number
  quantity: number
  subtotal: number
  product?: Product
}

export interface Payment {
  id: string
  order_id: string
  payment_method: PaymentMethod
  status: PaymentStatus
  amount: number
  currency: Currency
  transaction_id: string | null
  mobile_money_number: string | null
  mobile_money_provider: string | null
  payment_reference: string | null
  created_at: string
  updated_at: string
}

export interface Delivery {
  id: string
  order_id: string
  delivery_method: DeliveryMethod
  status: DeliveryStatus
  tracking_number: string | null
  courier_name: string | null
  estimated_delivery_date: string | null
  actual_delivery_date: string | null
  delivery_address: Record<string, any>
  delivery_notes: string | null
  recipient_name: string | null
  recipient_phone: string | null
  created_at: string
  updated_at: string
}

export interface Review {
  id: string
  order_id: string | null
  product_id: string
  buyer_id: string
  rating: number
  title: string | null
  comment: string | null
  is_verified_purchase: boolean
  is_approved: boolean
  helpful_count: number
  created_at: string
  updated_at: string
  buyer?: User
  product?: Product
}

export interface ShippingAddress {
  full_name: string
  phone: string
  address_line1: string
  address_line2?: string
  city: string
  province: string
  postal_code?: string
  country: string
  delivery_notes?: string
}
