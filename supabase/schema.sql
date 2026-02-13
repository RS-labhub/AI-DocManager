-- ══════════════════════════════════════════════════════════════
--  AI Document Management System — Supabase Schema
--  Run this in the Supabase SQL Editor to set up your database
-- ══════════════════════════════════════════════════════════════

-- 1. Enum for user roles
CREATE TYPE user_role AS ENUM ('god', 'super_admin', 'admin', 'user');

-- 2. Organizations
CREATE TABLE organizations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  description TEXT,
  logo_url    TEXT,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- 3. User profiles (extends Supabase auth.users)
CREATE TABLE profiles (
  id          UUID PRIMARY KEY,                     -- same as auth.users.id
  email       TEXT NOT NULL UNIQUE,
  full_name   TEXT NOT NULL,
  avatar_url  TEXT,
  role        user_role NOT NULL DEFAULT 'user',
  org_id      UUID REFERENCES organizations(id) ON DELETE SET NULL,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- 3b. Credentials (password hashes stored separately)
CREATE TABLE credentials (
  user_id        UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  password_hash  TEXT NOT NULL,
  created_at     TIMESTAMPTZ DEFAULT now(),
  updated_at     TIMESTAMPTZ DEFAULT now()
);

-- 4. Documents (org-scoped)
CREATE TABLE documents (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT NOT NULL,
  content     TEXT NOT NULL DEFAULT '',
  file_url    TEXT,
  file_type   TEXT,
  owner_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  org_id      UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  is_public   BOOLEAN NOT NULL DEFAULT false,
  tags        TEXT[] DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- 5. Encrypted AI API keys
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

-- 6. AI Agents (org-scoped)
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

-- 7. AI Actions (org-scoped)
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

-- 8. Audit logs
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

CREATE INDEX idx_profiles_org      ON profiles(org_id);
CREATE INDEX idx_profiles_role     ON profiles(role);
CREATE INDEX idx_documents_org     ON documents(org_id);
CREATE INDEX idx_documents_owner   ON documents(owner_id);
CREATE INDEX idx_ai_api_keys_user  ON ai_api_keys(user_id);
CREATE INDEX idx_ai_agents_org     ON ai_agents(org_id);
CREATE INDEX idx_ai_actions_org    ON ai_actions(org_id);
CREATE INDEX idx_ai_actions_status ON ai_actions(status);
CREATE INDEX idx_audit_logs_user   ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_org    ON audit_logs(org_id);

-- ══════════════════════════════════════════════════════════════
--  Row Level Security
-- ══════════════════════════════════════════════════════════════

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE credentials    ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents      ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_api_keys    ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_agents      ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_actions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs     ENABLE ROW LEVEL SECURITY;

-- Allow service role full access (for server-side operations)
CREATE POLICY "Service role full access" ON organizations FOR ALL USING (true);
CREATE POLICY "Service role full access" ON profiles       FOR ALL USING (true);
CREATE POLICY "Service role full access" ON credentials    FOR ALL USING (true);
CREATE POLICY "Service role full access" ON documents      FOR ALL USING (true);
CREATE POLICY "Service role full access" ON ai_api_keys    FOR ALL USING (true);
CREATE POLICY "Service role full access" ON ai_agents      FOR ALL USING (true);
CREATE POLICY "Service role full access" ON ai_actions     FOR ALL USING (true);
CREATE POLICY "Service role full access" ON audit_logs     FOR ALL USING (true);

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

CREATE TRIGGER trg_organizations_updated BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_profiles_updated      BEFORE UPDATE ON profiles       FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_credentials_updated   BEFORE UPDATE ON credentials    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_documents_updated     BEFORE UPDATE ON documents      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_ai_api_keys_updated   BEFORE UPDATE ON ai_api_keys    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_ai_agents_updated     BEFORE UPDATE ON ai_agents      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_ai_actions_updated    BEFORE UPDATE ON ai_actions     FOR EACH ROW EXECUTE FUNCTION update_updated_at();
