'use server'

import { createSupabaseServer } from '@/lib/supabase-server'

export async function createCrate({ drinkId, totalSegments }:{
  drinkId: string
  totalSegments: number
}) {
  const sb = await createSupabaseServer()
  const { data: { user } } = await sb.auth.getUser()
  if(!user) throw new Error('Nicht eingeloggt')

  // Admin-Check
  const { data: me } = await sb.from('profiles').select('role').eq('id', user.id).single()
  if(me?.role !== 'admin') throw new Error('Nur Admin')

  const { error } = await sb.from('crates').insert({
    drink_id: drinkId,
    total_segments: totalSegments,
    remaining_segments: totalSegments,
    created_by: user.id,
  })
  if(error) throw error
}

export async function takeFromCrate({
  crateId, drinkId, qty
}:{
  crateId: string, drinkId: string, qty: number
}){
  const sb = await createSupabaseServer()
  const { data: { user } } = await sb.auth.getUser()
  if(!user) throw new Error('Nicht eingeloggt')

  // Einzelpreis holen
  const { data: price, error: pe } = await sb
    .from('current_prices').select('price_cents').eq('drink_id', drinkId).single()
  if(pe) throw pe

  // Transaktion über SQL Function (dekrementiert Segmente + schreibt consumption)
  const { error } = await sb.rpc('tx_take_from_crate', {
    p_crate_id: crateId,
    p_user_id: user.id,
    p_drink_id: drinkId,
    p_qty: qty,
    p_unit_price: price?.price_cents ?? 0,
  })
  if(error) throw error
}
