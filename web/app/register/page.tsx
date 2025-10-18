'use client'

import { supabase } from '@/lib/supabase-client'
import Link from 'next/link'
import { useState } from 'react'

export default function RegisterPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [msg, setMsg] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMsg(null); setLoading(true)
    try {
      if (!fullName.trim()) throw new Error('Bitte Name angeben')
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      })
      if (error) throw error
      // Profilname direkt nachschieben (failsafe)
      await fetch('/api/profile/update', {
        method: 'POST',
        headers: { 'Content-Type':'application/json' },
        body: JSON.stringify({ full_name: fullName }),
      })
      setMsg('Registrierung ok. Bitte E-Mail bestätigen und dann einloggen.')
    } catch (err:any) {
      setMsg(err.message || 'Fehler')
    } finally { setLoading(false) }
  }

  return (
    <main className="max-w-md mx-auto space-y-4 p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800">
      <h1 className="text-xl font-semibold">Registrieren</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <label className="block">
          <div className="text-xs text-zinc-400 mb-1">Name (Pflicht)</div>
          <input className="input w-full" value={fullName} onChange={e=>setFullName(e.target.value)} required />
        </label>
        <label className="block">
          <div className="text-xs text-zinc-400 mb-1">E-Mail</div>
          <input className="input w-full" type="email" value={email} onChange={e=>setEmail(e.target.value)} required />
        </label>
        <label className="block">
          <div className="text-xs text-zinc-400 mb-1">Passwort</div>
          <input className="input w-full" type="password" value={password} onChange={e=>setPassword(e.target.value)} required />
        </label>
        <button className="btn btn-primary" disabled={loading} type="submit">{loading ? '...' : 'Konto erstellen'}</button>
      </form>
      <div className="text-sm text-zinc-400">Schon ein Konto? <Link className="underline" href="/login">Login</Link></div>
      {msg && <div className="text-sm">{msg}</div>}
    </main>
  )
}
