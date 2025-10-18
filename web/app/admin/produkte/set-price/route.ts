import { NextResponse, NextRequest } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase-server'

function parseEuroToCents(v: FormDataEntryValue | null): number | null {
  if (!v) return null
  const s = String(v).trim().replace(/\s+/g, '').replace('€', '').replace(',', '.')
  if (!s) return null
  const n = Number(s)
  if (!isFinite(n) || n < 0) return null
  return Math.round(n * 100)
}

export async function POST(req: NextRequest) {
  const sb = await createSupabaseServer()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return NextResponse.redirect('/login?next=/admin/produkte')

  const { data: me } = await sb.from('profiles').select('role').eq('id', user.id).single()
  if (me?.role !== 'admin') return NextResponse.redirect('/admin/produkte?err=forbidden')

  const fd = await req.formData()
  const drinkId = String(fd.get('drinkId') || '')
  const priceCents = parseEuroToCents(fd.get('price_eur'))
  const cratePriceCents = parseEuroToCents(fd.get('crate_price_eur'))
  const segments = fd.get('segments') ? Number(fd.get('segments')) : null

  if (!drinkId) return NextResponse.redirect('/admin/produkte?err=drink')

  if (priceCents !== null) {
    await sb.from('prices').insert({ drink_id: drinkId, price_cents: priceCents })
  }
  if (segments && Number.isFinite(segments) && segments > 0) {
    await sb.from('drinks').update({ segments_per_crate: segments }).eq('id', drinkId)
  }
  if (cratePriceCents !== null) {
    await sb.from('drinks').update({ crate_price_cents: cratePriceCents }).eq('id', drinkId)
  }

  return NextResponse.redirect('/admin/produkte?ok=saved')
}
