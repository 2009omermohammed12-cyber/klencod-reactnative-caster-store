-- كاستر ستور: قاعدة البيانات (Supabase). شغّل هذا الملف كاملاً في SQL Editor.

create extension if not exists pgcrypto;

-- ============ الملفات الشخصية ============
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  phone text,
  full_name text,
  role text not null default 'customer' check (role in ('customer', 'owner')),
  created_at timestamptz not null default now()
);

create or replace function public.my_role() returns text
language sql security definer stable set search_path = public as $$
  select role from public.profiles where id = auth.uid()
$$;

create or replace function public.is_owner() returns boolean
language sql security definer stable set search_path = public as $$
  select coalesce((select role = 'owner' from public.profiles where id = auth.uid()), false)
$$;

-- إنشاء ملف شخصي تلقائياً دائماً كزبون. المالك يُنشأ فقط عبر create-owner.sql (لا ترقية تلقائية بالبريد).
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  is_phone boolean := new.email like '%@phone.casterstore.app';
begin
  insert into public.profiles (id, email, phone, role) values (
    new.id,
    case when is_phone then null else new.email end,
    case when is_phone then split_part(new.email, '@', 1) else null end,
    'customer'
  );
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
create policy "profiles read own or owner" on public.profiles for select
  using (id = auth.uid() or public.is_owner());
create policy "profiles update own" on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid() and role = public.my_role());

-- ============ المنتجات ============
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  name text not null,
  description text not null default '',
  price numeric not null check (price >= 0),
  old_price numeric,
  media jsonb not null default '[]',   -- [{type:'image'|'video', url:'...'}]
  links jsonb not null default '[]',   -- [{title:'...', url:'...'}]
  featured boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.products enable row level security;
create policy "products read" on public.products for select using (active or public.is_owner());
create policy "products owner insert" on public.products for insert with check (public.is_owner());
create policy "products owner update" on public.products for update using (public.is_owner());
create policy "products owner delete" on public.products for delete using (public.is_owner());

-- ============ الطلبات ============
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null, -- عند حذف الحساب يبقى سجل الطلب بدون ربط
  full_name text not null,
  phone text not null,
  phone2 text,
  notes text,
  governorate text not null,
  area text not null,
  landmark text,
  items jsonb not null,                -- [{id,name,qty,price}]
  subtotal numeric not null,
  delivery_fee numeric not null,
  total numeric not null,
  status text not null default 'pending'
    check (status in ('pending', 'packing', 'delivering', 'delivered', 'rejected')),
  reject_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.orders enable row level security;
create policy "orders read own or owner" on public.orders for select
  using (user_id = auth.uid() or public.is_owner());
create policy "orders insert own" on public.orders for insert
  with check (user_id = auth.uid() and status = 'pending');
create policy "orders owner update" on public.orders for update using (public.is_owner());

-- ============ الدعم (محادثة سرية بين كل مستخدم والمالك) ============
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references auth.users(id) on delete cascade, -- صاحب المحادثة
  sender_id uuid not null references auth.users(id) on delete cascade,
  sender_role text not null check (sender_role in ('customer', 'owner')),
  body text,
  image_path text,
  read_by_owner boolean not null default false,
  read_by_customer boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists messages_customer_idx on public.messages (customer_id, created_at);
alter table public.messages enable row level security;
create policy "messages read own or owner" on public.messages for select
  using (customer_id = auth.uid() or public.is_owner());
create policy "messages insert" on public.messages for insert with check (
  (customer_id = auth.uid() and sender_id = auth.uid() and sender_role = 'customer')
  or (public.is_owner() and sender_id = auth.uid() and sender_role = 'owner')
);
create policy "messages mark read" on public.messages for update
  using (customer_id = auth.uid() or public.is_owner());

-- ============ الإشعارات (صندوق داخل التطبيق) ============
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade, -- null = للجميع
  kind text not null,
  title text not null,
  body text,
  ref_id text,
  sound text,
  created_at timestamptz not null default now()
);
alter table public.notifications add column if not exists sound text;
alter table public.notifications enable row level security;
create policy "notifications read" on public.notifications for select
  using (user_id is null or user_id = auth.uid());

