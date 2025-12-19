'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { Product } from '@/types'
import { ProductCard } from '@/components/product/product-card'
import { Button } from '@/components/ui/button'
import { ArrowRight, Shield, Truck, CreditCard, TrendingUp, Search } from 'lucide-react'

export default function HomePage() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([])
  const [newProducts, setNewProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    void fetchProducts()
  }, [])

  async function fetchProducts() {
    try {
      setLoading(true)

      const { data: featured } = await supabase
        .from('products')
        .select(
          `
          *,
          seller:sellers(*),
          category:categories(*)
        `,
        )
        .eq('is_active', true)
        .eq('is_featured', true)
        .limit(8)

      const { data: newest } = await supabase
        .from('products')
        .select(
          `
          *,
          seller:sellers(*),
          category:categories(*)
        `,
        )
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(8)

      if (featured) setFeaturedProducts(featured as Product[])
      if (newest) setNewProducts(newest as Product[])
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
          product_id: productId,
          quantity: 1,
        })

      if (error) {
        console.error('Error adding to cart:', error)
        alert('Failed to add item to cart')
      } else {
        alert('Item added to cart!')
      }
    }
  }

  const features = [
    {
      icon: Shield,
      title: 'Trusted & Secure',
      description: 'Official brands, verified sellers, and secure checkout.',
    },
    {
      icon: Truck,
      title: 'Fast Delivery',
      description: '2–5 day delivery across major Zambian cities.',
    },
    {
      icon: CreditCard,
      title: 'Flexible Payments',
      description: 'Mobile Money, cards, and cash on delivery.',
    },
    {
      icon: TrendingUp,
      title: 'Great Value',
      description: 'Compare top tech and fashion in one place.',
    },
  ] as const

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="relative bg-gray-50">
        <div className="relative container mx-auto px-4 pt-4 pb-4">
          {/* Global search bar (eBay-style) */}
          <div className="mb-4">
            <form
              action="/products"
              method="GET"
              className="flex flex-col md:flex-row gap-3 md:items-center"
            >
              <div className="flex-1 flex items-stretch rounded-full border border-gray-300 bg-white shadow-sm overflow-hidden">
                <div className="flex items-center px-3">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  name="q"
                  placeholder="Search Ebuney for products, deals and more..."
                  className="flex-1 border-0 outline-none text-sm px-1 py-2"
                />
                <div className="hidden sm:flex items-center px-3 border-l border-gray-200 text-xs md:text-sm text-gray-600 bg-gray-50">
                  <span>All Ebuney</span>
                </div>
              </div>
              <Button
                type="submit"
                className="rounded-full bg-blue-600 hover:bg-blue-700 px-6 text-sm font-semibold"
              >
                Search
              </Button>
            </form>
          </div>

          {/* Sliding promo banner */}
          <div className="relative w-full max-w-6xl mx-auto h-40 md:h-56 rounded-2xl overflow-hidden shadow-amazon-lg">
            {[
              {
                image: '/customer-laptop.jpg',
                alt: 'Ebuney customer using a laptop',
                headline: "There's a deal for you, too",
                subline: 'Fresh picks on laptops and accessories every week.',
              },
              {
                image: '/phone-showcase.jpg',
                alt: 'Phones available on Ebuney',
                headline: 'Upgrade your daily phone',
                subline: 'From trusted brands with clear specs and fast delivery.',
              },
              {
                image: '/laptop-showcase.jpg',
                alt: 'Premium laptop on a desk',
                headline: 'Turn your cart into an upgrade',
                subline: 'Save on the tech you have been eyeing for days.',
              },
            ].map((banner, index) => (
              <div
                key={banner.alt}
                className={`hero-main-slide hero-main-slide-${index} absolute inset-0`}
              >
                <Image
                  src={banner.image}
                  alt={banner.alt}
                  fill
                  priority={index === 0}
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/25 to-transparent" />
                <div className="absolute inset-y-0 left-4 right-4 flex flex-col justify-center text-white">
                  <p className="text-sm md:text-base font-semibold">{banner.headline}</p>
                  <p className="text-xs md:text-sm text-slate-100 mt-1">{banner.subline}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs md:text-sm">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-sky-600" />
            <span>Verified sellers</span>
          </div>
          <div className="flex items-center gap-2">
            <Truck className="h-4 w-4 text-emerald-600" />
            <span>Nationwide delivery</span>
          </div>
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-indigo-600" />
            <span>Multiple payments</span>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-amber-600" />
            <span>Fair prices & deals</span>
          </div>
        </div>
      </section>

      {/* Featured products */}
      {featuredProducts.length > 0 && (
        <section className="py-10 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl md:text-2xl font-bold">Featured picks</h2>
              <Link href="/products?featured=true">
                <Button variant="ghost" size="sm">
                  View all
                  <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </Link>
            </div>
            {loading ? (
              <div className="text-center py-8 text-sm text-gray-500">Loading products…</div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {featuredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onAddToCart={handleAddToCart}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* New arrivals */}
      {newProducts.length > 0 && (
        <section className="py-10 bg-white">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl md:text-2xl font-bold">New arrivals</h2>
              <Link href="/products?sort=newest">
                <Button variant="ghost" size="sm">
                  View all
                  <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </Link>
            </div>
            {loading ? (
              <div className="text-center py-8 text-sm text-gray-500">Loading products…</div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {newProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onAddToCart={handleAddToCart}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Why Ebuney */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-xl md:text-2xl font-bold mb-2">Why shop with Ebuney?</h2>
            <p className="text-xs md:text-sm text-gray-600 max-w-xl mx-auto">
              Designed for Zambian shoppers: clear delivery, easy returns, and support that actually
              answers.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-sm">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl bg-gray-50 border border-gray-200 p-4 flex flex-col gap-2"
              >
                <div className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-sky-100 text-sky-700">
                  <feature.icon className="h-4 w-4" />
                </div>
                <div className="font-semibold text-gray-900">{feature.title}</div>
                <div className="text-gray-600 text-xs">{feature.description}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

