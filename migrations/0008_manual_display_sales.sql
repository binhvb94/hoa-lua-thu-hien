-- V1.3.9.1: Trường số bán hiển thị độc lập thống kê thực tế. Chạy đúng một lần.
ALTER TABLE products ADD COLUMN display_sold_count INTEGER NOT NULL DEFAULT 0 CHECK(display_sold_count BETWEEN 0 AND 999999999);
