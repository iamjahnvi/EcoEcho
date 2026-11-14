-- Public EcoEcho contributions and the images attached to them.
-- Apply this migration to the Supabase project before enabling public sharing.

create table if not exists public.contributions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  display_name text not null,
  photo_path text not null unique,
  task_title text not null check (char_length(btrim(task_title)) between 1 and 120),
  description text check (description is null or char_length(description) <= 500),
  created_at timestamptz not null default now()
);

alter table public.contributions enable row level security;

grant select on public.contributions to anon, authenticated;
grant insert on public.contributions to authenticated;

drop policy if exists "Public can read contributions" on public.contributions;
create policy "Public can read contributions"
  on public.contributions for select
  to anon, authenticated
  using (true);

drop policy if exists "Users can create their own contributions" on public.contributions;
create policy "Users can create their own contributions"
  on public.contributions for insert
  to authenticated
  with check (user_id = (select auth.uid()));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'contribution-photos',
  'contribution-photos',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
)
on conflict (id) do nothing;

drop policy if exists "Authenticated users can upload their contribution photos" on storage.objects;
create policy "Authenticated users can upload their contribution photos"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'contribution-photos'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

drop policy if exists "Owners can remove their contribution photos" on storage.objects;
create policy "Owners can remove their contribution photos"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'contribution-photos'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );
