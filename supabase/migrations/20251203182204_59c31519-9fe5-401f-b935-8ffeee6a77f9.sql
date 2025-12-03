-- Add read receipts table
CREATE TABLE public.message_read_receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  read_at timestamp with time zone DEFAULT now(),
  UNIQUE(message_id, user_id)
);

ALTER TABLE public.message_read_receipts ENABLE ROW LEVEL SECURITY;

-- Group members can view read receipts
CREATE POLICY "Group members can view read receipts" ON public.message_read_receipts
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM messages m
    JOIN micro_group_members mgm ON mgm.group_id = m.group_id
    WHERE m.id = message_read_receipts.message_id
    AND mgm.user_id = auth.uid()
  )
);

-- Users can mark messages as read
CREATE POLICY "Users can mark messages as read" ON public.message_read_receipts
FOR INSERT WITH CHECK (auth.uid() = user_id);