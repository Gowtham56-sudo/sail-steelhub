import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const notificationIdInput = z.object({ notificationId: z.string().uuid() });

type NotificationRow = {
  id: string;
  kind: "birthday" | "anniversary" | "announcement";
  title: string;
  body: string;
  image_path: string | null;
  subject_employee_id: string | null;
  announcement_id: string | null;
  notice_date: string;
  created_at: string;
};

async function signedAnnouncementImages(admin: any, rows: NotificationRow[]) {
  const paths = [...new Set(rows.map((row) => row.image_path).filter(Boolean))] as string[];
  const signed = await Promise.all(
    paths.map(async (path) => {
      const { data } = await admin.storage.from("announcement-images").createSignedUrl(path, 60 * 60);
      return [path, data?.signedUrl ?? null] as const;
    }),
  );
  return new Map(signed);
}

/** Unread count for the header bell. */
export const getNotificationSummary = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const db: any = context.supabase;
    const [{ data: notifications, error }, { data: reads, error: readsError }] = await Promise.all([
      db.from("notifications").select("id"),
      db.from("notification_reads").select("notification_id").eq("user_id", context.userId),
    ]);
    if (error || readsError) throw new Error("Unable to load notifications");
    const readIds = new Set((reads ?? []).map((row: { notification_id: string }) => row.notification_id));
    return {
      unread: (notifications ?? []).filter((row: { id: string }) => !readIds.has(row.id)).length,
      total: notifications?.length ?? 0,
    };
  });

/** Feed used by the employee notification centre. */
export const getNotifications = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const db: any = context.supabase;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [{ data: notificationRows, error }, { data: reads, error: readsError }] = await Promise.all([
      db.from("notifications")
        .select("id, kind, title, body, image_path, subject_employee_id, announcement_id, notice_date, created_at")
        .order("created_at", { ascending: false })
        .limit(60),
      db.from("notification_reads").select("notification_id").eq("user_id", context.userId),
    ]);
    if (error || readsError) throw new Error("Unable to load notifications");

    const notifications = (notificationRows ?? []) as NotificationRow[];
    const ids = notifications.map((row) => row.id);
    const { data: wishes, error: wishesError } = ids.length
      ? await db
          .from("notification_wishes")
          .select("id, notification_id, sender_name, message, created_at")
          .in("notification_id", ids)
          .order("created_at", { ascending: true })
          .limit(240)
      : { data: [], error: null };
    if (wishesError) throw new Error("Unable to load celebration wishes");

    const images = await signedAnnouncementImages(supabaseAdmin, notifications);
    const readIds = new Set((reads ?? []).map((row: { notification_id: string }) => row.notification_id));
    const wishesByNotification = new Map<string, any[]>();
    for (const wish of wishes ?? []) {
      const collection = wishesByNotification.get(wish.notification_id) ?? [];
      collection.push(wish);
      wishesByNotification.set(wish.notification_id, collection);
    }

    return {
      unread: notifications.filter((row) => !readIds.has(row.id)).length,
      notifications: notifications.map((row) => ({
        ...row,
        is_read: readIds.has(row.id),
        image_url: row.image_path ? images.get(row.image_path) ?? null : null,
        wishes: wishesByNotification.get(row.id) ?? [],
      })),
    };
  });

/** Mark one item as read when the employee opens it. */
export const markNotificationRead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => notificationIdInput.parse(input))
  .handler(async ({ data, context }) => {
    const db: any = context.supabase;
    const { error } = await db.from("notification_reads").upsert(
      { notification_id: data.notificationId, user_id: context.userId, read_at: new Date().toISOString() },
      { onConflict: "notification_id,user_id" },
    );
    if (error) throw new Error("Unable to mark this notification as read");
    return { ok: true };
  });

/** Mark every currently visible notification as read. */
export const markAllNotificationsRead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const db: any = context.supabase;
    const { data: rows, error } = await db.from("notifications").select("id").limit(100);
    if (error) throw new Error("Unable to load notifications");
    if (!rows?.length) return { count: 0 };
    const { error: upsertError } = await db.from("notification_reads").upsert(
      rows.map((row: { id: string }) => ({ notification_id: row.id, user_id: context.userId })),
      { onConflict: "notification_id,user_id" },
    );
    if (upsertError) throw new Error("Unable to mark notifications as read");
    return { count: rows.length };
  });

/** Add a colleague's public wish to a birthday or work-anniversary notification. */
export const sendCelebrationWish = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({ notificationId: z.string().uuid(), message: z.string().trim().min(1).max(280) })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const admin: any = supabaseAdmin;
    const [{ data: notification }, { data: sender }] = await Promise.all([
      admin
        .from("notifications")
        .select("id, kind")
        .eq("id", data.notificationId)
        .in("kind", ["birthday", "anniversary"])
        .maybeSingle(),
      admin
        .from("employees")
        .select("full_name")
        .eq("auth_user_id", context.userId)
        .eq("is_active", true)
        .maybeSingle(),
    ]);
    if (!notification) throw new Error("This celebration is no longer available");
    if (!sender?.full_name) throw new Error("Your employee profile is not available");

    const { data: wish, error } = await admin
      .from("notification_wishes")
      .insert({
        notification_id: data.notificationId,
        sender_user_id: context.userId,
        sender_name: sender.full_name,
        message: data.message.trim(),
      })
      .select("id, notification_id, sender_name, message, created_at")
      .single();
    if (error) throw new Error("Unable to send your wish");
    return { wish };
  });
