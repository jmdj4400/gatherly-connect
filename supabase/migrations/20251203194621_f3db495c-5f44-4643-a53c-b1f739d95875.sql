-- PHASE 1: Data Consolidation Migration

-- 1. Normalize event_participants table
-- Add join_status and attendance_status columns
ALTER TABLE public.event_participants 
ADD COLUMN IF NOT EXISTS join_status text DEFAULT 'joined' CHECK (join_status IN ('joined', 'cancelled')),
ADD COLUMN IF NOT EXISTS attendance_status text DEFAULT NULL CHECK (attendance_status IN ('checked_in', 'no_show', NULL)),
ADD COLUMN IF NOT EXISTS attendance_at timestamp with time zone DEFAULT NULL,
ADD COLUMN IF NOT EXISTS cancelled_at timestamp with time zone DEFAULT NULL;

-- 2. Add unique constraint: one user cannot join same event twice
ALTER TABLE public.event_participants 
DROP CONSTRAINT IF EXISTS event_participants_user_event_unique;
ALTER TABLE public.event_participants 
ADD CONSTRAINT event_participants_user_event_unique UNIQUE (user_id, event_id);

-- 3. Add unique constraint for attendance_records: one user cannot attend same event twice
ALTER TABLE public.attendance_records 
DROP CONSTRAINT IF EXISTS attendance_records_user_event_unique;
ALTER TABLE public.attendance_records 
ADD CONSTRAINT attendance_records_user_event_unique UNIQUE (user_id, event_id);

-- 4. Add idempotency fields for user_streaks
ALTER TABLE public.user_streaks 
ADD COLUMN IF NOT EXISTS last_update_hash text DEFAULT NULL;

-- 5. Create trigger function to prevent micro_group edits after freeze
CREATE OR REPLACE FUNCTION public.prevent_frozen_group_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT frozen FROM public.micro_groups WHERE id = COALESCE(NEW.group_id, OLD.group_id)) = true THEN
    RAISE EXCEPTION 'Cannot modify frozen group';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- 6. Create trigger for micro_group_members immutability
DROP TRIGGER IF EXISTS check_frozen_group_members ON public.micro_group_members;
CREATE TRIGGER check_frozen_group_members
BEFORE INSERT OR UPDATE OR DELETE ON public.micro_group_members
FOR EACH ROW
EXECUTE FUNCTION public.prevent_frozen_group_changes();

-- 7. Create trigger function to prevent micro_groups updates when frozen
CREATE OR REPLACE FUNCTION public.prevent_frozen_group_self_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Allow updates that are setting frozen to true (the freeze action itself)
  IF OLD.frozen = true AND NEW.frozen = true THEN
    -- Only allow status updates on frozen groups
    IF OLD.meet_spot IS DISTINCT FROM NEW.meet_spot 
       OR OLD.meet_time IS DISTINCT FROM NEW.meet_time
       OR OLD.compatibility_score IS DISTINCT FROM NEW.compatibility_score THEN
      RAISE EXCEPTION 'Cannot modify frozen group details';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- 8. Create trigger for micro_groups self-immutability
DROP TRIGGER IF EXISTS check_frozen_group_self ON public.micro_groups;
CREATE TRIGGER check_frozen_group_self
BEFORE UPDATE ON public.micro_groups
FOR EACH ROW
EXECUTE FUNCTION public.prevent_frozen_group_self_changes();

-- 9. Add indexes for common queries
CREATE INDEX IF NOT EXISTS idx_event_participants_event_status ON public.event_participants(event_id, join_status);
CREATE INDEX IF NOT EXISTS idx_event_participants_user_status ON public.event_participants(user_id, join_status);
CREATE INDEX IF NOT EXISTS idx_micro_groups_event_frozen ON public.micro_groups(event_id, frozen);
CREATE INDEX IF NOT EXISTS idx_attendance_records_event ON public.attendance_records(event_id);
CREATE INDEX IF NOT EXISTS idx_user_streaks_user_org ON public.user_streaks(user_id, org_id);
CREATE INDEX IF NOT EXISTS idx_messages_group_created ON public.messages(group_id, created_at DESC);

-- 10. Add freeze_override_lock to events table
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS freeze_override_lock boolean DEFAULT false;

-- 11. Migrate existing status values to new schema
UPDATE public.event_participants 
SET join_status = 'joined' 
WHERE join_status IS NULL AND status IN ('interested', 'confirmed', 'joined');

UPDATE public.event_participants 
SET attendance_status = 'checked_in' 
WHERE attendance_status IS NULL AND status = 'attended';

UPDATE public.event_participants 
SET attendance_status = 'no_show' 
WHERE attendance_status IS NULL AND status = 'no_show';