CREATE INDEX IF NOT EXISTS idx_orders_status_created ON orders(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_registrations_phone ON registrations(phone);
CREATE TABLE IF NOT EXISTS order_status_history (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES orders(id),
  previous_status TEXT NOT NULL,
  new_status TEXT NOT NULL,
  changed_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_order_history_order ON order_status_history(order_id,changed_at DESC);
CREATE TRIGGER IF NOT EXISTS trg_orders_status_audit
AFTER UPDATE OF status ON orders
WHEN OLD.status <> NEW.status
BEGIN
  INSERT INTO order_status_history(id,order_id,previous_status,new_status)
  VALUES (lower(hex(randomblob(16))),NEW.id,OLD.status,NEW.status);
END;
