import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { normalizeEmployeeNumber } from "@/lib/employee-account";

/** Throws unless the caller holds the admin role. Returns the admin client. */
async function requireAdmin(context: { supabase: any; userId: string }) {
  const { data: isAdmin } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (!isAdmin) throw new Error("Forbidden");
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

async function logAction(
  admin: any,
  actorUserId: string,
  action: string,
  entity: string,
  entityId: string | null,
  details: Record<string, unknown> = {},
) {
  await admin.from("audit_logs").insert({
    actor_user_id: actorUserId,
    action,
    entity,
    entity_id: entityId,
    details,
  });
}

/** Headline counts plus the newest audit entries. */
export const getAdminOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const admin = await requireAdmin(context);

    const count = async (table: string, filter?: (q: any) => any) => {
      let q: any = (admin as any).from(table).select("id", { count: "exact", head: true });
      if (filter) q = filter(q);
      const { count: c } = await q;
      return c ?? 0;
    };

    const [employees, activated, modules, events, circulars, attempts] = await Promise.all([
      count("employees"),
      count("employees", (q) => q.not("auth_user_id", "is", null)),
      count("learning_modules"),
      count("events"),
      count("circulars"),
      count("quiz_attempts"),
    ]);

    const { data: logs } = await admin
      .from("audit_logs")
      .select("id, action, entity, entity_id, employee_number, created_at, details")
      .order("created_at", { ascending: false })
      .limit(25);

    return {
      stats: { employees, activated, modules, events, circulars, attempts },
      logs: logs ?? [],
    };
  });

/** Roster search for the admin employee manager. */
export const adminListEmployees = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { search?: string }) =>
    z.object({ search: z.string().max(80).optional() }).parse(input ?? {}),
  )
  .handler(async ({ data, context }) => {
    const admin = await requireAdmin(context);
    let q = admin
      .from("employees")
      .select(
        "id, employee_number, full_name, designation, department, work_email, phone, date_of_birth, date_of_joining, is_active, is_admin, auth_user_id",
      )
      .order("employee_number", { ascending: true })
      .limit(100);

    const search = data.search?.trim();
    if (search) {
      q = q.or(
        `employee_number.ilike.%${search}%,full_name.ilike.%${search}%,department.ilike.%${search}%`,
      );
    }
    const { data: rows, error } = await q;
    if (error) throw new Error("Unable to load employees");
    return { employees: rows ?? [] };
  });

const employeeInput = z.object({
  id: z.string().uuid().optional(),
  employee_number: z.string().min(3).max(32),
  full_name: z.string().min(2).max(120),
  designation: z.string().max(120).optional().nullable(),
  department: z.string().max(120).optional().nullable(),
  date_of_birth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  date_of_joining: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  work_email: z.string().email().optional().nullable().or(z.literal("")),
  phone: z.string().max(24).optional().nullable(),
  is_active: z.boolean().optional(),
  is_admin: z.boolean().optional(),
});

/** Create or update a roster record. */
export const adminSaveEmployee = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => employeeInput.parse(input))
  .handler(async ({ data, context }) => {
    const admin = await requireAdmin(context);
    const payload = {
      employee_number: normalizeEmployeeNumber(data.employee_number),
      full_name: data.full_name.trim(),
      designation: data.designation || null,
      department: data.department || null,
      date_of_birth: data.date_of_birth || null,
      date_of_joining: data.date_of_joining || null,
      work_email: data.work_email || null,
      phone: data.phone || null,
      ...(data.is_active === undefined ? {} : { is_active: data.is_active }),
      ...(data.is_admin === undefined ? {} : { is_admin: data.is_admin }),
    };

    if (data.id) {
      const { error } = await admin.from("employees").update(payload).eq("id", data.id);
      if (error) throw new Error(error.message);
      await logAction(admin, context.userId, "employee.update", "employees", data.id, {
        employee_number: payload.employee_number,
      });
      return { id: data.id };
    }

    const { data: row, error } = await admin
      .from("employees")
      .insert(payload)
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    await logAction(admin, context.userId, "employee.create", "employees", row.id, {
      employee_number: payload.employee_number,
    });
    return { id: row.id as string };
  });

