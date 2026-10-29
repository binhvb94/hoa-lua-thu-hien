-- V1.3.9.4: Mỗi sản phẩm giữ cột image làm ảnh đại diện, cộng thêm tối đa 11 ảnh phụ.
-- Ảnh cũ không bị thay đổi, đơn hàng và SEO vẫn tham chiếu cột image.
ALTER TABLE products ADD COLUMN gallery_images TEXT NOT NULL DEFAULT '[]';
