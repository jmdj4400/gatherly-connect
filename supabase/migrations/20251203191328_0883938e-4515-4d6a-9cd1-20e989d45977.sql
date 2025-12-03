-- Add new org roles to app_role enum (these will be committed with this migration)
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'org_owner';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'org_helper';