'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      // Ensure user profile exists / is synced on login
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        const fullName = (user.user_metadata as any)?.full_name || ''
        const phone = (user.user_metadata as any)?.phone || ''

        const { data: existingProfile } = await supabase
          .from('user_profiles')
          .select('id, full_name, phone, role')
          .eq('id', user.id)
          .maybeSingle()

        if (!existingProfile) {
          // Create buyer profile if it doesn't exist
          // @ts-expect-error - Supabase type inference limitation with insert operations
          await supabase.from('user_profiles').insert({
            id: user.id,
            email: user.email,
            full_name: fullName,
            phone,
            role: 'buyer',
          })
        } else {
          const updates: Record<string, any> = {}
          if (fullName && fullName !== existingProfile.full_name) {
            updates.full_name = fullName
          }
          if (phone && phone !== existingProfile.phone) {
            updates.phone = phone
          }
          if (!existingProfile.role) {
            updates.role = 'buyer'
          }

          if (Object.keys(updates).length > 0) {
            // @ts-expect-error - Supabase type inference limitation with update operations
            await supabase.from('user_profiles').update(updates).eq('id', user.id)
          }
        }
      }

      router.push('/dashboard')
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Failed to sign in')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Sign In</CardTitle>
          <CardDescription className="text-center">
            Sign in to your Ebuney account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg">
                {error}
              </div>
            )}

            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />

            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />

            <div className="flex items-center justify-between">
              <Link href="/auth/forgot-password" className="text-sm text-green-600 hover:underline">
                Forgot password?
              </Link>
            </div>

            <Button type="submit" className="w-full" isLoading={loading}>
              Sign In
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-gray-600">Don't have an account? </span>
            <Link href="/auth/register" className="text-green-600 font-medium hover:underline">
              Sign up
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

