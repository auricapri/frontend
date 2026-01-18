-- Migration: Weather and Marketing Tables
-- Part of the Tracking and Personalization Solution

-- 1. Weather Snapshots (Historical weather data)
CREATE TABLE IF NOT EXISTS weather_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location TEXT NOT NULL,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  temperature DOUBLE PRECISION,
  condition TEXT,
  humidity DOUBLE PRECISION,
  snapshot_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_weather_snapshots_location ON weather_snapshots(location);
CREATE INDEX IF NOT EXISTS idx_weather_snapshots_snapshot_date ON weather_snapshots(snapshot_date);

-- 2. Weather Rules (Configurable rules for weather-based actions)
CREATE TABLE IF NOT EXISTS weather_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_name TEXT NOT NULL,
  min_temp FLOAT,
  max_temp FLOAT,
  condition_trigger TEXT,
  action_metadata JSONB DEFAULT '{}',
  priority INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_weather_rules_active ON weather_rules(is_active);
CREATE INDEX IF NOT EXISTS idx_weather_rules_priority ON weather_rules(priority);

-- Insert default weather rules
INSERT INTO weather_rules (rule_name, min_temp, max_temp, condition_trigger, action_metadata, priority) VALUES
  ('Heavy Winter', NULL, 15, NULL, '{"tags": ["heavy_winter"], "categories": ["Casacos", "Blusas de Lã"]}', 10),
  ('Light Winter', 15, 20, NULL, '{"tags": ["light_winter"], "categories": ["Cardigans", "Jaquetas"]}', 8),
  ('Rainy Day', NULL, NULL, 'Rain', '{"tags": ["rainy_day"], "categories": ["Botas", "Impermeáveis"]}', 9),
  ('Summer Vibe', 28, NULL, NULL, '{"tags": ["summer_vibe"], "categories": ["Vestidos", "Biquínis"]}', 10),
  ('Warm Weather', 25, 28, NULL, '{"tags": ["warm_weather"], "categories": ["Camisetas", "Shorts"]}', 7),
  ('Sunny Day', NULL, NULL, 'Clear', '{"tags": ["sunny_day"], "categories": ["Óculos", "Chapéus"]}', 6)
ON CONFLICT DO NOTHING;

-- 3. Campaigns (Marketing campaign management)
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  tags TEXT[] DEFAULT '{}',
  target_segments JSONB DEFAULT '{}',
  weather_conditions JSONB,
  is_active BOOLEAN DEFAULT true,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_campaigns_tags ON campaigns USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_campaigns_is_active ON campaigns(is_active);
CREATE INDEX IF NOT EXISTS idx_campaigns_start_date ON campaigns(start_date);
CREATE INDEX IF NOT EXISTS idx_campaigns_end_date ON campaigns(end_date);

-- 4. User Tags (User interest scoring with decay)
CREATE TABLE IF NOT EXISTS user_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tag TEXT NOT NULL,
  score DOUBLE PRECISION NOT NULL DEFAULT 0.0 CHECK (score >= 0 AND score <= 1),
  source TEXT NOT NULL,
  last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  interaction_count INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, tag)
);

CREATE INDEX IF NOT EXISTS idx_user_tags_user_id ON user_tags(user_id);
CREATE INDEX IF NOT EXISTS idx_user_tags_tag ON user_tags(tag);
CREATE INDEX IF NOT EXISTS idx_user_tags_score ON user_tags(score);
CREATE INDEX IF NOT EXISTS idx_user_tags_last_seen ON user_tags(last_seen_at);

-- 5. Campaign Interactions (Tracking interactions with campaigns)
CREATE TABLE IF NOT EXISTS campaign_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  session_id TEXT,
  interaction_type TEXT NOT NULL, -- 'sent', 'opened', 'clicked', 'converted'
  source TEXT, -- 'weather_recommendation', 'campaign', 'organic'
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_campaign_interactions_campaign_id ON campaign_interactions(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_interactions_user_id ON campaign_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_campaign_interactions_type ON campaign_interactions(interaction_type);
CREATE INDEX IF NOT EXISTS idx_campaign_interactions_source ON campaign_interactions(source);

-- 6. Helper Functions for Maintenance

-- Function to apply tag decay automatically
CREATE OR REPLACE FUNCTION apply_tag_decay()
RETURNS void AS $$
BEGIN
  -- Decay tags that haven't been seen for more than 90 days
  UPDATE user_tags
  SET 
    score = score * POWER(0.8, EXTRACT(EPOCH FROM (NOW() - last_seen_at)) / (7 * 24 * 3600)),
    updated_at = NOW()
  WHERE 
    last_seen_at < NOW() - INTERVAL '90 days'
    AND score > 0.1;
  
  -- Remove tags with very low score
  DELETE FROM user_tags WHERE score < 0.1;
END;
$$ LANGUAGE plpgsql;
