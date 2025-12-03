-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  display_name TEXT,
  avatar_url TEXT,
  social_energy INT DEFAULT 3 CHECK (social_energy >= 1 AND social_energy <= 5),
  interests TEXT[] DEFAULT '{}',
  city TEXT,
  radius_km INT DEFAULT 25,
  language TEXT DEFAULT 'en',
  verified BOOLEAN DEFAULT FALSE,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create events table
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT DEFAULT 'manual' CHECK (source IN ('manual', 'eventbrite', 'csv')),
  source_id TEXT,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  category TEXT,
  city TEXT,
  venue_name TEXT,
  address TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  starts_at TIMESTAMP WITH TIME ZONE NOT NULL,
  ends_at TIMESTAMP WITH TIME ZONE,
  allow_come_alone BOOLEAN DEFAULT TRUE,
  max_group_size INT DEFAULT 5 CHECK (max_group_size >= 2 AND max_group_size <= 5),
  host_org_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create event_participants table
CREATE TABLE public.event_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'interested' CHECK (status IN ('interested', 'joined', 'no_show', 'attended')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  feedback JSONB,
  UNIQUE(event_id, user_id)
);

-- Create micro_groups table
CREATE TABLE public.micro_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'forming' CHECK (status IN ('forming', 'locked', 'done', 'frozen')),
  meet_spot TEXT,
  meet_time TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create micro_group_members table
CREATE TABLE public.micro_group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.micro_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('member', 'host')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

-- Create messages table for group chat
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.micro_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  moderated BOOLEAN DEFAULT FALSE
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.micro_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.micro_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- Events policies (public read, authenticated write)
CREATE POLICY "Anyone can view events" ON public.events FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create events" ON public.events FOR INSERT TO authenticated WITH CHECK (true);

-- Event participants policies
CREATE POLICY "Users can view participants of their events" ON public.event_participants FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can join events" ON public.event_participants FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own participation" ON public.event_participants FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can leave events" ON public.event_participants FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Micro groups policies
CREATE POLICY "Users can view groups they're in" ON public.micro_groups FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.micro_group_members WHERE group_id = id AND user_id = auth.uid())
);

-- Group members policies
CREATE POLICY "Members can view group members" ON public.micro_group_members FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.micro_group_members mgm WHERE mgm.group_id = micro_group_members.group_id AND mgm.user_id = auth.uid())
);

-- Messages policies
CREATE POLICY "Group members can view messages" ON public.messages FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.micro_group_members WHERE group_id = messages.group_id AND user_id = auth.uid())
);
CREATE POLICY "Group members can send messages" ON public.messages FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.micro_group_members WHERE group_id = messages.group_id AND user_id = auth.uid())
  AND auth.uid() = user_id
);

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- Create function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create indexes for performance
CREATE INDEX idx_events_starts_at ON public.events(starts_at);
CREATE INDEX idx_events_city ON public.events(city);
CREATE INDEX idx_event_participants_event ON public.event_participants(event_id);
CREATE INDEX idx_event_participants_user ON public.event_participants(user_id);
CREATE INDEX idx_micro_groups_status ON public.micro_groups(status);
CREATE INDEX idx_messages_group ON public.messages(group_id);