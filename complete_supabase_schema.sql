-- Complete Supabase Database Schema and Functions
-- Clean up all pre-existing stock functions to avoid parameter signature mismatch overloads
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN 
    SELECT n.nspname || '.' || p.proname || '(' || pg_get_function_identity_arguments(p.oid) || ')' AS prod
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE p.proname IN (
      'update_udhar_challan_with_stock',
      'update_jama_challan_with_stock',
      'delete_udhar_challan_with_stock',
      'delete_jama_challan_with_stock'
    )
  LOOP
    EXECUTE 'DROP FUNCTION IF EXISTS ' || r.prod;
  END LOOP;
END $$;

-- ==========================================
-- MIGRATION: 20251001075609_create_challan_system_tables.sql
-- ==========================================

/*
  # Create Challan Management System Tables

  ## Overview
  This migration creates a complete database schema for a challan (receipt/invoice) management system
  that handles client information, Udhar (credit/loan) challans, and Jama (collection) challans.

  ## New Tables

  ### 1. clients
  Stores client/customer information
  - `id` (uuid, primary key) - Unique identifier
  - `client_nic_name` (text) - Client NIC or nickname
  - `client_name` (text) - Full client name
  - `site` (text) - Site or location information
  - `primary_phone_number` (text) - Primary contact number
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 2. udhar_challans
  Stores Udhar (credit/loan) challan records
  - `id` (uuid, primary key) - Unique identifier
  - `udhar_challan_number` (text, unique) - Challan reference number
  - `client_id` (uuid, foreign key) - References clients table
  - `alternative_site` (text, optional) - Override site information
  - `secondary_phone_number` (text, optional) - Alternative phone number
  - `udhar_date` (date) - Date of the Udhar transaction
  - `driver_name` (text, optional) - Name of the driver
  - `created_at` (timestamptz) - Record creation timestamp

  ### 3. udhar_items
  Stores items/products for each Udhar challan
  - `id` (uuid, primary key) - Unique identifier
  - `udhar_challan_number` (text, foreign key) - References udhar_challans
  - `size_1_qty` through `size_9_qty` (integer) - Quantities for 9 different sizes
  - `size_1_borrowed` through `size_9_borrowed` (integer) - Borrowed stock for each size
  - `size_1_note` through `size_9_note` (text) - Notes for each size
  - `main_note` (text) - General notes
  - `created_at` (timestamptz) - Record creation timestamp

  ### 4. jama_challans
  Stores Jama (collection) challan records
  - Same structure as udhar_challans but for Jama transactions

  ### 5. jama_items
  Stores items/products for each Jama challan
  - Same structure as udhar_items but for Jama transactions

  ## Security
  - Row Level Security (RLS) is enabled on all tables
  - Policies allow authenticated users to perform all operations
  - Public access is restricted

  ## Important Notes
  - All tables use UUID primary keys with automatic generation
  - Timestamps are automatically managed with DEFAULT values
  - Foreign key constraints ensure referential integrity
  - Unique constraints prevent duplicate challan numbers
  - All quantity fields default to 0 for easier data entry
*/

-- Create clients table
CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_nic_name text NOT NULL,
  client_name text NOT NULL,
  site text NOT NULL,
  primary_phone_number text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create udhar_challans table
CREATE TABLE IF NOT EXISTS udhar_challans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  udhar_challan_number text UNIQUE NOT NULL,
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  alternative_site text,
  secondary_phone_number text,
  udhar_date date NOT NULL,
  driver_name text,
  created_at timestamptz DEFAULT now()
);

-- Create udhar_items table
CREATE TABLE IF NOT EXISTS udhar_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  udhar_challan_number text NOT NULL REFERENCES udhar_challans(udhar_challan_number) ON DELETE CASCADE,
  size_1_qty integer DEFAULT 0,
  size_2_qty integer DEFAULT 0,
  size_3_qty integer DEFAULT 0,
  size_4_qty integer DEFAULT 0,
  size_5_qty integer DEFAULT 0,
  size_6_qty integer DEFAULT 0,
  size_7_qty integer DEFAULT 0,
  size_8_qty integer DEFAULT 0,
  size_9_qty integer DEFAULT 0,
  size_1_borrowed integer DEFAULT 0,
  size_2_borrowed integer DEFAULT 0,
  size_3_borrowed integer DEFAULT 0,
  size_4_borrowed integer DEFAULT 0,
  size_5_borrowed integer DEFAULT 0,
  size_6_borrowed integer DEFAULT 0,
  size_7_borrowed integer DEFAULT 0,
  size_8_borrowed integer DEFAULT 0,
  size_9_borrowed integer DEFAULT 0,
  size_1_note text DEFAULT '',
  size_2_note text DEFAULT '',
  size_3_note text DEFAULT '',
  size_4_note text DEFAULT '',
  size_5_note text DEFAULT '',
  size_6_note text DEFAULT '',
  size_7_note text DEFAULT '',
  size_8_note text DEFAULT '',
  size_9_note text DEFAULT '',
  main_note text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Create jama_challans table
CREATE TABLE IF NOT EXISTS jama_challans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  jama_challan_number text UNIQUE NOT NULL,
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  alternative_site text,
  secondary_phone_number text,
  jama_date date NOT NULL,
  driver_name text,
  is_all_return boolean DEFAULT false NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create jama_items table
CREATE TABLE IF NOT EXISTS jama_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  jama_challan_number text NOT NULL REFERENCES jama_challans(jama_challan_number) ON DELETE CASCADE,
  size_1_qty integer DEFAULT 0,
  size_2_qty integer DEFAULT 0,
  size_3_qty integer DEFAULT 0,
  size_4_qty integer DEFAULT 0,
  size_5_qty integer DEFAULT 0,
  size_6_qty integer DEFAULT 0,
  size_7_qty integer DEFAULT 0,
  size_8_qty integer DEFAULT 0,
  size_9_qty integer DEFAULT 0,
  size_1_borrowed integer DEFAULT 0,
  size_2_borrowed integer DEFAULT 0,
  size_3_borrowed integer DEFAULT 0,
  size_4_borrowed integer DEFAULT 0,
  size_5_borrowed integer DEFAULT 0,
  size_6_borrowed integer DEFAULT 0,
  size_7_borrowed integer DEFAULT 0,
  size_8_borrowed integer DEFAULT 0,
  size_9_borrowed integer DEFAULT 0,
  size_1_note text DEFAULT '',
  size_2_note text DEFAULT '',
  size_3_note text DEFAULT '',
  size_4_note text DEFAULT '',
  size_5_note text DEFAULT '',
  size_6_note text DEFAULT '',
  size_7_note text DEFAULT '',
  size_8_note text DEFAULT '',
  size_9_note text DEFAULT '',
  main_note text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_clients_nic_name ON clients(client_nic_name);
CREATE INDEX IF NOT EXISTS idx_udhar_challans_client_id ON udhar_challans(client_id);
CREATE INDEX IF NOT EXISTS idx_udhar_challans_date ON udhar_challans(udhar_date);
CREATE INDEX IF NOT EXISTS idx_udhar_items_challan_number ON udhar_items(udhar_challan_number);
CREATE INDEX IF NOT EXISTS idx_jama_challans_client_id ON jama_challans(client_id);
CREATE INDEX IF NOT EXISTS idx_jama_challans_date ON jama_challans(jama_date);
CREATE INDEX IF NOT EXISTS idx_jama_items_challan_number ON jama_items(jama_challan_number);

-- Enable Row Level Security on all tables
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE udhar_challans ENABLE ROW LEVEL SECURITY;
ALTER TABLE udhar_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE jama_challans ENABLE ROW LEVEL SECURITY;
ALTER TABLE jama_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for clients table
CREATE POLICY "Authenticated users can view clients"
  ON clients FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert clients"
  ON clients FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update clients"
  ON clients FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete clients"
  ON clients FOR DELETE
  TO authenticated
  USING (true);

-- Create RLS policies for udhar_challans table
CREATE POLICY "Authenticated users can view udhar_challans"
  ON udhar_challans FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert udhar_challans"
  ON udhar_challans FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update udhar_challans"
  ON udhar_challans FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete udhar_challans"
  ON udhar_challans FOR DELETE
  TO authenticated
  USING (true);

-- Create RLS policies for udhar_items table
CREATE POLICY "Authenticated users can view udhar_items"
  ON udhar_items FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert udhar_items"
  ON udhar_items FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update udhar_items"
  ON udhar_items FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete udhar_items"
  ON udhar_items FOR DELETE
  TO authenticated
  USING (true);

-- Create RLS policies for jama_challans table
CREATE POLICY "Authenticated users can view jama_challans"
  ON jama_challans FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert jama_challans"
  ON jama_challans FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update jama_challans"
  ON jama_challans FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete jama_challans"
  ON jama_challans FOR DELETE
  TO authenticated
  USING (true);

-- Create RLS policies for jama_items table
CREATE POLICY "Authenticated users can view jama_items"
  ON jama_items FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert jama_items"
  ON jama_items FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update jama_items"
  ON jama_items FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete jama_items"
  ON jama_items FOR DELETE
  TO authenticated
  USING (true);

-- Create stock table
CREATE TABLE IF NOT EXISTS stock (
  size integer PRIMARY KEY,
  total_stock integer DEFAULT 0 NOT NULL CHECK (total_stock >= 0),
  on_rent_stock integer DEFAULT 0 NOT NULL CHECK (on_rent_stock >= 0),
  borrowed_stock integer DEFAULT 0 NOT NULL CHECK (borrowed_stock >= 0),
  lost_stock integer DEFAULT 0 NOT NULL CHECK (lost_stock >= 0),
  updated_at timestamp DEFAULT now()
);

-- Enable RLS for stock
ALTER TABLE stock ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view stock"
  ON stock FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can update/insert stock"
  ON stock FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anon users can view stock"
  ON stock FOR SELECT
  TO anon
  USING (true);

-- ==========================================
-- MIGRATION: 20251007090514_create_challan_crud_with_stock_functions.sql
-- ==========================================

/*
  # Challan CRUD Operations with Stock Management

  1. New RPC Functions
    - `update_udhar_challan_with_stock` - Updates Udhar challan and adjusts stock
    - `update_jama_challan_with_stock` - Updates Jama challan and adjusts stock
    - `delete_udhar_challan_with_stock` - Deletes Udhar challan and reverts stock
    - `delete_jama_challan_with_stock` - Deletes Jama challan and reverts stock

  2. How It Works
    - UPDATE: Calculates difference between old and new values, adjusts stock accordingly
    - DELETE: Reverts stock changes by decrementing (Udhar) or incrementing (Jama)
    - All operations are atomic (transaction-based)
    - Returns JSON with success status and message

  3. Stock Management
    - Udhar (giving items): Increments on_rent_stock and borrowed_stock
    - Jama (receiving items): Decrements on_rent_stock and borrowed_stock
    - UPDATE: Adjusts based on difference (old vs new)
    - DELETE: Complete reversal of original operation
*/

-- =============================================================================
-- UPDATE UDHAR CHALLAN WITH STOCK
-- =============================================================================
CREATE OR REPLACE FUNCTION update_udhar_challan_with_stock(
  p_challan_number TEXT,
  p_client_id UUID,
  p_alternative_site TEXT,
  p_secondary_phone_number TEXT,
  p_udhar_date DATE,
  p_driver_name TEXT,
  -- Old items (for calculating difference)
  p_old_size_1_qty INTEGER, p_old_size_2_qty INTEGER, p_old_size_3_qty INTEGER,
  p_old_size_4_qty INTEGER, p_old_size_5_qty INTEGER, p_old_size_6_qty INTEGER,
  p_old_size_7_qty INTEGER, p_old_size_8_qty INTEGER, p_old_size_9_qty INTEGER,
  p_old_size_1_borrowed INTEGER, p_old_size_2_borrowed INTEGER, p_old_size_3_borrowed INTEGER,
  p_old_size_4_borrowed INTEGER, p_old_size_5_borrowed INTEGER, p_old_size_6_borrowed INTEGER,
  p_old_size_7_borrowed INTEGER, p_old_size_8_borrowed INTEGER, p_old_size_9_borrowed INTEGER,
  -- New items
  p_new_size_1_qty INTEGER, p_new_size_2_qty INTEGER, p_new_size_3_qty INTEGER,
  p_new_size_4_qty INTEGER, p_new_size_5_qty INTEGER, p_new_size_6_qty INTEGER,
  p_new_size_7_qty INTEGER, p_new_size_8_qty INTEGER, p_new_size_9_qty INTEGER,
  p_new_size_1_borrowed INTEGER, p_new_size_2_borrowed INTEGER, p_new_size_3_borrowed INTEGER,
  p_new_size_4_borrowed INTEGER, p_new_size_5_borrowed INTEGER, p_new_size_6_borrowed INTEGER,
  p_new_size_7_borrowed INTEGER, p_new_size_8_borrowed INTEGER, p_new_size_9_borrowed INTEGER,
  p_new_size_1_note TEXT, p_new_size_2_note TEXT, p_new_size_3_note TEXT,
  p_new_size_4_note TEXT, p_new_size_5_note TEXT, p_new_size_6_note TEXT,
  p_new_size_7_note TEXT, p_new_size_8_note TEXT, p_new_size_9_note TEXT,
  p_new_main_note TEXT
)
RETURNS JSON AS $$
DECLARE
  v_old_qty INTEGER;
  v_old_borrowed INTEGER;
  v_new_qty INTEGER;
  v_new_borrowed INTEGER;
  v_qty_diff INTEGER;
  v_borrowed_diff INTEGER;
