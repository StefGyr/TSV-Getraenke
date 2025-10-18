import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const sb = await createSupabaseServer()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })

  const { drink_id } = await req.json()
  if (!drink_id) return NextResponse.json({ error: 'missing_drink' }, { status: 400 })

  // segments + crate price holen
  const [{ data: d }, { data: price }] = await Promise.all([
    sb.from('drinks').select('id,segments_per_crate').eq('id', drink_id).single(),
    sb.from('current_prices').select('price_cents,crate_price_cents').eq('drink_id', drink_id).single(),
  ])
  if (!d) return NextResponse.json({ error: 'drink_not_found' }, { status: 404 })

  const segments = d.segments_per_crate ?? 20
  const cratePrice = price?.crate_price_cents ?? null
  if (!cratePrice || cratePrice <= 0) return NextResponse.json({ error: 'crate_price_missing' }, { status: 400 })

  // 1) Kiste anlegen
  const { data: cRow, error: cErr } = await sb.from('crates').insert({
    drink_id,
    total_segments: segments,
    remaining_segments: segments,
    created_by: user.id,
    is_active: true,
  }).select('id').single()
  if (cErr) return NextResponse.json({ error: cErr.message }, { status: 400 })

  // 2) Kosten beim Zahler buchen (Menge 1, Preis = Kistenpreis)
  const { error: consErr } = await sb.from('consumptions').insert({
    user_id: user.id,
    drink_id,
    quantity: 1,
    source: 'single',               // belastet den Zahler
    crate_id: cRow.id,
    unit_price_cents: cratePrice,   // volle Kistenkosten
  })
  if (consErr) return NextResponse.json({ error: consErr.message }, { status: 400 })

  return NextResponse.json({ ok: true, crate_id: cRow.id })
}
