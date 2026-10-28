-- Cloudflare D1: dữ liệu đặt hàng và khách đăng ký của Hoa Lụa Thu Hiền.
-- Mọi đơn đều ở trạng thái 'new' để nhân viên gọi xác nhận COD; không đồng nghĩa đã thanh toán.
CREATE TABLE IF NOT EXISTS orders (
 id TEXT PRIMARY KEY,
 client_key TEXT NOT NULL UNIQUE,
 order_code TEXT NOT NULL UNIQUE,
 customer_name TEXT NOT NULL,
 phone TEXT NOT NULL,
 address TEXT NOT NULL,
 note TEXT NOT NULL DEFAULT '',
 payment_method TEXT NOT NULL DEFAULT 'cod',
 items_json TEXT NOT NULL,
 subtotal INTEGER NOT NULL,
 shipping_fee INTEGER NOT NULL DEFAULT 0,
 total INTEGER NOT NULL,
 status TEXT NOT NULL DEFAULT 'new',
 created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_phone ON orders(phone);
CREATE TABLE IF NOT EXISTS registrations (
 id TEXT PRIMARY KEY,
 full_name TEXT NOT NULL,
 phone TEXT NOT NULL UNIQUE,
 email TEXT,
 marketing_consent INTEGER NOT NULL DEFAULT 0,
 created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_registrations_created_at ON registrations(created_at DESC);
