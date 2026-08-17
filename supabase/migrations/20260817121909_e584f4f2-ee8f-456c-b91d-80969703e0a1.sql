CREATE TABLE public.events (
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
GRANT SELECT, INSERT, UPDATE, DELETE ON public.events TO authenticated;
GRANT ALL ON public.events TO service_role;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Employees read published events" ON public.events FOR SELECT TO authenticated USING (is_published = true);
CREATE POLICY "Admins manage events" ON public.events FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.event_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  caption text,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.event_photos TO authenticated;
GRANT ALL ON public.event_photos TO service_role;
ALTER TABLE public.event_photos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Employees read photos of published events" ON public.event_photos FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_id AND e.is_published = true));
CREATE POLICY "Admins manage event photos" ON public.event_photos FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

INSERT INTO public.events (id, title, description, category, location, event_date, cover_image_url) VALUES
('11111111-1111-4111-8111-111111111101','National Safety Week 2026','Plant-wide safety pledge, PPE demonstrations, fire drill and prize distribution for the best-performing departments.','Safety','Main Administrative Block, Salem Steel Plant','2026-03-04','https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&w=1200&q=70'),
('11111111-1111-4111-8111-111111111102','Independence Day Celebration','Flag hoisting by the Executive Director followed by cultural programmes and sweets distribution for employees and families.','Celebration','Plant Main Gate Ground','2026-08-15','https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=1200&q=70'),
('11111111-1111-4111-8111-111111111103','Cold Rolling Mill Skill Workshop','Hands-on refresher workshop on cold rolling parameters, coil handling and quality inspection for shop-floor teams.','Training','Cold Rolling Mill Training Hall','2026-06-18','https://images.unsplash.com/photo-1565043666747-69f6646db940?auto=format&fit=crop&w=1200&q=70'),
('11111111-1111-4111-8111-111111111104','Annual Sports Meet','Inter-department athletics, tug of war, cricket finals and a family fun zone.','Sports','SSP Sports Complex','2026-01-24','https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=1200&q=70');

INSERT INTO public.event_photos (event_id, image_url, caption, order_index) VALUES
('11111111-1111-4111-8111-111111111101','https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?auto=format&fit=crop&w=1200&q=70','Safety pledge ceremony',1),
('11111111-1111-4111-8111-111111111101','https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=1200&q=70','PPE demonstration stall',2),
('11111111-1111-4111-8111-111111111101','https://images.unsplash.com/photo-1516937941344-00b4e0337589?auto=format&fit=crop&w=1200&q=70','Mock fire drill',3),
('11111111-1111-4111-8111-111111111102','https://images.unsplash.com/photo-1532375810709-75b1da00537c?auto=format&fit=crop&w=1200&q=70','Flag hoisting',1),
('11111111-1111-4111-8111-111111111102','https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=70','Cultural programme',2),
('11111111-1111-4111-8111-111111111103','https://images.unsplash.com/photo-1581093588401-fbb62a02f120?auto=format&fit=crop&w=1200&q=70','Shop-floor demonstration',1),
('11111111-1111-4111-8111-111111111103','https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=70','Classroom session',2),
('11111111-1111-4111-8111-111111111104','https://images.unsplash.com/photo-1552674605-db6ffd4facb5?auto=format&fit=crop&w=1200&q=70','Tug of war final',1),
('11111111-1111-4111-8111-111111111104','https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=1200&q=70','Track events',2);