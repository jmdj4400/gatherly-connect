-- Add frozen column to micro_groups
ALTER TABLE public.micro_groups ADD COLUMN IF NOT EXISTS frozen boolean DEFAULT false;
ALTER TABLE public.micro_groups ADD COLUMN IF NOT EXISTS frozen_at timestamp with time zone;
ALTER TABLE public.micro_groups ADD COLUMN IF NOT EXISTS frozen_by uuid;

-- Create reports table
CREATE TABLE public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid REFERENCES auth.users(id),
  reported_user_id uuid NOT NULL,
  message_id uuid REFERENCES public.messages(id),
  group_id uuid REFERENCES public.micro_groups(id),
  reason text NOT NULL,
  moderation_flags jsonb,
  status text DEFAULT 'pending',
  resolved_by uuid,
  resolved_at timestamp with time zone,
  resolution_notes text,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Admins can view all reports
CREATE POLICY "Admins can manage reports" ON public.reports
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Org admins can view reports for their orgs
CREATE POLICY "Org admins can view their reports" ON public.reports
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM micro_groups mg
    JOIN events e ON mg.event_id = e.id
    JOIN user_roles ur ON ur.org_id = e.host_org_id
    WHERE mg.id = reports.group_id
    AND ur.user_id = auth.uid()
    AND ur.role = 'org_admin'
  )
);

-- Users can report
CREATE POLICY "Users can create reports" ON public.reports
FOR INSERT WITH CHECK (auth.uid() = reporter_id);

-- Create user_mutes table
CREATE TABLE public.user_mutes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  group_id uuid NOT NULL REFERENCES public.micro_groups(id),
  muted_until timestamp with time zone NOT NULL,
  reason text,
  muted_by uuid,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.user_mutes ENABLE ROW LEVEL SECURITY;

-- Admins can manage mutes
CREATE POLICY "Admins can manage mutes" ON public.user_mutes
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Service can insert mutes (for moderation)
CREATE POLICY "Service can insert mutes" ON public.user_mutes
FOR INSERT WITH CHECK (true);

-- Users can view their own mutes
CREATE POLICY "Users can view own mutes" ON public.user_mutes
FOR SELECT USING (auth.uid() = user_id);

-- Create user_bans table
CREATE TABLE public.user_bans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  banned_by uuid,
  reason text,
  permanent boolean DEFAULT false,
  banned_until timestamp with time zone,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.user_bans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage bans" ON public.user_bans
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view own bans" ON public.user_bans
FOR SELECT USING (auth.uid() = user_id);