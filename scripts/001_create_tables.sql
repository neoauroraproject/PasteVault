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

-- RLS policies for configs
DROP POLICY IF EXISTS "configs_select_own" ON public.configs;
CREATE POLICY "configs_select_own" ON public.configs FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "configs_insert_own" ON public.configs;
CREATE POLICY "configs_insert_own" ON public.configs FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "configs_update_own" ON public.configs;
CREATE POLICY "configs_update_own" ON public.configs FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "configs_delete_own" ON public.configs;
CREATE POLICY "configs_delete_own" ON public.configs FOR DELETE USING (auth.uid() = user_id);

-- Public read policy for configs (for /c/[id] public access)
DROP POLICY IF EXISTS "configs_select_public" ON public.configs;
CREATE POLICY "configs_select_public" ON public.configs FOR SELECT TO anon USING (enabled = true);

-- RLS policies for files
DROP POLICY IF EXISTS "files_select_own" ON public.files;
CREATE POLICY "files_select_own" ON public.files FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "files_insert_own" ON public.files;
CREATE POLICY "files_insert_own" ON public.files FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "files_update_own" ON public.files;
CREATE POLICY "files_update_own" ON public.files FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "files_delete_own" ON public.files;
CREATE POLICY "files_delete_own" ON public.files FOR DELETE USING (auth.uid() = user_id);

-- Public read policy for files (for /f/[id] public access)
DROP POLICY IF EXISTS "files_select_public" ON public.files;
CREATE POLICY "files_select_public" ON public.files FOR SELECT TO anon USING (enabled = true);
