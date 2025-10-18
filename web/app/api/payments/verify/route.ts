import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase-server'

/**
 * Erwartet JSON Body: { payment_id: number }
 * Verhalten:
 * - Prüft Admin-Rechte
 * - Lädt Zahlung + Overpay-Handling
 * - Ermittelt offenen Saldo des Nutzers (>=0 bedeutet: noch offen)
 * - Wenn handling === 'tip': berechnet tip_cents = Überzahlung; amount_cents bleibt als gezahlter Betrag stehen
 *   -> WICHTIG: Damit die Überzahlung den Saldo NICHT senkt, muss balances_view tip_cents NICHT abziehen (siehe Abschnitt 2)
 * - Wenn handling === 'credit': tip_cents = 0 (volle Zahlung reduziert den Saldo)
 */
export async function POST(req: Request) {
  try {
    const sb = createSupabaseServer()
    const { data: { user } } = await (await sb).auth.getUser()
    if (!user) return new NextResponse('Nicht eingeloggt', { status: 401 })

    // Admin-Check
    const { data: me } = await (await sb)
      .from('profiles').select('role').eq('id', user.id).single()
    if (me?.role !== 'admin') {
      return new NextResponse('Nicht berechtigt', { status: 403 })
    }

    const body = await req.json().catch(() => ({}))
    const payment_id = Number(body?.payment_id)
    if (!Number.isFinite(payment_id)) {
      return new NextResponse('payment_id fehlt/ungültig', { status: 400 })
    }

    // Zahlung holen
    const { data: pay, error: ePay } = await (await sb)
      .from('payments')
      .select('id, user_id, amount_cents, tip_cents, overpay_handling, status, created_at')
      .eq('id', payment_id)
      .single()
    if (ePay || !pay) return new NextResponse('Zahlung nicht gefunden', { status: 404 })
    if (pay.status === 'verified') {
      return NextResponse.json({ ok: true, note: 'Schon verifiziert' })
    }

    // Offenen Saldo ermitteln (>=0 heißt: noch offen, <0 heißt: Guthaben)
    const { data: balRows } = await (await sb)
      .from('balances_view')
      .select('user_id, balance_cents')
      .eq('user_id', pay.user_id)
    const open = Math.max(balRows?.[0]?.balance_cents ?? 0, 0)

    const handling = (pay.overpay_handling ?? 'tip') as 'tip' | 'credit'
    let tip_cents = 0

    if (handling === 'tip') {
      // Überzahlung = alles über dem OFFENEN Betrag
      tip_cents = Math.max(pay.amount_cents - open, 0)
    } else {
      // credit: komplette Zahlung reduziert den Saldo (kein Trinkgeld)
      tip_cents = 0
    }

    const { error: eUpd } = await (await sb)
      .from('payments')
      .update({
        status: 'verified',
        tip_cents,
        verified_at: new Date().toISOString(),
        verified_by: user.id,
      })
      .eq('id', pay.id)

    if (eUpd) return new NextResponse(eUpd.message, { status: 400 })

    return NextResponse.json({ ok: true, applied: pay.amount_cents - tip_cents, tip_cents })
  } catch (err: any) {
    return new NextResponse(err?.message || 'Fehler', { status: 500 })
  }
}