/** Activate/deactivate an employee, or grant/revoke the admin role. */
export const adminSetEmployeeFlags = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string; is_active?: boolean; is_admin?: boolean }) =>
    z
      .object({
        id: z.string().uuid(),
        is_active: z.boolean().optional(),
        is_admin: z.boolean().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const admin = await requireAdmin(context);
    const { data: row } = await admin
      .from("employees")
      .select("id, employee_number, auth_user_id")
      .eq("id", data.id)
      .maybeSingle();
    if (!row) throw new Error("Employee not found");

    const patch: { is_active?: boolean; is_admin?: boolean } = {};
    if (data.is_active !== undefined) patch.is_active = data.is_active;
    if (data.is_admin !== undefined) patch.is_admin = data.is_admin;
    if (Object.keys(patch).length === 0) return { ok: true };

    const { error } = await admin.from("employees").update(patch).eq("id", data.id);
    if (error) throw new Error(error.message);

    // Keep the role table in sync for already-activated accounts.
    if (data.is_admin !== undefined && row.auth_user_id) {
      if (data.is_admin) {
        await admin
          .from("user_roles")
          .upsert({ user_id: row.auth_user_id, role: "admin" }, { onConflict: "user_id,role" });
      } else {
        await admin
          .from("user_roles")
          .delete()
          .eq("user_id", row.auth_user_id)
          .eq("role", "admin");
      }
    }

    await logAction(admin, context.userId, "employee.flags", "employees", data.id, patch);
    return { ok: true };
  });

const CONTENT_TABLES = ["circulars", "events", "learning_modules", "forms"] as const;
type ContentTable = (typeof CONTENT_TABLES)[number];

/** All content rows (published and drafts) for the admin content manager. */
export const adminListContent = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const admin = await requireAdmin(context);
    const [circulars, events, modules] = await Promise.all([
      admin
        .from("circulars")
        .select("id, circular_number, title, category, department, issued_date, is_published")
        .order("issued_date", { ascending: false }),
      admin
        .from("events")
        .select("id, title, category, location, event_date, is_published")
        .order("event_date", { ascending: false }),
      admin
        .from("learning_modules")
        .select("id, title, category, publish_date, is_published")
        .order("publish_date", { ascending: false }),
    ]);
    return {
      circulars: circulars.data ?? [],
      events: events.data ?? [],
      modules: modules.data ?? [],
    };
  });

/** Publish or unpublish any content row. */
export const adminSetPublished = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { table: ContentTable; id: string; is_published: boolean }) =>
    z
      .object({
        table: z.enum(CONTENT_TABLES),
        id: z.string().uuid(),
        is_published: z.boolean(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const admin = await requireAdmin(context);
    const { error } = await admin
      .from(data.table)
      .update({ is_published: data.is_published })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    await logAction(admin, context.userId, "content.publish", data.table, data.id, {
      is_published: data.is_published,
    });
    return { ok: true };
  });

/** Publish a new circular straight from the admin panel. */
export const adminCreateCircular = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        circular_number: z.string().min(2).max(60),
        title: z.string().min(3).max(200),
        summary: z.string().max(500).optional(),
        body: z.string().max(20000).optional(),
        category: z.string().min(1).max(60),
        department: z.string().max(80).optional(),
        issued_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const admin = await requireAdmin(context);
    const { data: row, error } = await admin
      .from("circulars")
      .insert({
        circular_number: data.circular_number.trim(),
        title: data.title.trim(),
        summary: data.summary || null,
        body: data.body || null,
        category: data.category,
        department: data.department || null,
        issued_date: data.issued_date,
        is_published: true,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    await logAction(admin, context.userId, "circular.create", "circulars", row.id, {
      circular_number: data.circular_number,
    });
    return { id: row.id as string };
  });

/** Today's recorded birthday / work-anniversary greetings, newest first. */
export const adminGetCelebrations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const admin = await requireAdmin(context);
    const { data } = await admin
      .from("audit_logs")
      .select("id, action, entity_id, employee_number, details, created_at")
      .in("action", ["birthday_greeting", "work_anniversary"])
      .order("created_at", { ascending: false })
      .limit(50);
    return { greetings: data ?? [] };
  });

