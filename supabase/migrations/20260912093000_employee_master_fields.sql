-- Fields retained from the approved SAIL Steel Hub employee master workbook.
-- date_of_joining remains the official SAIL joining date used for anniversaries.
ALTER TABLE public.employees
  ADD COLUMN IF NOT EXISTS grade text,
  ADD COLUMN IF NOT EXISTS date_of_joining_ssp date;

COMMENT ON COLUMN public.employees.date_of_joining IS
  'Official date of joining SAIL, used for work anniversaries.';
COMMENT ON COLUMN public.employees.date_of_joining_ssp IS
  'Date of joining SSP.';
COMMENT ON COLUMN public.employees.grade IS
  'Employee grade from the approved employee master list.';
