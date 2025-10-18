// web/app/layout.tsx
import './globals.css'
import Nav from '@/components/Nav'

export const metadata = {
  title: 'TSV Getränke',
  description: 'Matchday Dark',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" className="dark">
      <body className="min-h-dvh bg-[var(--bg)] text-white">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <header className="flex items-center justify-between gap-4 mb-6">
            <h1 className="text-2xl sm:text-3xl font-semibold">
              TSV Getränke · <span className="text-[var(--primary)]">Matchday</span>
            </h1>
            <Nav />
          </header>
          {children}
        </div>
      </body>
    </html>
  )
}
