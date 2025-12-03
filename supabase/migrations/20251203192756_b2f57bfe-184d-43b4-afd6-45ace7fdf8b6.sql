-- Create attendance_records table for tracking user attendance at events
CREATE TABLE public.attendance_records (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  org_id uuid REFERENCES public.orgs(id) ON DELETE SET NULL,
  checked_in_at timestamp with time zone NOT NULL DEFAULT now(),
  minutes_before_start integer,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, event_id)
);

-- Create user_streaks table for tracking weekly attendance streaks
CREATE TABLE public.user_streaks (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  org_id uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  category text,
  current_streak integer NOT NULL DEFAULT 0,
  longest_streak integer NOT NULL DEFAULT 0,
  last_attendance_week integer,
  last_attendance_year integer,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, org_id, category)
);

-- Create badge_definitions table
CREATE TABLE public.badge_definitions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text NOT NULL,
  icon text NOT NULL,
  requirement_type text NOT NULL,
  requirement_count integer NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create user_badges table for awarded badges
CREATE TABLE public.user_badges (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  badge_id uuid NOT NULL REFERENCES public.badge_definitions(id) ON DELETE CASCADE,
  org_id uuid REFERENCES public.orgs(id) ON DELETE SET NULL,
  awarded_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, badge_id, org_id)
);

-- Create community_feed table for feed items
CREATE TABLE public.community_feed (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  feed_type text NOT NULL,
  user_id uuid,
  event_id uuid REFERENCES public.events(id) ON DELETE CASCADE,
  badge_id uuid REFERENCES public.badge_definitions(id) ON DELETE CASCADE,
  metadata jsonb DEFAULT '{}',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badge_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_feed ENABLE ROW LEVEL SECURITY;

-- RLS for attendance_records
CREATE POLICY "Users can view own attendance"
ON public.attendance_records FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Service can manage attendance"
ON public.attendance_records FOR ALL
USING (true) WITH CHECK (true);

-- RLS for user_streaks
CREATE POLICY "Users can view own streaks"
ON public.user_streaks FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view public streaks"
ON public.user_streaks FOR SELECT
USING (true);

CREATE POLICY "Service can manage streaks"
ON public.user_streaks FOR ALL
USING (true) WITH CHECK (true);

-- RLS for badge_definitions
CREATE POLICY "Anyone can view badges"
ON public.badge_definitions FOR SELECT
USING (true);

-- RLS for user_badges
CREATE POLICY "Anyone can view user badges"
ON public.user_badges FOR SELECT
USING (true);

CREATE POLICY "Service can manage user badges"
ON public.user_badges FOR ALL
USING (true) WITH CHECK (true);

-- RLS for community_feed
CREATE POLICY "Anyone can view community feed"
ON public.community_feed FOR SELECT
USING (true);

CREATE POLICY "Service can manage community feed"
ON public.community_feed FOR ALL
USING (true) WITH CHECK (true);

-- Insert default badge definitions
INSERT INTO public.badge_definitions (slug, name, description, icon, requirement_type, requirement_count) VALUES
('attendance_3', 'Regular', 'Attended 3 events', '🌟', 'attendance', 3),
('attendance_10', 'Dedicated', 'Attended 10 events', '🏅', 'attendance', 10),
('attendance_25', 'Legend', 'Attended 25 events', '👑', 'attendance', 25),
('streak_3', 'On Fire', '3 week streak', '🔥', 'streak', 3),
('streak_10', 'Unstoppable', '10 week streak', '💪', 'streak', 10),
('early_bird', 'Early Bird', 'Arrived 15+ min early 5 times', '🐦', 'early_arrival', 5),
('host_1', 'Event Host', 'Hosted your first event', '🎤', 'host', 1),
('host_5', 'Community Leader', 'Hosted 5 events', '🌟', 'host', 5);

-- Enable realtime for community_feed
ALTER PUBLICATION supabase_realtime ADD TABLE public.community_feed;