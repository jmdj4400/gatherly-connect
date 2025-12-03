-- Add recurring event columns to events table
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS recurrence_type TEXT DEFAULT 'none' CHECK (recurrence_type IN ('none', 'weekly', 'monthly')),
ADD COLUMN IF NOT EXISTS recurrence_day INTEGER CHECK (recurrence_day >= 0 AND recurrence_day <= 6),
ADD COLUMN IF NOT EXISTS recurrence_time TIME,
ADD COLUMN IF NOT EXISTS parent_event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS organizer_logo_url TEXT;

-- Create index for faster recurring event lookups
CREATE INDEX IF NOT EXISTS idx_events_parent_event_id ON public.events(parent_event_id);
CREATE INDEX IF NOT EXISTS idx_events_recurrence_type ON public.events(recurrence_type) WHERE recurrence_type != 'none';

-- Create table for generated Instagram assets
CREATE TABLE IF NOT EXISTS public.event_assets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  asset_type TEXT NOT NULL CHECK (asset_type IN ('story', 'post')),
  image_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(event_id, asset_type)
);

-- Enable RLS on event_assets
ALTER TABLE public.event_assets ENABLE ROW LEVEL SECURITY;

-- RLS policies for event_assets
CREATE POLICY "Anyone can view event assets"
ON public.event_assets
FOR SELECT
USING (true);

CREATE POLICY "Org admins can manage event assets"
ON public.event_assets
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM events e
    JOIN user_roles ur ON ur.org_id = e.host_org_id
    WHERE e.id = event_assets.event_id
    AND ur.user_id = auth.uid()
    AND ur.role = 'org_admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM events e
    JOIN user_roles ur ON ur.org_id = e.host_org_id
    WHERE e.id = event_assets.event_id
    AND ur.user_id = auth.uid()
    AND ur.role = 'org_admin'
  )
);

-- Allow service role to manage assets (for edge functions)
CREATE POLICY "Service can manage all event assets"
ON public.event_assets
FOR ALL
USING (true)
WITH CHECK (true);

-- Add trigger for updated_at
CREATE TRIGGER update_event_assets_updated_at
BEFORE UPDATE ON public.event_assets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();