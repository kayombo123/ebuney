'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useSearchParams } from 'next/navigation'
import { Product, Category } from '@/types'
import { ProductCard } from '@/components/product/product-card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, X } from 'lucide-react'

export default function ProductsPage() {
  const searchParams = useSearchParams()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '')
  const [categorySlug, setCategorySlug] = useState(searchParams.get('category') || '')
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'newest')
  const [categories, setCategories] = useState<Category[]>([])
  const [categoryIdFilter, setCategoryIdFilter] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    void loadCategories()
  }, [])

  useEffect(() => {
    if (!categorySlug) {
      setCategoryIdFilter(null)
      return
    }
    const match = categories.find((c) => c.slug === categorySlug)
    setCategoryIdFilter(match ? match.id : null)
  }, [categories, categorySlug])

  useEffect(() => {
    void fetchProducts()
  }, [searchQuery, categoryIdFilter, sortBy])

  async function loadCategories() {
    try {
      const { data } = await supabase
        .from('categories')
        .select('id, name, slug')
        .eq('is_active', true)
        .order('display_order', { ascending: true })

      if (data) {
        setCategories(data as Category[])
      }
    } catch (error) {
      console.error('Error loading categories:', error)
    }
  }

  async function fetchProducts() {
    setLoading(true)
    try {
      let query = supabase
        .from('products')
        .select(
          `
          *,
          seller:sellers(*),
          category:categories(*)
        `,
        )
        .eq('is_active', true)

      if (searchQuery) {
        query = query.ilike('name', `%${searchQuery}%`)
      }

      if (categoryIdFilter) {
        query = query.eq('category_id', categoryIdFilter)
      }

      if (sortBy === 'newest') {
        query = query.order('created_at', { ascending: false })
      } else if (sortBy === 'price-low') {
        query = query.order('price', { ascending: true })
      } else if (sortBy === 'price-high') {
        query = query.order('price', { ascending: false })
      } else if (sortBy === 'rating') {
        query = query.order('rating_average', { ascending: false })
      } else {
        query = query.order('created_at', { ascending: false })
      }

      const { data, error } = await query.limit(50)

      if (error) throw error
      if (data) setProducts(data as Product[])
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleAddToCart(productId: string) {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      window.location.href = '/auth/login'
      return
    }

    let { data: cart } = await supabase
      .from('carts')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!cart) {
      const { data: newCart } = await supabase
        .from('carts')
        .insert({ user_id: user.id })
        .select()
        .single()
      cart = newCart
    }

    if (cart) {
      const { error } = await supabase
        .from('cart_items')
        .upsert({
          cart_id: cart.id,
          product_id: productId,
          quantity: 1,
        })

      if (!error) {
        alert('Item added to cart!')
      }
    }
  }

  const activeCategory = categories.find((c) => c.id === categoryIdFilter)

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">All Products</h1>
          <p className="text-sm text-gray-600 mb-4">
            Browse electronics and fashion, or filter by category and price.
          </p>

          {/* Search and Filters – eBay-style pill bar */}
          <div className="space-y-2">
            <div className="flex flex-col md:flex-row gap-3 md:items-center">
              <div className="flex-1 flex items-stretch rounded-full border border-gray-300 bg-white shadow-sm overflow-hidden">
                <div className="flex items-center px-3">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <Input
                  placeholder="Search phones, laptops, sneakers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="border-0 shadow-none rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 text-sm flex-1"
                />
                <div className="hidden sm:flex items-center px-3 border-l border-gray-200 text-xs md:text-sm text-gray-600 bg-gray-50">
                  <select
                    value={categorySlug}
                    onChange={(e) => setCategorySlug(e.target.value)}
                    className="bg-transparent outline-none text-xs md:text-sm"
                  >
                    <option value="">All categories</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.slug}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <Button
                className="rounded-full bg-blue-600 hover:bg-blue-700 px-6 text-sm font-semibold"
                onClick={() => {
                  // Force refresh with current filters (in addition to effect)
                  void fetchProducts()
                }}
              >
                Search
              </Button>
            </div>

            {/* Sort dropdown */}
            <div className="flex justify-end">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
              >
                <option value="newest">Sort: Newest</option>
                <option value="price-low">Sort: Price Low → High</option>
                <option value="price-high">Sort: Price High → Low</option>
                <option value="rating">Sort: Top rated</option>
              </select>
            </div>
          </div>

        {/* Active Filters */}
        {(searchQuery || activeCategory) && (
          <div className="mt-2 flex flex-wrap gap-2">
            {searchQuery && (
              <div className="flex items-center gap-2 bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs md:text-sm">
                <span>Search: {searchQuery}</span>
                <button onClick={() => setSearchQuery('')}>
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
            {activeCategory && (
              <div className="flex items-center gap-2 bg-sky-100 text-sky-800 px-3 py-1 rounded-full text-xs md:text-sm">
                <span>Category: {activeCategory.name}</span>
                <button onClick={() => setCategorySlug('')}>
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
          </div>
        )}

        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading products...</div>
        ) : products.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">No products found for your filters.</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => {
                setSearchQuery('')
                setCategorySlug('')
              }}
            >
              Clear filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={handleAddToCart}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

