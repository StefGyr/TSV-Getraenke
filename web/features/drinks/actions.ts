'use server'

import { createSupabaseServer } from '@/lib/supabase-server'

async function ensureAdmin(sb: ReturnType<typeof createSupabaseServer> | any) {
  const { data: { user } } = await sb.auth.getUser()
  if (!user) throw new Error('Nicht eingeloggt')
  const { data: me } = await sb.from('profiles').select('role').eq('id', user.id).single()
  if (me?.role !== 'admin') throw new Error('Nur Admin')
  return user.id as string
}

export async function addDrink({
  name, unit, segmentsPerCrate = 20, priceCents,
}: {
  name: string; unit: string; segmentsPerCrate?: number; priceCents: number;
}) {
  const sb = await createSupabaseServer()
  await ensureAdmin(sb)
  const { data, error } = await sb.from('drinks').insert({
    name, unit, segments_per_crate: segmentsPerCrate, is_active: true,
  }).select('id').single()
  if (error) throw error
  await sb.from('prices').insert({ drink_id: data!.id, price_cents: priceCents })
}

export async function setPrice({
  drinkId, priceCents,
}: { drinkId: string; priceCents: number }) {
  const sb = await createSupabaseServer()
  await ensureAdmin(sb)
  const { error } = await sb.from('prices').insert({
    drink_id: drinkId, price_cents: priceCents,
  })
  if (error) throw error
}

export async function toggleActive({
  drinkId, isActive,
}: { drinkId: string; isActive: boolean }) {
  const sb = await createSupabaseServer()
  await ensureAdmin(sb)
  const { error } = await sb.from('drinks')
    .update({ is_active: isActive })
    .eq('id', drinkId)
  if (error) throw error
}
