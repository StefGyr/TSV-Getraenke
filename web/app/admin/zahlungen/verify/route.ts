import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase-server'
function base(req: Request){ const p=req.headers.get('x-forwarded-proto')??'https'; const h=req.headers.get('x-forwarded-host')??new URL(req.url).host; return `${p}://${h}` }

export async function POST(req: Request){
  const sb = await createSupabaseServer()
  const { data: { user } } = await sb.auth.getUser()
  if(!user) return NextResponse.json({error:'Nicht eingeloggt'},{status:401})
  const { data: me } = await sb.from('profiles').select('role').eq('id', user.id).single()
  if(me?.role!=='admin') return NextResponse.json({error:'Nur Admin'},{status:403})

  const fd = await req.formData()
  const id = Number(fd.get('id'))
  if(!id) return NextResponse.json({error:'id fehlt'},{status:400})

  const { error } = await sb.from('payments').update({
    status: 'verified',
    verified_at: new Date().toISOString(),
    verified_by: user.id,
  }).eq('id', id)
  if (error) return NextResponse.json({error:error.message},{status:500})

  return NextResponse.redirect(`${base(req)}/admin/zahlungen`, { status: 303 })
}
