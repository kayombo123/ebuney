'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Order, OrderItem, Payment, Delivery } from '@/types'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ORDER_STATUS_LABELS, DELIVERY_STATUS_LABELS, PAYMENT_METHODS } from '@/lib/constants'
import { ArrowLeft, Package, CreditCard, Truck } from 'lucide-react'

export default function OrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [order, setOrder] = useState<Order | null>(null)
  const [orderItems, setOrderItems] = useState<OrderItem[]>([])
  const [payment, setPayment] = useState<Payment | null>(null)
  const [delivery, setDelivery] = useState<Delivery | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    if (params.id) {
      fetchOrderDetails()
    }
  }, [params.id])

  async function fetchOrderDetails() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/auth/login')
      return
    }

    try {
      // Fetch order
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select(`
          *,
          seller:sellers(*)
        `)
        .eq('id', params.id)
        .eq('buyer_id', user.id)
        .single()

      if (orderError) throw orderError
      if (orderData) {
        setOrder(orderData as Order)

        // Fetch order items
        const { data: itemsData } = await supabase
          .from('order_items')
          .select(`
            *,
            product:products(*)
          `)
          .eq('order_id', params.id)

        if (itemsData) setOrderItems(itemsData as OrderItem[])

        // Fetch payment
        const { data: paymentData } = await supabase
          .from('payments')
          .select('*')
          .eq('order_id', params.id)
          .single()

        if (paymentData) setPayment(paymentData as Payment)

        // Fetch delivery
        const { data: deliveryData } = await supabase
          .from('deliveries')
          .select('*')
          .eq('order_id', params.id)
          .single()

        if (deliveryData) setDelivery(deliveryData as Delivery)
      }
    } catch (error) {
      console.error('Error fetching order details:', error)
    } finally {
      setLoading(false)
    }
  }

  function getStatusBadge(status: string, type: 'order' | 'delivery' | 'payment') {
    if (type === 'order') {
      const statusConfig = ORDER_STATUS_LABELS[status as keyof typeof ORDER_STATUS_LABELS] || ORDER_STATUS_LABELS.pending
      return <Badge variant={statusConfig.color as any}>{statusConfig.label}</Badge>
    } else if (type === 'delivery') {
      const statusConfig = DELIVERY_STATUS_LABELS[status as keyof typeof DELIVERY_STATUS_LABELS] || DELIVERY_STATUS_LABELS.pending
      return <Badge variant={statusConfig.color as any}>{statusConfig.label}</Badge>
    } else {
      return <Badge>{status}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="text-center py-12">Loading order...</div>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="text-center py-12">
            <p className="text-xl mb-4">Order not found</p>
            <Link href="/orders">
              <Button>Back to Orders</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <Link href="/orders">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Orders
          </Button>
        </Link>

        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-bold">Order #{order.order_number}</h1>
            {getStatusBadge(order.status, 'order')}
          </div>
          <p className="text-gray-600">
            Placed on {formatDateTime(order.created_at)}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Order Items */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Order Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {orderItems.map((item) => {
                    const product = item.product
                    const imageUrl = product?.images && product.images.length > 0
                      ? product.images[0]
                      : '/placeholder-product.jpg'

                    return (
                      <div key={item.id} className="flex gap-4 pb-4 border-b border-gray-200 last:border-0">
                        <div className="relative w-20 h-20 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                          <Image
                            src={imageUrl}
                            alt={item.product_name}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium mb-1">{item.product_name}</h3>
                          {item.variant_name && (
                            <p className="text-sm text-gray-600 mb-1">{item.variant_name}</p>
                          )}
                          <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">
                            {formatCurrency(item.subtotal)}
                          </p>
                          <p className="text-sm text-gray-600">
                            {formatCurrency(item.price)} each
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Shipping Address */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Shipping Address
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1 text-gray-700">
                  <p className="font-medium">{order.shipping_address.full_name}</p>
                  <p>{order.shipping_address.address_line1}</p>
                  {order.shipping_address.address_line2 && (
                    <p>{order.shipping_address.address_line2}</p>
                  )}
                  <p>
                    {order.shipping_address.city}, {order.shipping_address.province}
                  </p>
                  {order.shipping_address.postal_code && (
                    <p>{order.shipping_address.postal_code}</p>
                  )}
                  <p>{order.shipping_address.country}</p>
                  <p className="mt-2">Phone: {order.shipping_address.phone}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary & Info */}
          <div className="space-y-6">
            {/* Order Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>{formatCurrency(order.subtotal, order.currency)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span>
                    {order.shipping_cost === 0
                      ? 'Free'
                      : formatCurrency(order.shipping_cost, order.currency)}
                  </span>
                </div>
                {order.tax_amount > 0 && (
                  <div className="flex justify-between text-gray-600">
                    <span>Tax</span>
                    <span>{formatCurrency(order.tax_amount, order.currency)}</span>
                  </div>
                )}
                {order.discount_amount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-{formatCurrency(order.discount_amount, order.currency)}</span>
                  </div>
                )}
                <div className="border-t border-gray-200 pt-3 flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>{formatCurrency(order.total_amount, order.currency)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Payment Info */}
            {payment && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Payment
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Method</span>
                    <span className="font-medium">
                      {PAYMENT_METHODS[payment.payment_method]?.label || payment.payment_method}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status</span>
                    {getStatusBadge(payment.status, 'payment')}
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Amount</span>
                    <span className="font-medium">
                      {formatCurrency(payment.amount, payment.currency)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Delivery Info */}
            {delivery && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="h-5 w-5" />
                    Delivery
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status</span>
                    {getStatusBadge(delivery.status, 'delivery')}
                  </div>
                  {delivery.tracking_number && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tracking</span>
                      <span className="font-medium">{delivery.tracking_number}</span>
                    </div>
                  )}
                  {delivery.estimated_delivery_date && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Est. Delivery</span>
                      <span>{formatDateTime(delivery.estimated_delivery_date)}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

