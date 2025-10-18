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

    // aktive Kiste zu diesem Drink finden
    const { data: crates, error: cErr } = await sb
      .from('crates')
      .select('id, remaining_segments')
      .eq('drink_id', drinkId)
      .eq('is_active', true)
      .gt('remaining_segments', 0)
      .order('created_at', { ascending: true })
    if (cErr) return NextResponse.redirect('/verbuchen?err=crate_query')
    if (!crates || crates.length === 0) return NextResponse.redirect('/verbuchen?err=no_crate')

    // billigste Preislogik: aus Kiste ist kostenlos für den Entnehmer (unit_price_cents = 0)
    // und Bestand wird reduziert.
    // Wenn du eine DB-Funktion dafür hast: hier callen. Sonst einfache Prüfung/Update.
    let remain = qty
    for (const c of crates) {
      if (remain <= 0) break
      const take = Math.min(remain, c.remaining_segments)
      // Konsum buchen mit 0 Cent
      const ins = await sb.from('consumptions').insert({
        user_id: user.id,
        drink_id: drinkId,
        quantity: take,
        source: 'crate',
        crate_id: c.id,
        unit_price_cents: 0,
      })
      if (ins.error) return NextResponse.redirect('/verbuchen?err=insert')

      // Kiste reduzieren
      const upd = await sb.from('crates')
        .update({ remaining_segments: c.remaining_segments - take, is_active: c.remaining_segments - take > 0 })
        .eq('id', c.id)
      if (upd.error) return NextResponse.redirect('/verbuchen?err=crate_update')

      remain -= take
    }

    if (remain > 0) {
      // nicht genug Segmente in allen Kisten
      return NextResponse.redirect('/verbuchen?err=not_enough_crate')
    }

    return NextResponse.redirect('/verbuchen?ok=crate')
  } catch {
    return NextResponse.redirect('/verbuchen?err=server')
  }
}
