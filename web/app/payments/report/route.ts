// web/app/payments/report/route.ts
import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase-server'

function getBaseUrl(req: Request) {
  const proto = req.headers.get('x-forwarded-proto') ?? 'https'
  const host = req.headers.get('x-forwarded-host') ?? new URL(req.url).host
  return `${proto}://${host}`
}

export async function POST(req: Request) {
  try {
    const sb = await createSupabaseServer()
    const { data: { user } } = await sb.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Nicht eingeloggt' }, { status: 401 })

    const form = await req.formData()
    const method = String(form.get('method') ?? 'cash')
    const note = String(form.get('note') ?? '').slice(0, 200)
    const amountStr = String(form.get('amount') ?? '').replace(',', '.').trim()
    const amountCents = Math.round((Number.parseFloat(amountStr) || 0) * 100)
    if (!['cash','paypal'].includes(method) || amountCents <= 0) {
      return NextResponse.json({ error: 'Ungültige Eingaben' }, { status: 400 })
    }

    const { error } = await sb.from('payments').insert({
      user_id: user.id,
      amount_cents: amountCents,
      method,
      note,
      status: 'reported',
    })
    if (error) throw error

    const url = `${getBaseUrl(req)}/ich`
    return NextResponse.redirect(url, { status: 303 })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Unbekannter Fehler' }, { status: 500 })
  }
}
