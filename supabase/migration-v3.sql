-- Migration V3: Enhanced document fields for full-fledged DMS
-- Adds: description, file_url, file_size, version, status, last_accessed_at

-- New columns on documents
ALTER TABLE documents ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS file_url TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS file_size BIGINT DEFAULT 0;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived', 'under_review'));
ALTER TABLE documents ADD COLUMN IF NOT EXISTS last_accessed_at TIMESTAMPTZ DEFAULT NOW();

-- Index on status for filtering
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);
