'use client'
import * as React from 'react'

type Props = {
  title?: string
  subtitle?: string
  error?: string | null
  onSubmit: (pin: string) => void | Promise<void>
}

export default function PinPad({ title = 'PIN', subtitle, error, onSubmit }: Props) {
  const [pin, setPin] = React.useState('')

  function push(d: string) {
    setPin((p) => (p.length < 6 ? p + d : p))
  }
  function back() {
    setPin((p) => p.slice(0, -1))
  }
  function clear() {
    setPin('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (pin.length === 6) {
      await onSubmit(pin)
    }
  }

  const num = (n: string) => (
    <button
      type="button"
      className="rounded-xl border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 py-4 text-xl"
      onClick={() => push(n)}
    >
      {n}
    </button>
  )

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <div className="text-sm text-zinc-400">{title}</div>
        {subtitle && <div className="text-xs text-zinc-500">{subtitle}</div>}
        {error && <div className="mt-2 text-sm text-red-300">{error}</div>}
      </div>

      <div className="font-mono tracking-widest text-2xl bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-center">
        {pin.padEnd(6, '•')}
      </div>

      <div className="grid grid-cols-3 gap-2">
        {num('1')}{num('2')}{num('3')}
        {num('4')}{num('5')}{num('6')}
        {num('7')}{num('8')}{num('9')}
        <button type="button" onClick={clear} className="rounded-xl border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 py-4 text-sm">
          Clear
        </button>
        {num('0')}
        <button type="button" onClick={back} className="rounded-xl border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 py-4 text-sm">
          ←
        </button>
      </div>

      <button
        type="submit"
        disabled={pin.length !== 6}
        className="btn btn-primary w-full disabled:opacity-50"
      >
        Einloggen
      </button>
    </form>
  )
}
