-- Employee-facing notification centre: celebrations, wishes and announcements.
-- All dates are evaluated in India Standard Time so the daily greeting is correct
-- for the Salem Steel Plant rather than the database server's UTC date.

CREATE TABLE IF NOT EXISTS public.announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL CHECK (char_length(title) BETWEEN 3 AND 200),
  body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 10000),
  image_path text,
  is_published boolean NOT NULL DEFAULT false,
  published_at timestamptz,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL CHECK (kind IN ('birthday', 'anniversary', 'announcement')),
  title text NOT NULL,
  body text NOT NULL,
  image_path text,
  subject_employee_id uuid REFERENCES public.employees(id) ON DELETE SET NULL,
  announcement_id uuid REFERENCES public.announcements(id) ON DELETE CASCADE,
  notice_date date NOT NULL DEFAULT current_date,
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
  sender_name text NOT NULL CHECK (char_length(sender_name) BETWEEN 2 AND 120),
  message text NOT NULL CHECK (char_length(message) BETWEEN 1 AND 280),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS announcements_published_created_idx
  ON public.announcements (is_published, published_at DESC);
CREATE INDEX IF NOT EXISTS notifications_created_idx
  ON public.notifications (created_at DESC);
CREATE INDEX IF NOT EXISTS notification_reads_user_idx
  ON public.notification_reads (user_id, notification_id);
CREATE INDEX IF NOT EXISTS notification_wishes_notification_idx
  ON public.notification_wishes (notification_id, created_at ASC);

-- One birthday / anniversary message per person per day, even if the job is run twice.
CREATE UNIQUE INDEX IF NOT EXISTS notifications_celebration_once_idx
  ON public.notifications (kind, subject_employee_id, notice_date)
  WHERE kind IN ('birthday', 'anniversary');
-- Postgres permits many NULL values in a unique index, so this only limits announcements.
CREATE UNIQUE INDEX IF NOT EXISTS notifications_announcement_once_idx
  ON public.notifications (announcement_id);

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_reads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_wishes ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'announcements' AND policyname = 'Employees read published announcements') THEN
    CREATE POLICY "Employees read published announcements" ON public.announcements
      FOR SELECT TO authenticated USING (is_published = true OR public.has_role(auth.uid(), 'admin'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'announcements' AND policyname = 'Admins manage announcements') THEN
    CREATE POLICY "Admins manage announcements" ON public.announcements
      FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'notifications' AND policyname = 'Employees read notifications') THEN
    CREATE POLICY "Employees read notifications" ON public.notifications
      FOR SELECT TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'notifications' AND policyname = 'Admins manage notifications') THEN
    CREATE POLICY "Admins manage notifications" ON public.notifications
      FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'notification_reads' AND policyname = 'Employees manage their notification reads') THEN
    CREATE POLICY "Employees manage their notification reads" ON public.notification_reads
      FOR ALL TO authenticated
      USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'notification_wishes' AND policyname = 'Employees read wishes') THEN
    CREATE POLICY "Employees read wishes" ON public.notification_wishes
      FOR SELECT TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'notification_wishes' AND policyname = 'Employees add their own wishes') THEN
    CREATE POLICY "Employees add their own wishes" ON public.notification_wishes
      FOR INSERT TO authenticated WITH CHECK (sender_user_id = auth.uid());
  END IF;
END
$$;

GRANT SELECT ON public.announcements, public.notifications, public.notification_reads, public.notification_wishes TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.notification_reads TO authenticated;
GRANT INSERT ON public.notification_wishes TO authenticated;

DROP TRIGGER IF EXISTS set_announcements_updated_at ON public.announcements;
CREATE TRIGGER set_announcements_updated_at
  BEFORE UPDATE ON public.announcements
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.generate_daily_celebration_notifications()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  today_ist date := (now() AT TIME ZONE 'Asia/Kolkata')::date;
  employee_row record;
  inserted_count integer;
  birthdays integer := 0;
  anniversaries integer := 0;
  service_years integer;
BEGIN
  FOR employee_row IN
    SELECT id, full_name, date_of_birth, date_of_joining
    FROM public.employees
    WHERE is_active = true
  LOOP
    IF employee_row.date_of_birth IS NOT NULL
       AND to_char(employee_row.date_of_birth, 'MM-DD') = to_char(today_ist, 'MM-DD') THEN
      INSERT INTO public.notifications (kind, title, body, subject_employee_id, notice_date)
      VALUES (
        'birthday',
        'Happy Birthday, ' || employee_row.full_name || '!',
        'Join your SAIL Salem Steel Plant colleagues in sending birthday wishes.',
        employee_row.id,
        today_ist
      )
      ON CONFLICT (kind, subject_employee_id, notice_date)
        WHERE kind IN ('birthday', 'anniversary') DO NOTHING;
      GET DIAGNOSTICS inserted_count = ROW_COUNT;
      birthdays := birthdays + inserted_count;
    END IF;

    IF employee_row.date_of_joining IS NOT NULL
       AND to_char(employee_row.date_of_joining, 'MM-DD') = to_char(today_ist, 'MM-DD') THEN
      service_years := EXTRACT(YEAR FROM age(today_ist, employee_row.date_of_joining));
      IF service_years > 0 THEN
        INSERT INTO public.notifications (kind, title, body, subject_employee_id, notice_date)
        VALUES (
          'anniversary',
          'Work Anniversary: ' || employee_row.full_name,
          'Celebrating ' || service_years || ' year' || CASE WHEN service_years = 1 THEN '' ELSE 's' END || ' with SAIL Salem Steel Plant. Send your wishes!',
          employee_row.id,
          today_ist
        )
        ON CONFLICT (kind, subject_employee_id, notice_date)
          WHERE kind IN ('birthday', 'anniversary') DO NOTHING;
        GET DIAGNOSTICS inserted_count = ROW_COUNT;
        anniversaries := anniversaries + inserted_count;
      END IF;
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'date', today_ist,
    'birthdays', birthdays,
    'anniversaries', anniversaries,
    'count', birthdays + anniversaries
  );
END;
$$;

REVOKE ALL ON FUNCTION public.generate_daily_celebration_notifications() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.generate_daily_celebration_notifications() TO service_role;

-- The original migration pointed at an obsolete external Lovable endpoint.
-- Run directly in Postgres each day at 09:00 India time (03:30 UTC).
CREATE EXTENSION IF NOT EXISTS pg_cron;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'daily-celebrations') THEN
    PERFORM cron.unschedule('daily-celebrations');
  END IF;
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'daily-celebration-notifications') THEN
    PERFORM cron.unschedule('daily-celebration-notifications');
  END IF;
END
$$;
SELECT cron.schedule(
  'daily-celebration-notifications',
  '30 3 * * *',
  $$SELECT public.generate_daily_celebration_notifications();$$
);

-- Create any notifications due today when the migration is applied.
SELECT public.generate_daily_celebration_notifications();

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'announcement-images',
  'announcement-images',
  false,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
SET public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;
