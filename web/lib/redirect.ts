import { NextResponse } from 'next/server'

/** Baut IMMER eine absolute URL basierend auf req.url (nie selbst Host/Port bauen). */
export function to(req: Request, pathname: string, params?: Record<string, string>) {
  const url = new URL(pathname, req.url)
  if (params) for (const [k, v] of Object.entries(params)) if (v != null) url.searchParams.set(k, v)
  return url
}

/** 303 Redirect (POST → GET) auf Ziel */
export function seeOther(req: Request, pathname: string, params?: Record<string, string>) {
  return NextResponse.redirect(to(req, pathname, params), { status: 303 })
}

/** Shortcuts für /verbuchen Feedback */
export const ok  = (req: Request, tag: 'single'|'crate'|'issue') => seeOther(req, '/verbuchen', { ok: tag })
export const err = (req: Request, msg: string)                          => seeOther(req, '/verbuchen', { err: msg })
