-- Demo-Katalog (tenant_id = Standard-UUID für VITE_DEFAULT_TENANT_ID)
-- Alle INSERTs idempotent wo möglich.

insert into public.tenants (id, name, slug, domain, active)
values (
  '00000000-0000-0000-0000-000000000001',
  'Köfteman Demo',
  'koefteman',
  null,
  true
)
on conflict (id) do nothing;

insert into public.tenant_settings (
  tenant_id,
  primary_color,
  secondary_color,
  background_color,
  accent_color
)
select
  '00000000-0000-0000-0000-000000000001',
  '#CC2A40',
  '#183052',
  '#F5EFE4',
  '#62E6BE'
where not exists (
  select 1
  from public.tenant_settings ts
  where ts.tenant_id = '00000000-0000-0000-0000-000000000001'
);

-- Kategorien
insert into public.categories (id, tenant_id, name, name_tr, name_en, sort_order, active)
values
  (
    '10000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    'Vom Grill',
    'Izgaradan',
    'From the grill',
    1,
    true
  ),
  (
    '10000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000001',
    'Beilagen',
    'Garnitürler',
    'Sides',
    2,
    true
  ),
  (
    '10000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000001',
    'Getränke',
    'İçecekler',
    'Drinks',
    3,
    true
  )
on conflict (id) do nothing;

-- Produkte
insert into public.products (
  id,
  tenant_id,
  category_id,
  name,
  name_tr,
  name_en,
  description,
  description_tr,
  description_en,
  price,
  price_old,
  tax_rate,
  main_image_url,
  image_2_url,
  image_3_url,
  image_4_url,
  video_url,
  allergens,
  calories,
  sort_order,
  is_featured,
  popularity_count,
  active
)
values
  (
    '20000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001',
    'Köfte-Teller',
    'Köfte tabağı',
    'Köfte plate',
    'Rindfleisch-Köfte mit Reis, Salat und Joghurtsoße.',
    'Pilav, salata ve yoğurt sosu ile dana köfte.',
    'Beef köfte with rice, salad and yogurt sauce.',
    12.9,
    14.5,
    7.0,
    'https://picsum.photos/seed/lekkr1/800/600',
    'https://picsum.photos/seed/lekkr1b/800/600',
    null,
    null,
    'https://www.w3schools.com/html/mov_bbb.mp4',
    array['gluten', 'milk']::text[],
    720,
    1,
    true,
    142,
    true
  ),
  (
    '20000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001',
    'Lahmacun',
    'Lahmacun',
    'Lahmacun',
    'Dünn belegt, knusprig aus dem Steinofen.',
    'İnce hamur, taş fırında.',
    'Thin crust, stone oven baked.',
    6.5,
    null,
    7.0,
    'https://picsum.photos/seed/lekkr2/800/600',
    null,
    null,
    null,
    null,
    array['gluten']::text[],
    410,
    2,
    true,
    98,
    true
  ),
  (
    '20000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000002',
    'Cacık',
    'Cacık',
    'Cacık',
    'Joghurt mit Gurke und Knoblauch.',
    'Salatalık ve sarımsaklı yoğurt.',
    'Yogurt with cucumber and garlic.',
    4.2,
    null,
    7.0,
    'https://picsum.photos/seed/lekkr3/800/600',
    null,
    null,
    null,
    null,
    array['milk']::text[],
    120,
    1,
    false,
    34,
    true
  ),
  (
    '20000000-0000-0000-0000-000000000004',
    '00000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000003',
    'Ayran',
    'Ayran',
    'Ayran',
    '375 ml',
    '375 ml',
    '375 ml',
    2.9,
    null,
    7.0,
    'https://picsum.photos/seed/lekkr4/800/600',
    null,
    null,
    null,
    null,
    array['milk']::text[],
    90,
    1,
    false,
    210,
    true
  )
on conflict (id) do nothing;
