'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Order } from '@/types'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ORDER_STATUS_LABELS } from '@/lib/constants'
import { Package, Eye } from 'lucide-react'

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    fetchOrders()
  }, [])

  async function fetchOrders() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/auth/login')
      return
    }

    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          seller:sellers(id, business_name),
          items:order_items(*)
        `)
        .eq('buyer_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      if (data) setOrders(data as Order[])
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setLoading(false)
    }
  }

  function getStatusBadge(status: string) {
    const statusConfig = ORDER_STATUS_LABELS[status as keyof typeof ORDER_STATUS_LABELS] || ORDER_STATUS_LABELS.pending
    return (
      <Badge variant={statusConfig.color as any}>
        {statusConfig.label}
      </Badge>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="text-center py-12">Loading orders...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <h1 className="text-3xl font-bold mb-8">My Orders</h1>

        {orders.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">No orders yet</h2>
              <p className="text-gray-600 mb-6">Start shopping to see your orders here</p>
              <Link href="/products">
                <Button>Browse Products</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Card key={order.id}>
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-2">
                        <h3 className="text-lg font-semibold">
                          Order #{order.order_number}
                        </h3>
                        {getStatusBadge(order.status)}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        Placed on {formatDate(order.created_at)}
                      </p>
                      <p className="text-lg font-bold">
                        Total: {formatCurrency(order.final_price, order.currency)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Link href={`/orders/${order.id}`}>
                        <Button variant="outline">
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

