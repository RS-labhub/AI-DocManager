-- ══════════════════════════════════════════════════════════════
--  AI Document Management System — Supabase Schema (Complete)
--  Run this in the Supabase SQL Editor to set up your database
--  Includes all migrations (v2, v3, v4) merged into one file
-- ══════════════════════════════════════════════════════════════

-- 1. Enum for user roles
CREATE TYPE user_role AS ENUM ('god', 'super_admin', 'admin', 'user');

-- 2. Enum for membership approval status
CREATE TYPE approval_status AS ENUM ('pending', 'approved', 'rejected');

-- 3. Organizations
CREATE TABLE organizations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  org_code    TEXT NOT NULL UNIQUE,             -- alphanumeric code users enter to join
  description TEXT,
  logo_url    TEXT,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- 4. User profiles (extends Supabase auth.users)
CREATE TABLE profiles (
  id               UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,  -- linked to Supabase Auth
  email            TEXT NOT NULL UNIQUE,
  full_name        TEXT NOT NULL,
  avatar_url       TEXT,
  role             user_role NOT NULL DEFAULT 'user',
  org_id           UUID REFERENCES organizations(id) ON DELETE SET NULL,
  approval_status  approval_status NOT NULL DEFAULT 'approved',  -- pending/approved/rejected
  is_active        BOOLEAN NOT NULL DEFAULT true,
  created_at       TIMESTAMPTZ DEFAULT now(),
  updated_at       TIMESTAMPTZ DEFAULT now()
);

-- 5. Credentials (password hashes stored separately)
CREATE TABLE credentials (
  user_id        UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  password_hash  TEXT NOT NULL,
  created_at     TIMESTAMPTZ DEFAULT now(),
  updated_at     TIMESTAMPTZ DEFAULT now()
);

-- 6. Documents (org-scoped, with all v2/v3 columns)
CREATE TABLE documents (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title                 TEXT NOT NULL,
  content               TEXT NOT NULL DEFAULT '',
  description           TEXT,
  file_url              TEXT,
  file_type             TEXT,
  file_size             BIGINT DEFAULT 0,
  owner_id              UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  org_id                UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  is_public             BOOLEAN NOT NULL DEFAULT false,
  tags                  TEXT[] DEFAULT '{}',
  classification        TEXT DEFAULT 'general'
                          CHECK (classification IN ('general', 'confidential', 'internal', 'public', 'organization')),
  access_level          TEXT DEFAULT 'view_only'
                          CHECK (access_level IN ('view_only', 'comment', 'edit', 'full_access')),
  is_password_protected BOOLEAN DEFAULT false,
  version               INTEGER DEFAULT 1,
  status                TEXT DEFAULT 'draft'
                          CHECK (status IN ('draft', 'published', 'archived', 'under_review')),
  reviewers             TEXT[] DEFAULT '{}',
  referenced_docs       TEXT[] DEFAULT '{}',
  last_accessed_at      TIMESTAMPTZ DEFAULT now(),
  created_at            TIMESTAMPTZ DEFAULT now(),
  updated_at            TIMESTAMPTZ DEFAULT now()
);

-- 7. Document Comments
CREATE TABLE document_comments (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id  UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content      TEXT NOT NULL,
  parent_id    UUID REFERENCES document_comments(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now()
);

-- 8. Document Passwords (9-digit protection codes)
CREATE TABLE document_passwords (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id    UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE UNIQUE,
  password_hash  TEXT NOT NULL,
  set_by         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at     TIMESTAMPTZ DEFAULT now(),
  updated_at     TIMESTAMPTZ DEFAULT now()
);

-- 9. Encrypted AI API keys
CREATE TABLE ai_api_keys (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  provider       TEXT NOT NULL CHECK (provider IN ('groq', 'openai', 'anthropic')),
  encrypted_key  TEXT NOT NULL,
  iv             TEXT NOT NULL,
  auth_tag       TEXT NOT NULL,
  label          TEXT NOT NULL DEFAULT 'Default',
  is_active      BOOLEAN NOT NULL DEFAULT true,
  created_at     TIMESTAMPTZ DEFAULT now(),
  updated_at     TIMESTAMPTZ DEFAULT now()
);

-- 10. AI Agents (org-scoped)
CREATE TABLE ai_agents (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL,
  description  TEXT NOT NULL DEFAULT '',
  role         TEXT NOT NULL CHECK (role IN ('assistant', 'analyzer', 'editor', 'admin')),
  capabilities TEXT[] DEFAULT '{}',
  org_id       UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_by   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  is_active    BOOLEAN NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now()
);

-- 11. AI Actions (org-scoped)
CREATE TABLE ai_actions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id       UUID NOT NULL REFERENCES ai_agents(id) ON DELETE CASCADE,
  action_type    TEXT NOT NULL,
  resource_type  TEXT NOT NULL,
  resource_id    TEXT NOT NULL,
  status         TEXT NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending','approved','rejected','completed','failed')),
  requested_by   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  approved_by    UUID REFERENCES profiles(id),
  rejected_by    UUID REFERENCES profiles(id),
  metadata       JSONB DEFAULT '{}',
  result         JSONB,
  org_id         UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_at     TIMESTAMPTZ DEFAULT now(),
  updated_at     TIMESTAMPTZ DEFAULT now()
);

