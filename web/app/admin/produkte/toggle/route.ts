import { NextResponse, NextRequest } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  const sb = await createSupabaseServer()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return NextResponse.redirect('/login?next=/admin/produkte')

  const { data: me } = await sb.from('profiles').select('role').eq('id', user.id).single()
  if (me?.role !== 'admin') return NextResponse.redirect('/admin/produkte?err=forbidden')

  const fd = await req.formData()
  const drinkId = String(fd.get('drinkId') || '')
  const to = String(fd.get('to') || 'false') === 'true'
  if (!drinkId) return NextResponse.redirect('/admin/produkte?err=drink')

  await sb.from('drinks').update({ is_active: to }).eq('id', drinkId)

  return NextResponse.redirect('/admin/produkte?ok=toggle')
}
