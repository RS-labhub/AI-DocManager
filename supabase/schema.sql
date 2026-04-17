-- ══════════════════════════════════════════════════════════════
--  AI Document Management System — Supabase Schema (Consolidated)
--  ------------------------------------------------------------
--  This is the single-file, fresh-install schema. It represents
--  the end state after migration 001_real_rls.sql has been applied.
--
--  If you are provisioning a brand new Supabase project, run ONLY
--  this file. Do NOT also run 001_real_rls.sql — it is kept for
--  projects that were created from an older version of this file.
--
--  Key differences vs. the pre-migration schema:
--    • Legacy `credentials` table removed (auth lives in auth.users)
--    • All RLS policies are role-scoped (`TO service_role` /
--      `TO authenticated`) — no more `USING (true)` free-for-alls
--    • SECURITY DEFINER helper functions to avoid recursive RLS
--      checks against `profiles`
-- ══════════════════════════════════════════════════════════════

-- ══════════════════════════════════════════════════════════════
-- 1. Enums
-- ══════════════════════════════════════════════════════════════

CREATE TYPE user_role        AS ENUM ('god', 'super_admin', 'admin', 'user');
CREATE TYPE approval_status  AS ENUM ('pending', 'approved', 'rejected');

-- ══════════════════════════════════════════════════════════════
-- 2. Tables
-- ══════════════════════════════════════════════════════════════

-- 2.1 Organizations
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

-- 2.2 User profiles (extends Supabase auth.users)
CREATE TABLE profiles (
  id               UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email            TEXT NOT NULL UNIQUE,
  full_name        TEXT NOT NULL,
  avatar_url       TEXT,
  role             user_role NOT NULL DEFAULT 'user',
  org_id           UUID REFERENCES organizations(id) ON DELETE SET NULL,
  approval_status  approval_status NOT NULL DEFAULT 'approved',
  is_active        BOOLEAN NOT NULL DEFAULT true,
  created_at       TIMESTAMPTZ DEFAULT now(),
  updated_at       TIMESTAMPTZ DEFAULT now()
);

-- 2.3 Documents (org-scoped)
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

-- 2.4 Document comments
CREATE TABLE document_comments (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id  UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content      TEXT NOT NULL,
  parent_id    UUID REFERENCES document_comments(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now()
);

-- 2.5 Document passwords (scrypt hashes for protection codes)
CREATE TABLE document_passwords (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id    UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE UNIQUE,
  password_hash  TEXT NOT NULL,
  set_by         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at     TIMESTAMPTZ DEFAULT now(),
  updated_at     TIMESTAMPTZ DEFAULT now()
);

-- 2.6 Encrypted AI API keys (AES-256-GCM)
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

-- 2.7 AI agents (org-scoped)
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

-- 2.8 AI actions (org-scoped)
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

-- 2.9 Audit logs
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
-- 3. Indexes
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
-- 4. Auto-update updated_at triggers
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
CREATE TRIGGER trg_documents_updated       BEFORE UPDATE ON documents          FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_doc_comments_updated    BEFORE UPDATE ON document_comments  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_doc_passwords_updated   BEFORE UPDATE ON document_passwords FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_ai_api_keys_updated     BEFORE UPDATE ON ai_api_keys        FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_ai_agents_updated       BEFORE UPDATE ON ai_agents          FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_ai_actions_updated      BEFORE UPDATE ON ai_actions         FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ══════════════════════════════════════════════════════════════
-- 5. SECURITY DEFINER helpers for RLS
--    These let policies check role/org without recursing into
--    `profiles` policies. They only expose info about auth.uid().
-- ══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.current_profile()
RETURNS TABLE (id UUID, role user_role, org_id UUID, is_active BOOLEAN, approval_status approval_status)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT p.id, p.role, p.org_id, p.is_active, p.approval_status
  FROM profiles p
  WHERE p.id = auth.uid();
$$;

REVOKE ALL ON FUNCTION public.current_profile() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_profile() TO authenticated;

CREATE OR REPLACE FUNCTION public.current_role_is(min_role user_role)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM profiles p
    WHERE p.id = auth.uid()
      AND p.is_active
      AND p.approval_status = 'approved'
      AND (
        (min_role = 'user'        AND p.role IN ('user','admin','super_admin','god')) OR
        (min_role = 'admin'       AND p.role IN ('admin','super_admin','god')) OR
        (min_role = 'super_admin' AND p.role IN ('super_admin','god')) OR
        (min_role = 'god'         AND p.role = 'god')
      )
  );
$$;

