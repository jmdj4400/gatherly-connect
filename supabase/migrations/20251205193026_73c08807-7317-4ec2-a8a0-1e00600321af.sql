-- Step 1: Create SECURITY DEFINER helper functions to safely check group membership

-- Function to get all group IDs for a user (bypasses RLS)
CREATE OR REPLACE FUNCTION public.get_user_group_ids(_user_id uuid)
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT group_id FROM public.micro_group_members WHERE user_id = _user_id
$$;

-- Function to check if a user is a member of a specific group (bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_member_of_group(_user_id uuid, _group_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.micro_group_members
    WHERE user_id = _user_id AND group_id = _group_id
  )
$$;

-- Step 2: Fix micro_group_members policies
DROP POLICY IF EXISTS "Members can view group members" ON public.micro_group_members;

CREATE POLICY "Members can view group members" 
ON public.micro_group_members
FOR SELECT
TO authenticated
USING (group_id IN (SELECT public.get_user_group_ids(auth.uid())));

-- Step 3: Fix profiles policy that causes recursion
DROP POLICY IF EXISTS "Users can view group member profiles" ON public.profiles;

CREATE POLICY "Users can view group member profiles" 
ON public.profiles
FOR SELECT
TO authenticated
USING (id IN (
  SELECT mgm.user_id 
  FROM public.micro_group_members mgm
  WHERE mgm.group_id IN (SELECT public.get_user_group_ids(auth.uid()))
));

-- Step 4: Fix micro_groups policy (had a bug: micro_group_members.group_id = micro_group_members.id)
DROP POLICY IF EXISTS "Users can view groups they're in" ON public.micro_groups;

CREATE POLICY "Users can view groups they're in" 
ON public.micro_groups
FOR SELECT
TO authenticated
USING (id IN (SELECT public.get_user_group_ids(auth.uid())));