-- Fix RPC authorization bypass: Add organization membership checks to tag management functions

-- Drop and recreate add_content_tag with authorization check
CREATE OR REPLACE FUNCTION public.add_content_tag(file_id uuid, tag text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Check if user is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Check if user is member of the file's organization
  IF NOT EXISTS (
    SELECT 1 FROM content_files cf
    JOIN organization_members om ON cf.organization_id = om.organization_id
    WHERE cf.id = file_id AND om.user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Not authorized to modify tags for this file';
  END IF;

  -- Perform the tag update
  UPDATE public.content_files
  SET tags = array_append(COALESCE(tags, ARRAY[]::text[]), tag)
  WHERE id = file_id
    AND NOT (tags @> ARRAY[tag]);
END;
$$;

-- Drop and recreate remove_content_tag with authorization check
CREATE OR REPLACE FUNCTION public.remove_content_tag(file_id uuid, tag text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Check if user is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Check if user is member of the file's organization
  IF NOT EXISTS (
    SELECT 1 FROM content_files cf
    JOIN organization_members om ON cf.organization_id = om.organization_id
    WHERE cf.id = file_id AND om.user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Not authorized to modify tags for this file';
  END IF;

  -- Perform the tag removal
  UPDATE public.content_files
  SET tags = array_remove(tags, tag)
  WHERE id = file_id;
END;
$$;