// app/layout.tsx
import './globals.css'
import { Inter } from 'next/font/google'
import React from 'react'


const inter = Inter({ subsets: ['latin'] })


export const metadata = {
title: 'Getränke im Sportheim – TSV Lonnerstadt',
description: 'Matchday Dark UI',
}


export default function RootLayout({ children }: { children: React.ReactNode }) {
return (
<html lang="de" className="dark">
<body className={`${inter.className} bg-match-bg text-white`}>{children}</body>
</html>
)
}