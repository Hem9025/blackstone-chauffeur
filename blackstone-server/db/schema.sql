-- BlackStone Chauffeur — PostgreSQL schema
-- Run with: psql $DATABASE_URL -f schema.sql

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  phone VARCHAR(50),
  role VARCHAR(20) NOT NULL DEFAULT 'customer'
    CHECK (role IN ('customer', 'driver', 'provider', 'second_admin', 'admin')),
  status VARCHAR(20) NOT NULL DEFAULT 'active'
    CHECK (status IN ('pending', 'active')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS vehicles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('luxury', 'economy')),
  description TEXT,
  capacity INTEGER,
  price_per_km NUMERIC(10, 2),
  image_url TEXT,
  active BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS bookings (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER NOT NULL REFERENCES users(id),
  vehicle_id INTEGER NOT NULL REFERENCES vehicles(id),
  driver_id INTEGER REFERENCES users(id),
  pickup TEXT NOT NULL,
  dropoff TEXT NOT NULL,
  date DATE NOT NULL,
  time TIME NOT NULL,
  extras JSONB DEFAULT '[]',
  total_price NUMERIC(10, 2) NOT NULL,
  payment_status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  booking_status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (booking_status IN ('pending', 'assigned', 'en_route', 'arrived', 'completed', 'cancelled')),
  stripe_payment_intent_id VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS add_ons (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  price NUMERIC(10, 2) NOT NULL
);

CREATE TABLE IF NOT EXISTS enquiries (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  message TEXT NOT NULL,
  type VARCHAR(50),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed default add-ons
INSERT INTO add_ons (name, price) VALUES
  ('Champagne', 45.00),
  ('Child Seat', 15.00),
  ('Meet & Greet', 25.00),
  ('Red Carpet', 60.00),
  ('Extra Wait Time', 20.00)
ON CONFLICT DO NOTHING;
