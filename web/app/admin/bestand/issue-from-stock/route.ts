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
    if (!drinkId) return NextResponse.redirect(new URL('/admin/bestand?err=input', req.url))

    // Segmente pro Kiste + aktueller Lagerbestand
    const [{ data: drink }, { data: stockRow }] = await Promise.all([
      sb.from('drinks').select('segments_per_crate').eq('id', drinkId).single(),
      sb.from('inventory_stock_view').select('stock_units').eq('drink_id', drinkId).single(),
    ])

    const seg = drink?.segments_per_crate ?? 0
    const stockUnits = stockRow?.stock_units ?? 0

    if (seg <= 0) return NextResponse.redirect(new URL('/admin/bestand?err=seg', req.url))
    if (stockUnits < seg) {
      // zu wenig Bestand
      return NextResponse.redirect(new URL('/admin/bestand?err=nobestock', req.url))
    }

    // Kiste aus LAGER ausgeben (origin='stock'), Preis für Kiste optional lassen (admin setzt ggf. später)
    await sb.from('crates').insert({
      drink_id: drinkId,
      total_segments: seg,
      remaining_segments: seg,
      created_by: user.id,
      is_active: true,
      origin: 'stock',
      crate_price_cents: null,
      payer_user_id: null
    })

    // Bestand reduziert sich automatisch, weil inventory_stock_view auf crates.origin='stock' schaut
    return NextResponse.redirect(new URL('/admin/bestand?ok=issued', req.url))
  } catch (e) {
    console.error(e)
    return NextResponse.redirect(new URL('/admin/bestand?err=500', req.url))
  }
}
