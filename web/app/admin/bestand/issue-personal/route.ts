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
    const payerId = String(form.get('payerUserId') || '')
    const cratePrice = Math.round(parseFloat(String(form.get('cratePrice') || '0').replace(',', '.')) * 100)

    if (!drinkId || !payerId) {
      return NextResponse.redirect(new URL('/admin/bestand?err=input', req.url))
    }

    const { data: drink } = await sb.from('drinks').select('segments_per_crate').eq('id', drinkId).single()
    const seg = drink?.segments_per_crate ?? 0
    if (seg <= 0) return NextResponse.redirect(new URL('/admin/bestand?err=seg', req.url))

    // Persönliche Kiste: reduziert NICHT den Lagerbestand (origin='personal').
    // Der Zahler ist payer_user_id; optional crate_price_cents (für spätere Abrechnung/Transparenz).
    await sb.from('crates').insert({
      drink_id: drinkId,
      total_segments: seg,
      remaining_segments: seg,
      created_by: user.id,
      is_active: true,
      origin: 'personal',
      crate_price_cents: isNaN(cratePrice) ? null : cratePrice,
      payer_user_id: payerId
    })

    return NextResponse.redirect(new URL('/admin/bestand?ok=issued_personal', req.url))
  } catch (e) {
    console.error(e)
    return NextResponse.redirect(new URL('/admin/bestand?err=500', req.url))
  }
}
