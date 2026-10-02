-- ====================================================================
-- SMART CAMPUS RESOURCE & LAB MANAGEMENT PLATFORM
-- Complete PostgreSQL / Supabase Schema & Initial Data
-- ====================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ====================================================================
-- SECTION A: CORE CAMPUS, PROFILES & LABS
-- ====================================================================

-- Profiles (Users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'student', -- 'student', 'faculty', 'admin'
  department TEXT NOT NULL DEFAULT 'Computer Science & Engineering',
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Campus Graph: Nodes (Buildings, Labs, Landmarks)
CREATE TABLE IF NOT EXISTS public.campus_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  node_type TEXT NOT NULL, -- 'lab', 'building', 'landmark', 'gate'
  latitude NUMERIC(10, 7),
  longitude NUMERIC(10, 7),
  building TEXT,
  floor INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Campus Graph: Edges (Navigable walkways and pathways)
CREATE TABLE IF NOT EXISTS public.campus_edges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_node UUID NOT NULL REFERENCES public.campus_nodes(id) ON DELETE CASCADE,
  to_node UUID NOT NULL REFERENCES public.campus_nodes(id) ON DELETE CASCADE,
  distance_m NUMERIC(8, 2) NOT NULL,
  weight NUMERIC(8, 2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Laboratories
CREATE TABLE IF NOT EXISTS public.labs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  lab_code TEXT UNIQUE NOT NULL,
  building TEXT NOT NULL,
  node_id UUID REFERENCES public.campus_nodes(id) ON DELETE SET NULL,
  capacity INTEGER NOT NULL DEFAULT 40,
  investment NUMERIC(14, 2) DEFAULT 0.00,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Workstation & Hardware Resources
CREATE TABLE IF NOT EXISTS public.resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lab_id UUID NOT NULL REFERENCES public.labs(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  state TEXT NOT NULL DEFAULT 'AVAILABLE', -- 'AVAILABLE', 'RESERVED', 'ALLOCATED', 'MAINTENANCE'
  version INTEGER NOT NULL DEFAULT 0,
  batch_id UUID,
  serial_no TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ====================================================================
-- SECTION B: TIMETABLE & DAILY SLOTS
-- ====================================================================

-- Real-Time Daily Slots for Lab Timetables
CREATE TABLE IF NOT EXISTS public.daily_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lab_id UUID NOT NULL REFERENCES public.labs(id) ON DELETE CASCADE,
  lab_name TEXT NOT NULL,
  lab_code TEXT NOT NULL,
  building TEXT NOT NULL,
  slot_date DATE NOT NULL,
  time_range TEXT NOT NULL, -- e.g. '09:00 AM - 10:00 AM'
  status TEXT NOT NULL DEFAULT 'available', -- 'available', 'booked', 'maintenance'
  booked_by_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  booked_by_name TEXT,
  booked_by_email TEXT,
  booked_by_role TEXT,
  purpose TEXT,
  capacity INTEGER NOT NULL DEFAULT 40,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Bookings (Authoritative Allocation Records)
CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  lab_id UUID NOT NULL REFERENCES public.labs(id) ON DELETE CASCADE,
  resource_id UUID REFERENCES public.resources(id) ON DELETE SET NULL,
  state TEXT NOT NULL DEFAULT 'REQUESTED', -- 'REQUESTED', 'APPROVED', 'CANCELLED', 'COMPLETED'
  priority INTEGER NOT NULL DEFAULT 2,
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
  idempotency_key TEXT NOT NULL UNIQUE,
  purpose TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Scheduling Policy Decisions (FCFS, SJF, Priority, Round Robin)
CREATE TABLE IF NOT EXISTS public.scheduling_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  request_id TEXT NOT NULL,
  policy TEXT NOT NULL,
  decision TEXT NOT NULL,
  lease_id TEXT,
  metrics JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Navigation Routes
CREATE TABLE IF NOT EXISTS public.routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  origin_node UUID REFERENCES public.campus_nodes(id) ON DELETE SET NULL,
  destination_node UUID REFERENCES public.campus_nodes(id) ON DELETE SET NULL,
  algorithm TEXT NOT NULL DEFAULT 'DIJKSTRA',
  path JSONB NOT NULL,
  cost NUMERIC(8, 2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- System Audit Log
CREATE TABLE IF NOT EXISTS public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  before JSONB,
  after JSONB,
  correlation_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ====================================================================
-- SECTION C: 3NF INVENTORY MANAGEMENT
-- ====================================================================

CREATE TABLE IF NOT EXISTS public.equipment_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS public.suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  gstin TEXT UNIQUE,
  address TEXT
);

CREATE TABLE IF NOT EXISTS public.equipment_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES public.equipment_categories(id) ON DELETE CASCADE,
  brand TEXT,
  model_name TEXT NOT NULL,
  config_key TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS public.purchase_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  acquisition_lab_id UUID NOT NULL REFERENCES public.labs(id) ON DELETE CASCADE,
  model_id UUID NOT NULL REFERENCES public.equipment_models(id) ON DELETE CASCADE,
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
  register_sr_no TEXT NOT NULL,
  purchase_date DATE,
  reference_no TEXT,
  quantity_original INTEGER,
  quantity_current INTEGER,
  unit_rate NUMERIC(14, 2),
  total_cost NUMERIC(16, 2),
  status TEXT,
  source_file TEXT NOT NULL,
  source_page INTEGER NOT NULL,
  source_description TEXT
);

CREATE TABLE IF NOT EXISTS public.asset_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL REFERENCES public.purchase_batches(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  quantity_change INTEGER NOT NULL DEFAULT 0,
  from_lab_id UUID REFERENCES public.labs(id) ON DELETE SET NULL,
  to_lab_id UUID REFERENCES public.labs(id) ON DELETE SET NULL,
  event_date DATE,
  details TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Hardware Spec Tables (3NF Normalization)
CREATE TABLE IF NOT EXISTS public.computer_specs (
  model_id UUID PRIMARY KEY REFERENCES public.equipment_models(id) ON DELETE CASCADE,
  processor TEXT,
  ram_gb INTEGER,
  storage TEXT,
  operating_system TEXT,
  monitor_size_in NUMERIC(5, 2)
);

CREATE TABLE IF NOT EXISTS public.laptop_specs (
  model_id UUID PRIMARY KEY REFERENCES public.equipment_models(id) ON DELETE CASCADE,
  processor TEXT,
  ram_gb INTEGER,
  storage TEXT,
  operating_system TEXT,
  monitor_size_in NUMERIC(5, 2)
);

CREATE TABLE IF NOT EXISTS public.printer_specs (
  model_id UUID PRIMARY KEY REFERENCES public.equipment_models(id) ON DELETE CASCADE,
  functions TEXT,
  print_speed_ppm INTEGER,
  resolution TEXT,
  connectivity TEXT,
  input_tray_sheets INTEGER
);

CREATE TABLE IF NOT EXISTS public.ups_specs (
  model_id UUID PRIMARY KEY REFERENCES public.equipment_models(id) ON DELETE CASCADE,
  capacity_kva NUMERIC(8, 2),
  dc_voltage INTEGER,
  input_voltage_range TEXT,
  output_power_factor NUMERIC(5, 2),
  charger_amp INTEGER,
  battery_spec TEXT
);

CREATE TABLE IF NOT EXISTS public.battery_specs (
  model_id UUID PRIMARY KEY REFERENCES public.equipment_models(id) ON DELETE CASCADE,
  voltage_v INTEGER,
  capacity_ah INTEGER,
  battery_type TEXT
);

CREATE TABLE IF NOT EXISTS public.projector_specs (
  model_id UUID PRIMARY KEY REFERENCES public.equipment_models(id) ON DELETE CASCADE,
  technology TEXT,
  brightness_lumens INTEGER
);

CREATE TABLE IF NOT EXISTS public.interactive_panel_specs (
  model_id UUID PRIMARY KEY REFERENCES public.equipment_models(id) ON DELETE CASCADE,
  screen_size_in NUMERIC(5, 2),
  resolution TEXT,
  android_version TEXT,
  ram_gb INTEGER,
  storage TEXT,
  touch_points INTEGER,
  touch_accuracy_mm NUMERIC(5, 2),
  type_c_power_w INTEGER
);

-- ====================================================================
-- SECTION D: SEED INITIAL CAMPUS DATA
-- ====================================================================

-- 1. Equipment Categories
INSERT INTO public.equipment_categories (id, name) VALUES
  ('a1111111-1111-1111-1111-111111111111', 'Desktop Computer'),
  ('a2222222-2222-2222-2222-222222222222', 'Laptop'),
  ('a3333333-3333-3333-3333-333333333333', 'Printer'),
  ('a4444444-4444-4444-4444-444444444444', 'UPS Power System'),
  ('a5555555-5555-5555-5555-555555555555', 'Projector & Display')
ON CONFLICT (name) DO NOTHING;

-- 2. Campus Nodes
INSERT INTO public.campus_nodes (id, name, node_type, building, floor) VALUES
  ('b1111111-1111-1111-1111-111111111111', 'Main Academic Complex', 'building', 'Academic Block A', 1),
  ('b2222222-2222-2222-2222-222222222222', 'Computing & AI Center', 'building', 'IT Complex B', 2),
  ('b3333333-3333-3333-3333-333333333333', 'Advanced Robotics Wing', 'building', 'Innovation Tower', 3)
ON CONFLICT (id) DO NOTHING;

-- 3. Core Laboratories
INSERT INTO public.labs (id, name, lab_code, building, node_id, capacity, investment) VALUES
  ('c1111111-1111-1111-1111-111111111111', 'Advanced Software Engineering Lab', 'CS-LAB-01', 'Academic Block A', 'b1111111-1111-1111-1111-111111111111', 45, 1250000.00),
  ('c2222222-2222-2222-2222-222222222222', 'AI & Machine Learning Center', 'CS-LAB-02', 'IT Complex B', 'b2222222-2222-2222-2222-222222222222', 40, 2400000.00),
  ('c3333333-3333-3333-3333-333333333333', 'Cloud Computing & Networks Lab', 'CS-LAB-03', 'IT Complex B', 'b2222222-2222-2222-2222-222222222222', 50, 1800000.00),
  ('c4444444-4444-4444-4444-444444444444', 'Cybersecurity & Systems Research Lab', 'CS-LAB-04', 'Academic Block A', 'b1111111-1111-1111-1111-111111111111', 35, 1500000.00),
  ('c5555555-5555-5555-5555-555555555555', 'Database Systems & Big Data Lab', 'CS-LAB-05', 'Academic Block A', 'b1111111-1111-1111-1111-111111111111', 40, 1100000.00),
  ('c6666666-6666-6666-6666-666666666666', 'IoT & Embedded Systems Lab', 'EC-LAB-01', 'Innovation Tower', 'b3333333-3333-3333-3333-333333333333', 30, 950000.00),
  ('c7777777-7777-7777-7777-777777777777', 'Robotics & Automation Arena', 'ME-LAB-01', 'Innovation Tower', 'b3333333-3333-3333-3333-333333333333', 25, 3200000.00)
ON CONFLICT (id) DO NOTHING;

-- 4. Initial Daily Timing Slots (Today)
INSERT INTO public.daily_slots (lab_id, lab_name, lab_code, building, slot_date, time_range, status, capacity) VALUES
  ('c1111111-1111-1111-1111-111111111111', 'Advanced Software Engineering Lab', 'CS-LAB-01', 'Academic Block A', CURRENT_DATE, '09:00 AM - 10:00 AM', 'available', 45),
  ('c1111111-1111-1111-1111-111111111111', 'Advanced Software Engineering Lab', 'CS-LAB-01', 'Academic Block A', CURRENT_DATE, '10:00 AM - 11:00 AM', 'available', 45),
  ('c1111111-1111-1111-1111-111111111111', 'Advanced Software Engineering Lab', 'CS-LAB-01', 'Academic Block A', CURRENT_DATE, '11:15 AM - 12:15 PM', 'available', 45),
  ('c1111111-1111-1111-1111-111111111111', 'Advanced Software Engineering Lab', 'CS-LAB-01', 'Academic Block A', CURRENT_DATE, '01:00 PM - 02:00 PM', 'available', 45),
  ('c1111111-1111-1111-1111-111111111111', 'Advanced Software Engineering Lab', 'CS-LAB-01', 'Academic Block A', CURRENT_DATE, '02:00 PM - 03:00 PM', 'available', 45),
  ('c1111111-1111-1111-1111-111111111111', 'Advanced Software Engineering Lab', 'CS-LAB-01', 'Academic Block A', CURRENT_DATE, '03:15 PM - 04:15 PM', 'available', 45),
  ('c1111111-1111-1111-1111-111111111111', 'Advanced Software Engineering Lab', 'CS-LAB-01', 'Academic Block A', CURRENT_DATE, '04:15 PM - 05:15 PM', 'available', 45),

  ('c2222222-2222-2222-2222-222222222222', 'AI & Machine Learning Center', 'CS-LAB-02', 'IT Complex B', CURRENT_DATE, '09:00 AM - 10:00 AM', 'available', 40),
  ('c2222222-2222-2222-2222-222222222222', 'AI & Machine Learning Center', 'CS-LAB-02', 'IT Complex B', CURRENT_DATE, '10:00 AM - 11:00 AM', 'available', 40),
  ('c2222222-2222-2222-2222-222222222222', 'AI & Machine Learning Center', 'CS-LAB-02', 'IT Complex B', CURRENT_DATE, '11:15 AM - 12:15 PM', 'available', 40),
  ('c2222222-2222-2222-2222-222222222222', 'AI & Machine Learning Center', 'CS-LAB-02', 'IT Complex B', CURRENT_DATE, '01:00 PM - 02:00 PM', 'available', 40),
  ('c2222222-2222-2222-2222-222222222222', 'AI & Machine Learning Center', 'CS-LAB-02', 'IT Complex B', CURRENT_DATE, '02:00 PM - 03:00 PM', 'available', 40),
  ('c2222222-2222-2222-2222-222222222222', 'AI & Machine Learning Center', 'CS-LAB-02', 'IT Complex B', CURRENT_DATE, '03:15 PM - 04:15 PM', 'available', 40),

  ('c3333333-3333-3333-3333-333333333333', 'Cloud Computing & Networks Lab', 'CS-LAB-03', 'IT Complex B', CURRENT_DATE, '09:00 AM - 10:00 AM', 'available', 50),
  ('c3333333-3333-3333-3333-333333333333', 'Cloud Computing & Networks Lab', 'CS-LAB-03', 'IT Complex B', CURRENT_DATE, '10:00 AM - 11:00 AM', 'available', 50),
  ('c3333333-3333-3333-3333-333333333333', 'Cloud Computing & Networks Lab', 'CS-LAB-03', 'IT Complex B', CURRENT_DATE, '11:15 AM - 12:15 PM', 'available', 50),
  ('c3333333-3333-3333-3333-333333333333', 'Cloud Computing & Networks Lab', 'CS-LAB-03', 'IT Complex B', CURRENT_DATE, '01:00 PM - 02:00 PM', 'available', 50),
  ('c3333333-3333-3333-3333-333333333333', 'Cloud Computing & Networks Lab', 'CS-LAB-03', 'IT Complex B', CURRENT_DATE, '02:00 PM - 03:00 PM', 'available', 50),
  ('c3333333-3333-3333-3333-333333333333', 'Cloud Computing & Networks Lab', 'CS-LAB-03', 'IT Complex B', CURRENT_DATE, '03:15 PM - 04:15 PM', 'available', 50)
ON CONFLICT DO NOTHING;
