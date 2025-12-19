'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ShoppingCart, Search, Menu, User, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'

export function Header() {
  const pathname = usePathname()
  const [user, setUser] = useState<any>(null)
  const [cartCount, setCartCount] = useState(0)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      if (user) {
        fetchCartCount(user.id)
      }
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchCartCount(session.user.id)
      } else {
        setCartCount(0)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function fetchCartCount(userId: string) {
    const { data: cart } = await supabase
      .from('carts')
      .select('id')
      .eq('user_id', userId)
      .single()

    if (cart) {
      const userCart = cart as { id: string }
      const { count } = await supabase
        .from('cart_items')
        .select('*', { count: 'exact', head: true })
        .eq('cart_id', userCart.id)

      setCartCount(count || 0)
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/products', label: 'Products' },
  ]

  const headerCategories = [
    { name: 'Electronics', icon: '📱', href: '/products?category=electronics' },
    { name: 'Laptops', icon: '💻', href: '/products?category=laptops' },
    { name: 'TV & Audio', icon: '📺', href: '/products?category=tv-audio' },
    { name: 'Menswear', icon: '👔', href: '/products?category=menswear' },
    { name: 'Womenswear', icon: '👗', href: '/products?category=womenswear' },
    { name: 'Sneakers', icon: '👟', href: '/products?category=sneakers' },
  ]

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-2xl font-bold text-green-600">Ebuney</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition-colors hover:text-green-600 ${
                  pathname === link.href ? 'text-green-600' : 'text-gray-700'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Search, Categories menu, Cart, User */}
          <div className="flex items-center space-x-4">
            {/* Search */}
            <Link
              href="/products"
              className="hidden sm:flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100 transition-colors"
            >
              <Search className="h-5 w-5 text-gray-700" />
            </Link>

            {/* Categories dropdown */}
            <div className="hidden sm:block relative group">
              <button className="flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-full border border-gray-200 bg-white hover:bg-gray-50 hover:border-green-500 transition-colors">
                <span>Categories</span>
                <Menu className="h-4 w-4" />
              </button>
              <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                <div className="py-2 text-sm">
                  {headerCategories.map((cat) => (
                    <Link
                      key={cat.href}
                      href={cat.href}
                      className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-50"
                    >
                      <span className="text-lg leading-none">{cat.icon}</span>
                      <span>{cat.name}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* Cart */}
            {user && (
              <Link
                href="/cart"
                className="relative flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100 transition-colors"
              >
                <ShoppingCart className="h-5 w-5 text-gray-700" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-green-600 text-xs font-medium text-white">
                    {cartCount > 9 ? '9+' : cartCount}
                  </span>
                )}
              </Link>
            )}

            {/* User Menu */}
            {user ? (
              <div className="relative group">
                <button className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100 transition-colors">
                  <User className="h-5 w-5 text-gray-700" />
                </button>
                <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                  <div className="py-1">
                    <Link
                      href="/dashboard"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Dashboard
                    </Link>
                    <Link
                      href="/orders"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      My Orders
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="hidden sm:flex items-center space-x-2">
                <Link href="/auth/login">
                  <Button variant="ghost" size="sm">Sign In</Button>
                </Link>
                <Link href="/auth/register">
                  <Button size="sm">Sign Up</Button>
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100 transition-colors"
            >
              <Menu className="h-5 w-5 text-gray-700" />
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <nav className="flex flex-col space-y-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    pathname === link.href
                      ? 'bg-green-50 text-green-600'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              {!user && (
                <>
                  <Link
                    href="/auth/login"
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/auth/register"
                    className="px-4 py-2 text-sm font-medium bg-green-600 text-white rounded-lg hover:bg-green-700"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}

