'use client'

import * as React from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase-browser' // <— Browser-Client

type Mode = 'login' | 'register'

export default function LoginPage() {
  const router = useRouter()
  const sp = useSearchParams()
  const next = sp?.get('next') || '/'
  const [mode, setMode] = React.useState<Mode>('login')
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [ok, setOk] = React.useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setOk(null)
    setLoading(true)
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        // Erfolgreich → weiterleiten
        router.push(next)
        router.refresh()
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: email.split('@')[0] ?? '' }, // kann später auf der /ich Seite editiert werden
          },
        })
        if (error) throw error
        setOk('Registrierung erfolgreich. Bitte E-Mail bestätigen und dann einloggen.')
        setMode('login')
      }
    } catch (err: any) {
      setError(err?.message || 'Fehler bei der Anmeldung')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="max-w-md mx-auto space-y-6">
      <section className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800">
        <div className="text-xs text-zinc-400">TSV Getränke</div>
        <h1 className="text-xl font-semibold">Login</h1>
        <p className="text-sm text-zinc-400 mt-1">
          {mode === 'login'
            ? 'Mit E-Mail & Passwort einloggen'
            : 'Neues Konto registrieren'}
        </p>
      </section>

      <section className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800">
        {/* Tabs */}
        <div className="mb-4 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setMode('login')}
            className={`px-3 py-2 rounded-xl border ${
              mode === 'login'
                ? 'bg-emerald-900/30 border-emerald-600 text-emerald-200'
                : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800'
            }`}
          >
            Einloggen
          </button>
          <button
            type="button"
            onClick={() => setMode('register')}
            className={`px-3 py-2 rounded-xl border ${
              mode === 'register'
                ? 'bg-emerald-900/30 border-emerald-600 text-emerald-200'
                : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800'
            }`}
          >
            Registrieren
          </button>
        </div>

        {/* Form */}
        <form onSubmit={onSubmit} className="space-y-3">
          <div>
            <label className="block text-xs text-zinc-400 mb-1">E-Mail</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl bg-zinc-900 border border-zinc-800 px-3 py-2 outline-none focus:border-emerald-600"
              placeholder="dein.name@verein.de"
            />
          </div>

          <div>
            <label className="block text-xs text-zinc-400 mb-1">Passwort</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl bg-zinc-900 border border-zinc-800 px-3 py-2 outline-none focus:border-emerald-600"
              placeholder="••••••••"
            />
            <div className="text-[11px] text-zinc-500 mt-1">
              Mindestens 6 Zeichen.
            </div>
          </div>

          {error && (
            <div className="text-sm text-red-300 border border-red-600/40 bg-red-900/20 rounded-xl px-3 py-2">
              {error}
            </div>
          )}
          {ok && (
            <div className="text-sm text-emerald-300 border border-emerald-600/40 bg-emerald-900/20 rounded-xl px-3 py-2">
              {ok}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 disabled:opacity-60 disabled:hover:bg-emerald-700"
          >
            {loading
              ? (mode === 'login' ? 'Einloggen …' : 'Registrieren …')
              : (mode === 'login' ? 'Einloggen' : 'Registrieren')}
          </button>
        </form>

        {/* Hinweis Weiterleitung */}
        <div className="text-[11px] text-zinc-500 mt-3">
          Nach Erfolg: Weiterleitung zu <code>{next}</code>
        </div>
      </section>

      <section className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800">
        <div className="text-xs text-zinc-400 mb-1">Tipp</div>
        <div className="text-sm text-zinc-300">
          Der Magic-Link-Login wurde hier absichtlich weggelassen, um die früheren
          PKCE/Callback-Fehler zu vermeiden. Wir können ihn später sauber ergänzen.
        </div>
      </section>
    </main>
  )
}
