/*
# Create Announcements and Notifications Tables

## Purpose
Enables administrators to publish company announcements that automatically generate
per-user notifications for all active employees. Employees see a notification bell
with an unread count, can view announcement details, and mark notifications as read.

## 1. New Tables

### announcements
- id (uuid PK)
- title (text, not null)
- content (text, not null)
- category (text, default 'General')
- priority (text, not null, default 'normal') — normal|important|urgent
- status (text, not null, default 'published') — draft|published
- target_audience (text, default 'all') — reserved for future targeting
- created_by (uuid, nullable)
- created_at (timestamptz, default now())
- updated_at (timestamptz, default now())
- published_at (timestamptz, nullable)

### notifications
- id (uuid PK)
- user_id (uuid, not null)
- announcement_id (uuid, FK ON DELETE CASCADE)
- title (text, not null)
- message (text, not null)
- type (text, not null, default 'announcement')
- priority (text, not null, default 'normal')
- is_read (boolean, not null, default false)
- created_at (timestamptz, default now())

## 2. Security (RLS)
- announcements: employees read published; admins full CRUD
- notifications: users read/update own only; admins insert/delete

## 3. Notes
- Notifications created server-side via service-role client on publish.
- ON DELETE CASCADE removes notifications when announcement deleted.
- target_audience supports future targeting without schema changes.
*/

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
  published_at timestamptz
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.announcements TO authenticated;
GRANT ALL ON public.announcements TO service_role;

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Employees read published announcements" ON public.announcements;
CREATE POLICY "Employees read published announcements"
  ON public.announcements FOR SELECT TO authenticated
  USING (status = 'published');

DROP POLICY IF EXISTS "Admins read all announcements" ON public.announcements;
CREATE POLICY "Admins read all announcements"
  ON public.announcements FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins insert announcements" ON public.announcements;
CREATE POLICY "Admins insert announcements"
  ON public.announcements FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins update announcements" ON public.announcements;
CREATE POLICY "Admins update announcements"
  ON public.announcements FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins delete announcements" ON public.announcements;
CREATE POLICY "Admins delete announcements"
  ON public.announcements FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS announcements_status_created_at_idx
  ON public.announcements (status, created_at DESC);

CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  announcement_id uuid REFERENCES public.announcements(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL DEFAULT 'announcement',
  priority text NOT NULL DEFAULT 'normal',
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own notifications" ON public.notifications;
CREATE POLICY "Users read own notifications"
  ON public.notifications FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users update own notifications" ON public.notifications;
CREATE POLICY "Users update own notifications"
  ON public.notifications FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins insert notifications" ON public.notifications;
CREATE POLICY "Admins insert notifications"
  ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins delete notifications" ON public.notifications;
CREATE POLICY "Admins delete notifications"
  ON public.notifications FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS notifications_user_id_created_at_idx
  ON public.notifications (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS notifications_user_id_unread_idx
  ON public.notifications (user_id) WHERE is_read = false;