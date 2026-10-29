ALTER TABLE products ADD COLUMN recommendation_mode TEXT NOT NULL DEFAULT 'mixed'
  CHECK (recommendation_mode IN ('mixed','best_selling','top_rated','similar'));
CREATE TABLE IF NOT EXISTS product_reviews (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products(id),
  order_id TEXT NOT NULL REFERENCES orders(id),
  rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
  comment TEXT NOT NULL DEFAULT '',
  is_approved INTEGER NOT NULL DEFAULT 0 CHECK(is_approved IN (0,1)),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  reviewed_at TEXT,
  UNIQUE(order_id, product_id)
);
CREATE INDEX IF NOT EXISTS idx_product_reviews_public ON product_reviews(product_id,is_approved,order_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_moderation ON product_reviews(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status_id ON orders(status,id);
