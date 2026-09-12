-- Catch-up schema for the Supabase project used by this app.
-- It is deliberately idempotent so it can be run safely in the Supabase SQL Editor.

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

ALTER TABLE public.learning_modules ADD COLUMN IF NOT EXISTS video_path text;

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

GRANT SELECT, INSERT, UPDATE, DELETE ON public.events, public.event_photos, public.circulars, public.forms TO authenticated;
GRANT SELECT ON public.learning_modules TO authenticated;
GRANT SELECT, INSERT ON public.quiz_attempts TO authenticated;
GRANT ALL ON public.events, public.event_photos, public.circulars, public.forms, public.learning_modules, public.quiz_questions, public.quiz_attempts TO service_role;

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.circulars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'events' AND policyname = 'Employees read published events') THEN
    CREATE POLICY "Employees read published events" ON public.events FOR SELECT TO authenticated USING (is_published = true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'events' AND policyname = 'Admins manage events') THEN
    CREATE POLICY "Admins manage events" ON public.events FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'event_photos' AND policyname = 'Employees read photos of published events') THEN
    CREATE POLICY "Employees read photos of published events" ON public.event_photos FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_id AND e.is_published = true));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'event_photos' AND policyname = 'Admins manage event photos') THEN
    CREATE POLICY "Admins manage event photos" ON public.event_photos FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'circulars' AND policyname = 'Employees read published circulars') THEN
    CREATE POLICY "Employees read published circulars" ON public.circulars FOR SELECT TO authenticated USING (is_published = true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'circulars' AND policyname = 'Admins manage circulars') THEN
    CREATE POLICY "Admins manage circulars" ON public.circulars FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'forms' AND policyname = 'Employees read published forms') THEN
    CREATE POLICY "Employees read published forms" ON public.forms FOR SELECT TO authenticated USING (is_published = true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'forms' AND policyname = 'Admins manage forms') THEN
    CREATE POLICY "Admins manage forms" ON public.forms FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'learning_modules' AND policyname = 'Employees read published modules') THEN
    CREATE POLICY "Employees read published modules" ON public.learning_modules FOR SELECT TO authenticated USING (is_published = true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'learning_modules' AND policyname = 'Admins manage modules') THEN
    CREATE POLICY "Admins manage modules" ON public.learning_modules FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'quiz_questions' AND policyname = 'Admins manage questions') THEN
    CREATE POLICY "Admins manage questions" ON public.quiz_questions FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'quiz_attempts' AND policyname = 'Employees read own attempts') THEN
    CREATE POLICY "Employees read own attempts" ON public.quiz_attempts FOR SELECT TO authenticated USING (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'quiz_attempts' AND policyname = 'Admins read all attempts') THEN
    CREATE POLICY "Admins read all attempts" ON public.quiz_attempts FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'quiz_attempts' AND policyname = 'Employees insert own attempts') THEN
    CREATE POLICY "Employees insert own attempts" ON public.quiz_attempts FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS circulars_issued_date_idx ON public.circulars (issued_date DESC);
CREATE INDEX IF NOT EXISTS quiz_attempts_user_idx ON public.quiz_attempts (user_id, completed_at DESC);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'events_updated_at' AND tgrelid = 'public.events'::regclass) THEN
    EXECUTE 'CREATE TRIGGER events_updated_at BEFORE UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column()';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'circulars_updated_at' AND tgrelid = 'public.circulars'::regclass) THEN
    EXECUTE 'CREATE TRIGGER circulars_updated_at BEFORE UPDATE ON public.circulars FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column()';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'forms_updated_at' AND tgrelid = 'public.forms'::regclass) THEN
    EXECUTE 'CREATE TRIGGER forms_updated_at BEFORE UPDATE ON public.forms FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column()';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'learning_modules_updated_at' AND tgrelid = 'public.learning_modules'::regclass) THEN
    EXECUTE 'CREATE TRIGGER learning_modules_updated_at BEFORE UPDATE ON public.learning_modules FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column()';
  END IF;
END $$;

INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES
  ('forms', 'forms', false, 10485760),
  ('circular-files', 'circular-files', false, 10485760),
  ('event-media', 'event-media', true, 6291456),
  ('learning-videos', 'learning-videos', false, 52428800)
ON CONFLICT (id) DO UPDATE
SET public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit;