BEGIN
  UPDATE udhar_challans
  SET
    client_id = p_client_id,
    alternative_site = p_alternative_site,
    secondary_phone_number = p_secondary_phone_number,
    udhar_date = p_udhar_date,
    driver_name = p_driver_name
  WHERE udhar_challan_number = p_challan_number;

  UPDATE udhar_items
  SET
    size_1_qty = p_new_size_1_qty, size_2_qty = p_new_size_2_qty, size_3_qty = p_new_size_3_qty,
    size_4_qty = p_new_size_4_qty, size_5_qty = p_new_size_5_qty, size_6_qty = p_new_size_6_qty,
    size_7_qty = p_new_size_7_qty, size_8_qty = p_new_size_8_qty, size_9_qty = p_new_size_9_qty,
    size_1_borrowed = p_new_size_1_borrowed, size_2_borrowed = p_new_size_2_borrowed, size_3_borrowed = p_new_size_3_borrowed,
    size_4_borrowed = p_new_size_4_borrowed, size_5_borrowed = p_new_size_5_borrowed, size_6_borrowed = p_new_size_6_borrowed,
    size_7_borrowed = p_new_size_7_borrowed, size_8_borrowed = p_new_size_8_borrowed, size_9_borrowed = p_new_size_9_borrowed,
    size_1_note = p_new_size_1_note, size_2_note = p_new_size_2_note, size_3_note = p_new_size_3_note,
    size_4_note = p_new_size_4_note, size_5_note = p_new_size_5_note, size_6_note = p_new_size_6_note,
    size_7_note = p_new_size_7_note, size_8_note = p_new_size_8_note, size_9_note = p_new_size_9_note,
    main_note = p_new_main_note
  WHERE udhar_challan_number = p_challan_number;

  FOR i IN 1..9 LOOP
    CASE i
      WHEN 1 THEN v_old_qty := p_old_size_1_qty; v_old_borrowed := p_old_size_1_borrowed; v_new_qty := p_new_size_1_qty; v_new_borrowed := p_new_size_1_borrowed;
      WHEN 2 THEN v_old_qty := p_old_size_2_qty; v_old_borrowed := p_old_size_2_borrowed; v_new_qty := p_new_size_2_qty; v_new_borrowed := p_new_size_2_borrowed;
      WHEN 3 THEN v_old_qty := p_old_size_3_qty; v_old_borrowed := p_old_size_3_borrowed; v_new_qty := p_new_size_3_qty; v_new_borrowed := p_new_size_3_borrowed;
      WHEN 4 THEN v_old_qty := p_old_size_4_qty; v_old_borrowed := p_old_size_4_borrowed; v_new_qty := p_new_size_4_qty; v_new_borrowed := p_new_size_4_borrowed;
      WHEN 5 THEN v_old_qty := p_old_size_5_qty; v_old_borrowed := p_old_size_5_borrowed; v_new_qty := p_new_size_5_qty; v_new_borrowed := p_new_size_5_borrowed;
      WHEN 6 THEN v_old_qty := p_old_size_6_qty; v_old_borrowed := p_old_size_6_borrowed; v_new_qty := p_new_size_6_qty; v_new_borrowed := p_new_size_6_borrowed;
      WHEN 7 THEN v_old_qty := p_old_size_7_qty; v_old_borrowed := p_old_size_7_borrowed; v_new_qty := p_new_size_7_qty; v_new_borrowed := p_new_size_7_borrowed;
      WHEN 8 THEN v_old_qty := p_old_size_8_qty; v_old_borrowed := p_old_size_8_borrowed; v_new_qty := p_new_size_8_qty; v_new_borrowed := p_new_size_8_borrowed;
      WHEN 9 THEN v_old_qty := p_old_size_9_qty; v_old_borrowed := p_old_size_9_borrowed; v_new_qty := p_new_size_9_qty; v_new_borrowed := p_new_size_9_borrowed;
    END CASE;

    v_qty_diff := v_new_qty - v_old_qty;
    v_borrowed_diff := v_new_borrowed - v_old_borrowed;

    IF v_qty_diff != 0 OR v_borrowed_diff != 0 THEN
      UPDATE stock
      SET
        on_rent_stock = on_rent_stock + v_qty_diff,
        borrowed_stock = borrowed_stock + v_borrowed_diff
      WHERE size = i;
    END IF;
  END LOOP;

  RETURN json_build_object('success', true, 'message', 'Udhar challan updated successfully');
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'message', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- UPDATE JAMA CHALLAN WITH STOCK
-- =============================================================================
CREATE OR REPLACE FUNCTION update_jama_challan_with_stock(
  p_challan_number TEXT,
  p_client_id UUID,
  p_alternative_site TEXT,
  p_secondary_phone_number TEXT,
  p_jama_date DATE,
  p_driver_name TEXT,
  -- Old items
  p_old_size_1_qty INTEGER, p_old_size_2_qty INTEGER, p_old_size_3_qty INTEGER,
  p_old_size_4_qty INTEGER, p_old_size_5_qty INTEGER, p_old_size_6_qty INTEGER,
  p_old_size_7_qty INTEGER, p_old_size_8_qty INTEGER, p_old_size_9_qty INTEGER,
  p_old_size_1_borrowed INTEGER, p_old_size_2_borrowed INTEGER, p_old_size_3_borrowed INTEGER,
  p_old_size_4_borrowed INTEGER, p_old_size_5_borrowed INTEGER, p_old_size_6_borrowed INTEGER,
  p_old_size_7_borrowed INTEGER, p_old_size_8_borrowed INTEGER, p_old_size_9_borrowed INTEGER,
  -- New items
  p_new_size_1_qty INTEGER, p_new_size_2_qty INTEGER, p_new_size_3_qty INTEGER,
  p_new_size_4_qty INTEGER, p_new_size_5_qty INTEGER, p_new_size_6_qty INTEGER,
  p_new_size_7_qty INTEGER, p_new_size_8_qty INTEGER, p_new_size_9_qty INTEGER,
  p_new_size_1_borrowed INTEGER, p_new_size_2_borrowed INTEGER, p_new_size_3_borrowed INTEGER,
  p_new_size_4_borrowed INTEGER, p_new_size_5_borrowed INTEGER, p_new_size_6_borrowed INTEGER,
  p_new_size_7_borrowed INTEGER, p_new_size_8_borrowed INTEGER, p_new_size_9_borrowed INTEGER,
  p_new_size_1_note TEXT, p_new_size_2_note TEXT, p_new_size_3_note TEXT,
  p_new_size_4_note TEXT, p_new_size_5_note TEXT, p_new_size_6_note TEXT,
  p_new_size_7_note TEXT, p_new_size_8_note TEXT, p_new_size_9_note TEXT,
  p_new_main_note TEXT
)
RETURNS JSON AS $$
DECLARE
  v_old_qty INTEGER;
  v_old_borrowed INTEGER;
  v_new_qty INTEGER;
  v_new_borrowed INTEGER;
  v_qty_diff INTEGER;
  v_borrowed_diff INTEGER;
BEGIN
  UPDATE jama_challans
  SET
    client_id = p_client_id,
    alternative_site = p_alternative_site,
    secondary_phone_number = p_secondary_phone_number,
    jama_date = p_jama_date,
    driver_name = p_driver_name
  WHERE jama_challan_number = p_challan_number;

  UPDATE jama_items
  SET
    size_1_qty = p_new_size_1_qty, size_2_qty = p_new_size_2_qty, size_3_qty = p_new_size_3_qty,
    size_4_qty = p_new_size_4_qty, size_5_qty = p_new_size_5_qty, size_6_qty = p_new_size_6_qty,
    size_7_qty = p_new_size_7_qty, size_8_qty = p_new_size_8_qty, size_9_qty = p_new_size_9_qty,
    size_1_borrowed = p_new_size_1_borrowed, size_2_borrowed = p_new_size_2_borrowed, size_3_borrowed = p_new_size_3_borrowed,
    size_4_borrowed = p_new_size_4_borrowed, size_5_borrowed = p_new_size_5_borrowed, size_6_borrowed = p_new_size_6_borrowed,
    size_7_borrowed = p_new_size_7_borrowed, size_8_borrowed = p_new_size_8_borrowed, size_9_borrowed = p_new_size_9_borrowed,
    size_1_note = p_new_size_1_note, size_2_note = p_new_size_2_note, size_3_note = p_new_size_3_note,
    size_4_note = p_new_size_4_note, size_5_note = p_new_size_5_note, size_6_note = p_new_size_6_note,
    size_7_note = p_new_size_7_note, size_8_note = p_new_size_8_note, size_9_note = p_new_size_9_note,
    main_note = p_new_main_note
  WHERE jama_challan_number = p_challan_number;

  FOR i IN 1..9 LOOP
    CASE i
      WHEN 1 THEN v_old_qty := p_old_size_1_qty; v_old_borrowed := p_old_size_1_borrowed; v_new_qty := p_new_size_1_qty; v_new_borrowed := p_new_size_1_borrowed;
      WHEN 2 THEN v_old_qty := p_old_size_2_qty; v_old_borrowed := p_old_size_2_borrowed; v_new_qty := p_new_size_2_qty; v_new_borrowed := p_new_size_2_borrowed;
      WHEN 3 THEN v_old_qty := p_old_size_3_qty; v_old_borrowed := p_old_size_3_borrowed; v_new_qty := p_new_size_3_qty; v_new_borrowed := p_new_size_3_borrowed;
      WHEN 4 THEN v_old_qty := p_old_size_4_qty; v_old_borrowed := p_old_size_4_borrowed; v_new_qty := p_new_size_4_qty; v_new_borrowed := p_new_size_4_borrowed;
      WHEN 5 THEN v_old_qty := p_old_size_5_qty; v_old_borrowed := p_old_size_5_borrowed; v_new_qty := p_new_size_5_qty; v_new_borrowed := p_new_size_5_borrowed;
      WHEN 6 THEN v_old_qty := p_old_size_6_qty; v_old_borrowed := p_old_size_6_borrowed; v_new_qty := p_new_size_6_qty; v_new_borrowed := p_new_size_6_borrowed;
      WHEN 7 THEN v_old_qty := p_old_size_7_qty; v_old_borrowed := p_old_size_7_borrowed; v_new_qty := p_new_size_7_qty; v_new_borrowed := p_new_size_7_borrowed;
      WHEN 8 THEN v_old_qty := p_old_size_8_qty; v_old_borrowed := p_old_size_8_borrowed; v_new_qty := p_new_size_8_qty; v_new_borrowed := p_new_size_8_borrowed;
      WHEN 9 THEN v_old_qty := p_old_size_9_qty; v_old_borrowed := p_old_size_9_borrowed; v_new_qty := p_new_size_9_qty; v_new_borrowed := p_new_size_9_borrowed;
    END CASE;

    v_qty_diff := v_new_qty - v_old_qty;
    v_borrowed_diff := v_new_borrowed - v_old_borrowed;

    IF v_qty_diff != 0 OR v_borrowed_diff != 0 THEN
      UPDATE stock
      SET
        on_rent_stock = GREATEST(0, on_rent_stock - v_qty_diff),
        borrowed_stock = GREATEST(0, borrowed_stock - v_borrowed_diff)
      WHERE size = i;
    END IF;
  END LOOP;

  RETURN json_build_object('success', true, 'message', 'Jama challan updated successfully');
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'message', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- DELETE UDHAR CHALLAN WITH STOCK
-- =============================================================================
CREATE OR REPLACE FUNCTION delete_udhar_challan_with_stock(
  p_challan_number TEXT,
  p_size_1_qty INTEGER, p_size_2_qty INTEGER, p_size_3_qty INTEGER,
  p_size_4_qty INTEGER, p_size_5_qty INTEGER, p_size_6_qty INTEGER,
  p_size_7_qty INTEGER, p_size_8_qty INTEGER, p_size_9_qty INTEGER,
  p_size_1_borrowed INTEGER, p_size_2_borrowed INTEGER, p_size_3_borrowed INTEGER,
  p_size_4_borrowed INTEGER, p_size_5_borrowed INTEGER, p_size_6_borrowed INTEGER,
  p_size_7_borrowed INTEGER, p_size_8_borrowed INTEGER, p_size_9_borrowed INTEGER
)
RETURNS JSON AS $$
DECLARE
  v_qty INTEGER;
  v_borrowed INTEGER;
BEGIN
  FOR i IN 1..9 LOOP
    CASE i
      WHEN 1 THEN v_qty := p_size_1_qty; v_borrowed := p_size_1_borrowed;
      WHEN 2 THEN v_qty := p_size_2_qty; v_borrowed := p_size_2_borrowed;
      WHEN 3 THEN v_qty := p_size_3_qty; v_borrowed := p_size_3_borrowed;
      WHEN 4 THEN v_qty := p_size_4_qty; v_borrowed := p_size_4_borrowed;
      WHEN 5 THEN v_qty := p_size_5_qty; v_borrowed := p_size_5_borrowed;
      WHEN 6 THEN v_qty := p_size_6_qty; v_borrowed := p_size_6_borrowed;
      WHEN 7 THEN v_qty := p_size_7_qty; v_borrowed := p_size_7_borrowed;
      WHEN 8 THEN v_qty := p_size_8_qty; v_borrowed := p_size_8_borrowed;
      WHEN 9 THEN v_qty := p_size_9_qty; v_borrowed := p_size_9_borrowed;
    END CASE;

    IF v_qty > 0 OR v_borrowed > 0 THEN
      UPDATE stock
      SET
        on_rent_stock = GREATEST(0, on_rent_stock - v_qty),
        borrowed_stock = GREATEST(0, borrowed_stock - v_borrowed)
      WHERE size = i;
    END IF;
  END LOOP;

  DELETE FROM udhar_challans WHERE udhar_challan_number = p_challan_number;

  RETURN json_build_object('success', true, 'message', 'Udhar challan deleted successfully');
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'message', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- DELETE JAMA CHALLAN WITH STOCK
-- =============================================================================
CREATE OR REPLACE FUNCTION delete_jama_challan_with_stock(
  p_challan_number TEXT,
  p_size_1_qty INTEGER, p_size_2_qty INTEGER, p_size_3_qty INTEGER,
  p_size_4_qty INTEGER, p_size_5_qty INTEGER, p_size_6_qty INTEGER,
  p_size_7_qty INTEGER, p_size_8_qty INTEGER, p_size_9_qty INTEGER,
  p_size_1_borrowed INTEGER, p_size_2_borrowed INTEGER, p_size_3_borrowed INTEGER,
  p_size_4_borrowed INTEGER, p_size_5_borrowed INTEGER, p_size_6_borrowed INTEGER,
  p_size_7_borrowed INTEGER, p_size_8_borrowed INTEGER, p_size_9_borrowed INTEGER
)
RETURNS JSON AS $$
DECLARE
  v_qty INTEGER;
  v_borrowed INTEGER;
