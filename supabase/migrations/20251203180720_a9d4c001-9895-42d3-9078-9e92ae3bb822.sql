-- Create app_role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'org_admin', 'user');

-- Create user_roles table for role management
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  org_id UUID NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (user_id, role, org_id)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create orgs table
CREATE TABLE public.orgs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  contact_email TEXT,
  stripe_customer_id TEXT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.orgs ENABLE ROW LEVEL SECURITY;

-- Create import_batches table for CSV import tracking
CREATE TABLE public.import_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES public.orgs(id) ON DELETE CASCADE NOT NULL,
  filename TEXT,
  row_count INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'committed', 'rolled_back')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.import_batches ENABLE ROW LEVEL SECURITY;

-- Add import_batch_id to events
ALTER TABLE public.events ADD COLUMN import_batch_id UUID REFERENCES public.import_batches(id) ON DELETE SET NULL;

-- Add host_org_id foreign key if not exists
ALTER TABLE public.events DROP CONSTRAINT IF EXISTS events_host_org_id_fkey;
ALTER TABLE public.events ADD CONSTRAINT events_host_org_id_fkey FOREIGN KEY (host_org_id) REFERENCES public.orgs(id) ON DELETE SET NULL;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role, _org_id UUID DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
      AND (org_id = _org_id OR _org_id IS NULL OR org_id IS NULL)
  )
$$;

-- RLS Policies for user_roles
CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage roles" ON public.user_roles
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for orgs
CREATE POLICY "Anyone can view orgs" ON public.orgs
  FOR SELECT USING (true);

CREATE POLICY "Org admins can update their org" ON public.orgs
  FOR UPDATE USING (public.has_role(auth.uid(), 'org_admin', id));

CREATE POLICY "Admins can manage orgs" ON public.orgs
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated can create orgs" ON public.orgs
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- RLS Policies for import_batches
CREATE POLICY "Org admins can view their imports" ON public.import_batches
  FOR SELECT USING (public.has_role(auth.uid(), 'org_admin', org_id));

CREATE POLICY "Org admins can create imports" ON public.import_batches
  FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'org_admin', org_id));

CREATE POLICY "Org admins can update imports" ON public.import_batches
  FOR UPDATE USING (public.has_role(auth.uid(), 'org_admin', org_id));

-- Add ticket_price to events for billing
ALTER TABLE public.events ADD COLUMN ticket_price DECIMAL(10,2) DEFAULT 0;

-- Index for faster queries
CREATE INDEX idx_events_host_org ON public.events(host_org_id);
CREATE INDEX idx_events_import_batch ON public.events(import_batch_id);
CREATE INDEX idx_user_roles_user ON public.user_roles(user_id);
CREATE INDEX idx_import_batches_org ON public.import_batches(org_id);