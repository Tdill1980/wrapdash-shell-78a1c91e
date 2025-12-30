-- First, backfill organization_id for ai_actions that have NULL
UPDATE ai_actions
SET organization_id = '51aa96db-c06d-41ae-b3cb-25b045c75caf'
WHERE organization_id IS NULL;

-- Also backfill conversation_id from action_payload where missing
UPDATE ai_actions
SET conversation_id = (action_payload->>'conversation_id')::uuid
WHERE conversation_id IS NULL
  AND action_payload->>'conversation_id' IS NOT NULL;

-- Drop restrictive policies
DROP POLICY IF EXISTS "AI actions: members can view" ON ai_actions;
DROP POLICY IF EXISTS "AI actions: members can update" ON ai_actions;
DROP POLICY IF EXISTS "AI actions: members can insert" ON ai_actions;
DROP POLICY IF EXISTS "AI actions: members can delete" ON ai_actions;

-- Create proper RLS policies that work with null org_id fallback
CREATE POLICY "ai_actions_select"
ON ai_actions FOR SELECT
USING (
  organization_id = get_user_organization_id()
  OR organization_id IS NULL
  OR is_member_of_organization(auth.uid(), organization_id)
);

CREATE POLICY "ai_actions_insert"
ON ai_actions FOR INSERT
WITH CHECK (
  organization_id = get_user_organization_id()
  OR organization_id IS NULL
  OR is_member_of_organization(auth.uid(), organization_id)
);

CREATE POLICY "ai_actions_update"
ON ai_actions FOR UPDATE
USING (
  organization_id = get_user_organization_id()
  OR organization_id IS NULL
  OR is_member_of_organization(auth.uid(), organization_id)
);

CREATE POLICY "ai_actions_delete"
ON ai_actions FOR DELETE
USING (
  organization_id = get_user_organization_id()
  OR organization_id IS NULL
  OR is_member_of_organization(auth.uid(), organization_id)
);