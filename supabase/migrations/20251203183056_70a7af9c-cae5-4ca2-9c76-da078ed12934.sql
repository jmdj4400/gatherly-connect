-- Add embedding columns to profiles and events (using jsonb since vector extension not available)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS profile_embedding jsonb,
ADD COLUMN IF NOT EXISTS embedding_updated_at timestamp with time zone;

ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS event_embedding jsonb,
ADD COLUMN IF NOT EXISTS embedding_updated_at timestamp with time zone;

-- Create compatibility scores cache table
CREATE TABLE IF NOT EXISTS public.vibe_scores (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_type text NOT NULL CHECK (target_type IN ('event', 'user')),
  target_id uuid NOT NULL,
  score numeric NOT NULL CHECK (score >= 0 AND score <= 100),
  computed_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, target_type, target_id)
);

-- Enable RLS
ALTER TABLE public.vibe_scores ENABLE ROW LEVEL SECURITY;

-- Users can view their own vibe scores
CREATE POLICY "Users can view own vibe scores"
ON public.vibe_scores
FOR SELECT
USING (auth.uid() = user_id);

-- Service can manage vibe scores
CREATE POLICY "Service can manage vibe scores"
ON public.vibe_scores
FOR ALL
USING (true)
WITH CHECK (true);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_vibe_scores_user_target ON public.vibe_scores(user_id, target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_vibe_scores_target ON public.vibe_scores(target_type, target_id);