'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, slugify } from '@/lib/utils'
import { uploadProductImage } from '@/lib/supabase/storage'
import { User } from '@/types'

// Cloudflare Pages requires edge runtime for dynamic routes
export const runtime = 'edge'

interface AdminProductDetail {
  id: string
  name: string
  sku: string | null
  price: number
  compare_at_price: number | null
  currency: string
  stock_quantity: number
  is_active: boolean
  images: string[] | null
  category_id: string | null
}

export default function AdminEditProductPage() {
  const router = useRouter()
  const params = useParams()
  const supabase = createClient()

  const [product, setProduct] = useState<AdminProductDetail | null>(null)
  const [name, setName] = useState('')
  const [sku, setSku] = useState('')
  const [price, setPrice] = useState('')
  const [compareAt, setCompareAt] = useState('')
  const [currency, setCurrency] = useState('ZMW')
  const [stock, setStock] = useState('0')
  const [categoryId, setCategoryId] = useState<string | null>(null)
  const [imageUrls, setImageUrls] = useState<string[]>(['', '', '', '', '', ''])
  const [isActive, setIsActive] = useState(true)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([])
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null)

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

    const userProfile = profile as User | null
    if (!userProfile || userProfile.role !== 'admin') {
      router.push('/dashboard')
      return
    }

    const { data: cats, error } = await supabase
      .from('categories')
      .select('id, name')
      .order('display_order', { ascending: true })
      .order('name', { ascending: true })

    if (error) {
      console.error('Failed to load categories', error)
    }

    setCategories((cats || []) as { id: string; name: string }[])

    await loadProduct()
  }

  async function loadProduct() {
    try {
      setLoading(true)
      const id = params?.id as string
      const { data, error } = await supabase
        .from('products')
        .select(
          'id, name, sku, price, compare_at_price, currency, stock_quantity, is_active, images, category_id',
        )
        .eq('id', id)
        .single()

      if (error || !data) {
        setError('Product not found.')
        return
      }

      const p = data as AdminProductDetail
      setProduct(p)
      setName(p.name)
      setSku(p.sku || '')
      setPrice(String(p.price))
      setCompareAt(p.compare_at_price ? String(p.compare_at_price) : '')
      setCurrency(p.currency)
      setStock(String(p.stock_quantity))
      setCategoryId(p.category_id)
      const imgs = (p.images || []).slice(0, 6)
      while (imgs.length < 6) imgs.push('')
      setImageUrls(imgs)
      setIsActive(p.is_active)
    } catch (err) {
      console.error(err)
      setError('Error loading product.')
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!product) return

    setError(null)
    if (!name.trim() || !price) {
      setError('Name and price are required.')
      return
    }

    if (!categoryId) {
      setError('Please select a category for this product.')
      return
    }

    const cleanedImages = imageUrls.map((u) => u.trim()).filter((u) => u.length > 0)
    if (cleanedImages.length < 2) {
      setError('Please upload at least 2 images (you can upload up to 6).')
      return
    }

    setSaving(true)
    try {
      const numericPrice = parseFloat(price)
      const numericCompareAt = compareAt ? parseFloat(compareAt) : null
      const numericStock = parseInt(stock || '0', 10)

      const updatedSlug = slugify(name)

      const { error: updateError } = await supabase
        .from('products')
        // @ts-expect-error - Supabase type inference limitation with update operations
        .update({
          name,
          slug: updatedSlug,
          sku: sku || null,
          price: numericPrice,
          compare_at_price: numericCompareAt,
          stock_quantity: numericStock,
          currency,
          category_id: categoryId,
          is_active: isActive,
          images: cleanedImages.slice(0, 6),
        })
        .eq('id', product.id)

      if (updateError) {
        console.error(updateError)
        setError('Failed to update product.')
      } else {
        router.push('/admin/products')
      }
    } catch (err) {
      console.error(err)
      setError('Unexpected error while saving.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-xl">
        <Card>
          <CardHeader>
            <CardTitle>Edit product</CardTitle>
          </CardHeader>
          <CardContent>
            {loading && (
              <div className="py-8 text-center text-sm text-gray-500">Loading product…</div>
            )}
            {!loading && (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                    {error}
                  </div>
                )}

                <Input
                  label="Product name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />

                <Input
                  label="SKU (optional)"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  placeholder="Internal code"
                />

                <div className="flex gap-3">
                  <div className="flex-1">
                    <Input
                      label="Price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      required
                    />
                  </div>
                  <div className="flex-1">
                    <Input
                      label="Compare at price (optional)"
                      type="number"
                      min="0"
                      step="0.01"
                      value={compareAt}
                      onChange={(e) => setCompareAt(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex-1">
                    <Input
                      label="Stock quantity"
                      type="number"
                      min="0"
                      step="1"
                      value={stock}
                      onChange={(e) => setStock(e.target.value)}
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Currency
                    </label>
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
                    >
                      <option value="ZMW">ZMW</option>
                      <option value="USD">USD</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    value={categoryId || ''}
                    onChange={(e) => setCategoryId(e.target.value || null)}
                    className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
                    required
                  >
                    <option value="">Select a category…</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <p className="block text-sm font-medium text-gray-700 mb-1">
                    Product images (6 URLs)
                  </p>
                  <p className="text-[11px] text-gray-500 mb-2">
                    Upload up to 6 product images. We&rsquo;ll host them in Supabase Storage and use
                    them for the product gallery.
                  </p>
                  <div className="space-y-2">
                    {imageUrls.map((url, index) => (
                      <div key={index} className="space-y-1">
                        <Input
                          label={`Image ${index + 1} URL`}
                          value={url}
                          onChange={(e) => {
                            const next = [...imageUrls]
                            next[index] = e.target.value
                            setImageUrls(next)
                          }}
                          placeholder="https://…"
                        />
                        <div className="flex items-center justify-between gap-2">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={async (e) => {
                              const file = e.target.files?.[0]
                              if (!file) return
                              try {
                                setUploadingIndex(index)
                                const nextUrl = await uploadProductImage(file)
                                const next = [...imageUrls]
                                next[index] = nextUrl
                                setImageUrls(next)
                              } catch (err) {
                                console.error(err)
                                alert('Failed to upload image. Please try again.')
                              } finally {
                                setUploadingIndex(null)
                              }
                            }}
                            className="block w-full text-xs text-gray-600 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border file:border-gray-300 file:text-xs file:bg-white file:cursor-pointer"
                          />
                          {uploadingIndex === index && (
                            <span className="text-[11px] text-gray-500">Uploading…</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {product && (
                  <p className="text-xs text-gray-500">
                    Current price: {formatCurrency(product.price, product.currency)} • Stock:{' '}
                    {product.stock_quantity}
                  </p>
                )}

                <div className="flex items-center gap-2 pt-2">
                  <input
                    id="is_active"
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <label htmlFor="is_active" className="text-sm text-gray-700">
                    Product is active (visible in storefront)
                  </label>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push('/admin/products')}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" isLoading={saving}>
                    Save changes
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}


