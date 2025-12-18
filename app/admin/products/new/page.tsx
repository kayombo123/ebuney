'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { slugify } from '@/lib/utils'
import { uploadProductImage } from '@/lib/supabase/storage'

export default function AdminNewProductPage() {
  const router = useRouter()
  const supabase = createClient()

  const [name, setName] = useState('')
  const [sku, setSku] = useState('')
  const [price, setPrice] = useState('')
  const [compareAt, setCompareAt] = useState('')
  const [currency, setCurrency] = useState('ZMW')
  const [stock, setStock] = useState('0')
  const [categoryId, setCategoryId] = useState<string | null>(null)
  const [imageUrls, setImageUrls] = useState<string[]>(['', '', '', '', '', ''])
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([])

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

    const { data: cats, error } = await supabase
      .from('categories')
      .select('id, name')
      .order('display_order', { ascending: true })
      .order('name', { ascending: true })

    if (error) {
      console.error('Failed to load categories', error)
    }

    setCategories((cats || []) as { id: string; name: string }[])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
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
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      // Find owner seller profile (assumes admin user is the seller)
      const { data: seller } = await supabase
        .from('sellers')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!seller) {
        setError('No seller profile found for admin user. Create one in the database.')
        setSaving(false)
        return
      }

      const numericPrice = parseFloat(price)
      const numericCompareAt = compareAt ? parseFloat(compareAt) : null
      const numericStock = parseInt(stock || '0', 10)

      const slug = slugify(name)

      const { error: insertError } = await supabase.from('products').insert({
        seller_id: seller.id,
        category_id: categoryId,
        name,
        slug,
        description: null,
        short_description: null,
        sku: sku || null,
        price: numericPrice,
        compare_at_price: numericCompareAt,
        cost_price: null,
        currency,
        stock_quantity: numericStock,
        track_inventory: true,
        is_active: true,
        is_featured: false,
        images: cleanedImages.slice(0, 6),
      })

      if (insertError) {
        console.error(insertError)
        setError('Failed to save product.')
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
            <CardTitle>Add new product</CardTitle>
          </CardHeader>
          <CardContent>
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
                  Upload 6 clear product photos. We&rsquo;ll host them in Supabase Storage and use
                  them for the product gallery.
                </p>
                <div className="space-y-3">
                  {imageUrls.map((url, index) => (
                    <div key={index} className="space-y-1 border border-dashed border-gray-300 rounded-md p-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-gray-700">
                          Image {index + 1}
                        </span>
                        {url && (
                          <span className="text-[11px] text-emerald-600 font-medium">
                            Uploaded
                          </span>
                        )}
                      </div>
                      {url && (
                        <div className="mb-2">
                          <img
                            src={url}
                            alt={`Preview ${index + 1}`}
                            className="h-20 w-20 rounded-md object-cover border border-gray-200"
                          />
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0]
                          if (!file) return
                          try {
                            setUploadingIndex(index)
                            const uploadedUrl = await uploadProductImage(file)
                            const next = [...imageUrls]
                            next[index] = uploadedUrl
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
                        <p className="text-[11px] text-gray-500 mt-1">Uploading…</p>
                      )}
                    </div>
                  ))}
                </div>
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
                  Save product
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}