-- ============ إعدادات الأصوات (يحددها المالك) ============
create table if not exists public.app_settings (
  id int primary key default 1 check (id = 1),
  sound_order text not null default 'chime',
  sound_message text not null default 'pop',
  sound_reply text not null default 'ding',
  sound_status text not null default 'bell',
  sound_broadcast text not null default 'melody'
);
insert into public.app_settings (id) values (1) on conflict do nothing;
alter table public.app_settings enable row level security;
create policy "settings owner read" on public.app_settings for select using (public.is_owner());
create policy "settings owner update" on public.app_settings for update using (public.is_owner());

-- ============ رموز الإشعارات للأجهزة ============
create table if not exists public.push_tokens (
  token text primary key,
  user_id uuid references auth.users(id) on delete cascade,
  platform text,
  updated_at timestamptz not null default now()
);
alter table public.push_tokens enable row level security; -- بلا سياسات: الوصول عبر الدوال فقط

create or replace function public.register_push_token(p_token text, p_platform text) returns void
language plpgsql security definer set search_path = public as $$
begin
  insert into public.push_tokens (token, user_id, platform) values (p_token, auth.uid(), p_platform)
  on conflict (token) do update set user_id = auth.uid(), platform = excluded.platform, updated_at = now();
end $$;

create or replace function public.delete_push_token(p_token text) returns void
language plpgsql security definer set search_path = public as $$
begin
  delete from public.push_tokens where token = p_token and (user_id is null or user_id = auth.uid());
end $$;

grant execute on function public.register_push_token(text, text) to anon, authenticated;
grant execute on function public.delete_push_token(text) to anon, authenticated;

-- ============ حذف الحساب نهائياً (لا يمكن فتحه مرة أخرى) ============
create or replace function public.delete_my_account() returns void
language plpgsql security definer set search_path = public, auth as $$
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  if public.is_owner() then raise exception 'owner account cannot be deleted'; end if;
  delete from auth.users where id = auth.uid(); -- يحذف الملف الشخصي والمحادثات والإشعارات والأجهزة تلقائياً
end $$;
revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;

-- ============ التخزين (صور وفيديوهات) ============
insert into storage.buckets (id, name, public) values
  ('product-media', 'product-media', true),
  ('chat-media', 'chat-media', false)
on conflict (id) do nothing;

create policy "product media public read" on storage.objects for select
  using (bucket_id = 'product-media');
create policy "product media owner insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'product-media' and public.is_owner());
create policy "product media owner delete" on storage.objects for delete to authenticated
  using (bucket_id = 'product-media' and public.is_owner());

create policy "chat media read" on storage.objects for select to authenticated
  using (bucket_id = 'chat-media' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_owner()));
create policy "chat media insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'chat-media' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_owner()));

-- ============ التحديث الفوري ============
alter publication supabase_realtime add table public.messages, public.orders, public.notifications, public.products;

-- ============ إدارة الإشعارات المنشورة (تعديل/حذف) ============
drop policy if exists "notifications owner update" on public.notifications;
create policy "notifications owner update" on public.notifications for update using (public.is_owner());
drop policy if exists "notifications owner delete" on public.notifications;
create policy "notifications owner delete" on public.notifications for delete using (public.is_owner());

-- ============ أصوات إشعارات يرفعها المالك من جهازه ============
create table if not exists public.custom_sounds (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  url text not null,
  path text not null,
  push_sound text not null default 'chime',  -- صوت بديل للإشعار والتطبيق مغلق
  created_at timestamptz not null default now()
);
alter table public.custom_sounds enable row level security;
create policy "custom sounds read" on public.custom_sounds for select using (true);
create policy "custom sounds owner write" on public.custom_sounds for all using (public.is_owner()) with check (public.is_owner());
insert into storage.buckets (id, name, public) values ('sounds', 'sounds', true) on conflict (id) do nothing;
create policy "sounds public read" on storage.objects for select using (bucket_id = 'sounds');
create policy "sounds owner insert" on storage.objects for insert to authenticated with check (bucket_id = 'sounds' and public.is_owner());
create policy "sounds owner delete" on storage.objects for delete to authenticated using (bucket_id = 'sounds' and public.is_owner());

