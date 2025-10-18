// web/app/terminal/book/route.ts
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createSupabaseServer } from '@/lib/supabase-server'

export async function POST(req: Request) {
  try {
    const sb = await createSupabaseServer()

    // Terminal-User aus Cookie
    const cookieStore = await cookies()
    const termUid = cookieStore.get('terminal_uid')?.value
    if (!termUid) {
      return NextResponse.json({ ok: false, error: 'Kein PIN-Nutzer angemeldet' }, { status: 401 })
    }

    // Eingaben
    const fd = await req.formData()
    const drinkId = String(fd.get('drinkId') ?? '')
    const quantity = Math.max(1, parseInt(String(fd.get('quantity') ?? '1'), 10))
    if (!drinkId || !Number.isFinite(quantity) || quantity < 1) {
      return NextResponse.json({ ok: false, error: 'Ungültige Eingaben' }, { status: 400 })
    }

    // RPC ausführen (bucht inkl. Preisermittlung)
    const { error } = await sb.rpc('terminal_book', {
      p_user_id: termUid,
      p_drink_id: drinkId,
      p_quantity: quantity,
    })
    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    }

    // Erfolg
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? 'Unbekannter Fehler' }, { status: 500 })
  }
}
