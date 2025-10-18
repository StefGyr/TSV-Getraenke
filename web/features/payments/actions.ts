'use server'

import { createSupabaseServer } from '@/lib/supabase-server'

export async function reportPayment({
  amountCents,
  method,
  note,
}: {
  amountCents: number
  method: 'paypal' | 'cash'
  note?: string
}) {
  const sb = await createSupabaseServer()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) throw new Error('Nicht eingeloggt')

  // Ticket erstellen (Status 'reported')
  const { error } = await sb.from('payments').insert({
    user_id: user.id,
    amount_cents: amountCents,
    method,
    note,
  })
  if (error) throw error
}

// Admin: Zahlung verifizieren, Überzahlung behandeln
export async function verifyPayment({
  paymentId,
  handling,
}: {
  paymentId: number
  handling: 'tip' | 'credit'
}) {
  const sb = await createSupabaseServer()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) throw new Error('Nicht eingeloggt')

  // Admin-Check
  const { data: me } = await sb.from('profiles').select('role').eq('id', user.id).single()
  if (me?.role !== 'admin') throw new Error('Nur Admin')

  const { data: pay, error: payErr } = await sb
    .from('payments')
    .select('id,user_id,amount_cents,status')
    .eq('id', paymentId)
    .single()
  if (payErr) throw payErr
  if (!pay) throw new Error('Zahlung nicht gefunden')

  // Balance des Users holen
  const { data: bal } = await sb
    .from('balances_view')
    .select('balance_cents')
    .eq('user_id', pay.user_id)
    .single()

  const balance = bal?.balance_cents ?? 0
  let tip_cents = 0

  // Wenn mehr gezahlt als offen:
  if (pay.amount_cents > balance && handling === 'tip') {
    tip_cents = pay.amount_cents - balance
  }

  const { error: updErr } = await sb
    .from('payments')
    .update({
      status: 'verified',
      verified_at: new Date().toISOString(),
      verified_by: user.id,
      overpay_handling: handling,
      tip_cents,
    })
    .eq('id', paymentId)

  if (updErr) throw updErr
}
