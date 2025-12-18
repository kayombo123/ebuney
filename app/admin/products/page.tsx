'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'

interface AdminProduct {
  id: string
  name: string
  sku: string | null
  price: number
  stock_quantity: number
  is_active: boolean
  currency: string
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<AdminProduct[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    void ensureAdminAndLoad()
  }, [])

  async function ensureAdminAndLoad() {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      router.push('/auth/login')
      return
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      router.push('/dashboard')
      return
    }

    await loadProducts()
  }

  async function loadProducts() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('products')
        .select('id, name, sku, price, stock_quantity, is_active, currency')
        .order('created_at', { ascending: false })

      if (error) throw error
      setProducts((data || []) as AdminProduct[])
    } catch (error) {
      console.error('Error loading products', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Manage Products</h1>
            <p className="text-sm text-gray-600">
              Upload and maintain the catalog for the Ebuney storefront.
            </p>
          </div>
          <Button onClick={() => router.push('/admin/products/new')}>Add new product</Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base md:text-lg">All products</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-8 text-center text-sm text-gray-500">Loading products…</div>
            ) : products.length === 0 ? (
              <div className="py-8 text-center text-sm text-gray-500">
                No products yet. Click “Add new product” to create one.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b text-xs uppercase text-gray-500">
                      <th className="py-2 pr-3 text-left">Name</th>
                      <th className="py-2 px-3 text-left hidden md:table-cell">SKU</th>
                      <th className="py-2 px-3 text-right">Price</th>
                      <th className="py-2 px-3 text-right hidden md:table-cell">Stock</th>
                      <th className="py-2 px-3 text-center">Status</th>
                      <th className="py-2 pl-3 text-right" />
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((p) => (
                      <tr key={p.id} className="border-b last:border-0">
                        <td className="py-2 pr-3">
                          <div className="font-medium text-gray-900 truncate max-w-[220px]">
                            {p.name}
                          </div>
                        </td>
                        <td className="py-2 px-3 hidden md:table-cell text-gray-600">
                          {p.sku || '—'}
                        </td>
                        <td className="py-2 px-3 text-right">
                          {formatCurrency(p.price, p.currency)}
                        </td>
                        <td className="py-2 px-3 text-right hidden md:table-cell text-gray-700">
                          {p.stock_quantity}
                        </td>
                        <td className="py-2 px-3 text-center">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${
                              p.is_active
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {p.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="py-2 pl-3 text-right">
                          <Link href={`/admin/products/${p.id}`}>
                            <Button variant="outline" size="sm" className="text-xs">
                              Edit
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}


