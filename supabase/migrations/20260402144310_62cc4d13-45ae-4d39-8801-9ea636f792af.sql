-- Make avatars bucket private
UPDATE storage.buckets SET public = false WHERE id = 'avatars';

-- Drop the overly permissive public SELECT policy
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;

-- Create owner-only SELECT policy
CREATE POLICY "Users can view their own avatar"
ON storage.objects
FOR SELECT
USING (bucket_id = 'avatars' AND (auth.uid())::text = (storage.foldername(name))[1]);
