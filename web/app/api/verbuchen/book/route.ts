import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const sb = await createSupabaseServer()
    const { data: { user } } = await sb.auth.getUser()
    if (!user) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })

    const { drinkId, qty } = await req.json()
    const quantity = Math.max(1, parseInt(String(qty ?? 1), 10) || 1)
    if (!drinkId) return NextResponse.json({ error: 'missing_drink' }, { status: 400 })

    const { data: price, error: priceErr } = await sb
      .from('current_prices')
      .select('price_cents')
      .eq('drink_id', drinkId)
      .single()
    if (priceErr) return NextResponse.json({ error: 'price_not_found' }, { status: 400 })

    const unit = (price as any)?.price_cents ?? 0
    const { error } = await sb.from('consumptions').insert({
      user_id: user.id,
      drink_id: drinkId,
      quantity,
      source: 'single',
      unit_price_cents: unit,
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: 'unexpected' }, { status: 500 })
  }
}
