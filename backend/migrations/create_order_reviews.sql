CREATE TABLE IF NOT EXISTS order_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  helpful_count INTEGER DEFAULT 0,
  cashback_awarded BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(order_id, user_id)
);

CREATE TABLE IF NOT EXISTS order_review_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES order_reviews(id) ON DELETE CASCADE,
  media_url TEXT NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video')),
  file_size INTEGER NOT NULL,
  file_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS order_review_helpful (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES order_reviews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(review_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_order_reviews_order_id ON order_reviews(order_id);
CREATE INDEX IF NOT EXISTS idx_order_reviews_user_id ON order_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_order_review_media_review_id ON order_review_media(review_id);
CREATE INDEX IF NOT EXISTS idx_order_review_helpful_review_id ON order_review_helpful(review_id);
CREATE INDEX IF NOT EXISTS idx_order_review_helpful_user_id ON order_review_helpful(user_id);

CREATE OR REPLACE FUNCTION update_order_reviews_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER order_reviews_updated_at
  BEFORE UPDATE ON order_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_order_reviews_updated_at();

ALTER TABLE order_reviews ADD COLUMN IF NOT EXISTS cashback_awarded BOOLEAN DEFAULT FALSE;

