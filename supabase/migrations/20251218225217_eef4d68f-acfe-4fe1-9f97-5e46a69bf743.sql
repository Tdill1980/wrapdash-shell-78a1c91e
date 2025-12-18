-- ContentBox Assets table for managing all media assets
create table if not exists contentbox_assets (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id),
  source text not null, -- 'agent-chat', 'upload', 'import'
  asset_type text not null, -- 'video' | 'image'
  file_url text not null,
  original_name text,
  tags text[] default '{}',
  scanned boolean default false,
  scan_status text default 'pending', -- pending | scanning | ready | error
  duration_seconds integer,
  width integer,
  height integer,
  created_at timestamptz default now()
);

-- Indexes for performance
create index if not exists idx_contentbox_assets_org on contentbox_assets (organization_id);
create index if not exists idx_contentbox_assets_scan on contentbox_assets (scanned, scan_status);

-- Enable RLS
alter table contentbox_assets enable row level security;

-- RLS policies
create policy "Users can view assets in their organization"
  on contentbox_assets for select
  using ((organization_id = get_user_organization_id()) or (organization_id is null));

create policy "Users can insert assets in their organization"
  on contentbox_assets for insert
  with check ((organization_id = get_user_organization_id()) or (organization_id is null));

create policy "Users can update assets in their organization"
  on contentbox_assets for update
  using ((organization_id = get_user_organization_id()) or (organization_id is null));

create policy "Users can delete assets in their organization"
  on contentbox_assets for delete
  using ((organization_id = get_user_organization_id()) or (organization_id is null));