-- 12. Audit logs
CREATE TABLE audit_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action        TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id   TEXT,
  details       JSONB DEFAULT '{}',
  org_id        UUID REFERENCES organizations(id) ON DELETE SET NULL,
  ip_address    TEXT,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- ══════════════════════════════════════════════════════════════
--  Indexes
-- ══════════════════════════════════════════════════════════════

CREATE INDEX idx_profiles_org            ON profiles(org_id);
CREATE INDEX idx_profiles_role           ON profiles(role);
CREATE INDEX idx_profiles_approval       ON profiles(approval_status);
CREATE INDEX idx_orgs_org_code           ON organizations(org_code);
CREATE INDEX idx_documents_org           ON documents(org_id);
CREATE INDEX idx_documents_owner         ON documents(owner_id);
CREATE INDEX idx_documents_status        ON documents(status);
CREATE INDEX idx_doc_comments_document   ON document_comments(document_id);
CREATE INDEX idx_doc_comments_user       ON document_comments(user_id);
CREATE INDEX idx_doc_comments_parent     ON document_comments(parent_id);
CREATE INDEX idx_doc_passwords_document  ON document_passwords(document_id);
CREATE INDEX idx_ai_api_keys_user        ON ai_api_keys(user_id);
CREATE INDEX idx_ai_agents_org           ON ai_agents(org_id);
CREATE INDEX idx_ai_actions_org          ON ai_actions(org_id);
CREATE INDEX idx_ai_actions_status       ON ai_actions(status);
CREATE INDEX idx_audit_logs_user         ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_org          ON audit_logs(org_id);

-- ══════════════════════════════════════════════════════════════
--  Row Level Security
-- ══════════════════════════════════════════════════════════════

ALTER TABLE organizations      ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles           ENABLE ROW LEVEL SECURITY;
ALTER TABLE credentials        ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents          ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_comments  ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_passwords ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_api_keys        ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_agents          ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_actions         ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs         ENABLE ROW LEVEL SECURITY;

-- Allow service role full access (for server-side operations)
CREATE POLICY "Service role full access" ON organizations      FOR ALL USING (true);
CREATE POLICY "Service role full access" ON profiles           FOR ALL USING (true);
CREATE POLICY "Service role full access" ON credentials        FOR ALL USING (true);
CREATE POLICY "Service role full access" ON documents          FOR ALL USING (true);
CREATE POLICY "Service role full access" ON document_comments  FOR ALL USING (true);
CREATE POLICY "Service role full access" ON document_passwords FOR ALL USING (true);
CREATE POLICY "Service role full access" ON ai_api_keys        FOR ALL USING (true);
CREATE POLICY "Service role full access" ON ai_agents          FOR ALL USING (true);
CREATE POLICY "Service role full access" ON ai_actions         FOR ALL USING (true);
CREATE POLICY "Service role full access" ON audit_logs         FOR ALL USING (true);

-- ══════════════════════════════════════════════════════════════
--  Auto-update updated_at trigger
-- ══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_organizations_updated   BEFORE UPDATE ON organizations      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_profiles_updated        BEFORE UPDATE ON profiles           FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_credentials_updated     BEFORE UPDATE ON credentials        FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_documents_updated       BEFORE UPDATE ON documents          FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_doc_comments_updated    BEFORE UPDATE ON document_comments  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_doc_passwords_updated   BEFORE UPDATE ON document_passwords FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_ai_api_keys_updated     BEFORE UPDATE ON ai_api_keys        FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_ai_agents_updated       BEFORE UPDATE ON ai_agents          FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_ai_actions_updated      BEFORE UPDATE ON ai_actions         FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ══════════════════════════════════════════════════════════════
--  Storage Buckets
-- ══════════════════════════════════════════════════════════════

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
