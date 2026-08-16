CREATE TABLE public.learning_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  summary text,
  category text,
  video_url text,
  publish_date date NOT NULL DEFAULT CURRENT_DATE,
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.learning_modules TO authenticated;
GRANT ALL ON public.learning_modules TO service_role;
ALTER TABLE public.learning_modules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Employees read published modules" ON public.learning_modules FOR SELECT TO authenticated USING (is_published = true);
CREATE POLICY "Admins manage modules" ON public.learning_modules FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER learning_modules_updated_at BEFORE UPDATE ON public.learning_modules FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.quiz_questions (
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
GRANT ALL ON public.quiz_questions TO service_role;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage questions" ON public.quiz_questions FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.quiz_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_id uuid NOT NULL REFERENCES public.learning_modules(id) ON DELETE CASCADE,
  score integer NOT NULL,
  total integer NOT NULL,
  answers jsonb NOT NULL DEFAULT '[]'::jsonb,
  completed_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.quiz_attempts TO authenticated;
GRANT ALL ON public.quiz_attempts TO service_role;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Employees read own attempts" ON public.quiz_attempts FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins read all attempts" ON public.quiz_attempts FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Employees insert own attempts" ON public.quiz_attempts FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE INDEX quiz_attempts_user_idx ON public.quiz_attempts (user_id, completed_at DESC);

INSERT INTO public.learning_modules (id, title, summary, category, video_url, publish_date) VALUES
('11111111-1111-4111-8111-111111111111','Personal Protective Equipment (PPE) Essentials','Correct selection, inspection and use of PPE inside the Salem Steel Plant shop floors.','Safety','https://www.youtube.com/embed/aBpvHIqW1LM', CURRENT_DATE),
('22222222-2222-4222-8222-222222222222','Stainless Steel Cold Rolling Basics','How the Cold Rolling Mill converts hot band into bright annealed stainless steel coils.','Process','https://www.youtube.com/embed/1yFVjlZ3nJc', CURRENT_DATE - 1),
('33333333-3333-4333-8333-333333333333','Fire Safety and Emergency Response','Fire classes, extinguisher selection and plant emergency assembly procedure.','Safety','https://www.youtube.com/embed/Xgc90CoJbDI', CURRENT_DATE - 2);

INSERT INTO public.quiz_questions (module_id, order_index, question, options, correct_index, explanation) VALUES
('11111111-1111-4111-8111-111111111111',1,'What does PPE stand for?','["Personal Protective Equipment","Plant Production Efficiency","Primary Process Engineering","Public Protection Enforcement"]'::jsonb,0,'PPE means Personal Protective Equipment.'),
('11111111-1111-4111-8111-111111111111',2,'Which PPE protects against flying metal chips?','["Cotton gloves","Safety goggles","Ear plugs","Reflective vest"]'::jsonb,1,'Safety goggles shield the eyes from chips and sparks.'),
('11111111-1111-4111-8111-111111111111',3,'When must PPE be inspected?','["Once a year","Before every use","Only after an accident","Never"]'::jsonb,1,'PPE must be inspected before each use.'),
('11111111-1111-4111-8111-111111111111',4,'Safety helmets protect mainly against:','["Noise","Falling objects","Chemical splash","Heat radiation"]'::jsonb,1,'Helmets guard the head from falling objects and impact.'),
('11111111-1111-4111-8111-111111111111',5,'Which PPE is required in high-noise areas?','["Face shield","Ear protection","Apron","Gum boots"]'::jsonb,1,'Ear plugs or muffs are mandatory above 85 dB.'),
('11111111-1111-4111-8111-111111111111',6,'Damaged PPE should be:','["Repaired with tape","Used carefully","Reported and replaced","Shared with others"]'::jsonb,2,'Damaged PPE must be reported and replaced immediately.'),
('11111111-1111-4111-8111-111111111111',7,'Who is responsible for wearing PPE correctly?','["Only supervisors","Only contractors","Every employee","Only the safety officer"]'::jsonb,2,'Every person on the shop floor is responsible.'),
('11111111-1111-4111-8111-111111111111',8,'Safety shoes in a steel plant should have:','["Soft canvas tops","Steel toe caps","Open heels","Leather soles only"]'::jsonb,1,'Steel toe caps protect against crushing injuries.'),
('11111111-1111-4111-8111-111111111111',9,'A respirator is needed when there is:','["Bright light","Airborne dust or fumes","Loud noise","Slippery floor"]'::jsonb,1,'Respirators protect the lungs from dust and fumes.'),
('11111111-1111-4111-8111-111111111111',10,'PPE is which line of defence against hazards?','["First","Second","Last","Not a defence"]'::jsonb,2,'PPE is the last line of defence after engineering and administrative controls.');

INSERT INTO public.quiz_questions (module_id, order_index, question, options, correct_index, explanation) VALUES
('22222222-2222-4222-8222-222222222222',1,'Cold rolling is carried out at:','["Above recrystallisation temperature","Below recrystallisation temperature","Melting temperature","Annealing temperature"]'::jsonb,1,'Cold rolling happens below the recrystallisation temperature.'),
('22222222-2222-4222-8222-222222222222',2,'Salem Steel Plant is best known for:','["Rails","Stainless steel","Wire rods","Cement"]'::jsonb,1,'SSP is India''s flagship stainless steel producer.'),
('22222222-2222-4222-8222-222222222222',3,'Cold rolling mainly improves:','["Surface finish and thickness accuracy","Weight","Colour","Density"]'::jsonb,0,'It delivers a better finish and tighter thickness tolerance.'),
('22222222-2222-4222-8222-222222222222',4,'Bright Annealing is performed to:','["Add carbon","Restore ductility with a bright surface","Increase thickness","Cut coils"]'::jsonb,1,'Bright annealing softens steel while keeping a bright surface.'),
('22222222-2222-4222-8222-222222222222',5,'Pickling removes:','["Oil","Scale and oxides","Paint","Water"]'::jsonb,1,'Pickling removes surface scale and oxides.'),
('22222222-2222-4222-8222-222222222222',6,'The input to the Cold Rolling Mill is:','["Scrap","Hot rolled coil","Ingot","Billet"]'::jsonb,1,'Hot rolled band feeds the cold rolling mill.'),
('22222222-2222-4222-8222-222222222222',7,'Work hardening during cold rolling increases:','["Ductility","Hardness and strength","Grain size","Corrosion"]'::jsonb,1,'Cold work raises hardness and strength.'),
('22222222-2222-4222-8222-222222222222',8,'A 20-high mill is also called:','["Sendzimir mill","Blast furnace","Continuous caster","Coke oven"]'::jsonb,0,'A Sendzimir (Z-mill) is a 20-high cluster mill.'),
('22222222-2222-4222-8222-222222222222',9,'Stainless steel resists corrosion because of:','["Nickel plating","Chromium oxide passive layer","Paint","Zinc coating"]'::jsonb,1,'Chromium forms a self-healing passive oxide layer.'),
('22222222-2222-4222-8222-222222222222',10,'Coil tension in rolling is controlled to:','["Save power only","Maintain flatness and thickness","Increase noise","Cool the mill"]'::jsonb,1,'Correct tension keeps strip flat and gauge accurate.');

INSERT INTO public.quiz_questions (module_id, order_index, question, options, correct_index, explanation) VALUES
('33333333-3333-4333-8333-333333333333',1,'Class A fires involve:','["Ordinary solids like wood and paper","Flammable liquids","Electrical equipment","Metals"]'::jsonb,0,'Class A covers ordinary combustible solids.'),
('33333333-3333-4333-8333-333333333333',2,'For an electrical fire you should use:','["Water jet","CO2 extinguisher","Foam","Sand only"]'::jsonb,1,'CO2 is safe on live electrical equipment.'),
('33333333-3333-4333-8333-333333333333',3,'The fire triangle consists of:','["Fuel, heat, oxygen","Fuel, water, air","Heat, smoke, ash","Oxygen, water, fuel"]'::jsonb,0,'Remove any one element to stop a fire.'),
('33333333-3333-4333-8333-333333333333',4,'PASS in extinguisher use stands for:','["Push, Aim, Spray, Stop","Pull, Aim, Squeeze, Sweep","Press, Alert, Stand, Spray","Pull, Alert, Shout, Stop"]'::jsonb,1,'Pull, Aim, Squeeze, Sweep.'),
('33333333-3333-4333-8333-333333333333',5,'On hearing the fire alarm you should first:','["Collect belongings","Move to the assembly point","Call home","Continue working"]'::jsonb,1,'Evacuate calmly to the designated assembly point.'),
('33333333-3333-4333-8333-333333333333',6,'Fire exits must always be:','["Locked","Kept clear","Used for storage","Closed permanently"]'::jsonb,1,'Escape routes must never be obstructed.'),
('33333333-3333-4333-8333-333333333333',7,'A hot work permit is required for:','["Welding and gas cutting","Sweeping","Data entry","Material counting"]'::jsonb,0,'Hot work needs a permit and fire watch.'),
('33333333-3333-4333-8333-333333333333',8,'Class D fires involve:','["Cooking oil","Combustible metals","Paper","Electrical panels"]'::jsonb,1,'Class D is combustible metals such as magnesium.'),
('33333333-3333-4333-8333-333333333333',9,'Smoke inhalation victims should be moved to:','["A closed room","Fresh air","The nearest furnace","A cold store"]'::jsonb,1,'Move the victim to fresh air and seek medical help.'),
('33333333-3333-4333-8333-333333333333',10,'Fire drills are conducted to:','["Waste time","Practise safe and fast evacuation","Test alarms only","Fulfil paperwork"]'::jsonb,1,'Drills build muscle memory for a real emergency.');