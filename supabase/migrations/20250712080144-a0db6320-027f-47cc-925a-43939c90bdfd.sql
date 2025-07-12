
-- Create storage bucket for question attachments
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'question-attachments',
  'question-attachments',
  true,
  52428800, -- 50MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm', 'video/mov']
);

-- Create storage policies for question attachments
CREATE POLICY "Authenticated users can upload question attachments" 
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'question-attachments' 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Anyone can view question attachments" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'question-attachments');

CREATE POLICY "Users can update their own question attachments" 
ON storage.objects FOR UPDATE 
USING (
  bucket_id = 'question-attachments' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own question attachments" 
ON storage.objects FOR DELETE 
USING (
  bucket_id = 'question-attachments' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
