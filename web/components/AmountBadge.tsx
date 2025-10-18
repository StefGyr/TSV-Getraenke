export default function AmountBadge({ cents }: { cents: number }) {
  const isDebt = cents > 0
  const abs = Math.abs(cents)
  const txt = (abs / 100).toFixed(2).replace('.', ',') + ' €'
  const cls = isDebt
    ? 'border-red-900/40 bg-red-900/20 text-red-300'
    : 'border-emerald-900/40 bg-emerald-900/20 text-emerald-300'
  return (
    <span className={`inline-flex items-center rounded-lg border px-2 py-1 text-sm ${cls}`}>
      {isDebt ? 'Offen: ' : 'Guthaben: '}{txt}
    </span>
  )
}
