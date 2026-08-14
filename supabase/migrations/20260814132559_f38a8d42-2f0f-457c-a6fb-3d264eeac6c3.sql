CREATE TYPE public.app_role AS ENUM ('admin','moderator','employee');

CREATE TABLE public.employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_number text NOT NULL UNIQUE,
  full_name text NOT NULL,
  designation text,
  department text,
  date_of_birth date,
  date_of_joining date,
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

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id uuid,
  employee_number text,
  action text NOT NULL,
  entity text,
  entity_id text,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.employees TO authenticated;
GRANT ALL ON public.employees TO service_role;
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
GRANT SELECT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Employees view own record" ON public.employees
  FOR SELECT TO authenticated USING (auth_user_id = auth.uid());
CREATE POLICY "Admins view all employees" ON public.employees
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins insert employees" ON public.employees
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update employees" ON public.employees
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete employees" ON public.employees
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users view own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins view all roles" ON public.user_roles
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins read audit logs" ON public.audit_logs
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER employees_updated_at BEFORE UPDATE ON public.employees
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.employees (employee_number, full_name, designation, department, date_of_birth, date_of_joining, work_email, phone, is_admin) VALUES
  ('SSP10001','Ramesh Kumar','Deputy General Manager','Human Resources','1968-08-14','1992-06-01','ramesh.kumar@sailssp.in','+91 90000 10001', true),
  ('SSP10234','Lakshmi Narayanan','Senior Operator','Cold Rolling Mill','1970-03-22','1995-09-15','lakshmi.n@sailssp.in','+91 90000 10234', false),
  ('SSP10456','Anitha Selvam','Shift Engineer','Steel Melting Shop','1985-11-05','2010-07-19','anitha.s@sailssp.in','+91 90000 10456', false),
  ('SSP10789','Mohan Raj','Safety Officer','Safety & Fire Services','1975-01-30','2001-02-12','mohan.raj@sailssp.in','+91 90000 10789', false),
  ('SSP11002','Suresh Babu','Maintenance Technician','Mechanical Maintenance','1966-06-08','1990-04-03','suresh.babu@sailssp.in','+91 90000 11002', false),
  ('SSP11345','Priya Dharshini','Assistant Manager','Quality Assurance','1990-12-18','2015-08-24','priya.d@sailssp.in','+91 90000 11345', false);