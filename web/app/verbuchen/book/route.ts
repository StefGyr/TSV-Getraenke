import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  try {
    const sb = await createSupabaseServer()
    const { data: { user } } = await sb.auth.getUser()
    if (!user) return NextResponse.redirect('/login?next=/verbuchen')

    const form = await req.formData()
    const drinkId = String(form.get('drinkId') || '')
    const qty = Number(form.get('qty') || 0)
    if (!drinkId || !qty || qty <= 0) {
      return NextResponse.redirect('/verbuchen?err=bad_input')
    }

    const { data: price } = await sb.from('current_prices').select('price_cents').eq('drink_id', drinkId).single()
    if (!price?.price_cents) return NextResponse.redirect('/verbuchen?err=no_price')

    const { error } = await sb.from('consumptions').insert({
      user_id: user.id,
      drink_id: drinkId,
      quantity: qty,
      source: 'single',
      unit_price_cents: price.price_cents,
    })
    if (error) return NextResponse.redirect('/verbuchen?err=insert')

    return NextResponse.redirect('/verbuchen?ok=single')
  } catch {
    return NextResponse.redirect('/verbuchen?err=server')
  }
}
