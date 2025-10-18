import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const sb = await createSupabaseServer()
    const { data: { user } } = await sb.auth.getUser()
    if (!user) return NextResponse.redirect(new URL('/login?next=/admin/bestand', req.url), { status: 303 })

    const { data: me } = await sb.from('profiles').select('role').eq('id', user.id).single()
    if (me?.role !== 'admin') return NextResponse.redirect(new URL('/admin?err=forbidden', req.url), { status: 303 })

    const fd = await req.formData()
    const drinkId = String(fd.get('drinkId') ?? '')
    const crates = Math.max(1, parseInt(String(fd.get('crates') ?? '1'), 10) || 1)
    const unitCostCents = fd.get('unitCostCents') ? Math.max(0, parseInt(String(fd.get('unitCostCents')), 10) || 0) : null
    const note = String(fd.get('note') ?? '')

    if (!drinkId || crates <= 0) {
      return NextResponse.redirect(new URL('/admin/bestand?err=input', req.url), { status: 303 })
    }

    const { error } = await sb.from('stock_movements').insert({
      drink_id: drinkId,
      crates_delta: crates,
      unit_cost_cents: unitCostCents,
      kind: 'purchase',
      note,
      created_by: user.id,
    })
    if (error) throw error

    return NextResponse.redirect(new URL('/admin/bestand?ok=purchase', req.url), { status: 303 })
  } catch (e) {
    console.error('POST /admin/stock/purchase failed:', e)
    return NextResponse.redirect(new URL('/admin/bestand?err=500', req.url), { status: 303 })
  }
}
