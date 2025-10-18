'use server'
import { createSupabaseServer } from '@/lib/supabase-server'

export async function bookDrink({
  drinkId,
  quantity,
}: { drinkId: string; quantity: number }) {
  const sb = await createSupabaseServer()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) throw new Error('Nicht eingeloggt')

  const { data: price, error: priceErr } = await sb
    .from('current_prices')
    .select('price_cents')
    .eq('drink_id', drinkId)
    .single()
  if (priceErr) throw priceErr
  const unit = price?.price_cents ?? 0

  const { error: insErr } = await sb.from('consumptions').insert({
    user_id: user.id,
    drink_id: drinkId,
    quantity,
    source: 'single',
    unit_price_cents: unit,
  })
  if (insErr) throw insErr
}
