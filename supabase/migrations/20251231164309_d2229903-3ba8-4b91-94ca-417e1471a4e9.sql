-- Create agent_schedules table for runtime agent control
CREATE TABLE public.agent_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_name TEXT NOT NULL UNIQUE,
  enabled BOOLEAN DEFAULT true,
  timezone TEXT DEFAULT 'America/Phoenix',
  active_after TIME,
  active_before TIME,
  active_weekends BOOLEAN DEFAULT true,
  active_holidays BOOLEAN DEFAULT false,
  emergency_off BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.agent_schedules ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read agent schedules (widget needs this)
CREATE POLICY "Anyone can read agent schedules"
ON public.agent_schedules
FOR SELECT
USING (true);

-- Policy: Admins can manage agent schedules
CREATE POLICY "Admins can manage agent schedules"
ON public.agent_schedules
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Create trigger for updated_at
CREATE TRIGGER update_agent_schedules_updated_at
BEFORE UPDATE ON public.agent_schedules
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default Jordan schedule (active 5PM - 8:30AM Phoenix time)
INSERT INTO public.agent_schedules (agent_name, enabled, timezone, active_after, active_before)
VALUES ('jordan', true, 'America/Phoenix', '17:00', '08:30');