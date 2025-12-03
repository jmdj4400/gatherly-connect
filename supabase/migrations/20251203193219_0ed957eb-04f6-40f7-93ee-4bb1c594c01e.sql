-- Add auto-matching fields to events table
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS auto_match boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS freeze_hours_before integer DEFAULT 2;

-- Add frozen fields to micro_groups if not exists
ALTER TABLE public.micro_groups 
ADD COLUMN IF NOT EXISTS compatibility_score numeric,
ADD COLUMN IF NOT EXISTS auto_generated boolean DEFAULT false;

-- Create no_show_predictions table for tracking predicted no-shows
CREATE TABLE IF NOT EXISTS public.no_show_predictions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  group_id uuid REFERENCES public.micro_groups(id) ON DELETE CASCADE,
  risk_score numeric NOT NULL DEFAULT 0,
  factors jsonb DEFAULT '{}',
  computed_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, event_id)
);

-- Enable RLS
ALTER TABLE public.no_show_predictions ENABLE ROW LEVEL SECURITY;

-- RLS policies for no_show_predictions
CREATE POLICY "Org admins can view predictions for their events"
ON public.no_show_predictions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM events e
    JOIN user_roles ur ON ur.org_id = e.host_org_id
    WHERE e.id = no_show_predictions.event_id
    AND ur.user_id = auth.uid()
    AND ur.role = 'org_admin'
  )
);

CREATE POLICY "Service can manage predictions"
ON public.no_show_predictions FOR ALL
USING (true) WITH CHECK (true);

-- Add RLS policy for org admins to view groups for their events
CREATE POLICY "Org admins can view groups for their events"
ON public.micro_groups FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM events e
    JOIN user_roles ur ON ur.org_id = e.host_org_id
    WHERE e.id = micro_groups.event_id
    AND ur.user_id = auth.uid()
    AND ur.role = 'org_admin'
  )
);

-- Add policy for org admins to update groups (for freezing)
CREATE POLICY "Org admins can update groups for their events"
ON public.micro_groups FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM events e
    JOIN user_roles ur ON ur.org_id = e.host_org_id
    WHERE e.id = micro_groups.event_id
    AND ur.user_id = auth.uid()
    AND ur.role = 'org_admin'
  )
);

-- Add policy for org admins to view group members
CREATE POLICY "Org admins can view members for their events"
ON public.micro_group_members FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM micro_groups mg
    JOIN events e ON e.id = mg.event_id
    JOIN user_roles ur ON ur.org_id = e.host_org_id
    WHERE mg.id = micro_group_members.group_id
    AND ur.user_id = auth.uid()
    AND ur.role = 'org_admin'
  )
);