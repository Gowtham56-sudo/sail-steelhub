import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Home dashboard feed: the signed-in employee's own profile plus today's
 * celebrations across the plant. Celebration rows expose only a name,
 * department and designation — never contact details or dates of birth.
 */
export const getHomeFeed = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: profile } = await context.supabase
      .from("employees")
      .select("employee_number, full_name, designation, department, photo_url, date_of_joining")
      .eq("auth_user_id", context.userId)
      .maybeSingle();

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: roster } = await supabaseAdmin
      .from("employees")
      .select("id, full_name, designation, department, date_of_birth, date_of_joining")
      .eq("is_active", true);

    const now = new Date();
    const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(now.getUTCDate()).padStart(2, "0");
    const today = `${mm}-${dd}`;

    const birthdays = (roster ?? [])
      .filter((r) => r.date_of_birth?.slice(5) === today)
      .map((r) => ({
        id: r.id,
        name: r.full_name,
        designation: r.designation,
        department: r.department,
      }));

    const anniversaries = (roster ?? [])
      .filter((r) => r.date_of_joining?.slice(5) === today)
      .map((r) => ({
        id: r.id,
        name: r.full_name,
        designation: r.designation,
        department: r.department,
        years: r.date_of_joining
          ? now.getUTCFullYear() - Number(r.date_of_joining.slice(0, 4))
          : null,
      }))
      .filter((r) => (r.years ?? 0) > 0);

    return { profile, birthdays, anniversaries };
  });
