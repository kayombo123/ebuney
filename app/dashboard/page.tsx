'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { User } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Package, ShoppingCart, Heart, Settings } from 'lucide-react'

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    fetchUser()
  }, [])

  async function fetchUser() {
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) {
      router.push('/auth/login')
      return
    }

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', authUser.id)
        .single()

      if (error) throw error
      if (data) setUser(data as User)
    } catch (error) {
      console.error('Error fetching user:', error)
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

  if (!user) {
    return null
  }

  const dashboardCards = [
    {
      icon: Package,
      title: 'My Orders',
      description: 'View and track your orders',
      href: '/orders',
      color: 'text-blue-600',
    },
    {
      icon: ShoppingCart,
      title: 'Shopping Cart',
      description: 'Items you want to purchase',
      href: '/cart',
      color: 'text-green-600',
    },
    {
      icon: Heart,
      title: 'Favorites',
      description: 'Your saved items',
      href: '/favorites',
      color: 'text-red-600',
    },
    {
      icon: Settings,
      title: 'Account Settings',
      description: 'Manage your account',
      href: '/dashboard/settings',
      color: 'text-gray-600',
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-gray-600 mb-8">
          Welcome back, {user.full_name || user.email}!
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {dashboardCards.map((card) => (
            <Link key={card.href} href={card.href}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-lg bg-gray-100 ${card.color}`}>
                      <card.icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold mb-1">{card.title}</h3>
                      <p className="text-gray-600 text-sm">{card.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {user.role === 'seller' && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Seller Dashboard</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Manage your products, orders, and seller account.
              </p>
              <Link href="/seller">
                <Button>Go to Seller Dashboard</Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {user.role === 'admin' && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Admin Dashboard</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Manage the platform, moderate content, and view analytics.
              </p>
              <Link href="/admin">
                <Button>Go to Admin Dashboard</Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

