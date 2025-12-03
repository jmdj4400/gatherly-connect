-- Add columns to orgs table for community landing pages
ALTER TABLE public.orgs 
ADD COLUMN IF NOT EXISTS org_handle TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS cover_image_url TEXT,
ADD COLUMN IF NOT EXISTS short_bio TEXT,
ADD COLUMN IF NOT EXISTS community_tags TEXT[] DEFAULT '{}';

-- Create index on org_handle for fast lookups
CREATE INDEX IF NOT EXISTS idx_orgs_handle ON public.orgs(org_handle);

-- Create community followers table
CREATE TABLE public.community_followers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notify_new_events BOOLEAN DEFAULT true,
  public_display BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(org_id, user_id)
);

-- Enable RLS
ALTER TABLE public.community_followers ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can follow communities"
ON public.community_followers
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unfollow communities"
ON public.community_followers
FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own follow settings"
ON public.community_followers
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Public followers are visible"
ON public.community_followers
FOR SELECT
USING (public_display = true OR auth.uid() = user_id);

-- Index for follower lookups
CREATE INDEX idx_community_followers_org ON public.community_followers(org_id);
CREATE INDEX idx_community_followers_user ON public.community_followers(user_id);