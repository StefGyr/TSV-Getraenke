'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase-browser'

export default function PasswordResetPage() {
  const router = useRouter()
  const [pw, setPw] = useState('')
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string|null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    ;(async () => {
      // Wichtig: Access-Token aus URL einlösen (ähnlich wie Magic-Link)
      const { error } = await supabase.auth.exchangeCodeForSession(window.location.href)
      if (error) {
        console.error('exchangeCodeForSession', error)
        setErr('Token ungültig oder abgelaufen. Bitte Reset erneut starten.')
        return
      }
      setReady(true)
    })()
  }, [])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setErr(null)
    setLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: pw })
      if (error) throw error
      alert('Passwort aktualisiert. Du kannst dich jetzt einloggen.')
      router.replace('/login-passwort')
    } catch (e: any) {
      setErr(e?.message ?? 'Update fehlgeschlagen')
    } finally {
      setLoading(false)
    }
  }

  if (!ready) {
    return (
      <main className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800">
        <div className="text-zinc-300">Prüfe Berechtigung…</div>
        {err && <div className="text-red-400 text-sm mt-2">{err}</div>}
      </main>
    )
  }

  return (
    <main className="max-w-md mx-auto space-y-4 p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800">
      <h1 className="text-2xl font-semibold">Neues Passwort setzen</h1>
      <form onSubmit={submit} className="grid gap-3">
        <input
          type="password"
          value={pw}
          onChange={(e)=>setPw(e.target.value)}
          placeholder="Neues Passwort"
          className="rounded-xl bg-zinc-900 border border-zinc-800 px-4 py-2"
          required
        />
        <button className="btn-primary" type="submit" disabled={loading}>
          {loading ? 'Aktualisiere…' : 'Passwort speichern'}
        </button>
      </form>
      {err && <div className="text-red-400 text-sm">{err}</div>}
    </main>
  )
}
