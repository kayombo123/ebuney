'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import { Product, Review } from '@/types'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Star, ShoppingCart, Minus, Plus, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

// Cloudflare Pages requires edge runtime for dynamic routes
export const runtime = 'edge'

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [product, setProduct] = useState<Product | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [quantity, setQuantity] = useState(1)
  const [loading, setLoading] = useState(true)
  const [addingToCart, setAddingToCart] = useState(false)
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const supabase = createClient()

  useEffect(() => {
    if (params.slug) {
      fetchProduct()
    }
  }, [params.slug])

  useEffect(() => {
    if (product?.id) {
      fetchReviews(product.id)
    }
  }, [product?.id])

  async function fetchProduct() {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          seller:sellers(*),
          category:categories(*)
        `)
        .eq('slug', params.slug as string)
        .eq('is_active', true)
        .single()

      if (error) throw error
      if (data) setProduct(data as Product)
    } catch (error) {
      console.error('Error fetching product:', error)
    } finally {
      setLoading(false)
    }
  }

  async function fetchReviews(productId: string) {
    try {
      const { data } = await supabase
        .from('reviews')
        .select(`
          *,
          buyer:user_profiles(id, full_name, avatar_url)
        `)
        .eq('product_id', productId)
        .eq('is_approved', true)
        .order('created_at', { ascending: false })
        .limit(10)

      if (data) setReviews(data as Review[])
    } catch (error) {
      console.error('Error fetching reviews:', error)
    }
  }

  async function handleAddToCart() {
    if (!product) return

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/auth/login')
      return
    }

    setAddingToCart(true)
    try {
      let { data: cart } = await supabase
        .from('carts')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!cart) {
        const { data: newCart } = await supabase
          .from('carts')
          // @ts-expect-error - Supabase type inference limitation with insert operations
          .insert({ user_id: user.id })
          .select()
          .single()
        cart = newCart
      }

      if (cart) {
        const userCart = cart as { id: string }
        const { error } = await supabase
          .from('cart_items')
          // @ts-expect-error - Supabase type inference limitation with upsert operations
          .upsert({
            cart_id: userCart.id,
            product_id: product.id,
            quantity: quantity,
          })

        if (error) throw error
        alert('Item added to cart!')
        router.push('/cart')
      }
    } catch (error: any) {
      console.error('Error adding to cart:', error)
      alert(error.message || 'Failed to add to cart')
    } finally {
      setAddingToCart(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="text-center py-12">Loading product...</div>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="text-center py-12">
            <p className="text-xl mb-4">Product not found</p>
            <Link href="/products">
              <Button>Back to Products</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const mainImage =
    product.images && product.images.length > 0
      ? product.images[activeImageIndex] || product.images[0]
      : '/placeholder-product.jpg'

  const discountSource = product as any
  const discountPercentage =
    discountSource.compare_at_price && discountSource.price < discountSource.compare_at_price
      ? Math.round(
          ((discountSource.compare_at_price - discountSource.price) / discountSource.compare_at_price) * 100,
        )
      : null

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        <Link href="/products">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Products
          </Button>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Product Images */}
          <div className="bg-white rounded-lg overflow-hidden">
            {/* Main image with hover zoom & prev/next controls */}
            <div className="aspect-square relative group cursor-zoom-in overflow-hidden">
              <Image
                src={mainImage}
                alt={product.name}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-110"
                priority
              />

              {product.images && product.images.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      setActiveImageIndex((prev) =>
                        prev === 0 && product.images
                          ? product.images.length - 1
                          : prev - 1,
                      )
                    }
                    className="absolute left-3 top-1/2 -translate-y-1/2 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setActiveImageIndex((prev) =>
                        product.images && prev === product.images.length - 1
                          ? 0
                          : prev + 1,
                      )
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors"
                  >
                    {/* Re‑use Minus icon rotated as a simple chevron substitute */}
                    <ArrowLeft className="h-4 w-4 rotate-180" />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnails – scrollable & clickable */}
            {product.images && product.images.length > 1 && (
              <div className="flex gap-2 p-4 overflow-x-auto">
                {product.images.map((image, index) => (
                  <button
                    key={image + index.toString()}
                    type="button"
                    onClick={() => setActiveImageIndex(index)}
                    className={`relative w-20 h-20 flex-shrink-0 rounded-md overflow-hidden border transition-all ${
                      index === activeImageIndex
                        ? 'border-green-500 ring-2 ring-green-200'
                        : 'border-gray-200 hover:border-green-400'
                    }`}
                  >
                    <Image
                      src={image}
                      alt={`${product.name} ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <h1 className="text-3xl md:text-4xl font-bold">{product.name}</h1>

            {/* Rating */}
            {product.rating_average > 0 && (
              <div className="flex items-center gap-2">
                <div className="flex items-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-5 w-5 ${
                        star <= Math.round(product.rating_average)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-gray-600">
                  {product.rating_average.toFixed(1)} ({product.total_reviews} reviews)
                </span>
              </div>
            )}

          {/* Price */}
          <div className="flex items-baseline gap-4">
            <span className="text-4xl font-bold text-gray-900">
              {formatCurrency(
                discountSource.price || discountSource.buy_it_now_price || discountSource.starting_bid,
                product.currency,
              )}
            </span>
            {discountSource.compare_at_price &&
              discountSource.compare_at_price >
                (discountSource.price || discountSource.buy_it_now_price || discountSource.starting_bid) && (
                <>
                  <span className="text-2xl text-gray-500 line-through">
                    {formatCurrency(discountSource.compare_at_price, product.currency)}
                  </span>
                  {discountPercentage && <Badge variant="danger">-{discountPercentage}%</Badge>}
                </>
              )}
          </div>

            {/* Stock Status - use dynamic info if available on the product, otherwise fallback */}
            <p className="text-green-600 font-medium">In Stock</p>

            {/* Description */}
            {product.description && (
              <div>
                <h2 className="text-xl font-semibold mb-2">Description</h2>
                <p className="text-gray-700 whitespace-pre-line">{product.description}</p>
              </div>
            )}

            {/* Quantity Selector and Add to Cart */}
            {true && (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <label className="font-medium">Quantity:</label>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-12 text-center font-medium">{quantity}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setQuantity(quantity + 1)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleAddToCart}
                  isLoading={addingToCart}
                >
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  Add to Cart
                </Button>
              </div>
            )}

            {/* Additional Info */}
            <div className="border-t border-gray-200 pt-6 space-y-2 text-sm text-gray-600">
              <p><strong>SKU:</strong> {product.sku || 'N/A'}</p>
              {product.category && (
                <p>
                  <strong>Category:</strong>{' '}
                  <Link href={`/products?category=${product.category.id}`} className="text-green-600 hover:underline">
                    {product.category.name}
                  </Link>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        {reviews.length > 0 && (
          <Card>
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold mb-6">Reviews</h2>
              <div className="space-y-6">
                {reviews.map((review) => (
                  <div key={review.id} className="border-b border-gray-200 pb-6 last:border-0 last:pb-0">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-medium">
                          {review.buyer?.full_name || 'Anonymous'}
                        </p>
                        <p className="text-sm text-gray-500">{formatDate(review.created_at)}</p>
                      </div>
                      <div className="flex items-center">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-4 w-4 ${
                              star <= review.rating
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    {review.title && (
                      <h3 className="font-medium mb-1">{review.title}</h3>
                    )}
                    {review.comment && (
                      <p className="text-gray-700">{review.comment}</p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

