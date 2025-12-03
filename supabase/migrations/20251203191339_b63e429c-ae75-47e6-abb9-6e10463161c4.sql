-- Create org activity log table
CREATE TABLE public.org_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  action TEXT NOT NULL,
  target_user_id UUID,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.org_activity_log ENABLE ROW LEVEL SECURITY;

-- RLS policies for activity log
CREATE POLICY "Org members can view their org's activity log"
ON public.org_activity_log
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.org_id = org_activity_log.org_id
    AND user_roles.user_id = auth.uid()
    AND user_roles.role IN ('org_owner'::app_role, 'org_admin'::app_role, 'org_helper'::app_role)
  )
);

CREATE POLICY "Service can insert activity log"
ON public.org_activity_log
FOR INSERT
WITH CHECK (true);

-- Create helper function to check org membership with any org role
CREATE OR REPLACE FUNCTION public.is_org_member(_user_id uuid, _org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND org_id = _org_id
      AND role IN ('org_owner'::app_role, 'org_admin'::app_role, 'org_helper'::app_role)
  )
$$;

-- Create helper function to get user's org role
CREATE OR REPLACE FUNCTION public.get_org_role(_user_id uuid, _org_id uuid)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles
  WHERE user_id = _user_id
    AND org_id = _org_id
    AND role IN ('org_owner'::app_role, 'org_admin'::app_role, 'org_helper'::app_role)
  LIMIT 1
$$;