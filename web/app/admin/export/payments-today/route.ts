// web/app/admin/export/payments-today/route.ts
import { createSupabaseServer } from '@/lib/supabase-server'

export async function GET() {
  const sb = await createSupabaseServer()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })
  const { data: me } = await sb.from('profiles').select('role').eq('id', user.id).single()
  if (me?.role !== 'admin') return new Response('Forbidden', { status: 403 })

  const { data, error } = await sb.rpc('admin_payments_today')
  if (error) return new Response(error.message, { status: 500 })

  const header = ['created_at','user_id','method','amount_cents','status','tip_cents']
  const lines = [header.join(',')]
  for (const r of (data ?? [])) {
    lines.push([
      new Date(r.created_at).toISOString(),
      r.user_id,
      r.method,
      r.amount_cents,
      r.status,
      r.tip_cents,
    ].join(','))
  }
  const csv = lines.join('\n')
  return new Response(csv, {
    status: 200,
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': 'attachment; filename="payments-today.csv"',
    },
  })
}
