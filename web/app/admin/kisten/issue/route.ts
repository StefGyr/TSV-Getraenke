// web/app/admin/kisten/issue/route.ts
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
  const { data: me } = await sb.from('profiles').select('role').eq('id', user.id).single()
  if (me?.role !== 'admin') return NextResponse.json({ error: 'Nur Admin' }, { status: 403 })

  const fd = await req.formData()
  const crateId = String(fd.get('crateId') ?? '')
  const payerId = String(fd.get('payerId') ?? '')
  if (!crateId || !payerId) return NextResponse.json({ error: 'crateId/payerId fehlt' }, { status: 400 })

  const { data: crate, error: crateErr } = await sb
    .from('crates')
    .select('id, drink_id, total_segments')
    .eq('id', crateId)
    .maybeSingle()
  if (crateErr) return NextResponse.json({ error: crateErr.message }, { status: 500 })
  if (!crate) return NextResponse.json({ error: 'Kiste nicht gefunden' }, { status: 404 })

  // aktuellen Stückpreis holen
  const { data: price } = await sb
    .from('current_prices')
    .select('price_cents')
    .eq('drink_id', crate.drink_id)
    .maybeSingle()
  const unit = price?.price_cents ?? 0
  if (unit <= 0) return NextResponse.json({ error: 'Kein Preis hinterlegt' }, { status: 400 })

  const qty = crate.total_segments || 0
  const total = unit * qty
  if (qty <= 0 || total <= 0) {
    return NextResponse.json({ error: 'Ungültige Segmentzahl/Preis' }, { status: 400 })
  }

  // Wichtig: Zahler wird BELASTET → als Konsumtion (Quelle: crate_purchase)
  const { error: consErr } = await sb.from('consumptions').insert({
    user_id: payerId,
    drink_id: crate.drink_id,
    quantity: qty,
    source: 'crate',           // alternativ 'crate_purchase' – falls du das Feld strenger willst, nimm 'crate'
    crate_id: crate.id,
    unit_price_cents: unit,
  })
  if (consErr) return NextResponse.json({ error: consErr.message }, { status: 500 })

  // optional dokumentieren
  await sb.from('crates').update({
    // rein informativ – keine Zahlungslogik!
    paid_by: payerId,
    purchase_cents: total,
  }).eq('id', crateId)

  return NextResponse.redirect(`${base(req)}/admin/kisten`, { status: 303 })
}
