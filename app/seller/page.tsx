'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Product, Order } from '@/types'
import { formatCurrency } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Package, Plus, TrendingUp, DollarSign } from 'lucide-react'

export default function SellerDashboardPage() {
  const [seller, setSeller] = useState<{
    id: string
    business_name: string
    business_description: string | null
    is_verified: boolean
  } | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [recentOrders, setRecentOrders] = useState<Order[]>([])
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0,
  })
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    fetchSellerData()
  }, [])

  async function fetchSellerData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/auth/login')
      return
    }

    try {
      // Fetch seller profile
      const { data: sellerData } = await supabase
        .from('sellers')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (!sellerData) {
        router.push('/sell')
        return
      }

      setSeller(
        sellerData as {
          id: string
          business_name: string
          business_description: string | null
          is_verified: boolean
        },
      )

      // Fetch products
      const { data: productsData } = await supabase
        .from('products')
        .select('*')
        .eq('seller_id', (sellerData as { id: string }).id)
        .order('created_at', { ascending: false })
        .limit(10)

      if (productsData) setProducts(productsData as Product[])

      // Fetch recent orders
      const { data: ordersData } = await supabase
        .from('orders')
        .select('*')
        .eq('seller_id', (sellerData as { id: string }).id)
        .order('created_at', { ascending: false })
        .limit(10)

      if (ordersData) setRecentOrders(ordersData as Order[])

      // Fetch stats
      const { count: productsCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('seller_id', (sellerData as { id: string }).id)

      const { count: ordersCount } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('seller_id', (sellerData as { id: string }).id)

      const { count: pendingCount } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('seller_id', (sellerData as { id: string }).id)
        .in('status', ['pending', 'confirmed', 'processing'])

      const { data: revenueData } = await supabase
        .from('orders')
        .select('final_price')
        .eq('seller_id', (sellerData as { id: string }).id)
        .eq('status', 'delivered')

      const totalRevenue =
        revenueData?.reduce(
          (sum: number, order: { final_price: number }) => sum + order.final_price,
          0,
        ) || 0

      setStats({
        totalProducts: productsCount || 0,
        totalOrders: ordersCount || 0,
        totalRevenue,
        pendingOrders: pendingCount || 0,
      })
    } catch (error) {
      console.error('Error fetching seller data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="text-center py-12">Loading...</div>
        </div>
      </div>
    )
  }

  if (!seller) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Seller Dashboard</h1>
          <p className="text-gray-600">{seller.business_name}</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Products</p>
                  <p className="text-2xl font-bold">{stats.totalProducts}</p>
                </div>
                <Package className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Orders</p>
                  <p className="text-2xl font-bold">{stats.totalOrders}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
                  <p className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</p>
                </div>
                <DollarSign className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Pending Orders</p>
                  <p className="text-2xl font-bold">{stats.pendingOrders}</p>
                </div>
                <Package className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <Link href="/seller/products/new">
            <Button size="lg">
              <Plus className="h-5 w-5 mr-2" />
              Add New Product
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Products */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Recent Products</CardTitle>
                <Link href="/seller/products">
                  <Button variant="ghost" size="sm">View All</Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {products.length === 0 ? (
                <p className="text-gray-600 text-center py-4">No products yet</p>
              ) : (
                <div className="space-y-4">
                  {products.map((product) => (
                    <div
                      key={product.id}
                      className="flex items-center justify-between pb-4 border-b border-gray-200 last:border-0"
                    >
                      <div>
                        <h3 className="font-medium">{product.name}</h3>
                        <p className="text-sm text-gray-600">
                          {formatCurrency(
                            (product as any).price ||
                              (product as any).buy_it_now_price ||
                              product.starting_bid,
                            product.currency,
                          )}{' '}
                          • Stock
                        </p>
                      </div>
                      <Badge variant={'success'}>
                        Active
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Orders */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Recent Orders</CardTitle>
                <Link href="/seller/orders">
                  <Button variant="ghost" size="sm">View All</Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {recentOrders.length === 0 ? (
                <p className="text-gray-600 text-center py-4">No orders yet</p>
              ) : (
                <div className="space-y-4">
                  {recentOrders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between pb-4 border-b border-gray-200 last:border-0">
                      <div>
                        <h3 className="font-medium">Order #{order.order_number}</h3>
                        <p className="text-sm text-gray-600">
                          {formatCurrency(order.final_price, order.currency)}
                        </p>
                      </div>
                      <Badge>{order.status}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

