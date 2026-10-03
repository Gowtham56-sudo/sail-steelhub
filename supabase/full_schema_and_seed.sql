-- ==============================================================================
-- SAIL Salem Steel Plant - Complete Unified Database Schema & Seed Script
-- Run this in your Supabase Dashboard SQL Editor (https://supabase.com/dashboard)
-- ==============================================================================

-- 1. EXTENSIONS & ENUMS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'employee');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. HELPER FUNCTIONS
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- 3. EMPLOYEES TABLE
CREATE TABLE IF NOT EXISTS public.employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_number text NOT NULL UNIQUE,
  full_name text NOT NULL,
  designation text,
  grade text,
  department text,
  date_of_birth date,
  date_of_joining date,
  date_of_joining_ssp date,
  work_email text,
  phone text,
  photo_url text,
  is_admin boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  auth_user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
  activated_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 4. USER ROLES TABLE
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- 5. AUDIT LOGS
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id uuid,
  employee_number text,
  action text NOT NULL,
  entity text,
  entity_id text,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 6. LEARNING MODULES & QUIZZES
CREATE TABLE IF NOT EXISTS public.learning_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  summary text,
  category text,
  video_url text,
  video_path text,
  publish_date date NOT NULL DEFAULT CURRENT_DATE,
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.quiz_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id uuid NOT NULL REFERENCES public.learning_modules(id) ON DELETE CASCADE,
  order_index integer NOT NULL,
  question text NOT NULL,
  options jsonb NOT NULL,
  correct_index integer NOT NULL,
  explanation text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (module_id, order_index)
);

CREATE TABLE IF NOT EXISTS public.quiz_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_id uuid NOT NULL REFERENCES public.learning_modules(id) ON DELETE CASCADE,
  score integer NOT NULL,
  total integer NOT NULL,
  answers jsonb NOT NULL DEFAULT '[]'::jsonb,
  completed_at timestamptz NOT NULL DEFAULT now()
);

