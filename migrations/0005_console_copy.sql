ALTER TABLE products ADD COLUMN seo_title TEXT NOT NULL DEFAULT '';
ALTER TABLE products ADD COLUMN seo_description TEXT NOT NULL DEFAULT '';
CREATE INDEX IF NOT EXISTS idx_products_seo_index ON products(is_deleted,is_active,is_sample,updated_at);
