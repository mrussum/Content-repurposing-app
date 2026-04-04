-- Phase 3 migrations

-- 3.1 Direct platform OAuth tokens on profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS twitter_access_token  text,
  ADD COLUMN IF NOT EXISTS twitter_refresh_token text,
  ADD COLUMN IF NOT EXISTS twitter_token_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS linkedin_access_token  text,
  ADD COLUMN IF NOT EXISTS linkedin_token_expires_at timestamptz;

-- 3.2 Notion integration
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS notion_access_token text,
  ADD COLUMN IF NOT EXISTS notion_workspace_id text;

-- 3.3 Onboarding flag (if not already present from Phase 2)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS has_onboarded boolean NOT NULL DEFAULT false;

-- 3.6 Agency API keys
CREATE TABLE IF NOT EXISTS api_keys (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name          text NOT NULL,
  key_hash      text NOT NULL UNIQUE,   -- SHA-256 of the raw key; raw key shown once
  key_prefix    text NOT NULL,          -- first 12 chars for display (e.g. csp_abc123...)
  last_used_at  timestamptz,
  created_at    timestamptz DEFAULT now()
);

ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own api_keys"
  ON api_keys FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS api_keys_user_id_idx ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS api_keys_key_hash_idx ON api_keys(key_hash);

-- 3.7 Template library
CREATE TABLE IF NOT EXISTS templates (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid REFERENCES profiles(id) ON DELETE CASCADE,  -- NULL = community/built-in
  name              text NOT NULL,
  description       text NOT NULL DEFAULT '',
  system_prompt_addon text NOT NULL DEFAULT '',
  is_public         boolean NOT NULL DEFAULT false,
  use_count         int NOT NULL DEFAULT 0,
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now()
);

ALTER TABLE templates ENABLE ROW LEVEL SECURITY;

-- Users can read all public templates and their own private ones
CREATE POLICY "Read public or own templates"
  ON templates FOR SELECT
  USING (is_public = true OR auth.uid() = user_id);

-- Users can only insert/update/delete their own templates
CREATE POLICY "Manage own templates"
  ON templates FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS templates_public_use_count_idx ON templates(is_public, use_count DESC) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS templates_user_id_idx ON templates(user_id) WHERE user_id IS NOT NULL;

-- Seed a few built-in community templates (user_id NULL = system)
INSERT INTO templates (name, description, system_prompt_addon, is_public) VALUES
(
  'Storytelling',
  'Transforms dry content into narrative-driven stories with a hero and transformation arc.',
  'Use storytelling structure: open with a scene, introduce a challenge, show transformation. Make abstract ideas concrete through vivid examples.',
  true
),
(
  'Data-Driven',
  'Emphasizes statistics, research, and evidence in every format.',
  'Lead with data. Every claim should be backed by a number or study. Use specific percentages and timeframes, not vague language.',
  true
),
(
  'Contrarian',
  'Takes the opposite stance of conventional wisdom to spark engagement.',
  'Challenge common beliefs. Start with "Most people think X, but..." structure. Be provocative but always back it up with reasoning.',
  true
),
(
  'How-To Guide',
  'Transforms any content into actionable step-by-step instructions.',
  'Structure everything as numbered steps. Use active voice. Every format should tell the reader exactly what to do, in what order.',
  true
)
ON CONFLICT DO NOTHING;

-- Function to increment template use_count atomically
CREATE OR REPLACE FUNCTION increment_template_use_count(p_template_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE templates SET use_count = use_count + 1 WHERE id = p_template_id;
END;
$$;
