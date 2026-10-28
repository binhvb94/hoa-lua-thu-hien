-- Chạy 0001_init.sql trước, sau đó chạy tệp này. Giữ nguyên bảng orders và registrations.
CREATE TABLE IF NOT EXISTS products (
 id TEXT PRIMARY KEY,
 slug TEXT NOT NULL UNIQUE,
 name TEXT NOT NULL,
 category TEXT NOT NULL CHECK(category IN ('hoa-lua','hoa-cao-su','hoa-decor')),
 price INTEGER NOT NULL CHECK(price>=0),
 old_price INTEGER,
 badge TEXT NOT NULL DEFAULT '',
 detail TEXT NOT NULL DEFAULT '',
 material TEXT NOT NULL DEFAULT '',
 size TEXT NOT NULL DEFAULT '',
 image TEXT NOT NULL,
 tone TEXT NOT NULL DEFAULT 'rose',
 is_active INTEGER NOT NULL DEFAULT 1,
 is_deleted INTEGER NOT NULL DEFAULT 0,
 is_sample INTEGER NOT NULL DEFAULT 0,
 sort_order INTEGER NOT NULL DEFAULT 0,
 created_at TEXT NOT NULL DEFAULT (datetime('now')),
 updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_products_live ON products(is_deleted,is_active,sort_order);
CREATE TABLE IF NOT EXISTS admin_sessions (
 token_hash TEXT PRIMARY KEY, csrf_token TEXT NOT NULL, expires_at TEXT NOT NULL,
 created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_expire ON admin_sessions(expires_at);
CREATE TABLE IF NOT EXISTS admin_login_attempts (
 ip_hash TEXT PRIMARY KEY,failures INTEGER NOT NULL,first_attempt TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS admin_audit_logs (
 id TEXT PRIMARY KEY, action TEXT NOT NULL,product_id TEXT NOT NULL,
 created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_admin_audit_created ON admin_audit_logs(created_at DESC);
-- Dữ liệu sản phẩm mẫu, sẽ được gắn nhãn 'MẪU' trong ADMIN.
INSERT OR IGNORE INTO products (id,slug,name,category,price,old_price,badge,detail,material,size,image,tone,is_active,is_sample,sort_order) VALUES ('TH001','bo-hoa-hong-lua-hong-phan','Bó hoa hồng lụa hồng phấn','hoa-lua','189000','235000','Được yêu thích','Bó hoa lụa sắc hồng nhẹ nhàng, phù hợp trang trí bàn làm việc, phòng ngủ hoặc làm quà tặng.','Vải lụa nhân tạo','Mẫu tham khảo · liên hệ tư vấn kích thước','https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=1000&q=85','rose',1,1,1);
INSERT OR IGNORE INTO products (id,slug,name,category,price,old_price,badge,detail,material,size,image,tone,is_active,is_sample,sort_order) VALUES ('TH002','binh-hoa-cam-tu-cau-pastel','Bình cẩm tú cầu pastel','hoa-decor','325000',NULL,'Mẫu mới','Cẩm tú cầu phối tông pastel trang nhã, làm điểm nhấn cho kệ trang trí và góc phòng khách.','Hoa giả decor','Mẫu tham khảo · liên hệ tư vấn kích thước','https://images.unsplash.com/photo-1525310072745-f49212b5ac6d?auto=format&fit=crop&w=1000&q=85','lilac',1,1,2);
INSERT OR IGNORE INTO products (id,slug,name,category,price,old_price,badge,detail,material,size,image,tone,is_active,is_sample,sort_order) VALUES ('TH003','canh-moc-lan-cao-su-trang-kem','Cành mộc lan cao su trắng kem','hoa-cao-su','125000','158000','Giá tốt','Cành mộc lan cao su mang cảm giác mềm mại, dễ phối trong bình gốm và không gian tối giản.','Cao su nhân tạo','Mẫu tham khảo · liên hệ tư vấn kích thước','https://images.unsplash.com/photo-1487530811176-3780de880c2d?auto=format&fit=crop&w=1000&q=85','cream',1,1,3);
INSERT OR IGNORE INTO products (id,slug,name,category,price,old_price,badge,detail,material,size,image,tone,is_active,is_sample,sort_order) VALUES ('TH004','bo-hoa-tulip-lua-kem','Bó tulip lụa màu kem','hoa-lua','220000',NULL,'','Tulip lụa thanh lịch dành cho bàn trà, phòng ngủ hoặc phong cách trang trí Hàn Quốc.','Vải lụa nhân tạo','Mẫu tham khảo · liên hệ tư vấn kích thước','https://images.unsplash.com/photo-1526045478516-99145907023c?auto=format&fit=crop&w=1000&q=85','cream',1,1,4);
INSERT OR IGNORE INTO products (id,slug,name,category,price,old_price,badge,detail,material,size,image,tone,is_active,is_sample,sort_order) VALUES ('TH005','hoa-mau-don-decor','Hoa mẫu đơn decor thanh lịch','hoa-decor','285000','340000','Được yêu thích','Sắc hồng kem nhẹ nhàng, phù hợp trang trí nhà ở, cửa hàng hoặc làm góc chụp ảnh.','Hoa giả decor','Mẫu tham khảo · liên hệ tư vấn kích thước','https://images.unsplash.com/photo-1519378058457-4c29a0a2efac?auto=format&fit=crop&w=1000&q=85','rose',1,1,5);
INSERT OR IGNORE INTO products (id,slug,name,category,price,old_price,badge,detail,material,size,image,tone,is_active,is_sample,sort_order) VALUES ('TH006','canh-hoa-anh-dao-cao-su','Cành hoa anh đào cao su','hoa-cao-su','145000',NULL,'','Sắc hồng nổi bật, thích hợp cắm bình cao và phối không gian trang trí theo mùa.','Cao su nhân tạo','Mẫu tham khảo · liên hệ tư vấn kích thước','https://images.unsplash.com/photo-1494972308805-463bc619d34e?auto=format&fit=crop&w=1000&q=85','rose',1,1,6);
INSERT OR IGNORE INTO products (id,slug,name,category,price,old_price,badge,detail,material,size,image,tone,is_active,is_sample,sort_order) VALUES ('TH007','bo-hoa-baby-trang-lua','Bó hoa baby trắng lụa','hoa-lua','165000',NULL,'','Dáng bó nhẹ nhàng, có thể cắm riêng hoặc kết hợp hoa hồng, tulip trong nhiều phong cách.','Vải lụa nhân tạo','Mẫu tham khảo · liên hệ tư vấn kích thước','https://images.unsplash.com/photo-1508615070457-7baeba4003ab?auto=format&fit=crop&w=1000&q=85','cream',1,1,7);
INSERT OR IGNORE INTO products (id,slug,name,category,price,old_price,badge,detail,material,size,image,tone,is_active,is_sample,sort_order) VALUES ('TH008','set-hoa-decor-ban-tra','Set hoa decor bàn trà','hoa-decor','395000','465000','Set trang trí','Gợi ý phối hoa và bình tạo điểm nhấn nhẹ nhàng cho bàn trà, kệ tủ và bàn tiếp khách.','Hoa giả trang trí','Mẫu tham khảo · liên hệ tư vấn kích thước','https://images.unsplash.com/photo-1561181286-d3fee7d55364?auto=format&fit=crop&w=1000&q=85','lilac',1,1,8);
INSERT OR IGNORE INTO products (id,slug,name,category,price,old_price,badge,detail,material,size,image,tone,is_active,is_sample,sort_order) VALUES ('TH009','hoa-hong-cao-su-co-dien','Cành hồng cao su cổ điển','hoa-cao-su','109000',NULL,'','Hoa hồng cao su dễ phối thành bó hoặc cắm cành lẻ, thích hợp cho nhiều phong cách nội thất.','Cao su nhân tạo','Mẫu tham khảo · liên hệ tư vấn kích thước','https://images.unsplash.com/photo-1509600110300-21b9d5fedeb7?auto=format&fit=crop&w=1000&q=85','rose',1,1,9);
