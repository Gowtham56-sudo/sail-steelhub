import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Bell, CheckCheck, X, Megaphone, Loader as Loader2 } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import {
  getMyNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
  getAnnouncement,
} from "@/lib/announcements.functions";

const PRIORITY_BADGE: Record<string, string> = {
  normal: "bg-secondary text-secondary-foreground",
  important: "bg-accent/15 text-accent",
  urgent: "bg-destructive/15 text-destructive",
};

type NotificationRow = {
  id: string;
  announcement_id: string | null;
  title: string;
  message: string;
  type: string;
  priority: string;
  is_read: boolean;
  created_at: string;
};

type AnnouncementDetail = {
  id: string;
  title: string;
  content: string;
  category: string;
  priority: string;
  published_at: string | null;
};

export function NotificationBell() {
  const { t } = useI18n();
  const qc = useQueryClient();
  const fetchCount = useServerFn(getUnreadCount);
  const fetchList = useServerFn(getMyNotifications);
  const markRead = useServerFn(markNotificationRead);
  const markAll = useServerFn(markAllNotificationsRead);
  const fetchAnnouncement = useServerFn(getAnnouncement);

  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState<AnnouncementDetail | null>(null);

  const { data: countData } = useQuery({
    queryKey: ["unread-count"],
    queryFn: () => fetchCount(),
    refetchInterval: open ? 5000 : 30000,
  });

  const { data: notifData, isPending: listPending } = useQuery({
    queryKey: ["my-notifications"],
    queryFn: () => fetchList(),
    enabled: open,
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => markRead({ data: { id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-notifications"] });
      qc.invalidateQueries({ queryKey: ["unread-count"] });
    },
  });

  const markAllMutation = useMutation({
    mutationFn: () => markAll(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-notifications"] });
      qc.invalidateQueries({ queryKey: ["unread-count"] });
    },
  });

  const viewMutation = useMutation({
    mutationFn: (id: string) => fetchAnnouncement({ data: { id } }),
    onSuccess: (r) => {
      setDetail({
        id: r.announcement.id,
        title: r.announcement.title,
        content: r.announcement.content,
        category: r.announcement.category,
        priority: r.announcement.priority,
        published_at: r.announcement.published_at,
      });
    },
  });

  const unread = countData?.count ?? 0;
  const notifications: NotificationRow[] = notifData?.notifications ?? [];

  function openNotification(n: NotificationRow) {
    if (!n.is_read) markReadMutation.mutate(n.id);
    if (n.announcement_id) viewMutation.mutate(n.announcement_id);
  }

  if (detail) {
    return (
      <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60" onClick={() => setDetail(null)}>
        <div
          className="card-elevated max-h-[80vh] w-full max-w-md overflow-y-auto rounded-t-2xl p-5"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <Megaphone aria-hidden className="size-5 text-primary" />
              <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${PRIORITY_BADGE[detail.priority] ?? PRIORITY_BADGE["normal"]}`}>
                {detail.priority}
              </span>
            </div>
            <button type="button" onClick={() => setDetail(null)} className="rounded-lg p-1 text-muted-foreground">
              <X aria-hidden className="size-5" />
            </button>
          </div>
          <h2 className="mt-3 text-xl font-bold leading-snug">{detail.title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{detail.category}</p>
          <p className="mt-4 whitespace-pre-line text-base leading-relaxed">{detail.content}</p>
          {detail.published_at && (
            <p className="mt-4 text-sm text-muted-foreground">
              {new Date(detail.published_at).toLocaleString()}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        aria-label={t("notifications.label")}
        onClick={() => setOpen((v) => !v)}
        className="relative flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-foreground/15 text-primary-foreground transition-colors hover:bg-primary-foreground/25"
      >
        <Bell aria-hidden className="size-5" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex min-w-5 items-center justify-center rounded-full bg-accent px-1 text-xs font-bold text-accent-foreground">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-end" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/30" />
          <div
            className="card-elevated relative mt-16 mr-4 max-h-[70vh] w-full max-w-sm overflow-y-auto rounded-2xl p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-lg font-bold">{t("notifications.title")}</h2>
              <div className="flex items-center gap-2">
                {notifications.some((n) => !n.is_read) && (
                  <button
                    type="button"
                    onClick={() => markAllMutation.mutate()}
                    disabled={markAllMutation.isPending}
                    className="flex items-center gap-1 rounded-lg text-sm font-semibold text-primary"
                  >
                    <CheckCheck aria-hidden className="size-4" />
                    {t("notifications.markAll")}
                  </button>
                )}
                <button type="button" onClick={() => setOpen(false)} className="rounded-lg p-1 text-muted-foreground">
                  <X aria-hidden className="size-5" />
                </button>
              </div>
            </div>

            {listPending ? (
              <p className="mt-4 flex items-center gap-2 text-base text-muted-foreground">
                <Loader2 aria-hidden className="size-5 animate-spin" />
                {t("common.loading")}
              </p>
            ) : notifications.length === 0 ? (
              <p className="mt-4 py-8 text-center text-base text-muted-foreground">
                {t("notifications.empty")}
              </p>
            ) : (
              <ul className="mt-3 space-y-2">
                {notifications.map((n) => (
                  <li key={n.id}>
                    <button
                      type="button"
                      onClick={() => openNotification(n)}
                      className={`w-full rounded-xl border-2 p-3 text-left transition-colors ${
                        n.is_read
                          ? "border-border bg-card/50"
                          : "border-primary/30 bg-primary/5"
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <Megaphone aria-hidden className="mt-0.5 size-4 shrink-0 text-primary" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold leading-snug">{n.title}</p>
                          <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{n.message}</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {new Date(n.created_at).toLocaleString()}
                          </p>
                        </div>
                        {!n.is_read && (
                          <span className="mt-1 size-2.5 shrink-0 rounded-full bg-accent" aria-hidden />
                        )}
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </>
  );
}
