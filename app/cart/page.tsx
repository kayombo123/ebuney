'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { CartItem, Product } from '@/types'
import { formatCurrency } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Minus, Plus, Trash2, ShoppingBag } from 'lucide-react'

export default function CartPage() {
  const [cartItems, setCartItems] = useState<(CartItem & { product?: Product })[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    fetchCart()
  }, [])

  async function fetchCart() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/auth/login')
      return
    }

    try {
      const { data: cart } = await supabase
        .from('carts')
        .select('id')
        .eq('user_id', user.id)
        .single()

      const cartData = cart as { id: string } | null
      if (cartData && cartData.id) {
        const { data: items } = await supabase
          .from('cart_items')
          .select(`
            *,
            product:products(*)
          `)
          .eq('cart_id', cartData.id)

        if (items) {
          setCartItems(items as (CartItem & { product?: Product })[])
        }
      }
    } catch (error) {
      console.error('Error fetching cart:', error)
    } finally {
      setLoading(false)
    }
  }

  async function updateQuantity(itemId: string, newQuantity: number) {
    if (newQuantity < 1) return

    setUpdating(itemId)
    try {
      const { error } = await supabase
        .from('cart_items')
        // @ts-expect-error - Supabase type inference limitation with update operations
        .update({ quantity: newQuantity })
        .eq('id', itemId)

      if (error) throw error
      await fetchCart()
    } catch (error) {
      console.error('Error updating quantity:', error)
      alert('Failed to update quantity')
    } finally {
      setUpdating(null)
    }
  }

  async function removeItem(itemId: string) {
    setUpdating(itemId)
    try {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', itemId)

      if (error) throw error
      await fetchCart()
    } catch (error) {
      console.error('Error removing item:', error)
      alert('Failed to remove item')
    } finally {
      setUpdating(null)
    }
  }

  const subtotal = cartItems.reduce((sum, item) => {
    const product = item.product as any
    const price = product?.price || product?.buy_it_now_price || product?.starting_bid || 0
    return sum + price * item.quantity
  }, 0)

  const shipping = 0 // Free shipping by default
  const total = subtotal + shipping

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="text-center py-12">Loading cart...</div>
        </div>
      </div>
    )
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="text-center py-12">
            <ShoppingBag className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Your cart is empty</h2>
            <p className="text-gray-600 mb-6">Start shopping to add items to your cart</p>
            <Link href="/products">
              <Button>Continue Shopping</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cartItems.map((item) => {
              const product = item.product
              if (!product) return null

              const imageUrl = product.images && product.images.length > 0
                ? product.images[0]
                : '/placeholder-product.jpg'

              return (
                <Card key={item.id}>
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      <Link href={`/products/${product.slug}`} className="flex-shrink-0">
                        <div className="relative w-24 h-24 bg-gray-100 rounded-lg overflow-hidden">
                          <Image
                            src={imageUrl}
                            alt={product.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                      </Link>

                      <div className="flex-1 min-w-0">
                        <Link href={`/products/${product.slug}`}>
                          <h3 className="font-medium text-gray-900 hover:text-green-600 mb-1">
                            {product.name}
                          </h3>
                        </Link>
                        <p className="text-lg font-bold text-gray-900 mb-4">
                          {formatCurrency((product as any).price || (product as any).buy_it_now_price || product.buy_it_now_price || product.starting_bid, product.currency)}
                        </p>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              disabled={updating === item.id || item.quantity <= 1}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <span className="w-12 text-center font-medium">
                              {item.quantity}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              disabled={updating === item.id || ((product as any).stock_quantity != null && (product as any).stock_quantity < item.quantity + 1)}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeItem(item.id)}
                            disabled={updating === item.id}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardContent className="p-6">
                <h2 className="text-xl font-bold mb-4">Order Summary</h2>
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Shipping</span>
                    <span>{shipping === 0 ? 'Free' : formatCurrency(shipping)}</span>
                  </div>
                  <div className="border-t border-gray-200 pt-3 flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span>{formatCurrency(total)}</span>
                  </div>
                </div>

                <Link href="/checkout" className="block">
                  <Button className="w-full" size="lg">
                    Proceed to Checkout
                  </Button>
                </Link>

                <Link href="/products" className="block mt-4">
                  <Button variant="outline" className="w-full">
                    Continue Shopping
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