BEGIN
  FOR i IN 1..9 LOOP
    CASE i
      WHEN 1 THEN v_qty := p_size_1_qty; v_borrowed := p_size_1_borrowed;
      WHEN 2 THEN v_qty := p_size_2_qty; v_borrowed := p_size_2_borrowed;
      WHEN 3 THEN v_qty := p_size_3_qty; v_borrowed := p_size_3_borrowed;
      WHEN 4 THEN v_qty := p_size_4_qty; v_borrowed := p_size_4_borrowed;
      WHEN 5 THEN v_qty := p_size_5_qty; v_borrowed := p_size_5_borrowed;
      WHEN 6 THEN v_qty := p_size_6_qty; v_borrowed := p_size_6_borrowed;
      WHEN 7 THEN v_qty := p_size_7_qty; v_borrowed := p_size_7_borrowed;
      WHEN 8 THEN v_qty := p_size_8_qty; v_borrowed := p_size_8_borrowed;
      WHEN 9 THEN v_qty := p_size_9_qty; v_borrowed := p_size_9_borrowed;
    END CASE;

    IF v_qty > 0 OR v_borrowed > 0 THEN
      UPDATE stock
      SET
        on_rent_stock = on_rent_stock + v_qty,
        borrowed_stock = borrowed_stock + v_borrowed
      WHERE size = i;
    END IF;
  END LOOP;

  DELETE FROM jama_challans WHERE jama_challan_number = p_challan_number;

  RETURN json_build_object('success', true, 'message', 'Jama challan deleted successfully');
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'message', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- MIGRATION: 20251107000001_add_bill_status.sql
-- ==========================================

-- Add status column to bills table if it exists
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'bills') THEN
    ALTER TABLE bills
    ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'draft'
    CHECK (status IN ('draft', 'generated', 'cancelled'));

    COMMENT ON COLUMN bills.status IS 'Status of the bill: draft, generated, or cancelled';

    UPDATE bills SET status = 'generated' WHERE status IS NULL;
  END IF;
END $$;

-- ==========================================
-- MIGRATION: 20251107000002_fix_bills_schema.sql
-- ==========================================

-- Step 1: Drop and recreate the bills table with all required columns
DROP TABLE IF EXISTS bills CASCADE;

