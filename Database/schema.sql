-- FreshTrack database schema (MySQL 8.4+)
-- Quantities use DECIMAL rather than INT because wholesale goods may be sold by weight.
-- Monetary values use DECIMAL to avoid the rounding errors associated with FLOAT.
-- All transactional tables use InnoDB so foreign keys and row-level locks are available.
-- Application timestamps are stored in UTC; the frontend can convert them for display.

SET NAMES utf8mb4;
SET time_zone = '+00:00';

-- Create and select the project database before defining its tables.
CREATE DATABASE IF NOT EXISTS freshtrack
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_0900_ai_ci;
USE freshtrack;

-- ============================================================
-- 1. USER ACCOUNTS AND DELIVERY DETAILS
-- ============================================================

-- Stores both wholesale buyers and administrative staff.
-- The role column drives API authorization: BUYER users can shop and view their
-- own orders, while ADMIN users can maintain stock and process every order.
CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('BUYER', 'ADMIN') NOT NULL DEFAULT 'BUYER' COMMENT 'Authorization role used by the Express API',
  business_name VARCHAR(160) NULL,
  contact_name VARCHAR(120) NOT NULL,
  phone VARCHAR(40) NULL,
  status ENUM('ACTIVE', 'SUSPENDED') NOT NULL DEFAULT 'ACTIVE' COMMENT 'Suspended accounts cannot log in',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email),
  KEY idx_users_role_status (role, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
  COMMENT='Buyer and administrator login accounts';

-- Stores reusable buyer delivery addresses. Orders copy the selected address
-- into delivery_address, so changing a saved address cannot alter order history.
CREATE TABLE IF NOT EXISTS buyer_addresses (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  label VARCHAR(60) NOT NULL DEFAULT 'Main',
  recipient_name VARCHAR(120) NOT NULL,
  phone VARCHAR(40) NOT NULL,
  address_line1 VARCHAR(255) NOT NULL,
  address_line2 VARCHAR(255) NULL,
  city VARCHAR(100) NOT NULL,
  region VARCHAR(100) NULL,
  postal_code VARCHAR(30) NULL,
  country_code CHAR(2) NOT NULL DEFAULT 'HK',
  is_default BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Preferred address shown during checkout',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_addresses_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  KEY idx_addresses_user (user_id, is_default)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
  COMMENT='Reusable delivery addresses belonging to buyers';

-- ============================================================
-- 2. PRODUCT CATALOG
-- ============================================================

-- Groups products for storefront filtering and dashboard reporting.
CREATE TABLE IF NOT EXISTS categories (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(110) NOT NULL,
  description TEXT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_categories_name (name),
  UNIQUE KEY uq_categories_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
  COMMENT='Storefront product categories';

-- Stores stable catalog information and the current wholesale selling price.
-- Stock quantity is deliberately not stored here; it is calculated from valid
-- inventory batches so expiry dates can be handled correctly.
CREATE TABLE IF NOT EXISTS products (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  category_id BIGINT UNSIGNED NULL,
  sku VARCHAR(64) NOT NULL,
  name VARCHAR(180) NOT NULL,
  description TEXT NULL,
  unit VARCHAR(30) NOT NULL COMMENT 'Examples: kg, case, box, piece',
  wholesale_price DECIMAL(12,2) UNSIGNED NOT NULL,
  minimum_order_quantity DECIMAL(12,3) UNSIGNED NOT NULL DEFAULT 1.000 COMMENT 'Smallest quantity accepted in a buyer order',
  reorder_level DECIMAL(12,3) UNSIGNED NOT NULL DEFAULT 0.000 COMMENT 'Admin warning threshold for available stock',
  image_url VARCHAR(500) NULL,
  is_perishable BOOLEAN NOT NULL DEFAULT TRUE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_products_sku (sku),
  CONSTRAINT fk_products_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
  CONSTRAINT chk_products_price CHECK (wholesale_price >= 0),
  CONSTRAINT chk_products_minimum CHECK (minimum_order_quantity > 0),
  KEY idx_products_catalog (is_active, category_id, name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
  COMMENT='Wholesale product catalog and current prices';

-- ============================================================
-- 3. BATCH INVENTORY AND EXPIRY TRACKING
-- ============================================================

-- Each row represents one received shipment batch. Keeping batches separate
-- makes it possible to allocate stock using FEFO (first expiry, first out).
-- A NULL expiry date is allowed for non-perishable goods and sorts after dated
-- batches during allocation. current_quantity is the sellable balance.
CREATE TABLE IF NOT EXISTS inventory_batches (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  product_id BIGINT UNSIGNED NOT NULL,
  batch_code VARCHAR(100) NOT NULL,
  supplier_name VARCHAR(160) NULL,
  received_quantity DECIMAL(12,3) UNSIGNED NOT NULL COMMENT 'Original quantity received plus positive stock corrections',
  current_quantity DECIMAL(12,3) UNSIGNED NOT NULL COMMENT 'Quantity currently remaining in this batch',
  unit_cost DECIMAL(12,2) UNSIGNED NULL,
  received_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at DATE NULL COMMENT 'NULL only when the product does not expire',
  created_by BIGINT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_inventory_product_batch (product_id, batch_code),
  CONSTRAINT fk_batches_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
  CONSTRAINT fk_batches_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT,
  CONSTRAINT chk_batches_received CHECK (received_quantity > 0),
  CONSTRAINT chk_batches_current CHECK (current_quantity >= 0 AND current_quantity <= received_quantity),
  KEY idx_batches_fefo (product_id, current_quantity, expires_at, received_at),
  KEY idx_batches_expiry (expires_at, current_quantity)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
  COMMENT='Shipment-level stock balances and expiry dates';

-- ============================================================
-- 4. BUYER SHOPPING CART
-- ============================================================

-- A buyer has at most one active cart. The UNIQUE buyer_id key also makes the
-- API's INSERT IGNORE cart creation safe during concurrent requests.
CREATE TABLE IF NOT EXISTS carts (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  buyer_id BIGINT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_carts_buyer (buyer_id),
  CONSTRAINT fk_carts_buyer FOREIGN KEY (buyer_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
  COMMENT='Single active shopping cart for each buyer';

-- Cart line quantities are revalidated during checkout. The cart does not
-- reserve inventory, because a different buyer may purchase it first.
CREATE TABLE IF NOT EXISTS cart_items (
  cart_id BIGINT UNSIGNED NOT NULL,
  product_id BIGINT UNSIGNED NOT NULL,
  quantity DECIMAL(12,3) UNSIGNED NOT NULL COMMENT 'Requested wholesale quantity; checked again at checkout',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (cart_id, product_id),
  CONSTRAINT fk_cart_items_cart FOREIGN KEY (cart_id) REFERENCES carts(id) ON DELETE CASCADE,
  CONSTRAINT fk_cart_items_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  CONSTRAINT chk_cart_item_quantity CHECK (quantity > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
  COMMENT='Products and requested quantities currently in a buyer cart';

-- ============================================================
-- 5. ORDERS AND BATCH ALLOCATION
-- ============================================================

-- Order header containing workflow status, monetary total, and one delivery
-- address snapshot. subtotal is calculated by the backend inside the same
-- transaction that deducts inventory.
CREATE TABLE IF NOT EXISTS orders (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  order_number VARCHAR(40) NOT NULL,
  buyer_id BIGINT UNSIGNED NOT NULL,
  status ENUM('PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED') NOT NULL DEFAULT 'PROCESSING' COMMENT 'Controlled order fulfilment workflow',
  subtotal DECIMAL(14,2) UNSIGNED NOT NULL COMMENT 'Sum of order item line totals at checkout',
  notes VARCHAR(1000) NULL,
  delivery_address VARCHAR(1000) NOT NULL COMMENT 'Full delivery address copied at checkout',
  placed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  shipped_at DATETIME NULL,
  delivered_at DATETIME NULL,
  cancelled_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_orders_number (order_number),
  CONSTRAINT fk_orders_buyer FOREIGN KEY (buyer_id) REFERENCES users(id) ON DELETE RESTRICT,
  KEY idx_orders_buyer_date (buyer_id, placed_at),
  KEY idx_orders_status_date (status, placed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
  COMMENT='Buyer order headers';

-- Order lines retain product name, SKU, unit, and price snapshots. Historical
-- orders therefore remain accurate after catalog details or prices change.
CREATE TABLE IF NOT EXISTS order_items (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  order_id BIGINT UNSIGNED NOT NULL,
  product_id BIGINT UNSIGNED NOT NULL,
  sku_snapshot VARCHAR(64) NOT NULL COMMENT 'SKU copied from the product at checkout',
  product_name_snapshot VARCHAR(180) NOT NULL COMMENT 'Product name copied at checkout',
  unit_snapshot VARCHAR(30) NOT NULL COMMENT 'Unit of measure copied at checkout',
  unit_price DECIMAL(12,2) UNSIGNED NOT NULL COMMENT 'Wholesale price charged at checkout',
  quantity DECIMAL(12,3) UNSIGNED NOT NULL,
  line_total DECIMAL(14,2) UNSIGNED NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_order_items_product (order_id, product_id),
  CONSTRAINT fk_order_items_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  CONSTRAINT fk_order_items_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
  CONSTRAINT chk_order_items_quantity CHECK (quantity > 0),
  KEY idx_order_items_product (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
  COMMENT='Immutable product and price details for each order line';

-- Junction table recording exactly which batches fulfilled each order line.
-- One order line can consume several batches when no single batch has enough
-- stock. These rows also allow cancellation to restore the original batches.
CREATE TABLE IF NOT EXISTS order_item_batches (
  order_item_id BIGINT UNSIGNED NOT NULL,
  inventory_batch_id BIGINT UNSIGNED NOT NULL,
  allocated_quantity DECIMAL(12,3) UNSIGNED NOT NULL COMMENT 'Quantity deducted from this exact batch',
  PRIMARY KEY (order_item_id, inventory_batch_id),
  CONSTRAINT fk_allocations_order_item FOREIGN KEY (order_item_id) REFERENCES order_items(id) ON DELETE CASCADE,
  CONSTRAINT fk_allocations_batch FOREIGN KEY (inventory_batch_id) REFERENCES inventory_batches(id) ON DELETE RESTRICT,
  CONSTRAINT chk_allocations_quantity CHECK (allocated_quantity > 0),
  KEY idx_allocations_batch (inventory_batch_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
  COMMENT='FEFO batch allocations used to fulfil order lines';

-- ============================================================
-- 6. ORDER AND INVENTORY AUDIT TRAILS
-- ============================================================

-- Append-only history of every order status transition. The changed_by user
-- identifies the buyer who submitted the order or the admin who processed it.
CREATE TABLE IF NOT EXISTS order_status_history (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  order_id BIGINT UNSIGNED NOT NULL,
  from_status ENUM('PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED') NULL,
  to_status ENUM('PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED') NOT NULL,
  changed_by BIGINT UNSIGNED NOT NULL,
  note VARCHAR(500) NULL,
  changed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_status_history_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  CONSTRAINT fk_status_history_user FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE RESTRICT,
  KEY idx_status_history_order (order_id, changed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
  COMMENT='Append-only audit history of order status changes';

-- Append-only stock ledger. Positive quantity_change adds stock and negative
-- quantity_change removes it. SALE rows reference orders; RECEIPT, WASTE,
-- RETURN, and ADJUSTMENT rows explain all other balance changes.
CREATE TABLE IF NOT EXISTS inventory_movements (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  inventory_batch_id BIGINT UNSIGNED NOT NULL,
  product_id BIGINT UNSIGNED NOT NULL,
  order_id BIGINT UNSIGNED NULL,
  movement_type ENUM('RECEIPT', 'SALE', 'RETURN', 'ADJUSTMENT', 'WASTE') NOT NULL,
  quantity_change DECIMAL(12,3) NOT NULL COMMENT 'Positive adds stock; negative removes stock',
  reason VARCHAR(500) NULL,
  performed_by BIGINT UNSIGNED NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_movements_batch FOREIGN KEY (inventory_batch_id) REFERENCES inventory_batches(id) ON DELETE RESTRICT,
  CONSTRAINT fk_movements_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
  CONSTRAINT fk_movements_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE RESTRICT,
  CONSTRAINT fk_movements_user FOREIGN KEY (performed_by) REFERENCES users(id) ON DELETE RESTRICT,
  CONSTRAINT chk_movement_nonzero CHECK (quantity_change <> 0),
  KEY idx_movements_product_date (product_id, created_at),
  KEY idx_movements_order (order_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
  COMMENT='Auditable ledger of every inventory quantity change';

-- ============================================================
-- 7. REPORTING VIEWS
-- ============================================================

-- Catalog-facing stock summary calculated from batches. Expired batches are
-- excluded, while non-expiring batches remain available. nearest_expiry_date
-- powers the storefront and admin warnings without duplicating stock totals.
CREATE OR REPLACE VIEW product_stock AS
SELECT
  p.id AS product_id,
  COALESCE(SUM(
    CASE
      WHEN b.current_quantity > 0 AND (b.expires_at IS NULL OR b.expires_at >= CURRENT_DATE)
      THEN b.current_quantity
      ELSE 0
    END
  ), 0) AS available_quantity,
  MIN(
    CASE
      WHEN b.current_quantity > 0 AND (b.expires_at IS NULL OR b.expires_at >= CURRENT_DATE)
      THEN b.expires_at
      ELSE NULL
    END
  ) AS nearest_expiry_date
FROM products p
LEFT JOIN inventory_batches b ON b.product_id = p.id
GROUP BY p.id;

-- Admin alert list for batches that expire today or within the next 14 days.
-- Already-expired and empty batches are excluded because they require separate
-- waste/adjustment handling rather than a future-expiry warning.
CREATE OR REPLACE VIEW expiry_alerts AS
SELECT
  b.id AS batch_id,
  b.batch_code,
  b.product_id,
  p.sku,
  p.name AS product_name,
  b.current_quantity,
  p.unit,
  b.expires_at,
  DATEDIFF(b.expires_at, CURRENT_DATE) AS days_until_expiry
FROM inventory_batches b
JOIN products p ON p.id = b.product_id
WHERE b.current_quantity > 0
  AND b.expires_at BETWEEN CURRENT_DATE AND DATE_ADD(CURRENT_DATE, INTERVAL 14 DAY);
