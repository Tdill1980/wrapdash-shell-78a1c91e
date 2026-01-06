-- Remove broken policy
DROP POLICY IF EXISTS "Authenticated users can upload approveflow files"
ON storage.objects;

-- INSERT policy (for uploads)
CREATE POLICY "Authenticated users can upload approveflow files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'approveflow-files');

-- UPDATE policy (for upsert/overwrite)
CREATE POLICY "Authenticated users can update approveflow files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'approveflow-files');

-- DELETE policy (for cleanup)
CREATE POLICY "Authenticated users can delete approveflow files"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'approveflow-files');