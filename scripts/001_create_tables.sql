-- Configs table for text configs
CREATE TABLE IF NOT EXISTS public.configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  content TEXT NOT NULL,
  password TEXT,
  expires_at TIMESTAMPTZ,
  enabled BOOLEAN NOT NULL DEFAULT true,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Files table for uploaded files
CREATE TABLE IF NOT EXISTS public.files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  original_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT NOT NULL DEFAULT 0,
  mime_type TEXT,
  expires_at TIMESTAMPTZ,
  enabled BOOLEAN NOT NULL DEFAULT true,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on both tables
ALTER TABLE public.configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;

-- RLS policies for configs (only authenticated users can manage their own)
CREATE POLICY "configs_select_own" ON public.configs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "configs_insert_own" ON public.configs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "configs_update_own" ON public.configs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "configs_delete_own" ON public.configs FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for files (only authenticated users can manage their own)
CREATE POLICY "files_select_own" ON public.files FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "files_insert_own" ON public.files FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "files_update_own" ON public.files FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "files_delete_own" ON public.files FOR DELETE USING (auth.uid() = user_id);

-- Create storage bucket for file uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('uploads', 'uploads', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: authenticated users can upload
CREATE POLICY "uploads_insert_auth" ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'uploads');

-- Authenticated users can view their own uploads
CREATE POLICY "uploads_select_auth" ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'uploads');

-- Authenticated users can delete their own uploads
CREATE POLICY "uploads_delete_auth" ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'uploads');

-- Public can download from uploads bucket (for /f/{id} access)
CREATE POLICY "uploads_select_public" ON storage.objects FOR SELECT
  TO anon
  USING (bucket_id = 'uploads');