REVOKE ALL ON FUNCTION public.current_role_is(user_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_role_is(user_role) TO authenticated;

CREATE OR REPLACE FUNCTION public.current_org_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT org_id FROM profiles WHERE id = auth.uid();
$$;

REVOKE ALL ON FUNCTION public.current_org_id() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_org_id() TO authenticated;

-- ══════════════════════════════════════════════════════════════
-- 6. Row Level Security
-- ══════════════════════════════════════════════════════════════

ALTER TABLE organizations      ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles           ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents          ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_comments  ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_passwords ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_api_keys        ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_agents          ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_actions         ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs         ENABLE ROW LEVEL SECURITY;

-- ── service_role passthrough (server-side admin client) ──────
CREATE POLICY "service_role_full_access" ON organizations
  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_full_access" ON profiles
  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_full_access" ON documents
  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_full_access" ON document_comments
  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_full_access" ON document_passwords
  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_full_access" ON ai_api_keys
  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_full_access" ON ai_agents
  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_full_access" ON ai_actions
  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_full_access" ON audit_logs
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ── organizations ────────────────────────────────────────────
CREATE POLICY "org_read_own_or_god" ON organizations
  FOR SELECT TO authenticated
  USING (
    public.current_role_is('god')
    OR id = public.current_org_id()
  );

-- Delete: god deletes any org; super_admin deletes only their own.
CREATE POLICY "org_delete_privileged" ON organizations
  FOR DELETE TO authenticated
  USING (
    public.current_role_is('god')
    OR (
      public.current_role_is('super_admin')
      AND id = public.current_org_id()
    )
  );
-- Create/update go through the server/service role.

-- ── profiles ─────────────────────────────────────────────────
CREATE POLICY "profile_read_self" ON profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid());

CREATE POLICY "profile_read_god" ON profiles
  FOR SELECT TO authenticated
  USING (public.current_role_is('god'));

CREATE POLICY "profile_read_same_org_admin" ON profiles
  FOR SELECT TO authenticated
  USING (
    public.current_role_is('admin')
    AND org_id = public.current_org_id()
  );

CREATE POLICY "profile_read_same_org_peers" ON profiles
  FOR SELECT TO authenticated
  USING (
    org_id IS NOT NULL
    AND org_id = public.current_org_id()
  );

CREATE POLICY "profile_update_self" ON profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- ── documents ────────────────────────────────────────────────
CREATE POLICY "doc_read_scoped" ON documents
  FOR SELECT TO authenticated
  USING (
    public.current_role_is('god')
    OR (
      org_id = public.current_org_id()
      AND (
        is_public
        OR owner_id = auth.uid()
        OR public.current_role_is('admin')
      )
    )
  );

CREATE POLICY "doc_insert_own_org" ON documents
  FOR INSERT TO authenticated
  WITH CHECK (
    owner_id = auth.uid()
    AND org_id = public.current_org_id()
    AND public.current_role_is('user')
  );

CREATE POLICY "doc_update_owner_or_admin" ON documents
  FOR UPDATE TO authenticated
  USING (
    public.current_role_is('god')
    OR owner_id = auth.uid()
    OR (
      public.current_role_is('admin')
      AND org_id = public.current_org_id()
    )
  )
  WITH CHECK (
    public.current_role_is('god')
    OR owner_id = auth.uid()
    OR (
      public.current_role_is('admin')
      AND org_id = public.current_org_id()
    )
  );

CREATE POLICY "doc_delete_owner_or_admin" ON documents
  FOR DELETE TO authenticated
  USING (
    public.current_role_is('god')
    OR owner_id = auth.uid()
    OR (
      public.current_role_is('admin')
      AND org_id = public.current_org_id()
    )
  );

-- ── document_comments ────────────────────────────────────────
CREATE POLICY "comment_read_if_can_read_doc" ON document_comments
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM documents d
      WHERE d.id = document_comments.document_id
        AND (
          public.current_role_is('god')
          OR (
            d.org_id = public.current_org_id()
            AND (
              d.is_public
              OR d.owner_id = auth.uid()
              OR public.current_role_is('admin')
            )
          )
        )
    )
  );

CREATE POLICY "comment_insert_self" ON document_comments
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM documents d
      WHERE d.id = document_comments.document_id
        AND (
          public.current_role_is('god')
          OR (
            d.org_id = public.current_org_id()
            AND (
              d.is_public
              OR d.owner_id = auth.uid()
              OR public.current_role_is('admin')
            )
          )
        )
    )
  );

