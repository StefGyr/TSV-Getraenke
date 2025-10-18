'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase-browser'

export default function LoginPasswortPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErr(null)
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      window.location.href = '/'
    } catch (e: any) {
      setErr(e?.message ?? 'Login fehlgeschlagen')
    } finally {
      setLoading(false)
    }
  }

  async function sendResetLink() {
    setErr(null)
    if (!email) {
      setErr('Bitte E-Mail eintragen und dann „Passwort zurücksetzen“ klicken.')
      return
    }
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        // Nach Klick in der E-Mail landet man hier:
        redirectTo: `${window.location.origin}/auth/reset`,
      })
      if (error) throw error
      alert('Reset-Link wurde an deine E-Mail gesendet.')
    } catch (e: any) {
      setErr(e?.message ?? 'Konnte Reset-Link nicht senden')
    }
  }

  return (
    <main className="max-w-md mx-auto space-y-4 p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800">
      <h1 className="text-2xl font-semibold">Login (E-Mail & Passwort)</h1>

      <form onSubmit={onSubmit} className="grid gap-3">
        <label className="grid gap-1">
          <span className="text-sm text-zinc-400">E-Mail</span>
          <input
            type="email"
            value={email}
            onChange={(e)=>setEmail(e.target.value)}
            placeholder="dein.name@verein.de"
            className="rounded-xl bg-zinc-900 border border-zinc-800 px-4 py-2 outline-none focus:border-[var(--primary)]"
            required
          />
        </label>

        <label className="grid gap-1">
          <span className="text-sm text-zinc-400">Passwort</span>
          <div className="flex gap-2">
            <input
              type={showPw ? 'text' : 'password'}
              value={password}
              onChange={(e)=>setPassword(e.target.value)}
              placeholder="••••••••"
              className="flex-1 rounded-xl bg-zinc-900 border border-zinc-800 px-4 py-2 outline-none focus:border-[var(--primary)]"
              required
            />
            <button
              type="button"
              onClick={()=>setShowPw(s=>!s)}
              className="btn-ghost whitespace-nowrap"
              aria-pressed={showPw}
              title={showPw ? 'Passwort verbergen' : 'Passwort anzeigen'}
            >
              {showPw ? 'Verbergen' : 'Anzeigen'}
            </button>
          </div>
        </label>

        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Melde an…' : 'Einloggen'}
        </button>
      </form>

      <div className="flex items-center justify-between text-sm">
        <button onClick={sendResetLink} className="nav-link" type="button">
          Passwort zurücksetzen
        </button>
        <div className="flex gap-3">
          <a href="/login" className="nav-link">Magic-Link / Code</a>
          <a href="/register" className="nav-link">Registrieren</a>
        </div>
      </div>

      {err && <div className="text-red-400 text-sm">{err}</div>}
    </main>
  )
}
