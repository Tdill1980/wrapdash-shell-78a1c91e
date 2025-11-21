-- Design Panels Storage
create table design_panels (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  organization_id uuid references organizations(id) on delete cascade,
  
  vehicle_id uuid references vehicle_models(id),
  vehicle_make text,
  vehicle_model text,
  vehicle_year text,
  
  style text not null,
  substyle text,
  intensity text,
  
  width_inches numeric not null,
  height_inches numeric not null,
  
  thumbnail_url text,
  panel_preview_url text not null,
  panel_3d_url text,
  tiff_url text,
  
  metadata jsonb default '{}'::jsonb,
  
  folder_id uuid,
  tags text[] default array[]::text[],
  
  is_template boolean default false,
  is_shared boolean default false,
  
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Design Panel Folders
create table design_panel_folders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  organization_id uuid references organizations(id) on delete cascade,
  
  name text not null,
  description text,
  color text,
  
  parent_folder_id uuid references design_panel_folders(id) on delete cascade,
  
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Design Panel Versions
create table design_panel_versions (
  id uuid primary key default gen_random_uuid(),
  panel_id uuid references design_panels(id) on delete cascade not null,
  
  version_number integer not null,
  panel_preview_url text not null,
  panel_3d_url text,
  tiff_url text,
  
  changes_description text,
  metadata jsonb default '{}'::jsonb,
  
  created_at timestamp with time zone default now()
);

-- Enable RLS
alter table design_panels enable row level security;
alter table design_panel_folders enable row level security;
alter table design_panel_versions enable row level security;

-- RLS Policies for design_panels
create policy "Users can view their own panels"
on design_panels for select
using (auth.uid() = user_id);

create policy "Users can view shared panels"
on design_panels for select
using (is_shared = true);

create policy "Users can insert their own panels"
on design_panels for insert
with check (auth.uid() = user_id);

create policy "Users can update their own panels"
on design_panels for update
using (auth.uid() = user_id);

create policy "Users can delete their own panels"
on design_panels for delete
using (auth.uid() = user_id);

-- RLS Policies for design_panel_folders
create policy "Users can view their own folders"
on design_panel_folders for select
using (auth.uid() = user_id);

create policy "Users can insert their own folders"
on design_panel_folders for insert
with check (auth.uid() = user_id);

create policy "Users can update their own folders"
on design_panel_folders for update
using (auth.uid() = user_id);

create policy "Users can delete their own folders"
on design_panel_folders for delete
using (auth.uid() = user_id);

-- RLS Policies for design_panel_versions
create policy "Users can view versions of their panels"
on design_panel_versions for select
using (
  panel_id in (
    select id from design_panels where user_id = auth.uid()
  )
);

create policy "Users can insert versions of their panels"
on design_panel_versions for insert
with check (
  panel_id in (
    select id from design_panels where user_id = auth.uid()
  )
);

-- Indexes for performance
create index idx_design_panels_user_id on design_panels(user_id);
create index idx_design_panels_vehicle_id on design_panels(vehicle_id);
create index idx_design_panels_folder_id on design_panels(folder_id);
create index idx_design_panels_created_at on design_panels(created_at desc);
create index idx_design_panels_tags on design_panels using gin(tags);

create index idx_design_panel_folders_user_id on design_panel_folders(user_id);
create index idx_design_panel_folders_parent on design_panel_folders(parent_folder_id);

create index idx_design_panel_versions_panel_id on design_panel_versions(panel_id);

-- Update timestamp trigger
create or replace function update_design_panels_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_design_panels_updated_at
before update on design_panels
for each row
execute function update_design_panels_updated_at();

create trigger update_design_panel_folders_updated_at
before update on design_panel_folders
for each row
execute function update_design_panels_updated_at();