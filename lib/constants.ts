export const PLATFORM_NAME = 'Ebuney'
export const PLATFORM_TAGLINE = 'Your trusted marketplace in Zambia'

export const PAYMENT_METHODS = {
  mobile_money_mtn: { label: 'MTN Mobile Money', icon: '📱' },
  mobile_money_airtel: { label: 'Airtel Money', icon: '📱' },
  mobile_money_zamtel: { label: 'Zamtel Mobile Money', icon: '📱' },
  card: { label: 'Credit/Debit Card', icon: '💳' },
  cash_on_delivery: { label: 'Cash on Delivery', icon: '💰' },
} as const

export const DELIVERY_METHODS = {
  platform_courier: { label: 'Platform Courier', estimatedDays: 2 },
  third_party_courier: { label: 'Third-Party Courier', estimatedDays: 3 },
  seller_pickup: { label: 'Pickup from Seller', estimatedDays: 0 },
} as const

export const ORDER_STATUS_LABELS = {
  pending: { label: 'Pending', color: 'yellow' },
  confirmed: { label: 'Confirmed', color: 'blue' },
  processing: { label: 'Processing', color: 'purple' },
  shipped: { label: 'Shipped', color: 'indigo' },
  delivered: { label: 'Delivered', color: 'green' },
  cancelled: { label: 'Cancelled', color: 'red' },
  refunded: { label: 'Refunded', color: 'gray' },
} as const

export const DELIVERY_STATUS_LABELS = {
  pending: { label: 'Pending', color: 'yellow' },
  assigned: { label: 'Assigned', color: 'blue' },
  in_transit: { label: 'In Transit', color: 'indigo' },
  delivered: { label: 'Delivered', color: 'green' },
  failed: { label: 'Failed', color: 'red' },
  returned: { label: 'Returned', color: 'orange' },
} as const

export const DEFAULT_COMMISSION_RATE = 10.0
export const DEFAULT_CURRENCY = 'ZMW'
export const DEFAULT_SHIPPING_COST = 0 // Free shipping by default

export const ZAMBIAN_PROVINCES = [
  'Central',
  'Copperbelt',
  'Eastern',
  'Luapula',
  'Lusaka',
  'Muchinga',
  'Northern',
  'North-Western',
  'Southern',
  'Western',
] as const

