// web/app/terminal/crate/book/route.ts
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createSupabaseServer } from '@/lib/supabase-server'

export async function POST(req: Request) {
  try {
    const sb = await createSupabaseServer()
    const cookieStore = await cookies()
    const termUid = cookieStore.get('terminal_uid')?.value
    if (!termUid) return NextResponse.json({ ok: false, error: 'Kein PIN-Nutzer angemeldet' }, { status: 401 })

    const fd = await req.formData()
    const crateId = String(fd.get('crateId') ?? '')
    const drinkId = String(fd.get('drinkId') ?? '')
    const quantity = Math.max(1, parseInt(String(fd.get('quantity') ?? '1'), 10))
    if (!crateId || !drinkId || !Number.isFinite(quantity) || quantity < 1) {
      return NextResponse.json({ ok: false, error: 'Ungültige Eingaben' }, { status: 400 })
    }

    // Check: genug Segmente?
    const { data: crate, error: crateErr } = await sb
      .from('crates')
      .select('remaining_segments')
      .eq('id', crateId)
      .maybeSingle()
    if (crateErr) return NextResponse.json({ ok: false, error: crateErr.message }, { status: 500 })
    if (!crate || crate.remaining_segments < quantity) {
      return NextResponse.json({ ok: false, error: 'Nicht genug Segmente in der Kiste' }, { status: 400 })
    }

    // WICHTIG: kostenfrei verbuchen -> unit_price_cents = 0
    const { error } = await sb.rpc('tx_take_from_crate', {
      p_crate_id: crateId,
      p_user_id: termUid,
      p_drink_id: drinkId,
      p_qty: quantity,
      p_unit_price: 0, // <- hier liegt die Magie: keine Kosten für den Verbraucher
    })
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? 'Unbekannter Fehler' }, { status: 500 })
  }
}
