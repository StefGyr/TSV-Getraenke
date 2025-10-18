// web/components/SegmentBar.tsx
export default function SegmentBar({ total, remaining }: { total: number; remaining: number }) {
  const filled = Math.max(0, total - remaining)
  const clampedTotal = Math.max(1, Math.min(100, total))
  return (
    <div className="flex gap-[2px]" aria-label={`Kiste: ${filled}/${total} verbraucht`}>
      {Array.from({ length: clampedTotal }).map((_, i) => {
        const used = i < filled
        return (
          <div
            key={i}
            className={`h-2 rounded-sm ${used ? 'bg-[var(--primary)]' : 'bg-zinc-700'}`}
            style={{ width: `${100 / clampedTotal}%` }}
          />
        )
      })}
    </div>
  )
}
