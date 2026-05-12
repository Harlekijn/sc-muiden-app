-- Maak storage bucket aan voor aankondiging-afbeeldingen
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'announcement-images',
  'announcement-images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- CMS-gebruikers mogen afbeeldingen uploaden
CREATE POLICY "cms_users_upload_announcement_images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'announcement-images'
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('beheerder', 'commissielid')
    )
  );

-- Iedereen mag afbeeldingen lezen (bucket is public)
CREATE POLICY "public_read_announcement_images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'announcement-images');
