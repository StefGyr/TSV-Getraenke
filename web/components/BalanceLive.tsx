'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase-browser'

/**
 * Lauscht auf neue Consummations/Payments des aktuellen Users
 * und triggert router.refresh(), damit der Server-Saldo neu geladen wird.
 *
 * WICHTIG in Supabase Studio (einmalig):
 *  Database → Replication (Realtime) → Configuration:
 *    - Schema: public
 *    - Tabellen: consumptions, payments
 *    - Events: INSERT (für consumptions), INSERT/UPDATE (für payments)
 */
export default function BalanceLive({ userId }: { userId: string }) {
  const router = useRouter()

  useEffect(() => {
    // Kanal für Consummations (nur eigene)
    const ch1 = supabase
      .channel('consumptions-updates')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'consumptions', filter: `user_id=eq.${userId}` },
        () => router.refresh()
      )
      .subscribe()

    // Kanal für Payments (Saldo ändert sich bei verified)
    const ch2 = supabase
      .channel('payments-updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'payments', filter: `user_id=eq.${userId}` },
        () => router.refresh()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(ch1)
      supabase.removeChannel(ch2)
    }
  }, [router, userId])

  return null
}
