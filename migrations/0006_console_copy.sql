CREATE TABLE IF NOT EXISTS product_categories (
 slug TEXT PRIMARY KEY NOT NULL,
 name TEXT NOT NULL,
 description TEXT NOT NULL DEFAULT '',
 image TEXT NOT NULL DEFAULT '',
 seo_title TEXT NOT NULL DEFAULT '',
 seo_description TEXT NOT NULL DEFAULT '',
 seo_image TEXT NOT NULL DEFAULT '',
 is_active INTEGER NOT NULL DEFAULT 1,
 is_deleted INTEGER NOT NULL DEFAULT 0,
 sort_order INTEGER NOT NULL DEFAULT 0,
 created_at TEXT NOT NULL DEFAULT (datetime('now')),
 updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS product_category_links (
 product_id TEXT NOT NULL,
 category_slug TEXT NOT NULL,
 created_at TEXT NOT NULL DEFAULT (datetime('now')),
 PRIMARY KEY(product_id,category_slug),
 FOREIGN KEY(product_id) REFERENCES products(id),
 FOREIGN KEY(category_slug) REFERENCES product_categories(slug)
);
CREATE INDEX IF NOT EXISTS idx_category_active_order ON product_categories(is_deleted,is_active,sort_order);
CREATE INDEX IF NOT EXISTS idx_category_links_slug ON product_category_links(category_slug,product_id);
INSERT OR IGNORE INTO product_categories(slug,name,description,sort_order) VALUES
 ('hoa-lua','Hoa lụa','Những mẫu hoa lụa trang trí tinh tế',1),
 ('hoa-cao-su','Hoa cao su','Hoa cao su trang trí không gian sống',2),
 ('hoa-decor','Hoa giả decor','Những mẫu hoa giả decor đẹp',3);
INSERT OR IGNORE INTO product_category_links(product_id,category_slug)
 SELECT p.id,p.category FROM products p
 INNER JOIN product_categories c ON c.slug=p.category
 WHERE p.is_deleted=0;
