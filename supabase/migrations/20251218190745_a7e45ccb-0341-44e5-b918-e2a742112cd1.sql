-- Create mighty_calendars table (channel definitions)
CREATE TABLE mighty_calendars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  role TEXT NOT NULL, -- source | conversion | editorial | video | concierge
  owner_role TEXT NOT NULL,
  allowed_agents TEXT[] NOT NULL DEFAULT '{}',
  is_source BOOLEAN DEFAULT false,
  gradient_from TEXT DEFAULT '#6366f1',
  gradient_to TEXT DEFAULT '#a855f7',
  organization_id UUID REFERENCES organizations(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create mighty_calendar_items table (execution cards)
CREATE TABLE mighty_calendar_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  calendar_id UUID REFERENCES mighty_calendars(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id),
  title TEXT NOT NULL,
  description TEXT,
  franchise_slug TEXT, -- test_lab, wotw, chelsea, magazine, etc.
  scheduled_date DATE NOT NULL,
  status TEXT DEFAULT 'planned', -- planned | blocked | ready | executing | complete
  requires_source BOOLEAN DEFAULT false,
  source_item_id UUID REFERENCES mighty_calendar_items(id),
  legacy_content_id UUID, -- Links to existing content_calendar items
  checklist JSONB DEFAULT '[]',
  assigned_agent TEXT,
  is_legacy_import BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE mighty_calendars ENABLE ROW LEVEL SECURITY;
ALTER TABLE mighty_calendar_items ENABLE ROW LEVEL SECURITY;

-- RLS policies for mighty_calendars
CREATE POLICY "Anyone can view calendars" ON mighty_calendars 
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage calendars" ON mighty_calendars 
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- RLS policies for mighty_calendar_items
CREATE POLICY "Users can view calendar items in their org" ON mighty_calendar_items 
  FOR SELECT USING ((organization_id = get_user_organization_id()) OR (organization_id IS NULL));

CREATE POLICY "Users can manage calendar items in their org" ON mighty_calendar_items 
  FOR ALL USING ((organization_id = get_user_organization_id()) OR (organization_id IS NULL));

-- Seed the 5 operational calendars
INSERT INTO mighty_calendars (slug, name, description, role, owner_role, allowed_agents, is_source, gradient_from, gradient_to) VALUES
  ('ink_edge_mag', 'Ink & Edge Magazine', 'Source content flywheel - everything starts here', 'source', 'editorial', ARRAY['ryan_mitchell'], true, '#4f46e5', '#a855f7'),
  ('wpw_campaigns', 'WPW Campaigns', 'Revenue-driving email & paid campaigns', 'conversion', 'marketing', ARRAY['emily_carter', 'jordan_lee'], false, '#0ea5e9', '#06b6d4'),
  ('ink_edge_dist', 'Ink & Edge Distribution', 'Editorial distribution across social & email', 'editorial', 'editorial', ARRAY['ryan_mitchell', 'noah_bennett'], false, '#a855f7', '#ec4899'),
  ('wraptvworld', 'WrapTVWorld', 'Monthly video content & proof', 'video', 'video', ARRAY['wraptvworld_producer', 'noah_bennett'], false, '#3b82f6', '#14b8a6'),
  ('luigi', 'Luigi Chat', 'Ordering concierge & conversion', 'concierge', 'sales', ARRAY['jordan_lee'], false, '#22c55e', '#10b981');

-- Add trigger for updated_at
CREATE TRIGGER update_mighty_calendar_items_updated_at
  BEFORE UPDATE ON mighty_calendar_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();