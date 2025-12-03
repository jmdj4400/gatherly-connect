-- Add INSERT policy for micro_group_members (for edge function compatibility)
CREATE POLICY "Service can insert group members"
ON public.micro_group_members
FOR INSERT
WITH CHECK (true);

-- Add INSERT policy for micro_groups
CREATE POLICY "Service can create groups"
ON public.micro_groups
FOR INSERT
WITH CHECK (true);

-- Enable realtime for micro_groups
ALTER PUBLICATION supabase_realtime ADD TABLE public.micro_groups;