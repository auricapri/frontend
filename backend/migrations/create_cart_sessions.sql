CREATE TABLE IF NOT EXISTS cart_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_key TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_cart_sessions_session_key ON cart_sessions(session_key);
CREATE INDEX IF NOT EXISTS idx_cart_sessions_user_id ON cart_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_sessions_expires_at ON cart_sessions(expires_at) WHERE expires_at IS NOT NULL;

CREATE OR REPLACE FUNCTION update_cart_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_cart_sessions_updated_at
  BEFORE UPDATE ON cart_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_cart_sessions_updated_at();
