'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase-browser'

export default function AuthCallbackPage() {
  const router = useRouter()
  useEffect(() => {
    ;(async () => {
      // WICHTIG: komplette URL übergeben → Supabase liest code + code_verifier selbst
      const { error } = await supabase.auth.exchangeCodeForSession(window.location.href)
      if (error) {
        console.error('exchangeCodeForSession error', error)
        alert('Login fehlgeschlagen: ' + error.message)
        router.replace('/login')
        return
      }
      router.replace('/')
    })()
  }, [router])

  return (
    <main className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800">
      <div className="text-zinc-300">Anmeldung wird bestätigt …</div>
    </main>
  )
}
