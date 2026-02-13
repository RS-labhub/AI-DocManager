-- ══════════════════════════════════════════════════════════════
--  AI Document Management System — Migration v2
--  Adds: document_comments, document_passwords, storage buckets
--  Run this AFTER the initial schema.sql has been applied
-- ══════════════════════════════════════════════════════════════

-- ──────────────────────────────────────────────────────────────
--  1. Document Comments
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS document_comments (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id  UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content      TEXT NOT NULL,
  parent_id    UUID REFERENCES document_comments(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_doc_comments_document ON document_comments(document_id);
CREATE INDEX IF NOT EXISTS idx_doc_comments_user     ON document_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_doc_comments_parent   ON document_comments(parent_id);

ALTER TABLE document_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON document_comments FOR ALL USING (true);

CREATE TRIGGER trg_doc_comments_updated
  BEFORE UPDATE ON document_comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ──────────────────────────────────────────────────────────────
--  2. Document Passwords (9-digit protection codes)
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS document_passwords (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id    UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE UNIQUE,
  password_hash  TEXT NOT NULL,   -- bcrypt hash of the 9-digit code
  set_by         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at     TIMESTAMPTZ DEFAULT now(),
  updated_at     TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_doc_passwords_document ON document_passwords(document_id);

ALTER TABLE document_passwords ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON document_passwords FOR ALL USING (true);

CREATE TRIGGER trg_doc_passwords_updated
  BEFORE UPDATE ON document_passwords
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ──────────────────────────────────────────────────────────────
--  3. Add classification & access_level columns to documents
-- ──────────────────────────────────────────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='documents' AND column_name='classification') THEN
    ALTER TABLE documents ADD COLUMN classification TEXT DEFAULT 'general'
      CHECK (classification IN ('general', 'confidential', 'internal', 'public'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='documents' AND column_name='access_level') THEN
    ALTER TABLE documents ADD COLUMN access_level TEXT DEFAULT 'org'
      CHECK (access_level IN ('private', 'org', 'public'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='documents' AND column_name='is_password_protected') THEN
    ALTER TABLE documents ADD COLUMN is_password_protected BOOLEAN DEFAULT false;
  END IF;
END $$;

-- ──────────────────────────────────────────────────────────────
--  4. Storage Buckets
-- ──────────────────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents',
  'documents',
  false,
  52428800,  -- 50MB
  ARRAY[
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'text/csv',
    'text/markdown',
    'text/html',
    'application/json',
    'image/png',
    'image/jpeg',
    'image/webp'
  ]
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880,  -- 5MB
  ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for documents bucket
CREATE POLICY "Authenticated users can upload documents"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'documents');

CREATE POLICY "Users can view documents in their org"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'documents');

CREATE POLICY "Document owners can delete their files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'documents');

-- Storage policies for avatars bucket
CREATE POLICY "Anyone can view avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Authenticated users can upload avatars"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'avatars');

-- Service role full access on storage
CREATE POLICY "Service role storage access"
  ON storage.objects FOR ALL
  USING (true);
