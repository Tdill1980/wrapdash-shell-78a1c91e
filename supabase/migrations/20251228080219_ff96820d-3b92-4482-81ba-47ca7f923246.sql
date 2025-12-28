-- Create RPC function for quote stats with date range filtering
CREATE OR REPLACE FUNCTION get_quote_stats(
  start_date timestamptz DEFAULT NULL,
  end_date timestamptz DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
BEGIN
  result := jsonb_build_object(
    -- Totals
    'totals', (
      SELECT jsonb_build_object(
        'total_quotes', count(*),
        'total_converted', count(*) FILTER (WHERE converted_to_order = true)
      )
      FROM quotes
      WHERE
        (start_date IS NULL OR created_at >= start_date)
        AND (end_date IS NULL OR created_at <= end_date)
    ),

    -- Quote count by source
    'by_source', COALESCE((
      SELECT jsonb_object_agg(COALESCE(source, 'unknown'), cnt)
      FROM (
        SELECT source, count(*) as cnt
        FROM quotes
        WHERE
          (start_date IS NULL OR created_at >= start_date)
          AND (end_date IS NULL OR created_at <= end_date)
        GROUP BY source
      ) s
    ), '{}'::jsonb),

    -- Conversion rate by source
    'conversion_by_source', COALESCE((
      SELECT jsonb_object_agg(COALESCE(source, 'unknown'), conversion_rate)
      FROM (
        SELECT
          source,
          round(
            100.0 * sum(CASE WHEN converted_to_order THEN 1 ELSE 0 END)
            / NULLIF(count(*), 0),
            2
          ) as conversion_rate
        FROM quotes
        WHERE
          (start_date IS NULL OR created_at >= start_date)
          AND (end_date IS NULL OR created_at <= end_date)
        GROUP BY source
      ) s
    ), '{}'::jsonb),

    -- Retargeting effectiveness
    'retargeting', (
      SELECT jsonb_build_object(
        'quotes_with_followups', count(DISTINCT q.id),
        'converted_after_followup',
          count(DISTINCT q.id) FILTER (WHERE q.converted_to_order = true)
      )
      FROM quotes q
      JOIN quote_retargeting_log r ON r.quote_id = q.id
      WHERE
        (start_date IS NULL OR q.created_at >= start_date)
        AND (end_date IS NULL OR q.created_at <= end_date)
    )
  );

  RETURN result;
END;
$$;