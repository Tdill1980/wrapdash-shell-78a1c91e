-- Create coaching memory table for persistent corrections
CREATE TABLE IF NOT EXISTS public.agent_coaching_memory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id text NOT NULL,
  note text NOT NULL,
  created_at timestamptz DEFAULT now(),
  active boolean DEFAULT true
);

-- Create weekly directives table for steering focus
CREATE TABLE IF NOT EXISTS public.agent_weekly_directives (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id text NOT NULL,
  directive text NOT NULL,
  week_of date NOT NULL,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.agent_coaching_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_weekly_directives ENABLE ROW LEVEL SECURITY;

-- RLS policies for internal use (authenticated users can read/write)
CREATE POLICY "Authenticated users can manage coaching memory"
ON public.agent_coaching_memory
FOR ALL
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated users can manage weekly directives"
ON public.agent_weekly_directives
FOR ALL
USING (true)
WITH CHECK (true);

-- Index for faster lookups
CREATE INDEX idx_coaching_memory_agent ON public.agent_coaching_memory(agent_id, active);
CREATE INDEX idx_weekly_directives_agent_week ON public.agent_weekly_directives(agent_id, week_of, active);