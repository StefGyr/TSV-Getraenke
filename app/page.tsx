// app/page.tsx
export default function Page(){
return (
<main className="min-h-dvh grid place-items-center p-8">
<div className="text-center space-y-4">
<h1 className="text-4xl font-semibold">TSV Lonnerstadt</h1>
<p className="text-match-gray">Matchday Dark · Grundgerüst aktiv</p>
<div className="mono text-5xl">€ 0,00</div>
<div className="flex gap-3 justify-center">
<button className="px-4 py-2 rounded-2xl bg-match-green text-black font-semibold">Getränk verbuchen</button>
<button className="px-4 py-2 rounded-2xl border border-white/20">Kiste nutzen</button>
</div>
</div>
</main>
)
}