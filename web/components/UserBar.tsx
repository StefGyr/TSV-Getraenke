'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase-browser'

export default function UserBar() {
  const [email, setEmail] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    let mounted = true
    ;(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!mounted) return
      setEmail(user?.email ?? null)
    })()
    const { data: sub } = supabase.auth.onAuthStateChange(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setEmail(user?.email ?? null)
      router.refresh()
    })
    return () => { mounted = false; sub.subscription.unsubscribe() }
  }, [router])

  async function logout() {
    await supabase.auth.signOut()
    router.refresh()
  }

  if (!email) {
    return (
      <div className="flex items-center gap-3 text-sm">
        <a href="/login-passwort" className="hover:underline">Login</a>
        <a href="/register" className="hover:underline">Registrieren</a>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="text-zinc-300">{email}</span>
      <button onClick={logout} className="btn-ghost">Logout</button>
    </div>
  )
}
