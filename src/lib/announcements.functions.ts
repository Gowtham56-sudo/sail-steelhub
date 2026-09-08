import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

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

const announcementInput = z.object({
  id: z.string().uuid().optional().nullable(),
  title: z.string().min(3).max(200),
  content: z.string().min(5).max(20000),
  category: z.string().max(60).optional().default("General"),
  priority: z.enum(["normal", "important", "urgent"]).default("normal"),
  status: z.enum(["draft", "published"]).default("published"),
});

/** List all announcements for the admin panel (including drafts). */
export const adminListAnnouncements = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const admin = await requireAdmin(context);
    const { data, error } = await admin
      .from("announcements")
      .select("id, title, content, category, priority, status, target_audience, created_by, created_at, updated_at, published_at")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { announcements: data ?? [] };
  });

/** Get a single announcement for editing. */
export const adminGetAnnouncement = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const admin = await requireAdmin(context);
    const { data: row, error } = await admin
      .from("announcements")
      .select("id, title, content, category, priority, status, target_audience, created_by, created_at, updated_at, published_at")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) throw new Error("Announcement not found");
    return { announcement: row };
  });

/** Create or update an announcement. When publishing, fan-out notifications to all active employees. */
export const adminSaveAnnouncement = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => announcementInput.parse(input))
  .handler(async ({ data, context }) => {
    const admin = await requireAdmin(context);
    const now = new Date().toISOString();
    const isPublishing = data.status === "published";

    if (data.id) {
      const { data: existing } = await admin
        .from("announcements")
        .select("id, status, published_at")
        .eq("id", data.id)
        .maybeSingle();
      if (!existing) throw new Error("Announcement not found");

      const wasPublished = existing.status === "published" && existing.published_at !== null;
      const payload: Record<string, any> = {
        title: data.title.trim(),
        content: data.content.trim(),
        category: data.category,
        priority: data.priority,
        status: data.status,
        updated_at: now,
      };
      if (isPublishing && !wasPublished) {
        payload["published_at"] = now;
      }

      const { error } = await admin.from("announcements").update(payload).eq("id", data.id);
      if (error) throw new Error(error.message);

      if (isPublishing && !wasPublished) {
        await fanOutNotifications(admin, data.id, data.title, data.content, data.priority);
      }

      await logAction(admin, context.userId, "announcement.update", "announcements", data.id, {
        title: data.title,
        status: data.status,
      });
      return { id: data.id };
    }

    const payload: Record<string, any> = {
      title: data.title.trim(),
      content: data.content.trim(),
      category: data.category,
      priority: data.priority,
      status: data.status,
      target_audience: "all",
      created_by: context.userId,
      updated_at: now,
    };
    if (isPublishing) {
      payload["published_at"] = now;
    }

    const { data: row, error } = await admin
      .from("announcements")
      .insert(payload)
      .select("id")
      .single();
    if (error) throw new Error(error.message);

    if (isPublishing) {
      await fanOutNotifications(admin, row.id as string, data.title, data.content, data.priority);
    }

    await logAction(admin, context.userId, "announcement.create", "announcements", row.id, {
      title: data.title,
      status: data.status,
    });
    return { id: row.id as string };
  });

/** Delete an announcement (cascade-deletes its notifications). */
export const adminDeleteAnnouncement = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const admin = await requireAdmin(context);
    const { data: row } = await admin
      .from("announcements")
      .select("id, title")
      .eq("id", data.id)
      .maybeSingle();
    if (!row) throw new Error("Announcement not found");
    const { error } = await admin.from("announcements").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    await logAction(admin, context.userId, "announcement.delete", "announcements", data.id, {
      title: row.title,
    });
    return { ok: true };
  });

/** Create one notification row per active employee with an auth_user_id. */
async function fanOutNotifications(
  admin: any,
  announcementId: string,
  title: string,
  content: string,
  priority: string,
) {
  const { data: roster } = await admin
    .from("employees")
    .select("auth_user_id")
    .eq("is_active", true)
    .not("auth_user_id", "is", null);

  const userIds = (roster ?? [])
    .map((r: { auth_user_id: string | null }) => r.auth_user_id)
    .filter((uid: string | null): uid is string => uid !== null);

  if (userIds.length === 0) return;

  const message = content.length > 120 ? content.slice(0, 117) + "..." : content;

  const rows = userIds.map((uid: string) => ({
    user_id: uid,
    announcement_id: announcementId,
    title,
    message,
    type: "announcement",
    priority,
    is_read: false,
  }));

  const { error } = await admin.from("notifications").insert(rows);
  if (error) throw new Error(`Failed to create notifications: ${error.message}`);
}

// =============================================================
// Employee-facing notification server functions
// =============================================================

/** Get the signed-in employee's notifications, newest first. */
export const getMyNotifications = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("notifications")
      .select("id, announcement_id, title, message, type, priority, is_read, created_at")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    return { notifications: data ?? [] };
  });

/** Get the unread notification count for the signed-in employee. */
export const getUnreadCount = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { count, error } = await context.supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", context.userId)
      .eq("is_read", false);
    if (error) throw new Error(error.message);
    return { count: count ?? 0 };
  });

/** Mark a single notification as read. */
export const markNotificationRead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Mark all of the signed-in employee's notifications as read. */
export const markAllNotificationsRead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { error } = await context.supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", context.userId)
      .eq("is_read", false);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Get a single published announcement for an employee to view. */
export const getAnnouncement = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: announcement, error } = await context.supabase
      .from("announcements")
      .select("id, title, content, category, priority, published_at, created_at")
      .eq("id", data.id)
      .eq("status", "published")
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!announcement) throw new Error("Announcement not found");
    return { announcement };
  });
