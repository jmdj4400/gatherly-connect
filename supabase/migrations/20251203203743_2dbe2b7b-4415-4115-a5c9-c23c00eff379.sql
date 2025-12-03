-- Create venue_boosts table for B2B revenue
CREATE TABLE public.venue_boosts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  level TEXT NOT NULL DEFAULT 'basic', -- basic, pro
  status TEXT NOT NULL DEFAULT 'pending', -- pending, active, expired, canceled
  starts_at TIMESTAMP WITH TIME ZONE,
  ends_at TIMESTAMP WITH TIME ZONE,
  stripe_subscription_id TEXT,
  stripe_customer_id TEXT,
  price_amount INTEGER NOT NULL, -- in øre
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.venue_boosts ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Org admins can view their boosts"
  ON public.venue_boosts FOR SELECT
  USING (has_role(auth.uid(), 'org_admin'::app_role, org_id) OR has_role(auth.uid(), 'org_owner'::app_role, org_id));

CREATE POLICY "Org admins can create boosts"
  ON public.venue_boosts FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'org_admin'::app_role, org_id) OR has_role(auth.uid(), 'org_owner'::app_role, org_id));

CREATE POLICY "Service can manage all boosts"
  ON public.venue_boosts FOR ALL
  USING (true)
  WITH CHECK (true);

-- Anyone can see active boosts (for marketplace display)
CREATE POLICY "Anyone can view active boosts"
  ON public.venue_boosts FOR SELECT
  USING (status = 'active');

-- Index for efficient queries
CREATE INDEX idx_venue_boosts_event_id ON public.venue_boosts(event_id);
CREATE INDEX idx_venue_boosts_org_id ON public.venue_boosts(org_id);
CREATE INDEX idx_venue_boosts_status ON public.venue_boosts(status);
CREATE INDEX idx_venue_boosts_active ON public.venue_boosts(event_id, status) WHERE status = 'active';

-- Trigger for updated_at
CREATE TRIGGER update_venue_boosts_updated_at
  BEFORE UPDATE ON public.venue_boosts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();