CREATE TABLE bills (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID NOT NULL REFERENCES clients(id),
    bill_number VARCHAR(50) UNIQUE NOT NULL,
    bill_date DATE NOT NULL,
    from_date DATE NOT NULL,
    to_date DATE NOT NULL,
    daily_rent DECIMAL(10,2) NOT NULL,
    total_rent DECIMAL(10,2) NOT NULL,
    extra_costs_total DECIMAL(10,2) DEFAULT 0,
    discounts_total DECIMAL(10,2) DEFAULT 0,
    grand_total DECIMAL(10,2) NOT NULL,
    total_paid DECIMAL(10,2) DEFAULT 0,
    due_payment DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'generated', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 2: Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_bills_updated_at
    BEFORE UPDATE ON bills
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Step 3: Add helpful comments
COMMENT ON TABLE bills IS 'Stores all billing information for clients';
COMMENT ON COLUMN bills.status IS 'Current status of the bill: draft, generated, or cancelled';
COMMENT ON COLUMN bills.total_rent IS 'Total rental charges for the billing period';
COMMENT ON COLUMN bills.extra_costs_total IS 'Sum of all additional charges';
COMMENT ON COLUMN bills.discounts_total IS 'Sum of all discounts applied';
COMMENT ON COLUMN bills.grand_total IS 'Final amount after adding extra costs and subtracting discounts';
COMMENT ON COLUMN bills.total_paid IS 'Total amount paid so far';
COMMENT ON COLUMN bills.due_payment IS 'Remaining amount to be paid';

-- ==========================================
-- MIGRATION: 20251108000001_refresh_schema_cache.sql
-- ==========================================

-- Step 1: Add a comment to refresh schema cache
COMMENT ON COLUMN bills.bill_date IS 'Date when the bill was generated';

-- Step 2: Create an index on bill_date to improve query performance
CREATE INDEX IF NOT EXISTS bills_bill_date_idx ON bills(bill_date);

-- ==========================================
-- MIGRATION: 20251108000002_check_schema.sql
-- ==========================================

-- Get table structure
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'bills'
ORDER BY ordinal_position;

-- ==========================================
-- MIGRATION: 20251108000003_recreate_bills_table.sql
-- ==========================================

-- First, check if the table exists and drop it if it does
DROP TABLE IF EXISTS bills CASCADE;

-- Create the bills table with all required columns
CREATE TABLE bills (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID NOT NULL REFERENCES clients(id),
    bill_number VARCHAR(50) UNIQUE NOT NULL,
    billing_date DATE NOT NULL,
    from_date DATE NOT NULL,
    to_date DATE NOT NULL,
    daily_rent DECIMAL(10,2) NOT NULL,
    total_rent_amount DECIMAL(10,2) NOT NULL,
    total_extra_cost DECIMAL(10,2) DEFAULT 0 NOT NULL,
    total_discount DECIMAL(10,2) DEFAULT 0 NOT NULL,
    grand_total DECIMAL(10,2) NOT NULL,
    total_payment DECIMAL(10,2) DEFAULT 0 NOT NULL,
    due_payment DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'generated', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add helpful comments
COMMENT ON TABLE bills IS 'Stores all billing information for clients';
COMMENT ON COLUMN bills.status IS 'Current status of the bill: draft, generated, or cancelled';
COMMENT ON COLUMN bills.billing_date IS 'Date when the bill was generated';
COMMENT ON COLUMN bills.total_rent_amount IS 'Total rental charges for the billing period';
COMMENT ON COLUMN bills.total_extra_cost IS 'Sum of all additional charges';
COMMENT ON COLUMN bills.total_discount IS 'Sum of all discounts applied';
COMMENT ON COLUMN bills.grand_total IS 'Final amount after adding extra costs and subtracting discounts';
COMMENT ON COLUMN bills.total_payment IS 'Total amount paid so far';
COMMENT ON COLUMN bills.due_payment IS 'Remaining amount to be paid';

-- Enable Row Level Security
ALTER TABLE bills ENABLE ROW LEVEL SECURITY;

-- Create policies for bills table
-- Allow authenticated users to view bills
CREATE POLICY "View bills" ON bills
    FOR SELECT
    TO authenticated
    USING (true);  -- All authenticated users can view bills

-- Allow authenticated users to insert bills
CREATE POLICY "Insert bills" ON bills
    FOR INSERT
    TO authenticated
    WITH CHECK (true);  -- All authenticated users can create bills

-- Allow authenticated users to update bills
CREATE POLICY "Update bills" ON bills
    FOR UPDATE
    TO authenticated
    USING (true)  -- Can see the row
    WITH CHECK (true);  -- Can update the row

-- Allow authenticated users to delete bills
CREATE POLICY "Delete bills" ON bills
    FOR DELETE
    TO authenticated
    USING (true);  -- All authenticated users can delete bills

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_bills_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_bills_updated_at
    BEFORE UPDATE ON bills
    FOR EACH ROW
    EXECUTE FUNCTION update_bills_updated_at();

-- ==========================================
-- MIGRATION: 20260128120000_create_stock_history.sql
-- ==========================================

-- Create stock_history table
CREATE TABLE IF NOT EXISTS stock_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date timestamptz DEFAULT now(),
  type text CHECK (type IN ('add', 'remove')) NOT NULL,
  party_name text,
  note text,
  amount numeric DEFAULT 0,
  items jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE stock_history ENABLE ROW LEVEL SECURITY;

-- Create policies (modify as per your auth setup, assuming implicit public/anon access for now based on other tables)
CREATE POLICY "Allow public select on stock_history" ON stock_history FOR SELECT USING (true);
CREATE POLICY "Allow public insert on stock_history" ON stock_history FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on stock_history" ON stock_history FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on stock_history" ON stock_history FOR DELETE USING (true);


ALTER TABLE clients 
ADD COLUMN daily_rent_price NUMERIC DEFAULT 1;

-- ==========================================
-- MIGRATION: 20260712000000_add_size_10.sql
-- ==========================================

-- Migration: Add Size 10

ALTER TABLE udhar_items
  ADD COLUMN IF NOT EXISTS size_10_qty integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS size_10_borrowed integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS size_10_note text;

ALTER TABLE jama_items
  ADD COLUMN IF NOT EXISTS size_10_qty integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS size_10_borrowed integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS size_10_note text;

ALTER TABLE stock
  ADD COLUMN IF NOT EXISTS size_10_qty integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS size_10_borrowed integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS size_10_note text;

ALTER TABLE stock_history
  ADD COLUMN IF NOT EXISTS size_10_qty integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS size_10_borrowed integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS size_10_note text;


CREATE OR REPLACE FUNCTION increment_stock(
  p_size INTEGER,
  p_on_rent_increment INTEGER DEFAULT 0,
  p_borrowed_increment INTEGER DEFAULT 0
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE stock
  SET 
    on_rent_stock = on_rent_stock + COALESCE(p_on_rent_increment, 0),
    borrowed_stock = borrowed_stock + COALESCE(p_borrowed_increment, 0),
    updated_at = NOW()
  WHERE size = p_size;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Size % not found in stock table', p_size;
  END IF;
END;
$$;

-- RPC: Decrement Stock (Jama Transaction)
CREATE OR REPLACE FUNCTION decrement_stock(
  p_size INTEGER,
  p_on_rent_decrement INTEGER DEFAULT 0,
  p_borrowed_decrement INTEGER DEFAULT 0
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE stock
  SET 
    on_rent_stock = GREATEST(0, on_rent_stock - COALESCE(p_on_rent_decrement, 0)),
    borrowed_stock = GREATEST(0, borrowed_stock - COALESCE(p_borrowed_decrement, 0)),
    updated_at = NOW()
  WHERE size = p_size;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Size % not found in stock table', p_size;
  END IF;
END;
$$;

-- RPC: Update Udhar Challan with Stock adjustments
CREATE OR REPLACE FUNCTION update_udhar_challan_with_stock(
  p_challan_number TEXT,
  p_client_id UUID,
  p_alternative_site TEXT,
  p_secondary_phone_number TEXT,
  p_udhar_date DATE,
  p_driver_name TEXT,
  -- Old items data (for calculations)
  p_old_size_1_qty INTEGER, p_old_size_2_qty INTEGER, p_old_size_3_qty INTEGER,
  p_old_size_4_qty INTEGER, p_old_size_5_qty INTEGER, p_old_size_6_qty INTEGER,
  p_old_size_7_qty INTEGER, p_old_size_8_qty INTEGER, p_old_size_9_qty INTEGER, p_old_size_10_qty INTEGER,
  p_old_size_1_borrowed INTEGER, p_old_size_2_borrowed INTEGER, p_old_size_3_borrowed INTEGER,
  p_old_size_4_borrowed INTEGER, p_old_size_5_borrowed INTEGER, p_old_size_6_borrowed INTEGER,
  p_old_size_7_borrowed INTEGER, p_old_size_8_borrowed INTEGER, p_old_size_9_borrowed INTEGER, p_old_size_10_borrowed INTEGER,
  -- New items data
  p_new_size_1_qty INTEGER, p_new_size_2_qty INTEGER, p_new_size_3_qty INTEGER,
  p_new_size_4_qty INTEGER, p_new_size_5_qty INTEGER, p_new_size_6_qty INTEGER,
  p_new_size_7_qty INTEGER, p_new_size_8_qty INTEGER, p_new_size_9_qty INTEGER, p_new_size_10_qty INTEGER,
  p_new_size_1_borrowed INTEGER, p_new_size_2_borrowed INTEGER, p_new_size_3_borrowed INTEGER,
  p_new_size_4_borrowed INTEGER, p_new_size_5_borrowed INTEGER, p_new_size_6_borrowed INTEGER,
  p_new_size_7_borrowed INTEGER, p_new_size_8_borrowed INTEGER, p_new_size_9_borrowed INTEGER, p_new_size_10_borrowed INTEGER,
  p_new_size_1_note TEXT, p_new_size_2_note TEXT, p_new_size_3_note TEXT,
  p_new_size_4_note TEXT, p_new_size_5_note TEXT, p_new_size_6_note TEXT,
  p_new_size_7_note TEXT, p_new_size_8_note TEXT, p_new_size_9_note TEXT, p_new_size_10_note TEXT,
  p_new_main_note TEXT
)
RETURNS JSON AS $$
DECLARE
  v_old_qty INTEGER;
  v_old_borrowed INTEGER;
  v_new_qty INTEGER;
  v_new_borrowed INTEGER;
  v_qty_diff INTEGER;
  v_borrowed_diff INTEGER;
BEGIN
  -- Update challan details
  UPDATE udhar_challans
  SET
    client_id = p_client_id,
    alternative_site = p_alternative_site,
    secondary_phone_number = p_secondary_phone_number,
    udhar_date = p_udhar_date,
    driver_name = p_driver_name
  WHERE udhar_challan_number = p_challan_number;

  -- Update items details
  UPDATE udhar_items
  SET
    size_1_qty = p_new_size_1_qty, size_2_qty = p_new_size_2_qty, size_3_qty = p_new_size_3_qty,
    size_4_qty = p_new_size_4_qty, size_5_qty = p_new_size_5_qty, size_6_qty = p_new_size_6_qty,
    size_7_qty = p_new_size_7_qty, size_8_qty = p_new_size_8_qty, size_9_qty = p_new_size_9_qty, size_10_qty = p_new_size_10_qty,
    size_1_borrowed = p_new_size_1_borrowed, size_2_borrowed = p_new_size_2_borrowed, size_3_borrowed = p_new_size_3_borrowed,
    size_4_borrowed = p_new_size_4_borrowed, size_5_borrowed = p_new_size_5_borrowed, size_6_borrowed = p_new_size_6_borrowed,
    size_7_borrowed = p_new_size_7_borrowed, size_8_borrowed = p_new_size_8_borrowed, size_9_borrowed = p_new_size_9_borrowed, size_10_borrowed = p_new_size_10_borrowed,
    size_1_note = p_new_size_1_note, size_2_note = p_new_size_2_note, size_3_note = p_new_size_3_note,
    size_4_note = p_new_size_4_note, size_5_note = p_new_size_5_note, size_6_note = p_new_size_6_note,
    size_7_note = p_new_size_7_note, size_8_note = p_new_size_8_note, size_9_note = p_new_size_9_note, size_10_note = p_new_size_10_note,
    main_note = p_new_main_note
  WHERE udhar_challan_number = p_challan_number;

  -- Calculate delta difference per size and update stock
  FOR i IN 1..10 LOOP
    CASE i
      WHEN 1 THEN v_old_qty := p_old_size_1_qty; v_old_borrowed := p_old_size_1_borrowed; v_new_qty := p_new_size_1_qty; v_new_borrowed := p_new_size_1_borrowed;
      WHEN 2 THEN v_old_qty := p_old_size_2_qty; v_old_borrowed := p_old_size_2_borrowed; v_new_qty := p_new_size_2_qty; v_new_borrowed := p_new_size_2_borrowed;
      WHEN 3 THEN v_old_qty := p_old_size_3_qty; v_old_borrowed := p_old_size_3_borrowed; v_new_qty := p_new_size_3_qty; v_new_borrowed := p_new_size_3_borrowed;
      WHEN 4 THEN v_old_qty := p_old_size_4_qty; v_old_borrowed := p_old_size_4_borrowed; v_new_qty := p_new_size_4_qty; v_new_borrowed := p_new_size_4_borrowed;
      WHEN 5 THEN v_old_qty := p_old_size_5_qty; v_old_borrowed := p_old_size_5_borrowed; v_new_qty := p_new_size_5_qty; v_new_borrowed := p_new_size_5_borrowed;
      WHEN 6 THEN v_old_qty := p_old_size_6_qty; v_old_borrowed := p_old_size_6_borrowed; v_new_qty := p_new_size_6_qty; v_new_borrowed := p_new_size_6_borrowed;
      WHEN 7 THEN v_old_qty := p_old_size_7_qty; v_old_borrowed := p_old_size_7_borrowed; v_new_qty := p_new_size_7_qty; v_new_borrowed := p_new_size_7_borrowed;
      WHEN 8 THEN v_old_qty := p_old_size_8_qty; v_old_borrowed := p_old_size_8_borrowed; v_new_qty := p_new_size_8_qty; v_new_borrowed := p_new_size_8_borrowed;
      WHEN 9 THEN v_old_qty := p_old_size_9_qty; v_old_borrowed := p_old_size_9_borrowed; v_new_qty := p_new_size_9_qty; v_new_borrowed := p_new_size_9_borrowed;
      WHEN 10 THEN v_old_qty := p_old_size_10_qty; v_old_borrowed := p_old_size_10_borrowed; v_new_qty := p_new_size_10_qty; v_new_borrowed := p_new_size_10_borrowed;
    END CASE;

    v_qty_diff := v_new_qty - v_old_qty;
    v_borrowed_diff := v_new_borrowed - v_old_borrowed;

    IF v_qty_diff != 0 OR v_borrowed_diff != 0 THEN
      UPDATE stock
      SET
        on_rent_stock = on_rent_stock + v_qty_diff,
        borrowed_stock = borrowed_stock + v_borrowed_diff
      WHERE size = i;
    END IF;
  END LOOP;

  RETURN json_build_object('success', true, 'message', 'Udhar challan updated successfully');
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'message', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION decrement_stock(
  p_size INTEGER,
  p_on_rent_decrement INTEGER DEFAULT 0,
  p_borrowed_decrement INTEGER DEFAULT 0
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE stock
  SET 
    on_rent_stock = GREATEST(0, on_rent_stock - COALESCE(p_on_rent_decrement, 0)),
    borrowed_stock = GREATEST(0, borrowed_stock - COALESCE(p_borrowed_decrement, 0)),
    updated_at = NOW()
  WHERE size = p_size;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Size % not found in stock table', p_size;
  END IF;
END;
$$;

-- RPC: Update Udhar Challan with Stock adjustments
CREATE OR REPLACE FUNCTION update_udhar_challan_with_stock(
  p_challan_number TEXT,
  p_client_id UUID,
  p_alternative_site TEXT,
  p_secondary_phone_number TEXT,
  p_udhar_date DATE,
  p_driver_name TEXT,
  -- Old items data (for calculations)
  p_old_size_1_qty INTEGER, p_old_size_2_qty INTEGER, p_old_size_3_qty INTEGER,
  p_old_size_4_qty INTEGER, p_old_size_5_qty INTEGER, p_old_size_6_qty INTEGER,
  p_old_size_7_qty INTEGER, p_old_size_8_qty INTEGER, p_old_size_9_qty INTEGER, p_old_size_10_qty INTEGER,
  p_old_size_1_borrowed INTEGER, p_old_size_2_borrowed INTEGER, p_old_size_3_borrowed INTEGER,
  p_old_size_4_borrowed INTEGER, p_old_size_5_borrowed INTEGER, p_old_size_6_borrowed INTEGER,
  p_old_size_7_borrowed INTEGER, p_old_size_8_borrowed INTEGER, p_old_size_9_borrowed INTEGER, p_old_size_10_borrowed INTEGER,
  -- New items data
  p_new_size_1_qty INTEGER, p_new_size_2_qty INTEGER, p_new_size_3_qty INTEGER,
  p_new_size_4_qty INTEGER, p_new_size_5_qty INTEGER, p_new_size_6_qty INTEGER,
  p_new_size_7_qty INTEGER, p_new_size_8_qty INTEGER, p_new_size_9_qty INTEGER, p_new_size_10_qty INTEGER,
  p_new_size_1_borrowed INTEGER, p_new_size_2_borrowed INTEGER, p_new_size_3_borrowed INTEGER,
  p_new_size_4_borrowed INTEGER, p_new_size_5_borrowed INTEGER, p_new_size_6_borrowed INTEGER,
  p_new_size_7_borrowed INTEGER, p_new_size_8_borrowed INTEGER, p_new_size_9_borrowed INTEGER, p_new_size_10_borrowed INTEGER,
  p_new_size_1_note TEXT, p_new_size_2_note TEXT, p_new_size_3_note TEXT,
  p_new_size_4_note TEXT, p_new_size_5_note TEXT, p_new_size_6_note TEXT,
  p_new_size_7_note TEXT, p_new_size_8_note TEXT, p_new_size_9_note TEXT, p_new_size_10_note TEXT,
  p_new_main_note TEXT
)
RETURNS JSON AS $$
DECLARE
  v_old_qty INTEGER;
  v_old_borrowed INTEGER;
  v_new_qty INTEGER;
  v_new_borrowed INTEGER;
  v_qty_diff INTEGER;
  v_borrowed_diff INTEGER;
BEGIN
  -- Update challan details
  UPDATE udhar_challans
  SET
    client_id = p_client_id,
    alternative_site = p_alternative_site,
    secondary_phone_number = p_secondary_phone_number,
    udhar_date = p_udhar_date,
    driver_name = p_driver_name
  WHERE udhar_challan_number = p_challan_number;

  -- Update items details
  UPDATE udhar_items
  SET
    size_1_qty = p_new_size_1_qty, size_2_qty = p_new_size_2_qty, size_3_qty = p_new_size_3_qty,
    size_4_qty = p_new_size_4_qty, size_5_qty = p_new_size_5_qty, size_6_qty = p_new_size_6_qty,
    size_7_qty = p_new_size_7_qty, size_8_qty = p_new_size_8_qty, size_9_qty = p_new_size_9_qty, size_10_qty = p_new_size_10_qty,
    size_1_borrowed = p_new_size_1_borrowed, size_2_borrowed = p_new_size_2_borrowed, size_3_borrowed = p_new_size_3_borrowed,
    size_4_borrowed = p_new_size_4_borrowed, size_5_borrowed = p_new_size_5_borrowed, size_6_borrowed = p_new_size_6_borrowed,
    size_7_borrowed = p_new_size_7_borrowed, size_8_borrowed = p_new_size_8_borrowed, size_9_borrowed = p_new_size_9_borrowed, size_10_borrowed = p_new_size_10_borrowed,
    size_1_note = p_new_size_1_note, size_2_note = p_new_size_2_note, size_3_note = p_new_size_3_note,
    size_4_note = p_new_size_4_note, size_5_note = p_new_size_5_note, size_6_note = p_new_size_6_note,
    size_7_note = p_new_size_7_note, size_8_note = p_new_size_8_note, size_9_note = p_new_size_9_note, size_10_note = p_new_size_10_note,
    main_note = p_new_main_note
  WHERE udhar_challan_number = p_challan_number;

  -- Calculate delta difference per size and update stock
  FOR i IN 1..10 LOOP
    CASE i
      WHEN 1 THEN v_old_qty := p_old_size_1_qty; v_old_borrowed := p_old_size_1_borrowed; v_new_qty := p_new_size_1_qty; v_new_borrowed := p_new_size_1_borrowed;
      WHEN 2 THEN v_old_qty := p_old_size_2_qty; v_old_borrowed := p_old_size_2_borrowed; v_new_qty := p_new_size_2_qty; v_new_borrowed := p_new_size_2_borrowed;
      WHEN 3 THEN v_old_qty := p_old_size_3_qty; v_old_borrowed := p_old_size_3_borrowed; v_new_qty := p_new_size_3_qty; v_new_borrowed := p_new_size_3_borrowed;
      WHEN 4 THEN v_old_qty := p_old_size_4_qty; v_old_borrowed := p_old_size_4_borrowed; v_new_qty := p_new_size_4_qty; v_new_borrowed := p_new_size_4_borrowed;
      WHEN 5 THEN v_old_qty := p_old_size_5_qty; v_old_borrowed := p_old_size_5_borrowed; v_new_qty := p_new_size_5_qty; v_new_borrowed := p_new_size_5_borrowed;
      WHEN 6 THEN v_old_qty := p_old_size_6_qty; v_old_borrowed := p_old_size_6_borrowed; v_new_qty := p_new_size_6_qty; v_new_borrowed := p_new_size_6_borrowed;
      WHEN 7 THEN v_old_qty := p_old_size_7_qty; v_old_borrowed := p_old_size_7_borrowed; v_new_qty := p_new_size_7_qty; v_new_borrowed := p_new_size_7_borrowed;
      WHEN 8 THEN v_old_qty := p_old_size_8_qty; v_old_borrowed := p_old_size_8_borrowed; v_new_qty := p_new_size_8_qty; v_new_borrowed := p_new_size_8_borrowed;
      WHEN 9 THEN v_old_qty := p_old_size_9_qty; v_old_borrowed := p_old_size_9_borrowed; v_new_qty := p_new_size_9_qty; v_new_borrowed := p_new_size_9_borrowed;
      WHEN 10 THEN v_old_qty := p_old_size_10_qty; v_old_borrowed := p_old_size_10_borrowed; v_new_qty := p_new_size_10_qty; v_new_borrowed := p_new_size_10_borrowed;
    END CASE;

    v_qty_diff := v_new_qty - v_old_qty;
    v_borrowed_diff := v_new_borrowed - v_old_borrowed;

    IF v_qty_diff != 0 OR v_borrowed_diff != 0 THEN
      UPDATE stock
      SET
        on_rent_stock = on_rent_stock + v_qty_diff,
        borrowed_stock = borrowed_stock + v_borrowed_diff
      WHERE size = i;
    END IF;
  END LOOP;

  RETURN json_build_object('success', true, 'message', 'Udhar challan updated successfully');
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'message', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION update_udhar_challan_with_stock(
  p_challan_number TEXT,
  p_client_id UUID,
  p_alternative_site TEXT,
  p_secondary_phone_number TEXT,
  p_udhar_date DATE,
  p_driver_name TEXT,
  -- Old items data (for calculations)
  p_old_size_1_qty INTEGER, p_old_size_2_qty INTEGER, p_old_size_3_qty INTEGER,
  p_old_size_4_qty INTEGER, p_old_size_5_qty INTEGER, p_old_size_6_qty INTEGER,
  p_old_size_7_qty INTEGER, p_old_size_8_qty INTEGER, p_old_size_9_qty INTEGER, p_old_size_10_qty INTEGER,
  p_old_size_1_borrowed INTEGER, p_old_size_2_borrowed INTEGER, p_old_size_3_borrowed INTEGER,
  p_old_size_4_borrowed INTEGER, p_old_size_5_borrowed INTEGER, p_old_size_6_borrowed INTEGER,
  p_old_size_7_borrowed INTEGER, p_old_size_8_borrowed INTEGER, p_old_size_9_borrowed INTEGER, p_old_size_10_borrowed INTEGER,
  -- New items data
  p_new_size_1_qty INTEGER, p_new_size_2_qty INTEGER, p_new_size_3_qty INTEGER,
  p_new_size_4_qty INTEGER, p_new_size_5_qty INTEGER, p_new_size_6_qty INTEGER,
  p_new_size_7_qty INTEGER, p_new_size_8_qty INTEGER, p_new_size_9_qty INTEGER, p_new_size_10_qty INTEGER,
  p_new_size_1_borrowed INTEGER, p_new_size_2_borrowed INTEGER, p_new_size_3_borrowed INTEGER,
  p_new_size_4_borrowed INTEGER, p_new_size_5_borrowed INTEGER, p_new_size_6_borrowed INTEGER,
  p_new_size_7_borrowed INTEGER, p_new_size_8_borrowed INTEGER, p_new_size_9_borrowed INTEGER, p_new_size_10_borrowed INTEGER,
  p_new_size_1_note TEXT, p_new_size_2_note TEXT, p_new_size_3_note TEXT,
  p_new_size_4_note TEXT, p_new_size_5_note TEXT, p_new_size_6_note TEXT,
  p_new_size_7_note TEXT, p_new_size_8_note TEXT, p_new_size_9_note TEXT, p_new_size_10_note TEXT,
  p_new_main_note TEXT
)
RETURNS JSON AS $$
DECLARE
  v_old_qty INTEGER;
  v_old_borrowed INTEGER;
  v_new_qty INTEGER;
  v_new_borrowed INTEGER;
  v_qty_diff INTEGER;
  v_borrowed_diff INTEGER;
BEGIN
  -- Update challan details
  UPDATE udhar_challans
  SET
    client_id = p_client_id,
    alternative_site = p_alternative_site,
    secondary_phone_number = p_secondary_phone_number,
    udhar_date = p_udhar_date,
    driver_name = p_driver_name
  WHERE udhar_challan_number = p_challan_number;

  -- Update items details
  UPDATE udhar_items
  SET
    size_1_qty = p_new_size_1_qty, size_2_qty = p_new_size_2_qty, size_3_qty = p_new_size_3_qty,
    size_4_qty = p_new_size_4_qty, size_5_qty = p_new_size_5_qty, size_6_qty = p_new_size_6_qty,
    size_7_qty = p_new_size_7_qty, size_8_qty = p_new_size_8_qty, size_9_qty = p_new_size_9_qty, size_10_qty = p_new_size_10_qty,
    size_1_borrowed = p_new_size_1_borrowed, size_2_borrowed = p_new_size_2_borrowed, size_3_borrowed = p_new_size_3_borrowed,
    size_4_borrowed = p_new_size_4_borrowed, size_5_borrowed = p_new_size_5_borrowed, size_6_borrowed = p_new_size_6_borrowed,
    size_7_borrowed = p_new_size_7_borrowed, size_8_borrowed = p_new_size_8_borrowed, size_9_borrowed = p_new_size_9_borrowed, size_10_borrowed = p_new_size_10_borrowed,
    size_1_note = p_new_size_1_note, size_2_note = p_new_size_2_note, size_3_note = p_new_size_3_note,
    size_4_note = p_new_size_4_note, size_5_note = p_new_size_5_note, size_6_note = p_new_size_6_note,
    size_7_note = p_new_size_7_note, size_8_note = p_new_size_8_note, size_9_note = p_new_size_9_note, size_10_note = p_new_size_10_note,
    main_note = p_new_main_note
  WHERE udhar_challan_number = p_challan_number;

  -- Calculate delta difference per size and update stock
  FOR i IN 1..10 LOOP
    CASE i
      WHEN 1 THEN v_old_qty := p_old_size_1_qty; v_old_borrowed := p_old_size_1_borrowed; v_new_qty := p_new_size_1_qty; v_new_borrowed := p_new_size_1_borrowed;
      WHEN 2 THEN v_old_qty := p_old_size_2_qty; v_old_borrowed := p_old_size_2_borrowed; v_new_qty := p_new_size_2_qty; v_new_borrowed := p_new_size_2_borrowed;
      WHEN 3 THEN v_old_qty := p_old_size_3_qty; v_old_borrowed := p_old_size_3_borrowed; v_new_qty := p_new_size_3_qty; v_new_borrowed := p_new_size_3_borrowed;
      WHEN 4 THEN v_old_qty := p_old_size_4_qty; v_old_borrowed := p_old_size_4_borrowed; v_new_qty := p_new_size_4_qty; v_new_borrowed := p_new_size_4_borrowed;
      WHEN 5 THEN v_old_qty := p_old_size_5_qty; v_old_borrowed := p_old_size_5_borrowed; v_new_qty := p_new_size_5_qty; v_new_borrowed := p_new_size_5_borrowed;
      WHEN 6 THEN v_old_qty := p_old_size_6_qty; v_old_borrowed := p_old_size_6_borrowed; v_new_qty := p_new_size_6_qty; v_new_borrowed := p_new_size_6_borrowed;
      WHEN 7 THEN v_old_qty := p_old_size_7_qty; v_old_borrowed := p_old_size_7_borrowed; v_new_qty := p_new_size_7_qty; v_new_borrowed := p_new_size_7_borrowed;
      WHEN 8 THEN v_old_qty := p_old_size_8_qty; v_old_borrowed := p_old_size_8_borrowed; v_new_qty := p_new_size_8_qty; v_new_borrowed := p_new_size_8_borrowed;
      WHEN 9 THEN v_old_qty := p_old_size_9_qty; v_old_borrowed := p_old_size_9_borrowed; v_new_qty := p_new_size_9_qty; v_new_borrowed := p_new_size_9_borrowed;
      WHEN 10 THEN v_old_qty := p_old_size_10_qty; v_old_borrowed := p_old_size_10_borrowed; v_new_qty := p_new_size_10_qty; v_new_borrowed := p_new_size_10_borrowed;
    END CASE;

    v_qty_diff := v_new_qty - v_old_qty;
    v_borrowed_diff := v_new_borrowed - v_old_borrowed;

    IF v_qty_diff != 0 OR v_borrowed_diff != 0 THEN
      UPDATE stock
      SET
        on_rent_stock = on_rent_stock + v_qty_diff,
        borrowed_stock = borrowed_stock + v_borrowed_diff
      WHERE size = i;
    END IF;
  END LOOP;

  RETURN json_build_object('success', true, 'message', 'Udhar challan updated successfully');
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'message', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION update_jama_challan_with_stock(
  p_challan_number TEXT,
  p_client_id UUID,
  p_alternative_site TEXT,
  p_secondary_phone_number TEXT,
  p_jama_date DATE,
  p_driver_name TEXT,
  -- Old items data (for calculations)
  p_old_size_1_qty INTEGER, p_old_size_2_qty INTEGER, p_old_size_3_qty INTEGER,
  p_old_size_4_qty INTEGER, p_old_size_5_qty INTEGER, p_old_size_6_qty INTEGER,
  p_old_size_7_qty INTEGER, p_old_size_8_qty INTEGER, p_old_size_9_qty INTEGER, p_old_size_10_qty INTEGER,
  p_old_size_1_borrowed INTEGER, p_old_size_2_borrowed INTEGER, p_old_size_3_borrowed INTEGER,
  p_old_size_4_borrowed INTEGER, p_old_size_5_borrowed INTEGER, p_old_size_6_borrowed INTEGER,
  p_old_size_7_borrowed INTEGER, p_old_size_8_borrowed INTEGER, p_old_size_9_borrowed INTEGER, p_old_size_10_borrowed INTEGER,
  -- New items data
  p_new_size_1_qty INTEGER, p_new_size_2_qty INTEGER, p_new_size_3_qty INTEGER,
  p_new_size_4_qty INTEGER, p_new_size_5_qty INTEGER, p_new_size_6_qty INTEGER,
  p_new_size_7_qty INTEGER, p_new_size_8_qty INTEGER, p_new_size_9_qty INTEGER, p_new_size_10_qty INTEGER,
  p_new_size_1_borrowed INTEGER, p_new_size_2_borrowed INTEGER, p_new_size_3_borrowed INTEGER,
  p_new_size_4_borrowed INTEGER, p_new_size_5_borrowed INTEGER, p_new_size_6_borrowed INTEGER,
  p_new_size_7_borrowed INTEGER, p_new_size_8_borrowed INTEGER, p_new_size_9_borrowed INTEGER, p_new_size_10_borrowed INTEGER,
  p_new_size_1_note TEXT, p_new_size_2_note TEXT, p_new_size_3_note TEXT,
  p_new_size_4_note TEXT, p_new_size_5_note TEXT, p_new_size_6_note TEXT,
  p_new_size_7_note TEXT, p_new_size_8_note TEXT, p_new_size_9_note TEXT, p_new_size_10_note TEXT,
  p_new_main_note TEXT
)
RETURNS JSON AS $$
DECLARE
  v_old_qty INTEGER;
  v_old_borrowed INTEGER;
  v_new_qty INTEGER;
  v_new_borrowed INTEGER;
  v_qty_diff INTEGER;
  v_borrowed_diff INTEGER;
BEGIN
  -- Update challan details
  UPDATE jama_challans
  SET
    client_id = p_client_id,
    alternative_site = p_alternative_site,
    secondary_phone_number = p_secondary_phone_number,
    jama_date = p_jama_date,
    driver_name = p_driver_name
  WHERE jama_challan_number = p_challan_number;

  -- Update items details
  UPDATE jama_items
  SET
    size_1_qty = p_new_size_1_qty, size_2_qty = p_new_size_2_qty, size_3_qty = p_new_size_3_qty,
    size_4_qty = p_new_size_4_qty, size_5_qty = p_new_size_5_qty, size_6_qty = p_new_size_6_qty,
    size_7_qty = p_new_size_7_qty, size_8_qty = p_new_size_8_qty, size_9_qty = p_new_size_9_qty, size_10_qty = p_new_size_10_qty,
    size_1_borrowed = p_new_size_1_borrowed, size_2_borrowed = p_new_size_2_borrowed, size_3_borrowed = p_new_size_3_borrowed,
    size_4_borrowed = p_new_size_4_borrowed, size_5_borrowed = p_new_size_5_borrowed, size_6_borrowed = p_new_size_6_borrowed,
    size_7_borrowed = p_new_size_7_borrowed, size_8_borrowed = p_new_size_8_borrowed, size_9_borrowed = p_new_size_9_borrowed, size_10_borrowed = p_new_size_10_borrowed,
    size_1_note = p_new_size_1_note, size_2_note = p_new_size_2_note, size_3_note = p_new_size_3_note,
    size_4_note = p_new_size_4_note, size_5_note = p_new_size_5_note, size_6_note = p_new_size_6_note,
    size_7_note = p_new_size_7_note, size_8_note = p_new_size_8_note, size_9_note = p_new_size_9_note, size_10_note = p_new_size_10_note,
    main_note = p_new_main_note
  WHERE jama_challan_number = p_challan_number;

  -- Calculate delta difference per size and update stock (receivals decrease active rent/borrowed)
  FOR i IN 1..10 LOOP
    CASE i
      WHEN 1 THEN v_old_qty := p_old_size_1_qty; v_old_borrowed := p_old_size_1_borrowed; v_new_qty := p_new_size_1_qty; v_new_borrowed := p_new_size_1_borrowed;
      WHEN 2 THEN v_old_qty := p_old_size_2_qty; v_old_borrowed := p_old_size_2_borrowed; v_new_qty := p_new_size_2_qty; v_new_borrowed := p_new_size_2_borrowed;
      WHEN 3 THEN v_old_qty := p_old_size_3_qty; v_old_borrowed := p_old_size_3_borrowed; v_new_qty := p_new_size_3_qty; v_new_borrowed := p_new_size_3_borrowed;
      WHEN 4 THEN v_old_qty := p_old_size_4_qty; v_old_borrowed := p_old_size_4_borrowed; v_new_qty := p_new_size_4_qty; v_new_borrowed := p_new_size_4_borrowed;
      WHEN 5 THEN v_old_qty := p_old_size_5_qty; v_old_borrowed := p_old_size_5_borrowed; v_new_qty := p_new_size_5_qty; v_new_borrowed := p_new_size_5_borrowed;
      WHEN 6 THEN v_old_qty := p_old_size_6_qty; v_old_borrowed := p_old_size_6_borrowed; v_new_qty := p_new_size_6_qty; v_new_borrowed := p_new_size_6_borrowed;
      WHEN 7 THEN v_old_qty := p_old_size_7_qty; v_old_borrowed := p_old_size_7_borrowed; v_new_qty := p_new_size_7_qty; v_new_borrowed := p_new_size_7_borrowed;
      WHEN 8 THEN v_old_qty := p_old_size_8_qty; v_old_borrowed := p_old_size_8_borrowed; v_new_qty := p_new_size_8_qty; v_new_borrowed := p_new_size_8_borrowed;
      WHEN 9 THEN v_old_qty := p_old_size_9_qty; v_old_borrowed := p_old_size_9_borrowed; v_new_qty := p_new_size_9_qty; v_new_borrowed := p_new_size_9_borrowed;
      WHEN 10 THEN v_old_qty := p_old_size_10_qty; v_old_borrowed := p_old_size_10_borrowed; v_new_qty := p_new_size_10_qty; v_new_borrowed := p_new_size_10_borrowed;
    END CASE;

    v_qty_diff := v_new_qty - v_old_qty;
    v_borrowed_diff := v_new_borrowed - v_old_borrowed;

    IF v_qty_diff != 0 OR v_borrowed_diff != 0 THEN
      UPDATE stock
      SET
        on_rent_stock = GREATEST(0, on_rent_stock - v_qty_diff),
        borrowed_stock = GREATEST(0, borrowed_stock - v_borrowed_diff)
      WHERE size = i;
    END IF;
  END LOOP;

  RETURN json_build_object('success', true, 'message', 'Jama challan updated successfully');
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'message', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION delete_udhar_challan_with_stock(
  p_challan_number TEXT,
  p_size_1_qty INTEGER, p_size_2_qty INTEGER, p_size_3_qty INTEGER,
  p_size_4_qty INTEGER, p_size_5_qty INTEGER, p_size_6_qty INTEGER,
  p_size_7_qty INTEGER, p_size_8_qty INTEGER, p_size_9_qty INTEGER, p_size_10_qty INTEGER,
  p_size_1_borrowed INTEGER, p_size_2_borrowed INTEGER, p_size_3_borrowed INTEGER,
  p_size_4_borrowed INTEGER, p_size_5_borrowed INTEGER, p_size_6_borrowed INTEGER,
  p_size_7_borrowed INTEGER, p_size_8_borrowed INTEGER, p_size_9_borrowed INTEGER, p_size_10_borrowed INTEGER
)
RETURNS JSON AS $$
DECLARE
  v_qty INTEGER;
  v_borrowed INTEGER;
BEGIN
  FOR i IN 1..10 LOOP
    CASE i
      WHEN 1 THEN v_qty := p_size_1_qty; v_borrowed := p_size_1_borrowed;
      WHEN 2 THEN v_qty := p_size_2_qty; v_borrowed := p_size_2_borrowed;
      WHEN 3 THEN v_qty := p_size_3_qty; v_borrowed := p_size_3_borrowed;
      WHEN 4 THEN v_qty := p_size_4_qty; v_borrowed := p_size_4_borrowed;
      WHEN 5 THEN v_qty := p_size_5_qty; v_borrowed := p_size_5_borrowed;
      WHEN 6 THEN v_qty := p_size_6_qty; v_borrowed := p_size_6_borrowed;
      WHEN 7 THEN v_qty := p_size_7_qty; v_borrowed := p_size_7_borrowed;
      WHEN 8 THEN v_qty := p_size_8_qty; v_borrowed := p_size_8_borrowed;
      WHEN 9 THEN v_qty := p_size_9_qty; v_borrowed := p_size_9_borrowed;
      WHEN 10 THEN v_qty := p_size_10_qty; v_borrowed := p_size_10_borrowed;
    END CASE;

    IF v_qty > 0 OR v_borrowed > 0 THEN
      UPDATE stock
      SET
        on_rent_stock = GREATEST(0, on_rent_stock - v_qty),
        borrowed_stock = GREATEST(0, borrowed_stock - v_borrowed)
      WHERE size = i;
    END IF;
  END LOOP;

  DELETE FROM udhar_challans WHERE udhar_challan_number = p_challan_number;

  RETURN json_build_object('success', true, 'message', 'Udhar challan deleted successfully');
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'message', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION delete_jama_challan_with_stock(
  p_challan_number TEXT,
  p_size_1_qty INTEGER, p_size_2_qty INTEGER, p_size_3_qty INTEGER,
  p_size_4_qty INTEGER, p_size_5_qty INTEGER, p_size_6_qty INTEGER,
  p_size_7_qty INTEGER, p_size_8_qty INTEGER, p_size_9_qty INTEGER, p_size_10_qty INTEGER,
  p_size_1_borrowed INTEGER, p_size_2_borrowed INTEGER, p_size_3_borrowed INTEGER,
  p_size_4_borrowed INTEGER, p_size_5_borrowed INTEGER, p_size_6_borrowed INTEGER,
  p_size_7_borrowed INTEGER, p_size_8_borrowed INTEGER, p_size_9_borrowed INTEGER, p_size_10_borrowed INTEGER
)
RETURNS JSON AS $$
DECLARE
  v_qty INTEGER;
  v_borrowed INTEGER;
BEGIN
  FOR i IN 1..10 LOOP
    CASE i
      WHEN 1 THEN v_qty := p_size_1_qty; v_borrowed := p_size_1_borrowed;
      WHEN 2 THEN v_qty := p_size_2_qty; v_borrowed := p_size_2_borrowed;
      WHEN 3 THEN v_qty := p_size_3_qty; v_borrowed := p_size_3_borrowed;
      WHEN 4 THEN v_qty := p_size_4_qty; v_borrowed := p_size_4_borrowed;
      WHEN 5 THEN v_qty := p_size_5_qty; v_borrowed := p_size_5_borrowed;
      WHEN 6 THEN v_qty := p_size_6_qty; v_borrowed := p_size_6_borrowed;
      WHEN 7 THEN v_qty := p_size_7_qty; v_borrowed := p_size_7_borrowed;
      WHEN 8 THEN v_qty := p_size_8_qty; v_borrowed := p_size_8_borrowed;
      WHEN 9 THEN v_qty := p_size_9_qty; v_borrowed := p_size_9_borrowed;
      WHEN 10 THEN v_qty := p_size_10_qty; v_borrowed := p_size_10_borrowed;
    END CASE;

    IF v_qty > 0 OR v_borrowed > 0 THEN
      UPDATE stock
      SET
        on_rent_stock = on_rent_stock + v_qty,
        borrowed_stock = borrowed_stock + v_borrowed
      WHERE size = i;
    END IF;
  END LOOP;

  DELETE FROM jama_challans WHERE jama_challan_number = p_challan_number;

  RETURN json_build_object('success', true, 'message', 'Jama challan deleted successfully');
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'message', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ==========================================
-- MIGRATION: 20260712100000_dynamic_sizes.sql
-- ==========================================

-- 1. Create Plate Sizes table
CREATE TABLE IF NOT EXISTS plate_sizes (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert existing 10 sizes to preserve data
INSERT INTO plate_sizes (id, name, sort_order) VALUES
(1, '2 X 3', 1),
(2, '21 X 3', 2),
(3, '18 X 3', 3),
(4, '15 X 3', 4),
(5, '12 X 3', 5),
(6, '9 X 3', 6),
(7, 'પતરા', 7),
(8, '2 X 2', 8),
(9, '2 ફુટ', 9),
(10, 'Size 10', 10)
ON CONFLICT (id) DO NOTHING;

-- Ensure sequence is synced
SELECT setval('plate_sizes_id_seq', (SELECT MAX(id) FROM plate_sizes));

-- 2. Modify Stock Table (drop check constraint and add foreign key)
-- Find and drop the check constraint dynamically (often named 'stock_size_check' or similar)
DO $$
DECLARE
    con_name TEXT;
BEGIN
    SELECT conname INTO con_name
    FROM pg_constraint
    WHERE conrelid = 'stock'::regclass AND contype = 'c' AND pg_get_expr(conbin, conrelid) LIKE '%size >= 1%';
    
    IF con_name IS NOT NULL THEN
        EXECUTE 'ALTER TABLE stock DROP CONSTRAINT ' || con_name;
    END IF;
END $$;

ALTER TABLE stock ADD CONSTRAINT fk_stock_size FOREIGN KEY (size) REFERENCES plate_sizes(id) ON DELETE CASCADE;

-- 3. Add JSONB columns to items tables
ALTER TABLE udhar_items ADD COLUMN items JSONB DEFAULT '[]'::jsonb;
ALTER TABLE jama_items ADD COLUMN items JSONB DEFAULT '[]'::jsonb;

-- 4. Data Migration: Convert 30 columns to JSONB
-- For udhar_items
UPDATE udhar_items SET items = (
    SELECT jsonb_agg(
        jsonb_build_object(
            'size_id', size_id,
            'qty', qty,
            'borrowed', borrowed,
            'note', note
        )
    )
    FROM (
        SELECT 1 AS size_id, size_1_qty AS qty, size_1_borrowed AS borrowed, size_1_note AS note FROM udhar_items u2 WHERE u2.udhar_challan_number = udhar_items.udhar_challan_number
        UNION ALL SELECT 2, size_2_qty, size_2_borrowed, size_2_note FROM udhar_items u2 WHERE u2.udhar_challan_number = udhar_items.udhar_challan_number
        UNION ALL SELECT 3, size_3_qty, size_3_borrowed, size_3_note FROM udhar_items u2 WHERE u2.udhar_challan_number = udhar_items.udhar_challan_number
        UNION ALL SELECT 4, size_4_qty, size_4_borrowed, size_4_note FROM udhar_items u2 WHERE u2.udhar_challan_number = udhar_items.udhar_challan_number
        UNION ALL SELECT 5, size_5_qty, size_5_borrowed, size_5_note FROM udhar_items u2 WHERE u2.udhar_challan_number = udhar_items.udhar_challan_number
        UNION ALL SELECT 6, size_6_qty, size_6_borrowed, size_6_note FROM udhar_items u2 WHERE u2.udhar_challan_number = udhar_items.udhar_challan_number
        UNION ALL SELECT 7, size_7_qty, size_7_borrowed, size_7_note FROM udhar_items u2 WHERE u2.udhar_challan_number = udhar_items.udhar_challan_number
        UNION ALL SELECT 8, size_8_qty, size_8_borrowed, size_8_note FROM udhar_items u2 WHERE u2.udhar_challan_number = udhar_items.udhar_challan_number
        UNION ALL SELECT 9, size_9_qty, size_9_borrowed, size_9_note FROM udhar_items u2 WHERE u2.udhar_challan_number = udhar_items.udhar_challan_number
        UNION ALL SELECT 10, size_10_qty, size_10_borrowed, size_10_note FROM udhar_items u2 WHERE u2.udhar_challan_number = udhar_items.udhar_challan_number
    ) sub
    WHERE (qty > 0 OR borrowed > 0 OR (note IS NOT NULL AND note != ''))
);

-- If items is null, set to empty array
UPDATE udhar_items SET items = '[]'::jsonb WHERE items IS NULL;

-- For jama_items
UPDATE jama_items SET items = (
    SELECT jsonb_agg(
        jsonb_build_object(
            'size_id', size_id,
            'qty', qty,
            'borrowed', borrowed,
            'note', note
        )
    )
    FROM (
        SELECT 1 AS size_id, size_1_qty AS qty, size_1_borrowed AS borrowed, size_1_note AS note FROM jama_items j2 WHERE j2.jama_challan_number = jama_items.jama_challan_number
        UNION ALL SELECT 2, size_2_qty, size_2_borrowed, size_2_note FROM jama_items j2 WHERE j2.jama_challan_number = jama_items.jama_challan_number
        UNION ALL SELECT 3, size_3_qty, size_3_borrowed, size_3_note FROM jama_items j2 WHERE j2.jama_challan_number = jama_items.jama_challan_number
        UNION ALL SELECT 4, size_4_qty, size_4_borrowed, size_4_note FROM jama_items j2 WHERE j2.jama_challan_number = jama_items.jama_challan_number
        UNION ALL SELECT 5, size_5_qty, size_5_borrowed, size_5_note FROM jama_items j2 WHERE j2.jama_challan_number = jama_items.jama_challan_number
        UNION ALL SELECT 6, size_6_qty, size_6_borrowed, size_6_note FROM jama_items j2 WHERE j2.jama_challan_number = jama_items.jama_challan_number
        UNION ALL SELECT 7, size_7_qty, size_7_borrowed, size_7_note FROM jama_items j2 WHERE j2.jama_challan_number = jama_items.jama_challan_number
        UNION ALL SELECT 8, size_8_qty, size_8_borrowed, size_8_note FROM jama_items j2 WHERE j2.jama_challan_number = jama_items.jama_challan_number
        UNION ALL SELECT 9, size_9_qty, size_9_borrowed, size_9_note FROM jama_items j2 WHERE j2.jama_challan_number = jama_items.jama_challan_number
        UNION ALL SELECT 10, size_10_qty, size_10_borrowed, size_10_note FROM jama_items j2 WHERE j2.jama_challan_number = jama_items.jama_challan_number
    ) sub
    WHERE (qty > 0 OR borrowed > 0 OR (note IS NOT NULL AND note != ''))
);
UPDATE jama_items SET items = '[]'::jsonb WHERE items IS NULL;

-- 5. Drop old columns
ALTER TABLE udhar_items
  DROP COLUMN size_1_qty, DROP COLUMN size_2_qty, DROP COLUMN size_3_qty, DROP COLUMN size_4_qty, DROP COLUMN size_5_qty,
  DROP COLUMN size_6_qty, DROP COLUMN size_7_qty, DROP COLUMN size_8_qty, DROP COLUMN size_9_qty, DROP COLUMN size_10_qty,
  DROP COLUMN size_1_borrowed, DROP COLUMN size_2_borrowed, DROP COLUMN size_3_borrowed, DROP COLUMN size_4_borrowed, DROP COLUMN size_5_borrowed,
  DROP COLUMN size_6_borrowed, DROP COLUMN size_7_borrowed, DROP COLUMN size_8_borrowed, DROP COLUMN size_9_borrowed, DROP COLUMN size_10_borrowed,
  DROP COLUMN size_1_note, DROP COLUMN size_2_note, DROP COLUMN size_3_note, DROP COLUMN size_4_note, DROP COLUMN size_5_note,
  DROP COLUMN size_6_note, DROP COLUMN size_7_note, DROP COLUMN size_8_note, DROP COLUMN size_9_note, DROP COLUMN size_10_note;

ALTER TABLE jama_items
  DROP COLUMN size_1_qty, DROP COLUMN size_2_qty, DROP COLUMN size_3_qty, DROP COLUMN size_4_qty, DROP COLUMN size_5_qty,
  DROP COLUMN size_6_qty, DROP COLUMN size_7_qty, DROP COLUMN size_8_qty, DROP COLUMN size_9_qty, DROP COLUMN size_10_qty,
  DROP COLUMN size_1_borrowed, DROP COLUMN size_2_borrowed, DROP COLUMN size_3_borrowed, DROP COLUMN size_4_borrowed, DROP COLUMN size_5_borrowed,
  DROP COLUMN size_6_borrowed, DROP COLUMN size_7_borrowed, DROP COLUMN size_8_borrowed, DROP COLUMN size_9_borrowed, DROP COLUMN size_10_borrowed,
  DROP COLUMN size_1_note, DROP COLUMN size_2_note, DROP COLUMN size_3_note, DROP COLUMN size_4_note, DROP COLUMN size_5_note,
  DROP COLUMN size_6_note, DROP COLUMN size_7_note, DROP COLUMN size_8_note, DROP COLUMN size_9_note, DROP COLUMN size_10_note;

-- 6. Rewrite Stored Procedures

-- Helper stock functions remain exactly the same since they already take a size_id and quantities
CREATE OR REPLACE FUNCTION increment_stock(
  p_size INTEGER,
  p_on_rent_increment INTEGER DEFAULT 0,
  p_borrowed_increment INTEGER DEFAULT 0
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE stock
  SET 
    on_rent_stock = on_rent_stock + COALESCE(p_on_rent_increment, 0),
    borrowed_stock = borrowed_stock + COALESCE(p_borrowed_increment, 0),
    updated_at = NOW()
  WHERE size = p_size;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Size % not found in stock table', p_size;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION decrement_stock(
  p_size INTEGER,
  p_on_rent_decrement INTEGER DEFAULT 0,
  p_borrowed_decrement INTEGER DEFAULT 0
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE stock
  SET 
    on_rent_stock = GREATEST(0, on_rent_stock - COALESCE(p_on_rent_decrement, 0)),
    borrowed_stock = GREATEST(0, borrowed_stock - COALESCE(p_borrowed_decrement, 0)),
    updated_at = NOW()
  WHERE size = p_size;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Size % not found in stock table', p_size;
  END IF;
END;
$$;


-- NEW dynamic update_udhar_challan_with_stock
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN 
    SELECT n.nspname || '.' || p.proname || '(' || pg_get_function_identity_arguments(p.oid) || ')' AS prod
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE p.proname = 'update_udhar_challan_with_stock'
  LOOP
    EXECUTE 'DROP FUNCTION IF EXISTS ' || r.prod;
  END LOOP;
END $$;

CREATE OR REPLACE FUNCTION update_udhar_challan_with_stock(
  p_challan_number TEXT,
  p_client_id UUID,
  p_alternative_site TEXT,
  p_secondary_phone_number TEXT,
  p_udhar_date DATE,
  p_driver_name TEXT,
  p_old_items JSONB,
  p_new_items JSONB,
  p_new_main_note TEXT
)
RETURNS JSON AS $$
DECLARE
  v_item JSONB;
BEGIN
  -- Update challan details
  UPDATE udhar_challans
  SET
    client_id = p_client_id,
    alternative_site = p_alternative_site,
    secondary_phone_number = p_secondary_phone_number,
    udhar_date = p_udhar_date,
    driver_name = p_driver_name
  WHERE udhar_challan_number = p_challan_number;

  -- Update items details
  UPDATE udhar_items
  SET
    items = p_new_items,
    main_note = p_new_main_note
  WHERE udhar_challan_number = p_challan_number;

  -- Reverse old stock
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_old_items)
  LOOP
    IF (v_item->>'qty')::INTEGER > 0 OR (v_item->>'borrowed')::INTEGER > 0 THEN
      UPDATE stock
      SET
        on_rent_stock = GREATEST(0, on_rent_stock - COALESCE((v_item->>'qty')::INTEGER, 0)),
        borrowed_stock = GREATEST(0, borrowed_stock - COALESCE((v_item->>'borrowed')::INTEGER, 0))
      WHERE size = (v_item->>'size_id')::INTEGER;
    END IF;
  END LOOP;

  -- Apply new stock
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_new_items)
  LOOP
    IF (v_item->>'qty')::INTEGER > 0 OR (v_item->>'borrowed')::INTEGER > 0 THEN
      UPDATE stock
      SET
        on_rent_stock = on_rent_stock + COALESCE((v_item->>'qty')::INTEGER, 0),
        borrowed_stock = borrowed_stock + COALESCE((v_item->>'borrowed')::INTEGER, 0)
      WHERE size = (v_item->>'size_id')::INTEGER;
    END IF;
  END LOOP;

  RETURN json_build_object('success', true, 'message', 'Udhar challan updated successfully');
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'message', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- NEW dynamic update_jama_challan_with_stock
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN 
    SELECT n.nspname || '.' || p.proname || '(' || pg_get_function_identity_arguments(p.oid) || ')' AS prod
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE p.proname = 'update_jama_challan_with_stock'
  LOOP
    EXECUTE 'DROP FUNCTION IF EXISTS ' || r.prod;
  END LOOP;
END $$;

CREATE OR REPLACE FUNCTION update_jama_challan_with_stock(
  p_challan_number TEXT,
  p_client_id UUID,
  p_alternative_site TEXT,
  p_secondary_phone_number TEXT,
  p_jama_date DATE,
  p_driver_name TEXT,
  p_old_items JSONB,
  p_new_items JSONB,
  p_new_main_note TEXT
)
RETURNS JSON AS $$
DECLARE
  v_item JSONB;
BEGIN
  -- Update challan details
  UPDATE jama_challans
  SET
    client_id = p_client_id,
    alternative_site = p_alternative_site,
    secondary_phone_number = p_secondary_phone_number,
    jama_date = p_jama_date,
    driver_name = p_driver_name
  WHERE jama_challan_number = p_challan_number;

  -- Update items details
  UPDATE jama_items
  SET
    items = p_new_items,
    main_note = p_new_main_note
  WHERE jama_challan_number = p_challan_number;

  -- Reverse old stock (Add back what was returned)
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_old_items)
  LOOP
    IF (v_item->>'qty')::INTEGER > 0 OR (v_item->>'borrowed')::INTEGER > 0 THEN
      UPDATE stock
      SET
        on_rent_stock = on_rent_stock + COALESCE((v_item->>'qty')::INTEGER, 0),
        borrowed_stock = borrowed_stock + COALESCE((v_item->>'borrowed')::INTEGER, 0)
      WHERE size = (v_item->>'size_id')::INTEGER;
    END IF;
  END LOOP;

  -- Apply new stock (Subtract new return values)
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_new_items)
  LOOP
    IF (v_item->>'qty')::INTEGER > 0 OR (v_item->>'borrowed')::INTEGER > 0 THEN
      UPDATE stock
      SET
        on_rent_stock = GREATEST(0, on_rent_stock - COALESCE((v_item->>'qty')::INTEGER, 0)),
        borrowed_stock = GREATEST(0, borrowed_stock - COALESCE((v_item->>'borrowed')::INTEGER, 0))
      WHERE size = (v_item->>'size_id')::INTEGER;
    END IF;
  END LOOP;

  RETURN json_build_object('success', true, 'message', 'Jama challan updated successfully');
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'message', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- NEW delete_udhar_challan_with_stock
DROP FUNCTION IF EXISTS delete_udhar_challan_with_stock(TEXT, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER);

CREATE OR REPLACE FUNCTION delete_udhar_challan_with_stock(
  p_challan_number TEXT,
  p_items JSONB
)
RETURNS JSON AS $$
DECLARE
  v_item JSONB;
BEGIN
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    IF (v_item->>'qty')::INTEGER > 0 OR (v_item->>'borrowed')::INTEGER > 0 THEN
      UPDATE stock
      SET
        on_rent_stock = GREATEST(0, on_rent_stock - COALESCE((v_item->>'qty')::INTEGER, 0)),
        borrowed_stock = GREATEST(0, borrowed_stock - COALESCE((v_item->>'borrowed')::INTEGER, 0))
      WHERE size = (v_item->>'size_id')::INTEGER;
    END IF;
  END LOOP;

  DELETE FROM udhar_challans WHERE udhar_challan_number = p_challan_number;

  RETURN json_build_object('success', true, 'message', 'Udhar challan deleted successfully');
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'message', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- NEW delete_jama_challan_with_stock
DROP FUNCTION IF EXISTS delete_jama_challan_with_stock(TEXT, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER);

CREATE OR REPLACE FUNCTION delete_jama_challan_with_stock(
  p_challan_number TEXT,
  p_items JSONB
)
RETURNS JSON AS $$
DECLARE
  v_item JSONB;
BEGIN
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    IF (v_item->>'qty')::INTEGER > 0 OR (v_item->>'borrowed')::INTEGER > 0 THEN
      UPDATE stock
      SET
        on_rent_stock = on_rent_stock + COALESCE((v_item->>'qty')::INTEGER, 0),
        borrowed_stock = borrowed_stock + COALESCE((v_item->>'borrowed')::INTEGER, 0)
      WHERE size = (v_item->>'size_id')::INTEGER;
    END IF;
  END LOOP;

  DELETE FROM jama_challans WHERE jama_challan_number = p_challan_number;

  RETURN json_build_object('success', true, 'message', 'Jama challan deleted successfully');
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'message', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS for plate_sizes
ALTER TABLE plate_sizes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public select on plate_sizes" ON plate_sizes FOR SELECT USING (true);
CREATE POLICY "Allow public insert on plate_sizes" ON plate_sizes FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on plate_sizes" ON plate_sizes FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on plate_sizes" ON plate_sizes FOR DELETE USING (true);


-- ==========================================
-- MIGRATION: 20260714120000_add_categories.sql
-- ==========================================

-- Add category column to plate_sizes
ALTER TABLE plate_sizes ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'shuttering';

-- Set existing jack items to 'jack' category
UPDATE plate_sizes SET category = 'jack' 
WHERE name ILIKE '%jack%' OR name ILIKE '%જેક%';


-- ==========================================
-- MIGRATION: 20260714130000_add_jack_rents.sql
-- ==========================================

-- Add jack_rents column to clients table
ALTER TABLE clients ADD COLUMN IF NOT EXISTS jack_rents JSONB DEFAULT '{}'::jsonb;


-- ==========================================
-- MIGRATION: 20260717120000_app_settings_and_bill_cron.sql
-- ==========================================

-- App-wide settings shared between devices and server-side jobs.
-- The Settings screen syncs bill-calculation settings here so the monthly
-- bill cron uses the same values as manual billing.
CREATE TABLE IF NOT EXISTS app_settings (
  key text PRIMARY KEY,
  value text NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated manage app_settings" ON app_settings;
CREATE POLICY "Authenticated manage app_settings" ON app_settings
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

INSERT INTO app_settings (key, value)
VALUES ('date_sorting_method', 'standard')
ON CONFLICT (key) DO NOTHING;

-- -----------------------------------------------------------------------------
-- Monthly bill generation cron: 1st of every month, 03:00 UTC (08:30 IST).
-- Calls the generate-monthly-bills edge function via pg_net.
-- -----------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

DO $$
BEGIN
  PERFORM cron.unschedule('generate-monthly-bills');
EXCEPTION WHEN OTHERS THEN
  NULL; -- job did not exist yet
END $$;

SELECT cron.schedule(
  'generate-monthly-bills',
  '0 3 1 * *',
  $$
  SELECT net.http_post(
    url := 'https://bowonoxrnbelxjbwbthe.supabase.co/functions/v1/generate-monthly-bills',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer cronsecretkey'
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 55000
  );
  $$
);


-- ==========================================
-- MIGRATION: 20260717130000_add_bills_status_column.sql
-- ==========================================

-- The live DB was created without the bills.status column that the app code
-- (billOperations.saveBill) and the monthly bill cron expect. Add it:
-- existing bills were manually generated, new rows default to 'draft'
-- (cron-created bills awaiting owner review).
ALTER TABLE bills ADD COLUMN IF NOT EXISTS status varchar(20);

UPDATE bills SET status = 'generated' WHERE status IS NULL;

ALTER TABLE bills ALTER COLUMN status SET DEFAULT 'draft';

DO $$
BEGIN
  ALTER TABLE bills ADD CONSTRAINT bills_status_check
    CHECK (status IN ('draft', 'generated', 'cancelled'));
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;


-- ==========================================
-- MIGRATION: 20260717140000_add_bills_generated_by.sql
-- ==========================================

-- Track how a bill was created:
--   'manual' - by a person (CreateBill page, or the Create All Bills button)
--   'cron'   - by the scheduled monthly bill generation job
ALTER TABLE bills ADD COLUMN IF NOT EXISTS generated_by text DEFAULT 'manual';

UPDATE bills SET generated_by = 'manual' WHERE generated_by IS NULL;


-- ==========================================
-- MIGRATION: 20260717150000_seed_cron_enabled_setting.sql
-- ==========================================

-- On/off switch for the monthly bill generation cron, controlled from the
-- app's Settings screen. The edge function checks it at the start of every
-- cron-triggered run; the manual Create All Bills button ignores it.
INSERT INTO app_settings (key, value)
VALUES ('monthly_bill_cron_enabled', 'true')
ON CONFLICT (key) DO NOTHING;


-- ==========================================
-- MIGRATION: 20260718000000_challan_designs.sql
-- ==========================================

-- Challan export designs.
-- A "design" is a tenant's scanned/printed challan layout (background image) plus
-- a relative-coordinate config describing where each data value is drawn. Stored
-- as data so a new tenant is configured from the UI instead of editing code
-- (previously hard-coded in src/components/ReceiptTemplate.tsx).

CREATE TABLE IF NOT EXISTS challan_designs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  -- Which item category this design is for. Mirrors plate_sizes.category.
  category text NOT NULL DEFAULT 'shuttering'
    CHECK (category IN ('shuttering', 'jack', 'cuplock', 'other')),
  -- Which challan flow it applies to.
  challan_type text NOT NULL DEFAULT 'both'
    CHECK (challan_type IN ('udhar', 'jama', 'both')),
  -- Background image as an inline base64 data URL (nullable while drafting).
  -- Stored in-row on purpose so it goes through PostgREST (same RLS as every
  -- other table) instead of Supabase Storage, whose storage-api can reject
  -- ES256-signed JWTs. Downscaled client-side to keep rows small.
  background_path text,
  -- Natural pixel size of the uploaded background; used to preserve aspect ratio.
  background_width integer NOT NULL DEFAULT 0,
  background_height integer NOT NULL DEFAULT 0,
  -- Relative-coordinate layout (fields + row band). See src/utils/challanDesign/types.ts.
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  -- When multiple designs match a (category, challan_type), the default wins auto-select.
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_challan_designs_category
  ON challan_designs (category, challan_type);

ALTER TABLE challan_designs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated manage challan_designs" ON challan_designs;
CREATE POLICY "Authenticated manage challan_designs" ON challan_designs
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Keep updated_at fresh on every write.
CREATE OR REPLACE FUNCTION set_challan_designs_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_challan_designs_updated_at ON challan_designs;
CREATE TRIGGER trg_challan_designs_updated_at
  BEFORE UPDATE ON challan_designs
  FOR EACH ROW EXECUTE FUNCTION set_challan_designs_updated_at();

-- No Supabase Storage bucket: background images live inline in background_path
-- (see column comment above).


-- ==========================================
-- MIGRATION: 20260719000000_lost_damaged_items.sql
-- ==========================================

-- Lost/Damaged items (ગુમ/નુકસાન) support
-- 1. stock_history gains a 'lost' entry type (signed quantities in items JSONB).
-- 2. adjust_lost_stock RPC: signed delta on stock.lost_stock (positive = mark lost, negative = recover).
-- 3. Jama challan update/delete RPCs become lost-aware: on_rent reverses by qty + lost,
--    lost_stock tracks the lost component. Old payloads without 'lost' behave unchanged (COALESCE -> 0).

-- 1. Allow 'lost' entries in stock_history
ALTER TABLE stock_history DROP CONSTRAINT IF EXISTS stock_history_type_check;
ALTER TABLE stock_history ADD CONSTRAINT stock_history_type_check
  CHECK (type IN ('add', 'remove', 'lost'));

-- 2. Signed lost_stock adjustment.
-- Deliberately a separate function: adding a defaulted 4th param to decrement_stock
-- would create an ambiguous overload for PostgREST.
CREATE OR REPLACE FUNCTION adjust_lost_stock(p_size INTEGER, p_delta INTEGER)
RETURNS void AS $$
BEGIN
  UPDATE stock
  SET lost_stock = GREATEST(0, lost_stock + COALESCE(p_delta, 0)),
      updated_at = NOW()
  WHERE size = p_size;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Size % not found in stock table', p_size;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION adjust_lost_stock(INTEGER, INTEGER) TO anon, authenticated;

-- 3. Update Jama Challan with stock adjustments (lost-aware)
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN 
    SELECT n.nspname || '.' || p.proname || '(' || pg_get_function_identity_arguments(p.oid) || ')' AS prod
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE p.proname = 'update_jama_challan_with_stock'
  LOOP
    EXECUTE 'DROP FUNCTION IF EXISTS ' || r.prod;
  END LOOP;
END $$;


CREATE OR REPLACE FUNCTION update_jama_challan_with_stock(
  p_challan_number TEXT,
  p_client_id UUID,
  p_alternative_site TEXT,
  p_secondary_phone_number TEXT,
  p_jama_date DATE,
  p_driver_name TEXT,
  p_driver_mobile TEXT,
  p_vehicle_number TEXT,
  p_old_items JSONB,
  p_new_items JSONB,
  p_new_main_note TEXT
)
RETURNS JSON AS $$
DECLARE
  v_item JSONB;
  v_qty INTEGER;
  v_borrowed INTEGER;
  v_lost INTEGER;
BEGIN
  -- Update challan details
  UPDATE jama_challans
  SET
    client_id = p_client_id,
    alternative_site = p_alternative_site,
    secondary_phone_number = p_secondary_phone_number,
    jama_date = p_jama_date,
    driver_name = p_driver_name,
    driver_mobile = p_driver_mobile,
    vehicle_number = p_vehicle_number
  WHERE jama_challan_number = p_challan_number;

  -- Update items details
  UPDATE jama_items
  SET
    items = p_new_items,
    main_note = p_new_main_note
  WHERE jama_challan_number = p_challan_number;

  -- Reverse old stock (add back what was returned; un-mark old lost)
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_old_items)
  LOOP
    v_qty := COALESCE((v_item->>'qty')::INTEGER, 0);
    v_borrowed := COALESCE((v_item->>'borrowed')::INTEGER, 0);
    v_lost := COALESCE((v_item->>'lost')::INTEGER, 0);
    IF v_qty > 0 OR v_borrowed > 0 OR v_lost > 0 THEN
      UPDATE stock
      SET
        on_rent_stock = on_rent_stock + v_qty + v_lost,
        borrowed_stock = borrowed_stock + v_borrowed,
        lost_stock = GREATEST(0, lost_stock - v_lost)
      WHERE size = (v_item->>'size_id')::INTEGER;
    END IF;
  END LOOP;

  -- Apply new stock (subtract new return values; mark new lost)
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_new_items)
  LOOP
    v_qty := COALESCE((v_item->>'qty')::INTEGER, 0);
    v_borrowed := COALESCE((v_item->>'borrowed')::INTEGER, 0);
    v_lost := COALESCE((v_item->>'lost')::INTEGER, 0);
    IF v_qty > 0 OR v_borrowed > 0 OR v_lost > 0 THEN
      UPDATE stock
      SET
        on_rent_stock = GREATEST(0, on_rent_stock - v_qty - v_lost),
        borrowed_stock = GREATEST(0, borrowed_stock - v_borrowed),
        lost_stock = lost_stock + v_lost
      WHERE size = (v_item->>'size_id')::INTEGER;
    END IF;
  END LOOP;

  RETURN json_build_object('success', true, 'message', 'Jama challan updated successfully');
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'message', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Delete Jama Challan with stock reversal (lost-aware)
CREATE OR REPLACE FUNCTION delete_jama_challan_with_stock(
  p_challan_number TEXT,
  p_items JSONB
)
RETURNS JSON AS $$
DECLARE
  v_item JSONB;
  v_qty INTEGER;
  v_borrowed INTEGER;
  v_lost INTEGER;
BEGIN
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_qty := COALESCE((v_item->>'qty')::INTEGER, 0);
    v_borrowed := COALESCE((v_item->>'borrowed')::INTEGER, 0);
    v_lost := COALESCE((v_item->>'lost')::INTEGER, 0);
    IF v_qty > 0 OR v_borrowed > 0 OR v_lost > 0 THEN
      UPDATE stock
      SET
        on_rent_stock = on_rent_stock + v_qty + v_lost,
        borrowed_stock = borrowed_stock + v_borrowed,
        lost_stock = GREATEST(0, lost_stock - v_lost)
      WHERE size = (v_item->>'size_id')::INTEGER;
    END IF;
  END LOOP;

  DELETE FROM jama_challans WHERE jama_challan_number = p_challan_number;

  RETURN json_build_object('success', true, 'message', 'Jama challan deleted successfully');
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'message', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION update_jama_challan_with_stock(TEXT, UUID, TEXT, TEXT, DATE, TEXT, TEXT, TEXT, JSONB, JSONB, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION delete_jama_challan_with_stock(TEXT, JSONB) TO anon, authenticated;


-- ==========================================
-- MIGRATION: 20260720000000_split_damaged_stock.sql
-- ==========================================

-- Split lost (ગુમ) and damaged (નુકસાન) into separate buckets.
-- lost = gone permanently; damaged = out of circulation but repairable.
-- Stock math is identical for both: on_rent reverses by qty + lost + damaged,
-- total_stock unchanged, available = total - rent - lost_stock - damaged_stock.
-- Existing combined data stays in lost_stock; jama payloads without 'damaged'
-- behave unchanged (COALESCE -> 0).

-- 1. New stock bucket
ALTER TABLE stock ADD COLUMN IF NOT EXISTS damaged_stock INTEGER NOT NULL DEFAULT 0;

-- 2. Allow 'damaged' entries in stock_history (signed quantities, same as 'lost')
ALTER TABLE stock_history DROP CONSTRAINT IF EXISTS stock_history_type_check;
ALTER TABLE stock_history ADD CONSTRAINT stock_history_type_check
  CHECK (type IN ('add', 'remove', 'lost', 'damaged'));

-- 3. Signed damaged_stock adjustment (mirror of adjust_lost_stock).
-- Positive = mark damaged, negative = repaired/recovered back to available.
CREATE OR REPLACE FUNCTION adjust_damaged_stock(p_size INTEGER, p_delta INTEGER)
RETURNS void AS $$
BEGIN
  UPDATE stock
  SET damaged_stock = GREATEST(0, damaged_stock + COALESCE(p_delta, 0)),
      updated_at = NOW()
  WHERE size = p_size;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Size % not found in stock table', p_size;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION adjust_damaged_stock(INTEGER, INTEGER) TO anon, authenticated;

-- 4. Update Jama Challan with stock adjustments (lost + damaged aware)
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN 
    SELECT n.nspname || '.' || p.proname || '(' || pg_get_function_identity_arguments(p.oid) || ')' AS prod
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE p.proname = 'update_jama_challan_with_stock'
  LOOP
    EXECUTE 'DROP FUNCTION IF EXISTS ' || r.prod;
  END LOOP;
END $$;


CREATE OR REPLACE FUNCTION update_jama_challan_with_stock(
  p_challan_number TEXT,
  p_client_id UUID,
  p_alternative_site TEXT,
  p_secondary_phone_number TEXT,
  p_jama_date DATE,
  p_driver_name TEXT,
  p_driver_mobile TEXT,
  p_vehicle_number TEXT,
  p_old_items JSONB,
  p_new_items JSONB,
  p_new_main_note TEXT
)
RETURNS JSON AS $$
DECLARE
  v_item JSONB;
  v_qty INTEGER;
  v_borrowed INTEGER;
  v_lost INTEGER;
  v_damaged INTEGER;
BEGIN
  -- Update challan details
  UPDATE jama_challans
  SET
    client_id = p_client_id,
    alternative_site = p_alternative_site,
    secondary_phone_number = p_secondary_phone_number,
    jama_date = p_jama_date,
    driver_name = p_driver_name,
    driver_mobile = p_driver_mobile,
    vehicle_number = p_vehicle_number
  WHERE jama_challan_number = p_challan_number;

  -- Update items details
  UPDATE jama_items
  SET
    items = p_new_items,
    main_note = p_new_main_note
  WHERE jama_challan_number = p_challan_number;

  -- Reverse old stock (add back what was returned; un-mark old lost/damaged)
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_old_items)
  LOOP
    v_qty := COALESCE((v_item->>'qty')::INTEGER, 0);
    v_borrowed := COALESCE((v_item->>'borrowed')::INTEGER, 0);
    v_lost := COALESCE((v_item->>'lost')::INTEGER, 0);
    v_damaged := COALESCE((v_item->>'damaged')::INTEGER, 0);
    IF v_qty > 0 OR v_borrowed > 0 OR v_lost > 0 OR v_damaged > 0 THEN
      UPDATE stock
      SET
        on_rent_stock = on_rent_stock + v_qty + v_lost + v_damaged,
        borrowed_stock = borrowed_stock + v_borrowed,
        lost_stock = GREATEST(0, lost_stock - v_lost),
        damaged_stock = GREATEST(0, damaged_stock - v_damaged)
      WHERE size = (v_item->>'size_id')::INTEGER;
    END IF;
  END LOOP;

  -- Apply new stock (subtract new return values; mark new lost/damaged)
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_new_items)
  LOOP
    v_qty := COALESCE((v_item->>'qty')::INTEGER, 0);
    v_borrowed := COALESCE((v_item->>'borrowed')::INTEGER, 0);
    v_lost := COALESCE((v_item->>'lost')::INTEGER, 0);
    v_damaged := COALESCE((v_item->>'damaged')::INTEGER, 0);
    IF v_qty > 0 OR v_borrowed > 0 OR v_lost > 0 OR v_damaged > 0 THEN
      UPDATE stock
      SET
        on_rent_stock = GREATEST(0, on_rent_stock - v_qty - v_lost - v_damaged),
        borrowed_stock = GREATEST(0, borrowed_stock - v_borrowed),
        lost_stock = lost_stock + v_lost,
        damaged_stock = damaged_stock + v_damaged
      WHERE size = (v_item->>'size_id')::INTEGER;
    END IF;
  END LOOP;

  RETURN json_build_object('success', true, 'message', 'Jama challan updated successfully');
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'message', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Delete Jama Challan with stock reversal (lost + damaged aware)
CREATE OR REPLACE FUNCTION delete_jama_challan_with_stock(
  p_challan_number TEXT,
  p_items JSONB
)
RETURNS JSON AS $$
DECLARE
  v_item JSONB;
  v_qty INTEGER;
  v_borrowed INTEGER;
  v_lost INTEGER;
  v_damaged INTEGER;
BEGIN
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_qty := COALESCE((v_item->>'qty')::INTEGER, 0);
    v_borrowed := COALESCE((v_item->>'borrowed')::INTEGER, 0);
    v_lost := COALESCE((v_item->>'lost')::INTEGER, 0);
    v_damaged := COALESCE((v_item->>'damaged')::INTEGER, 0);
    IF v_qty > 0 OR v_borrowed > 0 OR v_lost > 0 OR v_damaged > 0 THEN
      UPDATE stock
      SET
        on_rent_stock = on_rent_stock + v_qty + v_lost + v_damaged,
        borrowed_stock = borrowed_stock + v_borrowed,
        lost_stock = GREATEST(0, lost_stock - v_lost),
        damaged_stock = GREATEST(0, damaged_stock - v_damaged)
      WHERE size = (v_item->>'size_id')::INTEGER;
    END IF;
  END LOOP;

  DELETE FROM jama_challans WHERE jama_challan_number = p_challan_number;

  RETURN json_build_object('success', true, 'message', 'Jama challan deleted successfully');
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'message', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION update_jama_challan_with_stock(TEXT, UUID, TEXT, TEXT, DATE, TEXT, TEXT, TEXT, JSONB, JSONB, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION delete_jama_challan_with_stock(TEXT, JSONB) TO anon, authenticated;


-- ==========================================
-- MIGRATION: 20260721000000_add_previous_pending_amount.sql
-- ==========================================

-- Add previous_pending_amount column to clients table
ALTER TABLE clients ADD COLUMN IF NOT EXISTS previous_pending_amount NUMERIC DEFAULT 0 NOT NULL;


-- ==========================================
-- MIGRATION: 20260722000000_add_category_separation.sql
-- ==========================================

-- Migration to add category column to tables
ALTER TABLE clients ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'shuttering';
ALTER TABLE udhar_challans ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'shuttering';
ALTER TABLE jama_challans ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'shuttering';
ALTER TABLE bills ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'shuttering';

-- Ensure driver_mobile and vehicle_number columns exist
ALTER TABLE udhar_challans ADD COLUMN IF NOT EXISTS driver_mobile TEXT;
ALTER TABLE udhar_challans ADD COLUMN IF NOT EXISTS vehicle_number TEXT;
ALTER TABLE jama_challans ADD COLUMN IF NOT EXISTS driver_mobile TEXT;
ALTER TABLE jama_challans ADD COLUMN IF NOT EXISTS vehicle_number TEXT;

-- Ensure bills table has correct column names expected by the frontend
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'bills') THEN
    -- Rename billdate to billing_date if it exists
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'bills' AND column_name = 'billdate') THEN
      ALTER TABLE bills RENAME COLUMN billdate TO billing_date;
    ELSIF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'bills' AND column_name = 'bill_date') THEN
      ALTER TABLE bills RENAME COLUMN bill_date TO billing_date;
    END IF;

    -- Rename total_rent to total_rent_amount if it exists
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'bills' AND column_name = 'total_rent') THEN
      ALTER TABLE bills RENAME COLUMN total_rent TO total_rent_amount;
    END IF;

    -- Rename extra_costs_total to total_extra_cost if it exists
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'bills' AND column_name = 'extra_costs_total') THEN
      ALTER TABLE bills RENAME COLUMN extra_costs_total TO total_extra_cost;
    END IF;

    -- Rename discounts_total to total_discount if it exists
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'bills' AND column_name = 'discounts_total') THEN
      ALTER TABLE bills RENAME COLUMN discounts_total TO total_discount;
    END IF;

    -- Rename total_paid to total_payment if it exists
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'bills' AND column_name = 'total_paid') THEN
      ALTER TABLE bills RENAME COLUMN total_paid TO total_payment;
    END IF;
  END IF;
END $$;

-- Reload Supabase PostgREST schema cache
NOTIFY pgrst, 'reload schema';


