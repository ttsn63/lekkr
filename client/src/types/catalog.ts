/** Zeilen aus public.categories – Abfragen immer mit .eq('tenant_id', …) */
export type CategoryRow = {
  id: string
  tenant_id: string
  name: string
  name_tr: string | null
  name_en: string | null
  sort_order: number
  active: boolean
  created_at: string
}

/** Zeilen aus public.products */
export type ProductRow = {
  id: string
  tenant_id: string
  category_id: string | null
  name: string
  name_tr: string | null
  name_en: string | null
  description: string | null
  description_tr: string | null
  description_en: string | null
  price: number
  price_old: number | null
  tax_rate: number
  main_image_url: string | null
  image_2_url: string | null
  image_3_url: string | null
  image_4_url: string | null
  video_url: string | null
  allergens: string[] | null
  calories: number | null
  sort_order: number
  is_featured: boolean
  popularity_count: number
  active: boolean
  created_at: string
}
