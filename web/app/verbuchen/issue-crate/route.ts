import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  try {
    const sb = await createSupabaseServer()
    const { data: { user } } = await sb.auth.getUser()
    if (!user) return NextResponse.redirect('/login?next=/verbuchen')

    const form = await req.formData()
    const drinkId = String(form.get('drinkId') || '')
    const mode = String(form.get('issueMode') || 'own_money') // 'own_money' (bezahlt) oder 'bring_crate' (mitgebracht)
    if (!drinkId) return NextResponse.redirect('/verbuchen?err=bad_input')

    // Preisinfos holen
    const [{ data: price }, { data: drink }] = await Promise.all([
      sb.from('current_prices').select('price_cents').eq('drink_id', drinkId).single(),
      sb.from('drinks').select('segments_per_crate').eq('id', drinkId).single(),
    ])
    if (!drink?.segments_per_crate) return NextResponse.redirect('/verbuchen?err=no_segments')

    // optional eigener Kistenpreis (falls du ein Feld 'crate_price_cents' hast):
    const { data: cratePriceRow } = await sb
      .from('prices')
      .select('price_cents')
      .eq('drink_id', drinkId)
      .order('valid_from', { ascending: false })
      .limit(1)
      .single()

    const singlePrice = price?.price_cents ?? 0
    const cratePrice = cratePriceRow?.price_cents ?? singlePrice * drink.segments_per_crate

    // Kiste in Bestand anlegen (voll)
    const insCrate = await sb.from('crates').insert({
      drink_id: drinkId,
      total_segments: drink.segments_per_crate,
      remaining_segments: drink.segments_per_crate,
      created_by: user.id,
      is_active: true,
    }).select('id').single()

    if (insCrate.error) return NextResponse.redirect('/verbuchen?err=crate_insert')

    // Wenn „selbst bezahlt“ → Kosten beim Zahler verbuchen (eine „Konsumtion“ für die ganze Kiste)
    if (mode === 'own_money') {
      const insCons = await sb.from('consumptions').insert({
        user_id: user.id,
        drink_id: drinkId,
        quantity: drink.segments_per_crate,   // damit geht es fair in die Kostenstatistik ein
        source: 'single',
        unit_price_cents: Math.round(cratePrice / drink.segments_per_crate), // verteilt
      })
      if (insCons.error) return NextResponse.redirect('/verbuchen?err=cons_insert')
    }

    // Wenn „mitgebracht“ → kein Preis für Zahler; Kiste steht aber zur Verfügung.
    return NextResponse.redirect('/verbuchen?ok=issued')
  } catch {
    return NextResponse.redirect('/verbuchen?err=server')
  }
}