-- 7. CIRCULARS & FORMS
CREATE TABLE IF NOT EXISTS public.circulars (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  circular_number text NOT NULL,
  title text NOT NULL,
  summary text,
  body text,
  category text NOT NULL DEFAULT 'General',
  department text,
  issued_date date NOT NULL DEFAULT CURRENT_DATE,
  file_url text,
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.forms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'General',
  department text,
  file_url text NOT NULL,
  file_name text,
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 8. EVENTS & PHOTO GALLERY
CREATE TABLE IF NOT EXISTS public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  category text,
  location text,
  event_date date NOT NULL DEFAULT CURRENT_DATE,
  cover_image_url text,
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.event_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  caption text,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 9. ANNOUNCEMENTS & SOCIAL NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public.announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  category text NOT NULL DEFAULT 'General',
  priority text NOT NULL DEFAULT 'normal',
  status text NOT NULL DEFAULT 'published',
  target_audience text NOT NULL DEFAULT 'all',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  published_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  kind text NOT NULL DEFAULT 'announcement',
  title text NOT NULL,
  message text,
  body text,
  notice_date date NOT NULL DEFAULT current_date,
  is_read boolean NOT NULL DEFAULT false,
  announcement_id uuid REFERENCES public.announcements(id) ON DELETE CASCADE,
  subject_employee_id uuid REFERENCES public.employees(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.notification_reads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id uuid NOT NULL REFERENCES public.notifications(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  read_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (notification_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.notification_wishes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id uuid NOT NULL REFERENCES public.notifications(id) ON DELETE CASCADE,
  sender_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_name text NOT NULL,
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 10. ENABLE ROW LEVEL SECURITY & GRANT PERMISSIONS
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.circulars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated, service_role;

-- Policies
DROP POLICY IF EXISTS "Public and employees read employees" ON public.employees;
CREATE POLICY "Public and employees read employees" ON public.employees FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins full employees" ON public.employees;
CREATE POLICY "Admins full employees" ON public.employees FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Users view own roles" ON public.user_roles;
CREATE POLICY "Users view own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Employees read modules" ON public.learning_modules;
CREATE POLICY "Employees read modules" ON public.learning_modules FOR SELECT USING (is_published = true);

DROP POLICY IF EXISTS "Employees read questions" ON public.quiz_questions;
CREATE POLICY "Employees read questions" ON public.quiz_questions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Employees manage own attempts" ON public.quiz_attempts;
CREATE POLICY "Employees manage own attempts" ON public.quiz_attempts FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Employees read circulars" ON public.circulars;
CREATE POLICY "Employees read circulars" ON public.circulars FOR SELECT USING (is_published = true);

DROP POLICY IF EXISTS "Employees read forms" ON public.forms;
CREATE POLICY "Employees read forms" ON public.forms FOR SELECT USING (is_published = true);

DROP POLICY IF EXISTS "Employees read events" ON public.events;
CREATE POLICY "Employees read events" ON public.events FOR SELECT USING (is_published = true);

DROP POLICY IF EXISTS "Employees read event photos" ON public.event_photos;
CREATE POLICY "Employees read event photos" ON public.event_photos FOR SELECT USING (true);

DROP POLICY IF EXISTS "Employees read announcements" ON public.announcements;
CREATE POLICY "Employees read announcements" ON public.announcements FOR SELECT USING (status = 'published');

DROP POLICY IF EXISTS "Employees read own notifications" ON public.notifications;
CREATE POLICY "Employees read own notifications" ON public.notifications FOR ALL USING (true);

-- 11. SEED DATA: EMPLOYEES ROSTER
INSERT INTO public.employees (employee_number, full_name, designation, grade, department, date_of_birth, date_of_joining, date_of_joining_ssp, work_email, phone, is_admin, is_active)
VALUES
  ('SSP10001', 'Ramesh Kumar', 'Deputy General Manager', 'E-6', 'Human Resources', '1968-08-14', '1992-06-01', '1995-04-12', 'ramesh.kumar@sailssp.in', '+91 90000 10001', true, true),
  ('SSP10234', 'Lakshmi Narayanan', 'Senior Operator', 'S-4', 'Cold Rolling Mill', '1970-03-22', '1995-09-15', '1995-09-15', 'lakshmi.n@sailssp.in', '+91 90000 10234', false, true),
  ('SSP10456', 'Anitha Selvam', 'Shift Engineer', 'E-2', 'Steel Melting Shop', '1985-11-05', '2010-07-19', '2010-07-19', 'anitha.s@sailssp.in', '+91 90000 10456', false, true),
  ('SSP10789', 'Mohan Raj', 'Safety Officer', 'E-3', 'Safety & Fire Services', '1975-01-30', '2001-02-12', '2001-02-12', 'mohan.raj@sailssp.in', '+91 90000 10789', false, true),
  ('SSP11002', 'Suresh Babu', 'Maintenance Technician', 'S-3', 'Mechanical Maintenance', '1966-06-08', '1990-04-03', '1990-04-03', 'suresh.babu@sailssp.in', '+91 90000 11002', false, true),
  ('SSP11345', 'Priya Dharshini', 'Assistant Manager', 'E-1', 'Quality Assurance', '1990-12-18', '2015-08-24', '2015-08-24', 'priya.d@sailssp.in', '+91 90000 11345', false, true)
ON CONFLICT (employee_number) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  designation = EXCLUDED.designation,
  department = EXCLUDED.department,
  date_of_birth = EXCLUDED.date_of_birth,
  is_admin = EXCLUDED.is_admin;

-- 12. SEED DATA: LEARNING MODULES & QUIZZES
INSERT INTO public.learning_modules (id, title, summary, category, video_url, publish_date, is_published)
VALUES
  ('11111111-1111-4111-8111-111111111111', 'Personal Protective Equipment (PPE) Essentials', 'Correct selection, inspection and use of PPE inside the Salem Steel Plant shop floors.', 'Safety', 'https://www.youtube.com/embed/aBpvHIqW1LM', CURRENT_DATE, true),
  ('22222222-2222-4222-8222-222222222222', 'Stainless Steel Cold Rolling Basics', 'How the Cold Rolling Mill converts hot band into bright annealed stainless steel coils.', 'Process', 'https://www.youtube.com/embed/1yFVjlZ3nJc', CURRENT_DATE - 1, true),
  ('33333333-3333-4333-8333-333333333333', 'Fire Safety and Emergency Response', 'Fire classes, extinguisher selection and plant emergency assembly procedure.', 'Safety', 'https://www.youtube.com/embed/Xgc90CoJbDI', CURRENT_DATE - 2, true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.quiz_questions (module_id, order_index, question, options, correct_index, explanation) VALUES
  ('11111111-1111-4111-8111-111111111111', 1, 'What does PPE stand for?', '["Personal Protective Equipment","Plant Production Efficiency","Primary Process Engineering","Public Protection Enforcement"]'::jsonb, 0, 'PPE means Personal Protective Equipment.'),
  ('11111111-1111-4111-8111-111111111111', 2, 'Which PPE protects against flying metal chips?', '["Cotton gloves","Safety goggles","Ear plugs","Reflective vest"]'::jsonb, 1, 'Safety goggles shield the eyes from chips and sparks.'),
  ('11111111-1111-4111-8111-111111111111', 3, 'When must PPE be inspected?', '["Once a year","Before every use","Only after an accident","Never"]'::jsonb, 1, 'PPE must be inspected before each use.'),
  ('11111111-1111-4111-8111-111111111111', 4, 'Safety helmets protect mainly against:', '["Noise","Falling objects","Chemical splash","Heat radiation"]'::jsonb, 1, 'Helmets guard the head from falling objects and impact.'),
  ('11111111-1111-4111-8111-111111111111', 5, 'Which PPE is required in high-noise areas?', '["Face shield","Ear protection","Apron","Gum boots"]'::jsonb, 1, 'Ear plugs or muffs are mandatory above 85 dB.'),
  ('22222222-2222-4222-8222-222222222222', 1, 'Cold rolling is carried out at:', '["Above recrystallisation temperature","Below recrystallisation temperature","Melting temperature","Annealing temperature"]'::jsonb, 1, 'Cold rolling happens below recrystallisation temperature.'),
  ('22222222-2222-4222-8222-222222222222', 2, 'Salem Steel Plant is best known for producing:', '["Rails","Stainless steel coils & sheets","Wire rods","Pig iron"]'::jsonb, 1, 'SSP is India''s pioneer in world-class stainless steel.'),
  ('33333333-3333-4333-8333-333333333333', 1, 'For an electrical fire in a motor panel, you must use:', '["Water jet","CO2 extinguisher","Foam extinguisher","Wet towel"]'::jsonb, 1, 'CO2 is non-conductive and safe for live electrical fires.')
ON CONFLICT (module_id, order_index) DO NOTHING;

-- 13. SEED DATA: CIRCULARS & FORMS
INSERT INTO public.circulars (circular_number, title, summary, category, department, issued_date, is_published)
VALUES
  ('SSP/HR/2026/014', 'Annual Health Check-up Schedule for Shop Floor Personnel', 'Mandatory occupational health screening for all employees in CRM and SMS departments starting next Monday.', 'Medical', 'Human Resources', CURRENT_DATE - 3, true),
  ('SSP/SAF/2026/008', 'Mandatory Safety Helmet and Steel Toe Shoes Compliance', 'Strict zero-tolerance policy across all operational bays effective immediately.', 'Safety', 'Safety & Fire Services', CURRENT_DATE - 7, true),
  ('SSP/ADM/2026/021', 'Holiday Notice - Tamil New Year and Plant Maintenance Shutdown', 'Operational schedule details for the upcoming holiday and planned roll change.', 'General', 'Administration', CURRENT_DATE - 12, true)
ON CONFLICT DO NOTHING;

INSERT INTO public.forms (title, description, category, department, file_url, file_name, is_published)
VALUES
  ('Medical Reimbursement Claim Form', 'Standard claim application for out-patient and in-patient medical expenses.', 'Medical', 'Human Resources', 'https://raw.githubusercontent.com/Gowtham56-sudo/sail-steelhub/main/public/robots.txt', 'medical_claim_form.pdf', true),
  ('Annual Leave Application Form', 'Earned leave, casual leave and half-pay leave application slip.', 'HR', 'Human Resources', 'https://raw.githubusercontent.com/Gowtham56-sudo/sail-steelhub/main/public/robots.txt', 'leave_application_form.pdf', true),
  ('Personal Protective Equipment (PPE) Requisition', 'Replacement and issue slip for safety boots, helmets, and protective gloves.', 'Safety', 'Safety & Fire Services', 'https://raw.githubusercontent.com/Gowtham56-sudo/sail-steelhub/main/public/robots.txt', 'ppe_requisition_form.pdf', true)
ON CONFLICT DO NOTHING;
