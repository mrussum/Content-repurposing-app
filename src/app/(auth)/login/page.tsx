'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

export default function LoginPage() {
  const [email,     setEmail]     = useState('')
  const [sent,      setSent]      = useState(false)
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState<string | null>(null)

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    })

    if (error) {
      setError(error.message)
    } else {
      setSent(true)
    }
    setLoading(false)
  }

  async function handleGoogle() {
    setLoading(true)
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options:  { redirectTo: `${window.location.origin}/auth/callback` },
    })
  }

  return (
    <div className="min-h-screen bg-[#060606] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <span className="text-[#c8ff00] font-bold text-4xl font-syne">CS</span>
          <p className="mt-2 text-[#555] text-sm">Content Studio Pro</p>
        </div>

        <div className="rounded-[14px] border border-[#1a1a1a] bg-[#0c0c0c] p-6">
          {sent ? (
            <div className="text-center py-4">
              <p className="text-[#e8e8e8] font-medium mb-2">Check your email</p>
              <p className="text-sm text-[#555]">
                We sent a magic link to <span className="text-[#888]">{email}</span>.
                Click it to sign in.
              </p>
            </div>
          ) : (
            <>
              <h1 className="text-lg font-semibold text-[#e8e8e8] font-syne mb-6">Sign in</h1>

              <form onSubmit={handleMagicLink} className="flex flex-col gap-3">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="h-10 w-full rounded-[8px] border border-[#181818] bg-[#0e0e0e] px-3 text-sm text-[#e8e8e8] placeholder:text-[#2e2e2e] focus:border-[#c8ff00] focus:outline-none"
                />

                {error && (
                  <p className="text-xs text-[#ff7070]">{error}</p>
                )}

                <Button type="submit" disabled={loading || !email} className="w-full">
                  {loading ? 'Sending…' : 'Send magic link'}
                </Button>
              </form>

              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px bg-[#1a1a1a]" />
                <span className="text-xs text-[#444]">or</span>
                <div className="flex-1 h-px bg-[#1a1a1a]" />
              </div>

              <Button
                variant="secondary"
                onClick={handleGoogle}
                disabled={loading}
                className="w-full"
              >
                Continue with Google
              </Button>
            </>
          )}
        </div>

        <p className="text-center text-xs text-[#333] mt-6">
          By signing in you agree to our terms and privacy policy.
        </p>
      </div>
    </div>
  )
}
