-- Add storage policies for public buckets

-- media-library bucket policies
CREATE POLICY "public_select_media_library" ON storage.objects 
FOR SELECT USING (bucket_id = 'media-library');

CREATE POLICY "public_insert_media_library" ON storage.objects 
FOR INSERT WITH CHECK (bucket_id = 'media-library');

CREATE POLICY "public_update_media_library" ON storage.objects 
FOR UPDATE USING (bucket_id = 'media-library');

CREATE POLICY "public_delete_media_library" ON storage.objects 
FOR DELETE USING (bucket_id = 'media-library');

-- approveflow-files bucket policies
CREATE POLICY "public_select_approveflow" ON storage.objects 
FOR SELECT USING (bucket_id = 'approveflow-files');

CREATE POLICY "public_insert_approveflow" ON storage.objects 
FOR INSERT WITH CHECK (bucket_id = 'approveflow-files');

CREATE POLICY "public_update_approveflow" ON storage.objects 
FOR UPDATE USING (bucket_id = 'approveflow-files');

CREATE POLICY "public_delete_approveflow" ON storage.objects 
FOR DELETE USING (bucket_id = 'approveflow-files');

-- design-vault bucket policies
CREATE POLICY "public_select_design_vault" ON storage.objects 
FOR SELECT USING (bucket_id = 'design-vault');

CREATE POLICY "public_insert_design_vault" ON storage.objects 
FOR INSERT WITH CHECK (bucket_id = 'design-vault');

-- shopflow-files bucket policies
CREATE POLICY "public_select_shopflow" ON storage.objects 
FOR SELECT USING (bucket_id = 'shopflow-files');

CREATE POLICY "public_insert_shopflow" ON storage.objects 
FOR INSERT WITH CHECK (bucket_id = 'shopflow-files');

CREATE POLICY "public_update_shopflow" ON storage.objects 
FOR UPDATE USING (bucket_id = 'shopflow-files');

-- portfolio-media bucket policies
CREATE POLICY "public_select_portfolio" ON storage.objects 
FOR SELECT USING (bucket_id = 'portfolio-media');

CREATE POLICY "public_insert_portfolio" ON storage.objects 
FOR INSERT WITH CHECK (bucket_id = 'portfolio-media');

-- affiliate-media bucket policies
CREATE POLICY "public_select_affiliate" ON storage.objects 
FOR SELECT USING (bucket_id = 'affiliate-media');

CREATE POLICY "public_insert_affiliate" ON storage.objects 
FOR INSERT WITH CHECK (bucket_id = 'affiliate-media');

-- dashboard-hero bucket policies
CREATE POLICY "public_select_dashboard_hero" ON storage.objects 
FOR SELECT USING (bucket_id = 'dashboard-hero');

CREATE POLICY "public_insert_dashboard_hero" ON storage.objects 
FOR INSERT WITH CHECK (bucket_id = 'dashboard-hero');