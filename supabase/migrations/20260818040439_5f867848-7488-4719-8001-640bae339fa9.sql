CREATE TABLE public.circulars (
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

GRANT SELECT, INSERT, UPDATE, DELETE ON public.circulars TO authenticated;
GRANT ALL ON public.circulars TO service_role;

ALTER TABLE public.circulars ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Employees read published circulars" ON public.circulars
  FOR SELECT TO authenticated USING (is_published = true);
CREATE POLICY "Admins manage circulars" ON public.circulars
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER circulars_updated_at BEFORE UPDATE ON public.circulars
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX circulars_issued_date_idx ON public.circulars (issued_date DESC);

INSERT INTO public.circulars (circular_number, title, summary, body, category, department, issued_date) VALUES
('SSP/SAFETY/2026/014','Mandatory PPE Compliance in All Production Bays','All employees and contract workers must wear approved helmets, safety shoes, goggles and hand gloves inside production and material handling areas.','With immediate effect, entry to the Cold Rolling Mill, Annealing & Pickling Line and material handling bays is permitted only with complete personal protective equipment. Shift in-charges will conduct spot checks at the start of every shift. Non-compliance will be recorded and reported to the Safety Department. Damaged PPE must be exchanged at the safety store before shift start.','Safety','Safety Department','2026-08-04'),
('SSP/HR/2026/031','Revised Timings for General Shift Employees','General shift timings stand revised to 08:30 hrs to 17:00 hrs from 01 September 2026.','To align with plant-wide energy optimisation, general shift timings are revised to 08:30 hrs to 17:00 hrs, with a 30 minute lunch break from 13:00 hrs. Shift employees (A, B and C) continue on existing timings. Departmental heads are requested to update attendance rosters accordingly.','HR','Personnel & Administration','2026-07-28'),
('SSP/TRG/2026/009','Nomination for Cold Rolling Process Skill Upgradation Programme','Departments may nominate up to four employees for the five-day skill upgradation programme at the Training Institute.','The Training Institute will conduct a five-day residential programme on cold rolling process control, coil handling and surface defect analysis. Nominations with employee number, designation and department should reach the Training Institute at least ten days before commencement. Participants will receive a certificate on successful completion of the end-of-course assessment.','Training','Training Institute','2026-07-15'),
('SSP/ADMIN/2026/022','Plant Holiday Notification — Independence Day','15 August 2026 will be observed as a paid holiday for all employees except essential and continuous process staff.','15 August 2026 shall be observed as a plant holiday. Flag hoisting will take place at the Administrative Building at 08:00 hrs, followed by refreshments. Continuous process sections and essential services will work as per the approved shift roster and compensatory off will be granted.','General','Personnel & Administration','2026-08-01'),
('SSP/IT/2026/007','Password Policy and Knowledge Hub Account Activation','All employees must activate their Knowledge Hub account using their employee number and set a strong password.','Employees are advised to activate their Employee Knowledge Hub account at the earliest using their employee number and date of birth. Passwords must be at least eight characters and must not be shared with anyone. IT Department will never ask for your password over phone or email. Report suspicious messages to the IT helpdesk immediately.','IT','Information Technology','2026-06-30'),
('SSP/MED/2026/005','Annual Health Check-up Camp for Employees Above 45 Years','Health check-up camp at the Plant Medical Centre from 10 to 20 September 2026.','The Plant Medical Centre will conduct the annual health check-up camp covering blood profile, ECG, vision and audiometry testing. Employees above 45 years of age are required to attend. Departments should schedule attendance so that production is not affected. Reports will be issued confidentially to the employee.','Welfare','Medical Services','2026-08-10');