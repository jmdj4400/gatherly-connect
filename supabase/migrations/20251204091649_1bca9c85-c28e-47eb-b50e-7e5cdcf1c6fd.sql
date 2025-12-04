-- Fix 1: Profiles table - restrict email/PII exposure
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;

-- Users can always see their own profile
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
USING (auth.uid() = id);

-- Users can see profiles of people in their groups (for chat/matching)
CREATE POLICY "Users can view group member profiles"
ON profiles FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM micro_group_members mgm1
    JOIN micro_group_members mgm2 ON mgm1.group_id = mgm2.group_id
    WHERE mgm1.user_id = auth.uid()
    AND mgm2.user_id = profiles.id
  )
);

-- Org admins can view profiles of event participants
CREATE POLICY "Org admins can view participant profiles"
ON profiles FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM event_participants ep
    JOIN events e ON ep.event_id = e.id
    JOIN user_roles ur ON ur.org_id = e.host_org_id
    WHERE ep.user_id = profiles.id
    AND ur.user_id = auth.uid()
    AND ur.role IN ('org_admin', 'org_owner')
  )
);

-- Fix 2: Events table - add UPDATE/DELETE protection
-- Only org members can update their org's events
CREATE POLICY "Org members can update events"
ON events FOR UPDATE
USING (
  is_org_member(auth.uid(), host_org_id)
);

-- Only org admins/owners can delete events
CREATE POLICY "Org admins can delete events"
ON events FOR DELETE
USING (
  has_role(auth.uid(), 'org_admin'::app_role, host_org_id) OR
  has_role(auth.uid(), 'org_owner'::app_role, host_org_id)
);