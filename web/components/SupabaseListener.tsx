'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase-browser'

export default function SupabaseListener() {
  const router = useRouter()
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      // Server-Routen neu ausliefern (SSR sieht frische Cookies)
      router.refresh()
    })
    return () => { sub.subscription.unsubscribe() }
  }, [router])
  return null
}
