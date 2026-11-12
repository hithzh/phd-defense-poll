-- ============================================================
-- PhD Thesis Defense Date Poll — 数据库初始化脚本
-- 在 Supabase Dashboard → SQL Editor 中完整粘贴并运行一次
-- ============================================================

-- 1. 创建 availability 表（初始为空，三位老师都还没有任何标记）
create table if not exists public.availability (
  id uuid primary key default gen_random_uuid(),
  member_index int not null check (member_index in (0, 1, 2)),  -- 0=Zhang Qichun 1=Li Quan 2=YU Wing Chi
  day int not null check (day between 1 and 31),                -- 2026 年 12 月的某一天
  created_at timestamptz not null default now(),
  unique (member_index, day)
);

-- 2. 启用 RLS 并放行匿名读写（页面无登录，anon key 直接访问；
--    仅三位老师使用、无敏感数据，放行是安全的）
alter table public.availability enable row level security;

drop policy if exists "anon can select" on public.availability;
create policy "anon can select" on public.availability
  for select using (true);

drop policy if exists "anon can insert" on public.availability;
create policy "anon can insert" on public.availability
  for insert with check (true);

drop policy if exists "anon can delete" on public.availability;
create policy "anon can delete" on public.availability
  for delete using (true);

-- 3. 把表加入 realtime 发布（实时同步必需；幂等写法，可重复执行）
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'availability'
  ) then
    alter publication supabase_realtime add table public.availability;
  end if;
end $$;
