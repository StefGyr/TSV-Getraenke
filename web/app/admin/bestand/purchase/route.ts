import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase-server'

export async function POST(req: Request) {
  try {
    const sb = await createSupabaseServer()
    const { data: { user } } = await sb.auth.getUser()
    if (!user) return NextResponse.redirect(new URL('/login?next=/admin/bestand', req.url))

    const { data: me } = await sb.from('profiles').select('role').eq('id', user.id).single()
    if (me?.role !== 'admin') return NextResponse.redirect(new URL('/admin?err=forbidden', req.url))

    const form = await req.formData()
    const drinkId = String(form.get('drinkId') || '')
    const crates = Number(form.get('crates') || 0)
    const units = Number(form.get('units') || 0)
    const cost = Math.round(parseFloat(String(form.get('cost') || '0').replace(',', '.')) * 100)
    const note = String(form.get('note') || '')

    if (!drinkId || (crates <= 0 && units <= 0)) {
      return NextResponse.redirect(new URL('/admin/bestand?err=input', req.url))
    }

    // Segmente pro Kiste holen
    const { data: drink } = await sb.from('drinks').select('segments_per_crate').eq('id', drinkId).single()
    const seg = drink?.segments_per_crate ?? 0
    const unitsAdded = crates * seg + units
    if (unitsAdded <= 0) {
      return NextResponse.redirect(new URL('/admin/bestand?err=calc', req.url))
    }

    await sb.from('inventory_purchases').insert({
      drink_id: drinkId,
      units_added: unitsAdded,
      cost_cents: isNaN(cost) ? 0 : cost,
      note,
      created_by: user.id
    })

    return NextResponse.redirect(new URL('/admin/bestand?ok=purchased', req.url))
  } catch (e) {
    console.error(e)
    return NextResponse.redirect(new URL('/admin/bestand?err=500', req.url))
  }
}
