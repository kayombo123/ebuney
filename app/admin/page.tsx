'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { User, Seller, Product, Order } from '@/types'
import { formatCurrency } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Users, Store, Package, DollarSign, CheckCircle, XCircle } from 'lucide-react'

export default function AdminDashboardPage() {
  const [user, setUser] = useState<User | null>(null)
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalSellers: 0,
    pendingSellers: 0,
    totalProducts: 0,
    pendingProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
  })
  const [pendingSellers, setPendingSellers] = useState<Seller[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    checkAdminAccess()
    fetchStats()
  }, [])

  async function checkAdminAccess() {
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) {
      router.push('/auth/login')
      return
    }

    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', authUser.id)
      .single()

    if (error || !profile) {
      router.push('/dashboard')
      return
    }

    const userProfile = profile as User
    if (userProfile.role === 'admin') {
      setUser(userProfile)
    } else {
      router.push('/dashboard')
    }
  }

  async function fetchStats() {
    try {
      const { count: usersCount } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true })

      const { count: sellersCount } = await supabase
        .from('sellers')
        .select('*', { count: 'exact', head: true })

      const { count: pendingSellersCount } = await supabase
        .from('sellers')
        .select('*', { count: 'exact', head: true })
        .eq('is_verified', false)

      const { count: productsCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })

      const { count: pendingProductsCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', false)

      const { count: ordersCount } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })

      const { data: revenueData } = await supabase
        .from('orders')
        .select('total_amount')
        .eq('status', 'delivered')

      const totalRevenue = revenueData
        ? revenueData.reduce((sum: number, order: { total_amount: number }) => sum + order.total_amount, 0)
        : 0

      // Fetch pending sellers
      const { data: pendingSellersData } = await supabase
        .from('sellers')
        .select('*')
        .eq('is_verified', false)
        .limit(5)

      setStats({
        totalUsers: usersCount || 0,
        totalSellers: sellersCount || 0,
        pendingSellers: pendingSellersCount || 0,
        totalProducts: productsCount || 0,
        pendingProducts: pendingProductsCount || 0,
        totalOrders: ordersCount || 0,
        totalRevenue,
      })

      if (pendingSellersData) {
        setPendingSellers(pendingSellersData as Seller[])
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  async function verifySeller(sellerId: string, verify: boolean) {
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) return

    try {
      const { error } = await supabase
        .from('sellers')
        // @ts-expect-error - Supabase type inference limitation with update operations
        .update({
          is_verified: verify,
          verified_at: verify ? new Date().toISOString() : null,
          verified_by: verify ? authUser.id : null,
        })
        .eq('id', sellerId)

      if (error) throw error
      await fetchStats()
    } catch (error) {
      console.error('Error verifying seller:', error)
      alert('Failed to update seller verification status')
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

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Platform management and analytics</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Users</p>
                  <p className="text-2xl font-bold">{stats.totalUsers}</p>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Sellers</p>
                  <p className="text-2xl font-bold">{stats.totalSellers}</p>
                  {stats.pendingSellers > 0 && (
                    <p className="text-sm text-orange-600">{stats.pendingSellers} pending</p>
                  )}
                </div>
                <Store className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Products</p>
                  <p className="text-2xl font-bold">{stats.totalProducts}</p>
                </div>
                <Package className="h-8 w-8 text-purple-600" />
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
        </div>

        {/* Pending Seller Verifications */}
        {pendingSellers.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Pending Seller Verifications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pendingSellers.map((seller) => (
                  <div key={seller.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <h3 className="font-medium">{seller.business_name}</h3>
                      <p className="text-sm text-gray-600">{seller.business_description}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Registered: {new Date(seller.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => verifySeller(seller.id, true)}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Verify
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => verifySeller(seller.id, false)}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              <Link href="/admin/sellers">
                <Button variant="outline" className="mt-4">
                  View All Sellers
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link href="/admin/sellers">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <Store className="h-8 w-8 text-green-600 mb-2" />
                <h3 className="font-semibold text-lg mb-1">Manage Sellers</h3>
                <p className="text-sm text-gray-600">Verify and manage seller accounts</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/products">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <Package className="h-8 w-8 text-purple-600 mb-2" />
                <h3 className="font-semibold text-lg mb-1">Manage Products</h3>
                <p className="text-sm text-gray-600">Moderate and manage product listings</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/orders">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <Package className="h-8 w-8 text-blue-600 mb-2" />
                <h3 className="font-semibold text-lg mb-1">View Orders</h3>
                <p className="text-sm text-gray-600">Monitor all platform orders</p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  )
}

