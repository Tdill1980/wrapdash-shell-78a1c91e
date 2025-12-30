-- Add a tag to text[] array (no duplicates)
CREATE OR REPLACE FUNCTION public.add_content_tag(file_id uuid, tag text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
BEGIN
  UPDATE public.content_files
  SET tags = array(
    SELECT DISTINCT unnest(COALESCE(tags, '{}'::text[])) UNION SELECT tag
  )
  WHERE id = file_id;
END;
$$;

-- Remove a tag from text[] array
CREATE OR REPLACE FUNCTION public.remove_content_tag(file_id uuid, tag text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
BEGIN
  UPDATE public.content_files
  SET tags = array(
    SELECT x FROM unnest(COALESCE(tags, '{}'::text[])) x WHERE x <> tag
  )
  WHERE id = file_id;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.add_content_tag(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.remove_content_tag(uuid, text) TO authenticated;