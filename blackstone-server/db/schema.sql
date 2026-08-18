-- BlackStone Chauffeur — MySQL schema
-- Run locally with:   mysql -u root -p blackstone < schema.sql
-- Run on hPanel with: import this file via phpMyAdmin (or run it over an
--                      SSH/remote-MySQL connection if your plan allows one).

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  phone VARCHAR(50),
  role VARCHAR(20) NOT NULL DEFAULT 'customer'
    CHECK (role IN ('customer', 'driver', 'provider', 'second_admin', 'admin')),
  status VARCHAR(20) NOT NULL DEFAULT 'active'
    CHECK (status IN ('pending', 'active')),
  reset_token VARCHAR(255),
  reset_token_expires DATETIME,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS vehicles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(20) NOT NULL DEFAULT 'economy',
  description TEXT,
  capacity INT,
  price_per_km DECIMAL(10, 2),
  image_url TEXT,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  passengers INT DEFAULT 4,
  suitcases INT DEFAULT 2,
  owned INT DEFAULT 1,
  starting_price DECIMAL(10, 2) DEFAULT 0,
  price_per_minute DECIMAL(10, 2) DEFAULT 0,
  price_per_occupant DECIMAL(10, 2) DEFAULT 0,
  price_per_suitcase DECIMAL(10, 2) DEFAULT 0,
  -- distance_tiers: [{"min":0,"max":16,"price":105}, ...] — flat fare for the
  -- bracket the trip's total distance falls into (not a per-km multiplier).
  distance_tiers JSON,
  features JSON
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS bookings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  customer_id INT NOT NULL,
  vehicle_id INT NOT NULL,
  driver_id INT,
  pickup TEXT NOT NULL,
  dropoff TEXT NOT NULL,
  date DATE NOT NULL,
  time TIME NOT NULL,
  -- Set on provider-placed bookings (the provider's own account owns the
  -- booking via customer_id, but the passenger is someone else). NULL for
  -- ordinary customer bookings, where the passenger is the customer.
  passenger_name VARCHAR(255),
  passenger_phone VARCHAR(50),
  passenger_email VARCHAR(255),
  -- One Way / Return / Hourly — drives which fields the booking form collects.
  -- Hourly has no dropoff and is priced by hours (per-minute rate) instead of
  -- distance tier. One Way and Return are both dropoff/distance-tier priced
  -- (Return doesn't currently double the fare — trip type is informational
  -- plus the hourly/dropoff split). See utils/pricing.js.
  trip_type VARCHAR(20) NOT NULL DEFAULT 'one_way',
  -- Chauffeur Service or Airport Transfer — independent of trip_type above.
  service_type VARCHAR(50) NOT NULL DEFAULT 'Chauffeur Service',
  -- Only set when trip_type = 'hourly' — number of hours booked.
  hours INT,
  -- Only used when service_type = 'Airport Transfer'.
  flight_number VARCHAR(20),
  -- Extra stops beyond pickup/dropoff, priced at a flat rate per stop (see
  -- the 'Additional Stop' row in add_ons). Kept alongside stop_addresses
  -- (rather than just deriving the count from it) so a count is always
  -- available even if addresses aren't collected for some reason.
  stops INT NOT NULL DEFAULT 0,
  -- Address text for each additional stop, in visit order — JSON array of
  -- strings, e.g. ["123 Queen St", "45 Ponsonby Rd"]. Only used when
  -- stops > 0; not routed through distance_tiers, just shown to the
  -- driver/admin and drawn on the route map as waypoints.
  stop_addresses JSON,
  -- Number of child seats requested (0-2), priced via the 'Child Seat' row
  -- in add_ons multiplied by this quantity.
  child_seats INT NOT NULL DEFAULT 0,
  -- Free-text special requests from whoever created the booking (customer,
  -- provider, or admin) — shown to admin/driver, purely informational.
  notes VARCHAR(250),
  extras JSON,
  total_price DECIMAL(10, 2) NOT NULL,
  -- What the assigned driver gets paid for this specific ride, set by admin
  -- at their discretion — separate from and never derived from total_price
  -- (what the customer is charged). NULL until admin sets one. Only ever
  -- shown to the driver it's assigned to, never to the customer.
  driver_price DECIMAL(10, 2),
  -- The rate this booking counts toward for the owning provider's monthly
  -- settlement (see provider_payments) — set by admin, separate from and
  -- never derived from total_price (what the end passenger is charged).
  -- NULL until admin sets one; irrelevant for ordinary customer bookings.
  provider_price DECIMAL(10, 2),
  -- Free-text external reference — a provider's own booking/PO number, or
  -- any other tag admin wants attached for their own records. Purely
  -- informational, shown alongside notes.
  reference VARCHAR(100),
  payment_status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  booking_status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (booking_status IN ('pending', 'assigned', 'en_route', 'arrived', 'completed', 'cancelled')),
  stripe_payment_intent_id VARCHAR(255),
  distance_km DECIMAL(10, 2),
  duration_min INT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_bookings_customer FOREIGN KEY (customer_id) REFERENCES users(id),
  CONSTRAINT fk_bookings_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
  CONSTRAINT fk_bookings_driver FOREIGN KEY (driver_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- In-app notifications — a bell icon in the navbar polls GET
-- /api/notifications for whichever user is logged in. One row per
-- recipient per event (fan-out on write) rather than a broadcast table, so
-- each person's read/unread state is independent — e.g. one admin reading a
-- "new booking" notification doesn't mark it read for a second admin too.
CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  -- e.g. 'booking_created', 'booking_updated', 'driver_assigned',
  -- 'driver_removed', 'booking_cancelled' — not enforced by a CHECK since
  -- new types are expected to be added over time without a migration.
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message VARCHAR(500),
  -- Where clicking the notification should take you, e.g. '/admin' or
  -- '/driver' — a relative in-app path, not a full URL.
  link VARCHAR(255),
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_notifications_user (user_id, is_read)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS add_ons (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  price DECIMAL(10, 2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Monthly settlement record between admin and a provider. Providers place
-- bookings on behalf of their own clients and settle up with BlackStone
-- periodically (not per-booking) — one row per provider per calendar month
-- (e.g. '2026-07'), toggled paid/unpaid manually by admin whenever payment
-- actually comes in. No row for a given month means "unpaid" by default —
-- admin only needs to write a row once they want to mark it paid (or to
-- explicitly flag it unpaid for the record).
CREATE TABLE IF NOT EXISTS provider_payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  provider_id INT NOT NULL,
  month CHAR(7) NOT NULL,
  status VARCHAR(10) NOT NULL DEFAULT 'unpaid'
    CHECK (status IN ('paid', 'unpaid')),
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_provider_payments_provider FOREIGN KEY (provider_id) REFERENCES users(id),
  UNIQUE KEY uq_provider_payments_provider_month (provider_id, month)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Single-row settings table (always id = 1) controlling what second_admin
-- accounts can access, toggled by the main admin from Admin > Settings.
-- 'admin' role always has full access regardless of these flags — they only
-- ever restrict 'second_admin'. can_manage_bookings defaults TRUE and the
-- other three default FALSE, matching the app's previous hardcoded
-- behaviour (second_admin could only see Bookings) so introducing this
-- table doesn't silently grant anyone new access.
CREATE TABLE IF NOT EXISTS admin_permissions (
  id INT PRIMARY KEY DEFAULT 1,
  can_manage_bookings BOOLEAN NOT NULL DEFAULT TRUE,
  can_manage_vehicles BOOLEAN NOT NULL DEFAULT FALSE,
  can_manage_users BOOLEAN NOT NULL DEFAULT FALSE,
  can_view_stats BOOLEAN NOT NULL DEFAULT FALSE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO admin_permissions (id)
SELECT * FROM (SELECT 1 AS id) AS tmp
WHERE NOT EXISTS (SELECT 1 FROM admin_permissions WHERE id = 1);

-- Per-second-admin overrides. A second_admin with no row here inherits the
-- single admin_permissions default above (unchanged behaviour); admin can
-- give an individual second_admin their own set of flags by writing a row
-- here instead, without affecting anyone else's access. Same flags/
-- defaults as admin_permissions for consistency, though the defaults on
-- this table are rarely relied on directly — a row is always seeded from
-- the current effective permissions at the moment admin first customizes
-- that user (see routes/permissions.js), not from these column defaults.
CREATE TABLE IF NOT EXISTS user_permissions (
  user_id INT PRIMARY KEY,
  can_manage_bookings BOOLEAN NOT NULL DEFAULT TRUE,
  can_manage_vehicles BOOLEAN NOT NULL DEFAULT FALSE,
  can_manage_users BOOLEAN NOT NULL DEFAULT FALSE,
  can_view_stats BOOLEAN NOT NULL DEFAULT FALSE,
  CONSTRAINT fk_user_permissions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS enquiries (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  message TEXT NOT NULL,
  type VARCHAR(50),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seed default add-ons (name has no unique constraint, so guard with a
-- not-exists check instead of MySQL's INSERT IGNORE / ON DUPLICATE KEY).
INSERT INTO add_ons (name, price)
SELECT * FROM (SELECT 'Champagne' AS name, 45.00 AS price) AS tmp
WHERE NOT EXISTS (SELECT 1 FROM add_ons WHERE name = 'Champagne');

INSERT INTO add_ons (name, price)
SELECT * FROM (SELECT 'Child Seat' AS name, 15.00 AS price) AS tmp
WHERE NOT EXISTS (SELECT 1 FROM add_ons WHERE name = 'Child Seat');

INSERT INTO add_ons (name, price)
SELECT * FROM (SELECT 'Meet & Greet' AS name, 25.00 AS price) AS tmp
WHERE NOT EXISTS (SELECT 1 FROM add_ons WHERE name = 'Meet & Greet');

INSERT INTO add_ons (name, price)
SELECT * FROM (SELECT 'Red Carpet' AS name, 60.00 AS price) AS tmp
WHERE NOT EXISTS (SELECT 1 FROM add_ons WHERE name = 'Red Carpet');

INSERT INTO add_ons (name, price)
SELECT * FROM (SELECT 'Extra Wait Time' AS name, 20.00 AS price) AS tmp
WHERE NOT EXISTS (SELECT 1 FROM add_ons WHERE name = 'Extra Wait Time');

INSERT INTO add_ons (name, price)
SELECT * FROM (SELECT 'VIP Airport Pickup' AS name, 30.00 AS price) AS tmp
WHERE NOT EXISTS (SELECT 1 FROM add_ons WHERE name = 'VIP Airport Pickup');

-- Priced per stop, multiplied by bookings.stops — not a one-time toggle.
INSERT INTO add_ons (name, price)
SELECT * FROM (SELECT 'Additional Stop' AS name, 20.00 AS price) AS tmp
WHERE NOT EXISTS (SELECT 1 FROM add_ons WHERE name = 'Additional Stop');
