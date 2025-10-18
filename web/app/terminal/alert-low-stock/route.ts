import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase-server'

export async function POST(req: Request) {
  const sb = await createSupabaseServer()
  const form = await req.formData()
  const userId = String(form.get('userId') || '')
  const drinkId = String(form.get('drinkId') || '')
  const note = String(form.get('note') || '')

  if (!drinkId) return NextResponse.redirect(new URL('/terminal?err=alert', req.url))

  await sb.from('low_stock_alerts').insert({
    user_id: userId || null,
    drink_id: drinkId,
    note: note || null,
  })

  return NextResponse.redirect(new URL('/terminal?ok=alert', req.url))
}
