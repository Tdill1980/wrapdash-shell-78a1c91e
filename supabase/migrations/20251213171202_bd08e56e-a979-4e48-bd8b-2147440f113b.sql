-- Add organization_role enum type
CREATE TYPE public.organization_role AS ENUM ('beta_shop', 'affiliate', 'admin');

-- Add role column to organizations table
ALTER TABLE public.organizations 
ADD COLUMN role organization_role DEFAULT 'beta_shop';