/** Manually run the daily celebration scan (same logic as the scheduled job). */
export const adminRunCelebrations = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const admin = await requireAdmin(context);
    const { data: roster } = await admin
      .from("employees")
      .select("id, employee_number, full_name, department, date_of_birth, date_of_joining")
      .eq("is_active", true);

    const now = new Date();
    const today = `${String(now.getUTCMonth() + 1).padStart(2, "0")}-${String(
      now.getUTCDate(),
    ).padStart(2, "0")}`;

    const rows: {
      action: string;
      entity: string;
      entity_id: string;
      employee_number: string;
      details: Record<string, string | number | null>;
    }[] = [];
    for (const r of roster ?? []) {
      if (r.date_of_birth?.slice(5) === today) {
        rows.push({
          action: "birthday_greeting",
          entity: "employees",
          entity_id: r.id,
          employee_number: r.employee_number,
          details: { name: r.full_name, department: r.department, date: today },
        });
      }
      const years = r.date_of_joining
        ? now.getUTCFullYear() - Number(r.date_of_joining.slice(0, 4))
        : 0;
      if (r.date_of_joining?.slice(5) === today && years > 0) {
        rows.push({
          action: "work_anniversary",
          entity: "employees",
          entity_id: r.id,
          employee_number: r.employee_number,
          details: { name: r.full_name, department: r.department, years, date: today },
        });
      }
    }

    if (rows.length > 0) await admin.from("audit_logs").insert(rows);
    return { count: rows.length, date: today };
  });

/** All forms (published and hidden) for the admin forms manager. */
export const adminListForms = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const admin = await requireAdmin(context);
    const { data } = await admin
      .from("forms")
      .select("id, title, description, category, department, file_name, is_published, created_at")
      .order("created_at", { ascending: false });
    return { forms: data ?? [] };
  });

/** Signed upload slot so the browser can send the file straight to storage. */
export const adminCreateFormUpload = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { fileName: string }) =>
    z.object({ fileName: z.string().min(1).max(200) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const admin = await requireAdmin(context);
    const safe = data.fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `${crypto.randomUUID()}-${safe}`;
    const { data: signed, error } = await admin.storage.from("forms").createSignedUploadUrl(path);
    if (error || !signed) throw new Error("Unable to prepare upload");
    return { path, token: signed.token };
  });

/** Save a form record once its file has been uploaded. */
export const adminCreateForm = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        title: z.string().min(3).max(200),
        description: z.string().max(1000).optional(),
        category: z.string().min(1).max(60),
        department: z.string().max(80).optional(),
        file_url: z.string().min(1).max(400),
        file_name: z.string().min(1).max(200),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const admin = await requireAdmin(context);
    const { data: row, error } = await admin
      .from("forms")
      .insert({
        title: data.title.trim(),
        description: data.description || null,
        category: data.category,
        department: data.department || null,
        file_url: data.file_url,
        file_name: data.file_name,
        is_published: true,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    await logAction(admin, context.userId, "form.create", "forms", row.id, { title: data.title });
    return { id: row.id as string };
  });

/** Remove a form and its stored file. */
export const adminDeleteForm = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const admin = await requireAdmin(context);
    const { data: row } = await admin
      .from("forms")
      .select("id, file_url, title")
      .eq("id", data.id)
      .maybeSingle();
    if (!row) throw new Error("Form not found");
    await admin.storage.from("forms").remove([row.file_url]);
    const { error } = await admin.from("forms").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    await logAction(admin, context.userId, "form.delete", "forms", data.id, { title: row.title });
    return { ok: true };
  });
