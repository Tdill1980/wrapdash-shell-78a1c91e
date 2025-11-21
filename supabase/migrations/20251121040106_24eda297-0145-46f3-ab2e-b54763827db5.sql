-- Fix function search path security warning by recreating with proper search_path
drop function if exists update_design_panels_updated_at() cascade;

create or replace function update_design_panels_updated_at()
returns trigger 
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Recreate the triggers
create trigger update_design_panels_updated_at
before update on design_panels
for each row
execute function update_design_panels_updated_at();

create trigger update_design_panel_folders_updated_at
before update on design_panel_folders
for each row
execute function update_design_panels_updated_at();