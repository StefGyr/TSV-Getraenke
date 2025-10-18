'use client'
import * as React from 'react'

export default function ProfileAndPinForms({
  initialName,
}: {
  initialName: string | null
}) {
  const [name, setName] = React.useState(initialName ?? '')
  const [pin, setPin] = React.useState('')
  const [m1, setM1] = React.useState<string | null>(null)
  const [m2, setM2] = React.useState<string | null>(null)
  const [loading1, setLoading1] = React.useState(false)
  const [loading2, setLoading2] = React.useState(false)

  async function submitName(e: React.FormEvent) {
    e.preventDefault()
    setM1(null); setLoading1(true)
    try {
      const fd = new FormData()
      fd.set('full_name', name)
      const res = await fetch('/api/profile/update-name', { method: 'POST', body: fd })
      if (!res.ok) throw new Error(await res.text())
      setM1('Name gespeichert.')
    } catch (err:any) {
      setM1('Fehler: ' + err.message)
    } finally {
      setLoading1(false)
    }
  }

  async function submitPin(e: React.FormEvent) {
    e.preventDefault()
    setM2(null); setLoading2(true)
    try {
      const fd = new FormData()
      fd.set('pin', pin)
      const res = await fetch('/api/profile/set-pin', { method: 'POST', body: fd })
      if (!res.ok) throw new Error(await res.text())
      setM2('PIN gesetzt.')
      setPin('')
    } catch (err:any) {
      setM2('Fehler: ' + err.message)
    } finally {
      setLoading2(false)
    }
  }

  return (
    <div className="grid sm:grid-cols-2 gap-4">
      {/* Name */}
      <form onSubmit={submitName} className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-2">
        <div className="text-sm font-semibold">Profil</div>
        <label className="text-xs text-zinc-400">Vollständiger Name</label>
        <input
          className="input"
          value={name}
          onChange={(e)=>setName(e.target.value)}
          placeholder="Max Muster"
          name="full_name"
          required
        />
        <button className="btn btn-primary w-full" disabled={loading1} type="submit">
          {loading1 ? 'Speichern…' : 'Speichern'}
        </button>
        {m1 && <div className="text-xs text-zinc-400">{m1}</div>}
      </form>

      {/* PIN */}
      <form onSubmit={submitPin} className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-2">
        <div className="text-sm font-semibold">Terminal-PIN</div>
        <label className="text-xs text-zinc-400">Neue PIN (4–6 Ziffern)</label>
        <input
          className="input"
          value={pin}
          onChange={(e)=>setPin(e.target.value.replace(/\D/g,''))}
          inputMode="numeric"
          minLength={4}
          maxLength={6}
          placeholder="••••"
          name="pin"
          required
        />
        <button className="btn btn-primary w-full" disabled={loading2} type="submit">
          {loading2 ? 'Setze PIN…' : 'PIN setzen'}
        </button>
        {m2 && <div className="text-xs text-zinc-400">{m2}</div>}
      </form>
    </div>
  )
}