CREATE POLICY "comment_delete_self_or_admin" ON document_comments
  FOR DELETE TO authenticated
  USING (
    user_id = auth.uid()
    OR public.current_role_is('god')
    OR (
      public.current_role_is('admin')
      AND EXISTS (
        SELECT 1 FROM documents d
        WHERE d.id = document_comments.document_id
          AND d.org_id = public.current_org_id()
      )
    )
  );

-- ── document_passwords (no authenticated access; app uses service role) ──
-- Intentionally no policies for `authenticated`.

-- ── ai_api_keys (owner-only) ─────────────────────────────────
CREATE POLICY "aikeys_read_own_metadata" ON ai_api_keys
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "aikeys_insert_own" ON ai_api_keys
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "aikeys_update_own" ON ai_api_keys
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "aikeys_delete_own" ON ai_api_keys
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- ── ai_agents ────────────────────────────────────────────────
CREATE POLICY "agent_read_same_org" ON ai_agents
  FOR SELECT TO authenticated
  USING (
    public.current_role_is('god')
    OR org_id = public.current_org_id()
  );

CREATE POLICY "agent_manage_admin" ON ai_agents
  FOR ALL TO authenticated
  USING (
    public.current_role_is('god')
    OR (
      public.current_role_is('admin')
      AND org_id = public.current_org_id()
    )
  )
  WITH CHECK (
    public.current_role_is('god')
    OR (
      public.current_role_is('admin')
      AND org_id = public.current_org_id()
    )
  );

-- ── ai_actions ───────────────────────────────────────────────
CREATE POLICY "ai_action_read_same_org" ON ai_actions
  FOR SELECT TO authenticated
  USING (
    public.current_role_is('god')
    OR org_id = public.current_org_id()
  );

CREATE POLICY "ai_action_insert_self" ON ai_actions
  FOR INSERT TO authenticated
  WITH CHECK (
    requested_by = auth.uid()
    AND org_id = public.current_org_id()
  );

CREATE POLICY "ai_action_update_admin" ON ai_actions
  FOR UPDATE TO authenticated
  USING (
    public.current_role_is('god')
    OR (
      public.current_role_is('admin')
      AND org_id = public.current_org_id()
    )
  )
  WITH CHECK (
    public.current_role_is('god')
    OR (
      public.current_role_is('admin')
      AND org_id = public.current_org_id()
    )
  );

CREATE POLICY "ai_action_delete_self_or_admin" ON ai_actions
  FOR DELETE TO authenticated
  USING (
    public.current_role_is('god')
    OR requested_by = auth.uid()
    OR (
      public.current_role_is('admin')
      AND org_id = public.current_org_id()
    )
  );

-- ── audit_logs ──────────────────────────────────────────────
-- Read: admin+ only (god or admin of same org).
CREATE POLICY "audit_read_admin_own_org" ON audit_logs
  FOR SELECT TO authenticated
  USING (
    public.current_role_is('god')
    OR (
      public.current_role_is('admin')
      AND org_id = public.current_org_id()
    )
  );

-- Insert: any authenticated user may log an action about themselves.
CREATE POLICY "audit_insert_self" ON audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- ══════════════════════════════════════════════════════════════
-- 7. Storage buckets
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

-- ── storage.objects policies ─────────────────────────────────
-- documents: private; all access goes through the app (service role).
-- The /api/document-file route enforces access checks.
CREATE POLICY "docs_service_only" ON storage.objects
  FOR ALL TO service_role
  USING (bucket_id = 'documents')
  WITH CHECK (bucket_id = 'documents');

-- avatars: public-read; authenticated users can only write under their own uid prefix.
CREATE POLICY "avatar_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "avatar_upload_own_prefix" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND (name LIKE auth.uid()::text || '/%')
  );

CREATE POLICY "avatar_update_own_prefix" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (name LIKE auth.uid()::text || '/%')
  )
  WITH CHECK (
    bucket_id = 'avatars'
    AND (name LIKE auth.uid()::text || '/%')
  );

CREATE POLICY "avatar_delete_own_prefix" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (name LIKE auth.uid()::text || '/%')
  );

-- service_role passthrough for admin storage ops
CREATE POLICY "storage_service_role" ON storage.objects
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ══════════════════════════════════════════════════════════════
--  Post-install sanity check
--    SELECT relname, relrowsecurity FROM pg_class
--    WHERE relname IN (
--      'organizations','profiles','documents','document_comments',
--      'document_passwords','ai_api_keys','ai_agents','ai_actions',
--      'audit_logs'
--    );
--  All should have relrowsecurity = true.
-- ══════════════════════════════════════════════════════════════
