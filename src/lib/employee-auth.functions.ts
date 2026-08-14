import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  employeeNumberToAuthEmail,
  normalizeEmployeeNumber,
  MIN_PASSWORD_LENGTH,
} from "@/lib/employee-account";

const employeeNumberSchema = z
  .string()
  .min(3)
  .max(32)
  .regex(/^[A-Za-z0-9-]+$/, "Employee number may contain letters, numbers and dashes only.");

/**
 * Tells the login screen whether this employee number still needs a
 * first-time activation. It never reveals names or any personal data.
 */
export const getAccountStatus = createServerFn({ method: "POST" })
  .inputValidator((input: { employeeNumber: string }) =>
    z.object({ employeeNumber: employeeNumberSchema }).parse(input),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const employeeNumber = normalizeEmployeeNumber(data.employeeNumber);

    const { data: row } = await supabaseAdmin
      .from("employees")
      .select("auth_user_id, is_active")
      .eq("employee_number", employeeNumber)
      .maybeSingle();

    if (!row || !row.is_active) return { known: false, activated: false } as const;
    return { known: true, activated: row.auth_user_id !== null } as const;
  });

/**
 * First-time activation. The employee proves they are the roster owner with
 * their date of birth, then chooses the password they will use from now on.
 * Passwords are only ever handed to the auth system, which stores a hash.
 */
export const activateAccount = createServerFn({ method: "POST" })
  .inputValidator((input: { employeeNumber: string; dateOfBirth: string; password: string }) =>
    z
      .object({
        employeeNumber: employeeNumberSchema,
        dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use the date picker."),
        password: z.string().min(MIN_PASSWORD_LENGTH).max(72),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const employeeNumber = normalizeEmployeeNumber(data.employeeNumber);

    const { data: row } = await supabaseAdmin
      .from("employees")
      .select("id, employee_number, date_of_birth, is_active, is_admin, auth_user_id")
      .eq("employee_number", employeeNumber)
      .maybeSingle();

    const genericError = {
      ok: false as const,
      error: "Employee number or date of birth is incorrect. Please contact HR / IT.",
    };

    if (!row || !row.is_active || row.date_of_birth !== data.dateOfBirth) {
      await supabaseAdmin.from("audit_logs").insert({
        employee_number: employeeNumber,
        action: "activation_failed",
        entity: "employees",
        details: { reason: !row ? "unknown_employee" : "verification_mismatch" },
      });
      return genericError;
    }

    if (row.auth_user_id) {
      return {
        ok: false as const,
        error: "This account is already active. Please sign in with your password.",
      };
    }

    const email = employeeNumberToAuthEmail(employeeNumber);
    const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: data.password,
      email_confirm: true,
      user_metadata: { employee_number: employeeNumber },
    });

    if (createError || !created.user) {
      return { ok: false as const, error: createError?.message ?? "Could not create the account." };
    }

    const userId = created.user.id;

    const { error: linkError } = await supabaseAdmin
      .from("employees")
      .update({ auth_user_id: userId, activated_at: new Date().toISOString() })
      .eq("id", row.id);

    if (linkError) {
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return { ok: false as const, error: "Could not link your account. Please try again." };
    }

    await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: userId, role: row.is_admin ? "admin" : "employee" });

    await supabaseAdmin.from("audit_logs").insert({
      actor_user_id: userId,
      employee_number: employeeNumber,
      action: "account_activated",
      entity: "employees",
      entity_id: row.id,
    });

    return { ok: true as const, email };
  });

/** Profile of the signed-in employee, read through their own permissions. */
export const getMyProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("employees")
      .select(
        "employee_number, full_name, designation, department, date_of_birth, date_of_joining, work_email, phone, photo_url",
      )
      .eq("auth_user_id", context.userId)
      .maybeSingle();

    if (error) throw new Error(error.message);

    const { data: roles } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId);

    return { profile: data, roles: (roles ?? []).map((r) => r.role) };
  });
