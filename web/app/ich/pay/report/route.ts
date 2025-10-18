import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase-server'

function base(req: Request) {
  const p = req.headers.get('x-forwarded-proto') ?? 'https'
  const h = req.headers.get('x-forwarded-host') ?? new URL(req.url).host
  return `${p}://${h}`
}

export async function POST(req: Request) {
  const sb = await createSupabaseServer()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht eingeloggt' }, { status: 401 })

  const fd = await req.formData()
  const amountStr = String(fd.get('amount') ?? '0').replace(',', '.')
  const cents = Math.round(parseFloat(amountStr) * 100)
  const method = (String(fd.get('method') ?? 'paypal') === 'cash') ? 'cash' : 'paypal'
  if (!Number.isFinite(cents) || cents <= 0) return NextResponse.json({ error: 'Betrag ungültig' }, { status: 400 })

  const { error } = await sb.from('payments').insert({
    user_id: user.id,
    amount_cents: cents,
    method,
    note: 'gemeldet',
    status: 'reported',
  })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.redirect(`${base(req)}/ich`, { status: 303 })
}
