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
  const name = String(fd.get('name') || '').trim()
  const unit = String(fd.get('unit') || 'Flasche').trim()
  const segments = Number(fd.get('segments') || 20)
  const priceCents = parseEuroToCents(fd.get('price_eur'))
  const cratePriceCents = parseEuroToCents(fd.get('crate_price_eur'))

  if (!name) return NextResponse.redirect('/admin/produkte?err=name')

  const { data: drink, error: dErr } = await sb.from('drinks').insert({
    name, unit, segments_per_crate: Number.isFinite(segments) && segments > 0 ? segments : 20, is_active: true,
  }).select('id').single()

  if (dErr || !drink) return NextResponse.redirect('/admin/produkte?err=insert')

  if (priceCents !== null) {
    await sb.from('prices').insert({ drink_id: drink.id, price_cents: priceCents })
  }
  if (cratePriceCents !== null) {
    await sb.from('drinks').update({ crate_price_cents: cratePriceCents }).eq('id', drink.id)
  }

  return NextResponse.redirect('/admin/produkte?ok=added')
}
