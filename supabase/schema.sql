-- Паспорт дома — Database Schema

-- Houses
create table if not exists houses (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  address text,
  city text,
  house_type text not null default 'house',
  area numeric,
  year_built integer,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table houses enable row level security;
create policy "Users can manage own houses" on houses
  for all using (auth.uid() = user_id);

-- House members (shared access)
create table if not exists house_members (
  id uuid default gen_random_uuid() primary key,
  house_id uuid references houses(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade,
  email text not null,
  role text not null default 'viewer',
  invited_at timestamptz default now() not null,
  accepted boolean default false
);

alter table house_members enable row level security;
create policy "House owners can manage members" on house_members
  for all using (
    exists (select 1 from houses where houses.id = house_members.house_id and houses.user_id = auth.uid())
  );
create policy "Members can view own membership" on house_members
  for select using (auth.uid() = user_id);

-- Systems
create table if not exists systems (
  id uuid default gen_random_uuid() primary key,
  house_id uuid references houses(id) on delete cascade not null,
  category text not null,
  name text not null,
  model text,
  installed_at date,
  last_maintenance_at date,
  maintenance_interval_months integer,
  next_maintenance_at date,
  status text not null default 'ok',
  notes text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table systems enable row level security;
create policy "Users can manage systems of own houses" on systems
  for all using (
    exists (select 1 from houses where houses.id = systems.house_id and houses.user_id = auth.uid())
  );

-- Masters
create table if not exists masters (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  phone text,
  specialization text,
  notes text,
  created_at timestamptz default now() not null
);

alter table masters enable row level security;
create policy "Users can manage own masters" on masters
  for all using (auth.uid() = user_id);

-- Maintenance logs
create table if not exists maintenance_logs (
  id uuid default gen_random_uuid() primary key,
  house_id uuid references houses(id) on delete cascade not null,
  system_id uuid references systems(id) on delete set null,
  master_id uuid references masters(id) on delete set null,
  date date not null,
  type text not null default 'maintenance',
  comment text,
  cost numeric,
  created_at timestamptz default now() not null
);

alter table maintenance_logs enable row level security;
create policy "Users can manage logs of own houses" on maintenance_logs
  for all using (
    exists (select 1 from houses where houses.id = maintenance_logs.house_id and houses.user_id = auth.uid())
  );

-- Reminders
create table if not exists reminders (
  id uuid default gen_random_uuid() primary key,
  house_id uuid references houses(id) on delete cascade not null,
  system_id uuid references systems(id) on delete set null,
  title text not null,
  description text,
  due_date date not null,
  is_auto boolean default false,
  completed boolean default false,
  created_at timestamptz default now() not null
);

alter table reminders enable row level security;
create policy "Users can manage reminders of own houses" on reminders
  for all using (
    exists (select 1 from houses where houses.id = reminders.house_id and houses.user_id = auth.uid())
  );

-- Expenses
create table if not exists expenses (
  id uuid default gen_random_uuid() primary key,
  house_id uuid references houses(id) on delete cascade not null,
  system_id uuid references systems(id) on delete set null,
  maintenance_log_id uuid references maintenance_logs(id) on delete set null,
  date date not null,
  amount numeric not null,
  category text,
  comment text,
  created_at timestamptz default now() not null
);

alter table expenses enable row level security;
create policy "Users can manage expenses of own houses" on expenses
  for all using (
    exists (select 1 from houses where houses.id = expenses.house_id and houses.user_id = auth.uid())
  );

-- Documents
create table if not exists documents (
  id uuid default gen_random_uuid() primary key,
  house_id uuid references houses(id) on delete cascade not null,
  system_id uuid references systems(id) on delete set null,
  maintenance_log_id uuid references maintenance_logs(id) on delete set null,
  name text not null,
  type text not null default 'other',
  file_url text not null,
  file_size bigint,
  created_at timestamptz default now() not null
);

alter table documents enable row level security;
create policy "Users can manage documents of own houses" on documents
  for all using (
    exists (select 1 from houses where houses.id = documents.house_id and houses.user_id = auth.uid())
  );

-- Storage bucket for documents
insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict do nothing;

create policy "Users can upload documents" on storage.objects
  for insert with check (bucket_id = 'documents' and auth.role() = 'authenticated');

create policy "Users can view own documents" on storage.objects
  for select using (bucket_id = 'documents' and auth.role() = 'authenticated');

create policy "Users can delete own documents" on storage.objects
  for delete using (bucket_id = 'documents' and auth.role() = 'authenticated');

-- Function to auto-calculate next_maintenance_at
create or replace function calculate_next_maintenance()
returns trigger as $$
begin
  if NEW.last_maintenance_at is not null and NEW.maintenance_interval_months is not null then
    NEW.next_maintenance_at := NEW.last_maintenance_at + (NEW.maintenance_interval_months || ' months')::interval;
  end if;
  NEW.updated_at := now();
  return NEW;
end;
$$ language plpgsql;

create trigger systems_calculate_maintenance
  before insert or update on systems
  for each row execute function calculate_next_maintenance();

-- Function to update houses.updated_at
create or replace function update_house_timestamp()
returns trigger as $$
begin
  NEW.updated_at := now();
  return NEW;
end;
$$ language plpgsql;

create trigger houses_updated_at
  before update on houses
  for each row execute function update_house_timestamp();
