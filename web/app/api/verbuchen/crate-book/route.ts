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

    const { error } = await sb.rpc('tx_take_from_crates', {
      p_drink_id: drinkId,
      p_user_id: user.id,
      p_qty: quantity,
      p_unit_price: 0, // kostenlos
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: 'unexpected' }, { status: 500 })
  }
}
