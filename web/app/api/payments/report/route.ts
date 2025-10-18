import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase-server'

export async function POST(req: Request) {
  const sb = createSupabaseServer()
  const { data: { user } } = await (await sb).auth.getUser()
  if (!user) return new NextResponse('Nicht eingeloggt', { status: 401 })

  const fd = await req.formData()
  const amount_cents = Number(fd.get('amount_cents') ?? 0)
  const method = String(fd.get('method') ?? '')
  const overpay_handling = String(fd.get('overpay_handling') ?? 'tip')
  const note = (fd.get('note') ?? '') as string

  if (!Number.isFinite(amount_cents) || amount_cents <= 0) {
    return new NextResponse('Ungültiger Betrag', { status: 400 })
  }
  if (!['paypal','cash'].includes(method)) {
    return new NextResponse('Ungültige Zahlungsart', { status: 400 })
  }
  if (!['tip','credit'].includes(overpay_handling)) {
    return new NextResponse('Ungültige Überzahlungs-Option', { status: 400 })
  }

  const { error } = await (await sb).from('payments').insert({
    user_id: user.id,
    amount_cents,
    method,
    note,
    status: 'reported',
    overpay_handling,
    tip_cents: 0, // Tip wird erst bei Verifizierung angewendet (entspr. Handling)
  })
  if (error) return new NextResponse(error.message, { status: 400 })

  return NextResponse.json({ ok: true })
}
