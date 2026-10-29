-- V1.3.9.5 – phân loại / SKU / giá / tồn kho / ảnh theo tổ hợp.
-- Không thay đổi sản phẩm cũ: chỉ sản phẩm mới cấu hình phân loại cần chọn biến thể.
ALTER TABLE products ADD COLUMN variant_config TEXT NOT NULL DEFAULT '{"axes":[],"items":[]}';
-- Stock safety: reject an attempted checkout decrement if a combination has insufficient stock.
CREATE TRIGGER IF NOT EXISTS product_variant_stock_nonnegative
BEFORE UPDATE OF variant_config ON products
WHEN EXISTS(SELECT 1 FROM json_each(NEW.variant_config,'$.items') AS j
            WHERE CAST(json_extract(j.value,'$.stock') AS INTEGER)<0)
BEGIN SELECT RAISE(ABORT,'VARIANT_OUT_OF_STOCK'); END;
