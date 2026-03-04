-- =============================================================================
-- STORAGE: study_materials bucket (for AI Study Help uploads)
-- =============================================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('study_materials', 'study_materials', false);

CREATE POLICY "Users can upload own study_materials" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'study_materials'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view own study_materials" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'study_materials'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own study_materials" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'study_materials'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
