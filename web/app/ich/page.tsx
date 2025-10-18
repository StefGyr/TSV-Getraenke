import { createSupabaseServer } from '@/lib/supabase-server'
import ProfileAndPinForms from '@/components/ich/ProfileAndPinForms'
import PaymentReportForm from '@/components/ich/PaymentReportForm'

export const revalidate = 0

function euro(n: number = 0) {
  return (Math.round(n) / 100).toFixed(2).replace('.', ',') + ' €'
}

export default async function IchPage() {
  const sb = createSupabaseServer()
  const { data: { user } } = await (await sb).auth.getUser()
  if (!user) {
    return (
      <main className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800">
        Bitte einloggen · <a className="underline" href="/login?next=/ich">Login</a>
      </main>
    )
  }

  const [
    { data: profile },
    { data: balanceRows },
    { data: payments },
  ] = await Promise.all([
    (await sb).from('profiles').select('full_name').eq('id', user.id).single(),
    (await sb).from('balances_view').select('user_id, balance_cents').eq('user_id', user.id),
    (await sb).from('payments')
      .select('id, amount_cents, tip_cents, method, status, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
  ])

  const balance = balanceRows?.[0]?.balance_cents ?? 0
  const paypalLink = process.env.NEXT_PUBLIC_PAYPAL_LINK

  return (
    <main className="space-y-6">
      {/* Meine Daten / Saldo */}
      <section className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-zinc-400">Ich</div>
            <div className="text-xl font-semibold">Meine Daten</div>
            <div className="text-xs text-zinc-500">{user.email}</div>
          </div>
          <div className={`px-3 py-2 rounded-xl border text-sm
            ${balance > 0 ? 'border-red-400/40 bg-red-400/10 text-red-200' : 'border-emerald-400/40 bg-emerald-400/10 text-emerald-200'}`}>
            {balance > 0 ? 'Offen: ' : 'Guthaben: '}{euro(Math.abs(balance))}
          </div>
        </div>
      </section>

      {/* Profile + PIN (Client-Formulare) */}
      <ProfileAndPinForms initialName={profile?.full_name ?? ''} />

      {/* Zahlung melden */}
      <PaymentReportForm paypalLink={paypalLink} />

      {/* Meine Zahlungen */}
      <section className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
        <div className="text-sm font-semibold mb-2">Meine Zahlungen</div>
        <div className="space-y-2">
          {(payments ?? []).length === 0 && (
            <div className="text-sm text-zinc-400">Noch keine Zahlungen.</div>
          )}
          {(payments ?? []).map((p:any)=> (
            <div key={p.id} className="flex items-center justify-between border border-zinc-800 rounded-xl px-3 py-2">
              <div>
                <div className="text-sm">{p.method} · {p.status}</div>
                <div className="text-xs text-zinc-500">{new Date(p.created_at).toLocaleString('de-DE')}</div>
              </div>
              <div className="text-sm">
                {euro(p.amount_cents)}
                {p.tip_cents ? <span className="text-zinc-400"> (+ Trinkgeld {euro(p.tip_cents)})</span> : null}
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
