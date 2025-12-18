export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type UserRole = 'buyer' | 'admin'
export type AuctionStatus = 'active' | 'ended' | 'cancelled'
export type BidStatus = 'active' | 'outbid' | 'won' | 'cancelled'
export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'
export type DeliveryMethod = 'platform_courier' | 'third_party_courier' | 'seller_pickup'
export type DeliveryStatus = 'pending' | 'assigned' | 'in_transit' | 'delivered' | 'failed' | 'returned'
export type PaymentMethod = 'mobile_money_mtn' | 'mobile_money_airtel' | 'mobile_money_zamtel' | 'card' | 'cash_on_delivery'
export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'refunded'
export type Currency = 'ZMW' | 'USD' | 'GBP' | 'EUR'

export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          phone: string | null
          role: UserRole
          avatar_url: string | null
          is_verified: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          phone?: string | null
          role?: UserRole
          avatar_url?: string | null
          is_verified?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          phone?: string | null
          role?: UserRole
          avatar_url?: string | null
          is_verified?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          parent_id: string | null
          image_url: string | null
          is_active: boolean
          display_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          parent_id?: string | null
          image_url?: string | null
          is_active?: boolean
          display_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          parent_id?: string | null
          image_url?: string | null
          is_active?: boolean
          display_order?: number
          created_at?: string
          updated_at?: string
        }
      }
      products: {
        Row: {
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
          weight_kg: number | null
          dimensions_cm: string | null
          tags: string[] | null
          images: string[] | null
          metadata: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          category_id?: string | null
          name: string
          slug: string
          description?: string | null
          short_description?: string | null
          sku?: string | null
          starting_bid: number
          current_bid?: number | null
          bid_increment?: number
          reserve_price?: number | null
          buy_it_now_price?: number | null
          currency?: Currency
          auction_start?: string
          auction_end: string
          status?: AuctionStatus
          winner_id?: string | null
          total_bids?: number
          is_featured?: boolean
          rating_average?: number
          total_reviews?: number
          weight_kg?: number | null
          dimensions_cm?: string | null
          tags?: string[] | null
          images?: string[] | null
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          category_id?: string | null
          name?: string
          slug?: string
          description?: string | null
          short_description?: string | null
          sku?: string | null
          starting_bid?: number
          current_bid?: number | null
          bid_increment?: number
          reserve_price?: number | null
          buy_it_now_price?: number | null
          currency?: Currency
          auction_start?: string
          auction_end?: string
          status?: AuctionStatus
          winner_id?: string | null
          total_bids?: number
          is_featured?: boolean
          rating_average?: number
          total_reviews?: number
          weight_kg?: number | null
          dimensions_cm?: string | null
          tags?: string[] | null
          images?: string[] | null
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      bids: {
        Row: {
          id: string
          product_id: string
          user_id: string
          amount: number
          status: BidStatus
          is_auto_bid: boolean
          max_auto_bid: number | null
          created_at: string
        }
        Insert: {
          id?: string
          product_id: string
          user_id: string
          amount: number
          status?: BidStatus
          is_auto_bid?: boolean
          max_auto_bid?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          user_id?: string
          amount?: number
          status?: BidStatus
          is_auto_bid?: boolean
          max_auto_bid?: number | null
          created_at?: string
        }
      }
      watchlist: {
        Row: {
          id: string
          user_id: string
          product_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          product_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          product_id?: string
          created_at?: string
        }
      }
      orders: {
        Row: {
          id: string
          order_number: string
          buyer_id: string
          product_id: string
          winning_bid_id: string
          final_price: number
          status: OrderStatus
          currency: Currency
          shipping_address: Json
          billing_address: Json | null
          notes: string | null
          created_at: string
          updated_at: string
          cancelled_at: string | null
          cancelled_reason: string | null
        }
        Insert: {
          id?: string
          order_number: string
          buyer_id: string
          product_id: string
          winning_bid_id: string
          final_price: number
          status?: OrderStatus
          currency?: Currency
          shipping_address: Json
          billing_address?: Json | null
          notes?: string | null
          created_at?: string
          updated_at?: string
          cancelled_at?: string | null
          cancelled_reason?: string | null
        }
        Update: {
          id?: string
          order_number?: string
          buyer_id?: string
          product_id?: string
          winning_bid_id?: string
          final_price?: number
          status?: OrderStatus
          currency?: Currency
          shipping_address?: Json
          billing_address?: Json | null
          notes?: string | null
          created_at?: string
          updated_at?: string
          cancelled_at?: string | null
          cancelled_reason?: string | null
        }
      }
      payments: {
        Row: {
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
          payment_data: Json | null
          processed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          order_id: string
          payment_method: PaymentMethod
          status?: PaymentStatus
          amount: number
          currency?: Currency
          transaction_id?: string | null
          mobile_money_number?: string | null
          mobile_money_provider?: string | null
          payment_reference?: string | null
          payment_data?: Json | null
          processed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          payment_method?: PaymentMethod
          status?: PaymentStatus
          amount?: number
          currency?: Currency
          transaction_id?: string | null
          mobile_money_number?: string | null
          mobile_money_provider?: string | null
          payment_reference?: string | null
          payment_data?: Json | null
          processed_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      deliveries: {
        Row: {
          id: string
          order_id: string
          delivery_method: DeliveryMethod
          status: DeliveryStatus
          tracking_number: string | null
          courier_name: string | null
          courier_contact: string | null
          estimated_delivery_date: string | null
          actual_delivery_date: string | null
          delivery_address: Json
          delivery_notes: string | null
          recipient_name: string | null
          recipient_phone: string | null
          delivery_failed_reason: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          order_id: string
          delivery_method: DeliveryMethod
          status?: DeliveryStatus
          tracking_number?: string | null
          courier_name?: string | null
          courier_contact?: string | null
          estimated_delivery_date?: string | null
          actual_delivery_date?: string | null
          delivery_address: Json
          delivery_notes?: string | null
          recipient_name?: string | null
          recipient_phone?: string | null
          delivery_failed_reason?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          delivery_method?: DeliveryMethod
          status?: DeliveryStatus
          tracking_number?: string | null
          courier_name?: string | null
          courier_contact?: string | null
          estimated_delivery_date?: string | null
          actual_delivery_date?: string | null
          delivery_address?: Json
          delivery_notes?: string | null
          recipient_name?: string | null
          recipient_phone?: string | null
          delivery_failed_reason?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      reviews: {
        Row: {
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
        }
        Insert: {
          id?: string
          order_id?: string | null
          product_id: string
          buyer_id: string
          rating: number
          title?: string | null
          comment?: string | null
          is_verified_purchase?: boolean
          is_approved?: boolean
          helpful_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          order_id?: string | null
          product_id?: string
          buyer_id?: string
          rating?: number
          title?: string | null
          comment?: string | null
          is_verified_purchase?: boolean
          is_approved?: boolean
          helpful_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: string
          title: string
          message: string
          link: string | null
          is_read: boolean
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: string
          title: string
          message: string
          link?: string | null
          is_read?: boolean
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: string
          title?: string
          message?: string
          link?: string | null
          is_read?: boolean
          metadata?: Json | null
          created_at?: string
        }
      }
      admin_audit_logs: {
        Row: {
          id: string
          admin_id: string
          action: string
          entity_type: string
          entity_id: string | null
          changes: Json | null
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          admin_id: string
          action: string
          entity_type: string
          entity_id?: string | null
          changes?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          admin_id?: string
          action?: string
          entity_type?: string
          entity_id?: string | null
          changes?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
      }
      [key: string]: any
    }
    Views: {
      [key: string]: any
    }
    Functions: {
      [key: string]: any
    }
    Enums: {
      user_role: UserRole
      auction_status: AuctionStatus
      bid_status: BidStatus
      order_status: OrderStatus
      delivery_method: DeliveryMethod
      delivery_status: DeliveryStatus
      payment_method: PaymentMethod
      payment_status: PaymentStatus
      currency: Currency
    }
  }
}
