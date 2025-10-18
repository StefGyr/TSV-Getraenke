'use client'
import * as React from 'react'

export default function QtyPicker({ name }: { name: string }) {
  const [qty, setQty] = React.useState<number>(1)

  return (
    <div className="flex gap-2">
      <input
        name={name}
        value={qty}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          setQty(Math.max(1, parseInt(e.target.value || '1', 10) || 1))
        }
        className="input w-16 text-center"
        inputMode="numeric"
        min={1}
      />
      <div className="grid grid-cols-5 gap-1">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
          <button
            type="button"
            key={n}
            className="px-2 py-1 rounded-lg border border-zinc-700 bg-zinc-800 text-sm"
            onClick={() => setQty(n)}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  )
}
