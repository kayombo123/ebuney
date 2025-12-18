'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { CartItem, Product, ShippingAddress, PaymentMethod } from '@/types'
import { formatCurrency, generateOrderNumber } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PAYMENT_METHODS, ZAMBIAN_PROVINCES } from '@/lib/constants'
import { ShoppingBag } from 'lucide-react'

export default function CheckoutPage() {
  const [cartItems, setCartItems] = useState<(CartItem & { product?: Product })[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    full_name: '',
    phone: '',
    address_line1: '',
    address_line2: '',
    city: '',
    province: '',
    postal_code: '',
    country: 'Zambia',
    delivery_notes: '',
  })
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash_on_delivery')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    fetchCart()
    loadUserAddress()
  }, [])

  async function fetchCart() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/auth/login')
      return
    }

    try {
      const { data: cart } = await supabase
        .from('carts')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (cart) {
        const { data: items } = await supabase
          .from('cart_items')
          .select(`
            *,
            product:products(*)
          `)
          .eq('cart_id', cart.id)

        if (items && items.length > 0) {
          setCartItems(items as (CartItem & { product?: Product })[])
        } else {
          router.push('/cart')
        }
      }
    } catch (error) {
      console.error('Error fetching cart:', error)
    } finally {
      setLoading(false)
    }
  }

  async function loadUserAddress() {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('full_name, phone')
        .eq('id', user.id)
        .single()

      if (profile) {
        setShippingAddress(prev => ({
          ...prev,
          full_name: profile.full_name || '',
          phone: profile.phone || '',
        }))
      }
    }
  }

  async function handlePlaceOrder() {
    if (!validateForm()) return

    setProcessing(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Group cart items by seller
      const itemsBySeller = new Map<string, typeof cartItems>()
      for (const item of cartItems) {
        if (!item.product?.seller_id) continue
        const sellerId = item.product.seller_id
        if (!itemsBySeller.has(sellerId)) {
          itemsBySeller.set(sellerId, [])
        }
        itemsBySeller.get(sellerId)!.push(item)
      }

      // Create orders for each seller
      const orderPromises = Array.from(itemsBySeller.entries()).map(async ([sellerId, items]) => {
        const subtotal = items.reduce((sum, item) => {
          return sum + (item.product?.price || 0) * item.quantity
        }, 0)

        const orderNumber = generateOrderNumber()
        const shippingCost = 0 // Free shipping for now
        const taxAmount = 0
        const discountAmount = 0
        const totalAmount = subtotal + shippingCost + taxAmount - discountAmount

        // Create order
        const { data: order, error: orderError } = await supabase
          .from('orders')
          .insert({
            order_number: orderNumber,
            buyer_id: user.id,
            seller_id: sellerId,
            status: 'pending',
            subtotal,
            tax_amount: taxAmount,
            shipping_cost: shippingCost,
            discount_amount: discountAmount,
            total_amount: totalAmount,
            currency: 'ZMW',
            shipping_address: shippingAddress as any,
            billing_address: shippingAddress as any,
          })
          .select()
          .single()

        if (orderError) throw orderError

        // Create order items
        const orderItems = items.map(item => ({
          order_id: order.id,
          product_id: item.product_id,
          variant_id: item.variant_id,
          product_name: item.product?.name || '',
          product_sku: item.product?.sku || null,
          variant_name: null,
          price: item.product?.price || 0,
          quantity: item.quantity,
          subtotal: (item.product?.price || 0) * item.quantity,
        }))

        const { error: itemsError } = await supabase
          .from('order_items')
          .insert(orderItems)

        if (itemsError) throw itemsError

        // Create payment record
        const { error: paymentError } = await supabase
          .from('payments')
          .insert({
            order_id: order.id,
            payment_method: paymentMethod,
            status: paymentMethod === 'cash_on_delivery' ? 'pending' : 'pending',
            amount: totalAmount,
            currency: 'ZMW',
          })

        if (paymentError) throw paymentError

        // Create delivery record
        const { error: deliveryError } = await supabase
          .from('deliveries')
          .insert({
            order_id: order.id,
            delivery_method: 'platform_courier',
            status: 'pending',
            delivery_address: shippingAddress as any,
            recipient_name: shippingAddress.full_name,
            recipient_phone: shippingAddress.phone,
            delivery_notes: shippingAddress.delivery_notes,
          })

        if (deliveryError) throw deliveryError

        return order
      })

      const orders = await Promise.all(orderPromises)

      // Clear cart
      const { data: cart } = await supabase
        .from('carts')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (cart) {
        await supabase
          .from('cart_items')
          .delete()
          .eq('cart_id', cart.id)
      }

      router.push(`/orders/success?order=${orders[0]?.order_number}`)
    } catch (error: any) {
      console.error('Error placing order:', error)
      alert(error.message || 'Failed to place order')
    } finally {
      setProcessing(false)
    }
  }

  function validateForm(): boolean {
    if (!shippingAddress.full_name.trim()) {
      alert('Please enter your full name')
      return false
    }
    if (!shippingAddress.phone.trim()) {
      alert('Please enter your phone number')
      return false
    }
    if (!shippingAddress.address_line1.trim()) {
      alert('Please enter your address')
      return false
    }
    if (!shippingAddress.city.trim()) {
      alert('Please enter your city')
      return false
    }
    if (!shippingAddress.province) {
      alert('Please select your province')
      return false
    }
    return true
  }

  const subtotal = cartItems.reduce((sum, item) => {
    return sum + (item.product?.price || 0) * item.quantity
  }, 0)

  const shipping = 0
  const total = subtotal + shipping

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="text-center py-12">Loading...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <h1 className="text-3xl font-bold mb-8">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Shipping Address */}
            <Card>
              <CardHeader>
                <CardTitle>Shipping Address</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  label="Full Name"
                  value={shippingAddress.full_name}
                  onChange={(e) => setShippingAddress({ ...shippingAddress, full_name: e.target.value })}
                  required
                />
                <Input
                  label="Phone Number"
                  value={shippingAddress.phone}
                  onChange={(e) => setShippingAddress({ ...shippingAddress, phone: e.target.value })}
                  required
                  placeholder="+260 9XX XXX XXX"
                />
                <Input
                  label="Address Line 1"
                  value={shippingAddress.address_line1}
                  onChange={(e) => setShippingAddress({ ...shippingAddress, address_line1: e.target.value })}
                  required
                />
                <Input
                  label="Address Line 2 (Optional)"
                  value={shippingAddress.address_line2}
                  onChange={(e) => setShippingAddress({ ...shippingAddress, address_line2: e.target.value })}
                />
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="City"
                    value={shippingAddress.city}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })}
                    required
                  />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Province
                    </label>
                    <select
                      value={shippingAddress.province}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, province: e.target.value })}
                      className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
                      required
                    >
                      <option value="">Select Province</option>
                      {ZAMBIAN_PROVINCES.map((province) => (
                        <option key={province} value={province}>
                          {province}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <Input
                  label="Postal Code (Optional)"
                  value={shippingAddress.postal_code}
                  onChange={(e) => setShippingAddress({ ...shippingAddress, postal_code: e.target.value })}
                />
                <Input
                  label="Delivery Notes (Optional)"
                  value={shippingAddress.delivery_notes}
                  onChange={(e) => setShippingAddress({ ...shippingAddress, delivery_notes: e.target.value })}
                  placeholder="Any special instructions for delivery"
                />
              </CardContent>
            </Card>

            {/* Payment Method */}
            <Card>
              <CardHeader>
                <CardTitle>Payment Method</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {Object.entries(PAYMENT_METHODS).map(([key, method]) => (
                  <label
                    key={key}
                    className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                      paymentMethod === key
                        ? 'border-green-600 bg-green-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={key}
                      checked={paymentMethod === key}
                      onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                      className="mr-3"
                    />
                    <span className="text-2xl mr-3">{method.icon}</span>
                    <span className="font-medium">{method.label}</span>
                  </label>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 mb-6">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-gray-600">
                        {item.product?.name} × {item.quantity}
                      </span>
                      <span className="font-medium">
                        {formatCurrency((item.product?.price || 0) * item.quantity)}
                      </span>
                    </div>
                  ))}
                  <div className="border-t border-gray-200 pt-3 space-y-2">
                    <div className="flex justify-between text-gray-600">
                      <span>Subtotal</span>
                      <span>{formatCurrency(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>Shipping</span>
                      <span>{shipping === 0 ? 'Free' : formatCurrency(shipping)}</span>
                    </div>
                    <div className="border-t border-gray-200 pt-3 flex justify-between text-lg font-bold">
                      <span>Total</span>
                      <span>{formatCurrency(total)}</span>
                    </div>
                  </div>
                </div>

                <Button
                  className="w-full"
                  size="lg"
                  onClick={handlePlaceOrder}
                  isLoading={processing}
                >
                  Place Order
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

