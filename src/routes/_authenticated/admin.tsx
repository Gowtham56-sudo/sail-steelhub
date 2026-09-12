import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Loader2,
  ShieldCheck,
  Search,
  Plus,
  Eye,
  EyeOff,
  Cake,
  PartyPopper,
  Play,
  Trash2,
  Sparkles,
  Pencil,
  Megaphone,
  ImagePlus,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import {
  getAdminOverview,
  adminListEmployees,
  adminSaveEmployee,
  adminSetEmployeeFlags,
  adminListContent,
  adminSetPublished,
  adminCreateCircular,
  adminCreateCircularUpload,
  adminCreateEvent,
  adminCreateEventPhotoUpload,
  adminAddEventPhoto,
  adminGetCelebrations,
  adminRunCelebrations,
  adminListForms,
  adminCreateFormUpload,
  adminCreateForm,
  adminDeleteForm,
  adminListModules,
  adminGetModule,
  adminSaveModule,
  adminDeleteModule,
  adminAiDraftModule,
  adminCreateLearningVideoUpload,
  adminListAnnouncements,
  adminCreateAnnouncementImageUpload,
  adminSaveAnnouncement,
  adminDeleteAnnouncement,
} from "@/lib/admin.functions";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Admin Panel — SAIL Salem Steel Plant Knowledge Hub" },
      {
        name: "description",
        content:
          "Manage the Salem Steel Plant employee roster, learning content, events, circulars and audit logs.",
      },
      { property: "og:title", content: "Admin Panel — SAIL Salem Steel Plant Knowledge Hub" },
      {
        property: "og:description",
        content: "Role-based administration for the Salem Steel Plant employee knowledge hub.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminPage,
});

type Tab =
  | "overview"
  | "employees"
  | "content"
  | "learning"
  | "forms"
  | "announcements"
  | "greetings"
  | "audit";

const TABS: { id: Tab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "employees", label: "Employees" },
  { id: "content", label: "Content" },
  { id: "learning", label: "Learning" },
  { id: "forms", label: "Forms" },
  { id: "announcements", label: "Announcements" },
  { id: "greetings", label: "Greetings" },
  { id: "audit", label: "Audit" },
];

const inputClass =
  "min-h-12 w-full rounded-xl border-2 border-border bg-background px-3 text-base";

function AdminPage() {
  const [tab, setTab] = useState<Tab>("overview");

  return (
    <AppShell title="Admin Panel">
      <div className="card-elevated flex items-center gap-3 p-4">
        <ShieldCheck aria-hidden className="size-7 text-accent" />
        <p className="text-base font-semibold">Administrator tools — all actions are logged.</p>
      </div>

      <div
        role="tablist"
        aria-label="Admin sections"
        className="mt-4 grid grid-cols-3 gap-1 rounded-xl bg-muted p-1"
      >
        {TABS.map((x) => (
          <button
            key={x.id}
            role="tab"
            aria-selected={tab === x.id}
            type="button"
            onClick={() => setTab(x.id)}
            className={`min-h-12 rounded-lg text-sm font-bold ${
              tab === x.id ? "bg-card text-primary shadow" : "text-muted-foreground"
            }`}
          >
            {x.label}
          </button>
        ))}
      </div>

      <div className="mt-5">
        {tab === "overview" ? <OverviewTab /> : null}
        {tab === "employees" ? <EmployeesTab /> : null}
        {tab === "content" ? <ContentTab /> : null}
        {tab === "learning" ? <LearningTab /> : null}
        {tab === "forms" ? <FormsTab /> : null}
        {tab === "announcements" ? <AnnouncementsTab /> : null}
        {tab === "greetings" ? <GreetingsTab /> : null}
        {tab === "audit" ? <AuditTab /> : null}
      </div>
    </AppShell>
  );
}

function Spinner() {
  return (
    <p className="flex items-center gap-2 text-lg text-muted-foreground">
      <Loader2 aria-hidden className="size-5 animate-spin" />
      Loading…
    </p>
  );
}

function useOverview() {
  const fn = useServerFn(getAdminOverview);
  return useQuery({ queryKey: ["admin-overview"], queryFn: () => fn() });
}

function OverviewTab() {
  const { data, isPending, error } = useOverview();
  if (isPending) return <Spinner />;
  if (error) return <p className="text-lg text-destructive">You do not have admin access.</p>;

  const s = data!.stats;
  const cards = [
    { label: "Employees on roster", value: s.employees },
    { label: "Accounts activated", value: s.activated },
    { label: "Learning modules", value: s.modules },
    { label: "Quiz attempts", value: s.attempts },
    { label: "Events", value: s.events },
    { label: "Circulars", value: s.circulars },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {cards.map((c) => (
        <div key={c.label} className="card-elevated p-4">
          <p className="text-3xl font-bold text-primary">{c.value}</p>
          <p className="mt-1 text-sm font-semibold text-muted-foreground">{c.label}</p>
        </div>
      ))}
    </div>
  );
}

const EMPTY_EMPLOYEE = {
  id: undefined as string | undefined,
  employee_number: "",
  full_name: "",
  designation: "",
  grade: "",
  department: "",
  date_of_birth: "",
  date_of_joining: "",
  date_of_joining_ssp: "",
  work_email: "",
  phone: "",
};

function EmployeesTab() {
  const qc = useQueryClient();
  const list = useServerFn(adminListEmployees);
  const save = useServerFn(adminSaveEmployee);
  const setFlags = useServerFn(adminSetEmployeeFlags);

  const [search, setSearch] = useState("");
  const [form, setForm] = useState<typeof EMPTY_EMPLOYEE | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const { data, isPending } = useQuery({
    queryKey: ["admin-employees", search],
    queryFn: () => list({ data: { search } }),
  });

  const saveMutation = useMutation({
    mutationFn: (values: typeof EMPTY_EMPLOYEE) => save({ data: values }),
    onSuccess: () => {
      setForm(null);
      setMessage("Employee saved.");
      qc.invalidateQueries({ queryKey: ["admin-employees"] });
      qc.invalidateQueries({ queryKey: ["admin-overview"] });
    },
    onError: (e: Error) => setMessage(e.message),
  });

  const flagMutation = useMutation({
    mutationFn: (v: { id: string; is_active?: boolean; is_admin?: boolean }) =>
      setFlags({ data: v }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-employees"] }),
    onError: (e: Error) => setMessage(e.message),
  });

  return (
    <div>
      <label className="relative block">
        <Search
          aria-hidden
          className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground"
        />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search number, name or department"
          aria-label="Search employees"
          className={`${inputClass} pl-11`}
        />
      </label>

      <button
        type="button"
        onClick={() => {
          setMessage(null);
          setForm({ ...EMPTY_EMPLOYEE });
        }}
        className="mt-3 flex min-h-14 w-full items-center justify-center gap-2 rounded-xl bg-primary text-lg font-bold text-primary-foreground"
      >
        <Plus aria-hidden className="size-5" /> Add employee
      </button>

      {message ? <p className="mt-3 text-base font-semibold text-accent">{message}</p> : null}

      {form ? (
        <form
          className="card-elevated mt-4 space-y-3 p-4"
          onSubmit={(e) => {
            e.preventDefault();
            saveMutation.mutate(form);
          }}
        >
          <h2 className="text-xl font-bold">{form.id ? "Edit employee" : "New employee"}</h2>
          {(
            [
              ["employee_number", "Employee number", "text"],
              ["full_name", "Full name", "text"],
              ["designation", "Designation", "text"],
              ["grade", "Grade", "text"],
              ["department", "Department", "text"],
              ["date_of_birth", "Date of birth", "date"],
              ["date_of_joining", "Date of joining SAIL", "date"],
              ["date_of_joining_ssp", "Date of joining SSP", "date"],
              ["work_email", "Work email", "email"],
              ["phone", "Phone", "tel"],
            ] as const
          ).map(([key, label, type]) => (
            <label key={key} className="block">
              <span className="text-sm font-semibold text-muted-foreground">{label}</span>
              <input
                type={type}
                value={(form as Record<string, string>)[key] ?? ""}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                required={key === "employee_number" || key === "full_name"}
                className={inputClass}
              />
            </label>
          ))}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saveMutation.isPending}
              className="min-h-14 flex-1 rounded-xl bg-primary text-lg font-bold text-primary-foreground"
            >
              {saveMutation.isPending ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              onClick={() => setForm(null)}
              className="min-h-14 flex-1 rounded-xl border-2 border-border text-lg font-bold"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : null}

      {isPending ? (
        <div className="mt-4">
          <Spinner />
        </div>
      ) : (
        <ul className="mt-4 space-y-3">
          {(data?.employees ?? []).map((e) => (
            <li key={e.id} className="card-elevated p-4">
              <p className="text-lg font-bold">{e.full_name}</p>
              <p className="text-sm font-semibold text-muted-foreground">
                {e.employee_number} · {e.designation ?? "—"} · {e.grade ?? "—"} · {e.department ?? "—"}
              </p>
              <p className="mt-1 text-sm">
                {e.auth_user_id ? "Activated" : "Not activated"} ·{" "}
                {e.is_active ? "Active" : "Inactive"} · {e.is_admin ? "Admin" : "Employee"}
              </p>
              <div className="mt-3 grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setMessage(null);
                    setForm({
                      id: e.id,
                      employee_number: e.employee_number,
                      full_name: e.full_name,
                      designation: e.designation ?? "",
                      grade: e.grade ?? "",
                      department: e.department ?? "",
                      date_of_birth: e.date_of_birth ?? "",
                      date_of_joining: e.date_of_joining ?? "",
                      date_of_joining_ssp: e.date_of_joining_ssp ?? "",
                      work_email: e.work_email ?? "",
                      phone: e.phone ?? "",
                    });
                  }}
                  className="min-h-12 rounded-lg border-2 border-border text-sm font-bold"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => flagMutation.mutate({ id: e.id, is_active: !e.is_active })}
                  className="min-h-12 rounded-lg border-2 border-border text-sm font-bold"
                >
                  {e.is_active ? "Deactivate" : "Activate"}
                </button>
                <button
                  type="button"
                  onClick={() => flagMutation.mutate({ id: e.id, is_admin: !e.is_admin })}
                  className="min-h-12 rounded-lg border-2 border-border text-sm font-bold"
                >
                  {e.is_admin ? "Remove admin" : "Make admin"}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const CIRCULAR_FORM = {
  circular_number: "",
  title: "",
  summary: "",
  body: "",
  category: "General",
  department: "",
  issued_date: new Date().toISOString().slice(0, 10),
};

const EVENT_FORM = {
  title: "",
  description: "",
  category: "General",
  location: "",
  event_date: new Date().toISOString().slice(0, 10),
  is_published: true,
};

const MAX_UPLOAD_BYTES = 6 * 1024 * 1024;
const EVENT_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_VIDEO_UPLOAD_BYTES = 50 * 1024 * 1024;
const LEARNING_VIDEO_TYPES = new Set(["video/mp4", "video/webm", "video/quicktime"]);

function ContentTab() {
  const qc = useQueryClient();
  const listFn = useServerFn(adminListContent);
  const publishFn = useServerFn(adminSetPublished);
  const createCircularFn = useServerFn(adminCreateCircular);
  const circularUploadFn = useServerFn(adminCreateCircularUpload);
  const createEventFn = useServerFn(adminCreateEvent);
  const photoUploadFn = useServerFn(adminCreateEventPhotoUpload);
  const addPhotoFn = useServerFn(adminAddEventPhoto);

  const [showCircularForm, setShowCircularForm] = useState(false);
  const [showEventForm, setShowEventForm] = useState(false);
  const [circularForm, setCircularForm] = useState({ ...CIRCULAR_FORM });
  const [circularFile, setCircularFile] = useState<File | null>(null);
  const [eventForm, setEventForm] = useState({ ...EVENT_FORM });
  const [eventPhotos, setEventPhotos] = useState<File[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  const { data, isPending } = useQuery({
    queryKey: ["admin-content"],
    queryFn: () => listFn(),
  });

  const publish = useMutation({
    mutationFn: (v: {
      table: "circulars" | "events" | "learning_modules";
      id: string;
      is_published: boolean;
    }) => publishFn({ data: v }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-content"] }),
    onError: (e: Error) => setMessage(e.message),
  });

  const createCircular = useMutation({
    mutationFn: async ({ fields, file }: { fields: typeof CIRCULAR_FORM; file: File | null }) => {
      let file_url: string | undefined;
      if (file) {
        if (file.size > MAX_UPLOAD_BYTES) throw new Error("Attachment must be 6 MB or smaller.");
        const slot = await circularUploadFn({ data: { fileName: file.name } });
        const { error } = await supabase.storage
          .from("circular-files")
          .uploadToSignedUrl(slot.path, slot.token, file);
        if (error) throw new Error(error.message);
        file_url = slot.path;
      }
      return createCircularFn({ data: { ...fields, file_url } });
    },
    onSuccess: () => {
      setShowCircularForm(false);
      setCircularForm({ ...CIRCULAR_FORM });
      setCircularFile(null);
      setMessage("Circular published.");
      qc.invalidateQueries({ queryKey: ["admin-content"] });
    },
    onError: (e: Error) => setMessage(e.message),
  });

  const createEvent = useMutation({
    mutationFn: async ({ fields, photos }: { fields: typeof EVENT_FORM; photos: File[] }) => {
      for (const photo of photos) {
        if (photo.size > MAX_UPLOAD_BYTES) {
          throw new Error(`${photo.name} must be 6 MB or smaller.`);
        }
        if (!EVENT_IMAGE_TYPES.has(photo.type)) {
          throw new Error(`${photo.name} must be a JPG, PNG, or WebP image.`);
        }
      }
      const event = await createEventFn({ data: fields });
      for (let index = 0; index < photos.length; index += 1) {
        const photo = photos[index];
        if (!photo) continue;
        const slot = await photoUploadFn({
          data: { fileName: photo.name, contentType: photo.type as "image/jpeg" | "image/png" | "image/webp" },
        });
        const { error } = await supabase.storage
          .from("event-media")
          .uploadToSignedUrl(slot.path, slot.token, photo);
        if (error) throw new Error(error.message);
        await addPhotoFn({
          data: { eventId: event.id, path: slot.path, setAsCover: index === 0 },
        });
      }
      return event;
    },
    onSuccess: () => {
      setShowEventForm(false);
      setEventForm({ ...EVENT_FORM });
      setEventPhotos([]);
      setMessage("Event published. Photos are visible in the event gallery.");
      qc.invalidateQueries({ queryKey: ["admin-content"] });
    },
    onError: (e: Error) => setMessage(e.message),
  });

  function Group({
    title,
    table,
    rows,
  }: {
    title: string;
    table: "circulars" | "events" | "learning_modules";
    rows: { id: string; title: string; is_published: boolean; category?: string | null }[];
  }) {
    return (
      <section className="mt-5">
        <h2 className="text-xl font-bold">{title}</h2>
        <ul className="mt-3 space-y-3">
          {rows.map((r) => (
            <li key={r.id} className="card-elevated flex items-center gap-3 p-4">
              <div className="min-w-0 flex-1">
                <p className="truncate text-base font-bold">{r.title}</p>
                <p className="text-sm text-muted-foreground">
                  {r.category ?? "—"} · {r.is_published ? "Published" : "Draft"}
                </p>
              </div>
              <button
                type="button"
                aria-label={r.is_published ? `Unpublish ${r.title}` : `Publish ${r.title}`}
                onClick={() => publish.mutate({ table, id: r.id, is_published: !r.is_published })}
                className="flex size-12 shrink-0 items-center justify-center rounded-lg border-2 border-border"
              >
                {r.is_published ? (
                  <Eye aria-hidden className="size-5 text-primary" />
                ) : (
                  <EyeOff aria-hidden className="size-5 text-muted-foreground" />
                )}
              </button>
            </li>
          ))}
        </ul>
      </section>
    );
  }

  if (isPending) return <Spinner />;

  return (
    <div>
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => {
            setShowCircularForm((v) => !v);
            setShowEventForm(false);
          }}
          className="flex min-h-14 items-center justify-center gap-2 rounded-xl bg-primary text-base font-bold text-primary-foreground"
        >
          <Plus aria-hidden className="size-5" /> New circular
        </button>
        <button
          type="button"
          onClick={() => {
            setShowEventForm((v) => !v);
            setShowCircularForm(false);
          }}
          className="flex min-h-14 items-center justify-center gap-2 rounded-xl border-2 border-primary text-base font-bold text-primary"
        >
          <Plus aria-hidden className="size-5" /> New event
        </button>
      </div>
      {message ? <p className="mt-3 text-base font-semibold text-accent">{message}</p> : null}

      {showCircularForm ? (
        <form
          className="card-elevated mt-4 space-y-3 p-4"
          onSubmit={(e) => {
            e.preventDefault();
            createCircular.mutate({ fields: circularForm, file: circularFile });
          }}
        >
          {(
            [
              ["circular_number", "Circular number", "text"],
              ["title", "Title", "text"],
              ["category", "Category", "text"],
              ["department", "Department", "text"],
              ["issued_date", "Issued date", "date"],
            ] as const
          ).map(([key, label, type]) => (
            <label key={key} className="block">
              <span className="text-sm font-semibold text-muted-foreground">{label}</span>
              <input
                type={type}
                value={circularForm[key]}
                onChange={(e) => setCircularForm({ ...circularForm, [key]: e.target.value })}
                required={key !== "department"}
                className={inputClass}
              />
            </label>
          ))}
          <label className="block">
            <span className="text-sm font-semibold text-muted-foreground">Summary</span>
            <textarea
              value={circularForm.summary}
              onChange={(e) => setCircularForm({ ...circularForm, summary: e.target.value })}
              rows={2}
              className="w-full rounded-xl border-2 border-border bg-background p-3 text-base"
            />
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-muted-foreground">Full text</span>
            <textarea
              value={circularForm.body}
              onChange={(e) => setCircularForm({ ...circularForm, body: e.target.value })}
              rows={5}
              className="w-full rounded-xl border-2 border-border bg-background p-3 text-base"
            />
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-muted-foreground">
              Attachment (optional, max 6 MB)
            </span>
            <input
              type="file"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
              onChange={(e) => setCircularFile(e.target.files?.[0] ?? null)}
              className="mt-1 w-full text-base"
            />
          </label>
          <button
            type="submit"
            disabled={createCircular.isPending}
            className="min-h-14 w-full rounded-xl bg-primary text-lg font-bold text-primary-foreground"
          >
            {createCircular.isPending ? "Publishing…" : "Publish circular"}
          </button>
        </form>
      ) : null}

      {showEventForm ? (
        <form
          className="card-elevated mt-4 space-y-3 p-4"
          onSubmit={(e) => {
            e.preventDefault();
            createEvent.mutate({ fields: eventForm, photos: eventPhotos });
          }}
        >
          <h2 className="text-lg font-bold">New event and photo gallery</h2>
          {(
            [
              ["title", "Event title", "text"],
              ["category", "Category", "text"],
              ["location", "Location", "text"],
              ["event_date", "Event date", "date"],
            ] as const
          ).map(([key, label, type]) => (
            <label key={key} className="block">
              <span className="text-sm font-semibold text-muted-foreground">{label}</span>
              <input
                type={type}
                value={eventForm[key]}
                onChange={(e) => setEventForm({ ...eventForm, [key]: e.target.value })}
                required={key === "title" || key === "event_date"}
                className={inputClass}
              />
            </label>
          ))}
          <label className="block">
            <span className="text-sm font-semibold text-muted-foreground">Description</span>
            <textarea
              value={eventForm.description}
              onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
              rows={4}
              className="w-full rounded-xl border-2 border-border bg-background p-3 text-base"
            />
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-muted-foreground">
              Photos (JPG, PNG, or WebP; each max 6 MB)
            </span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={(e) => setEventPhotos(Array.from(e.target.files ?? []))}
              className="mt-1 w-full text-base"
            />
            {eventPhotos.length ? (
              <p className="mt-1 text-sm text-muted-foreground">
                {eventPhotos.length} photo{eventPhotos.length === 1 ? "" : "s"} selected. The first will be the cover image.
              </p>
            ) : null}
          </label>
          <button
            type="submit"
            disabled={createEvent.isPending}
            className="min-h-14 w-full rounded-xl bg-primary text-lg font-bold text-primary-foreground"
          >
            {createEvent.isPending ? "Publishing…" : "Publish event"}
          </button>
        </form>
      ) : null}

      <Group
        title="Circulars"
        table="circulars"
        rows={(data?.circulars ?? []).map((c) => ({
          id: c.id,
          title: `${c.circular_number} — ${c.title}`,
          is_published: c.is_published,
          category: c.category,
        }))}
      />
      <Group
        title="Events"
        table="events"
        rows={(data?.events ?? []).map((e) => ({
          id: e.id,
          title: e.title,
          is_published: e.is_published,
          category: e.category,
        }))}
      />
      <Group
        title="Learning modules"
        table="learning_modules"
        rows={(data?.modules ?? []).map((m) => ({
          id: m.id,
          title: m.title,
          is_published: m.is_published,
          category: m.category,
        }))}
      />
    </div>
  );
}

const ANNOUNCEMENT_FORM = {
  id: undefined as string | undefined,
  title: "",
  body: "",
  image_path: null as string | null,
  is_published: true,
};

function AnnouncementsTab() {
  const qc = useQueryClient();
  const listFn = useServerFn(adminListAnnouncements);
  const uploadFn = useServerFn(adminCreateAnnouncementImageUpload);
  const saveFn = useServerFn(adminSaveAnnouncement);
  const deleteFn = useServerFn(adminDeleteAnnouncement);
  const [form, setForm] = useState({ ...ANNOUNCEMENT_FORM });
  const [image, setImage] = useState<File | null>(null);
  const [showComposer, setShowComposer] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const { data, isPending, error } = useQuery({
    queryKey: ["admin-announcements"],
    queryFn: () => listFn(),
  });

  const save = useMutation({
    mutationFn: async ({ fields, file }: { fields: typeof ANNOUNCEMENT_FORM; file: File | null }) => {
      let image_path = fields.image_path;
      if (file) {
        if (file.size > 5 * 1024 * 1024) throw new Error("Announcement image must be 5 MB or smaller.");
        if (!EVENT_IMAGE_TYPES.has(file.type)) throw new Error("Use a JPG, PNG, or WebP image.");
        const slot = await uploadFn({
          data: {
            fileName: file.name,
            contentType: file.type as "image/jpeg" | "image/png" | "image/webp",
          },
        });
        const { error: uploadError } = await supabase.storage
          .from("announcement-images")
          .uploadToSignedUrl(slot.path, slot.token, file);
        if (uploadError) throw new Error(uploadError.message);
        image_path = slot.path;
      }
      return saveFn({ data: { ...fields, image_path } });
    },
    onSuccess: () => {
      setForm({ ...ANNOUNCEMENT_FORM });
      setImage(null);
      setShowComposer(false);
      setMessage("Announcement saved. Published announcements are now in every employee's notification bell.");
      qc.invalidateQueries({ queryKey: ["admin-announcements"] });
      qc.invalidateQueries({ queryKey: ["notification-summary"] });
    },
    onError: (e: Error) => setMessage(e.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: () => {
      setMessage("Announcement removed.");
      qc.invalidateQueries({ queryKey: ["admin-announcements"] });
      qc.invalidateQueries({ queryKey: ["notification-summary"] });
    },
    onError: (e: Error) => setMessage(e.message),
  });

  function resetComposer() {
    setForm({ ...ANNOUNCEMENT_FORM });
    setImage(null);
    setShowComposer(false);
  }

  if (isPending) return <Spinner />;
  if (error) return <p className="text-lg text-destructive">You do not have admin access.</p>;

  return (
    <div>
      <button
        type="button"
        onClick={() => {
          setShowComposer((visible) => !visible);
          setMessage(null);
        }}
        className="flex min-h-14 w-full items-center justify-center gap-2 rounded-xl bg-primary text-lg font-bold text-primary-foreground"
      >
        <Megaphone aria-hidden className="size-5" />
        {showComposer ? "Close announcement composer" : "New announcement"}
      </button>
      <p className="mt-2 text-sm text-muted-foreground">
        Publishing sends an in-app notification to every active employee. Add one optional image for a more visual post.
      </p>
      {message ? <p className="mt-3 text-base font-semibold text-accent">{message}</p> : null}

      {showComposer ? (
        <form
          className="card-elevated mt-4 space-y-3 p-4"
          onSubmit={(event) => {
            event.preventDefault();
            save.mutate({ fields: form, file: image });
          }}
        >
          <h2 className="text-lg font-bold">{form.id ? "Edit announcement" : "Create announcement"}</h2>
          <label className="block">
            <span className="text-sm font-semibold text-muted-foreground">Title</span>
            <input
              required
              maxLength={200}
              value={form.title}
              onChange={(event) => setForm({ ...form, title: event.target.value })}
              className={inputClass}
              placeholder="Example: Safety briefing on Friday"
            />
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-muted-foreground">Announcement</span>
            <textarea
              required
              maxLength={10000}
              rows={6}
              value={form.body}
              onChange={(event) => setForm({ ...form, body: event.target.value })}
              className="w-full rounded-xl border-2 border-border bg-background p-3 text-base"
              placeholder="Write the information employees need to know…"
            />
          </label>
          <label className="block">
            <span className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
              <ImagePlus aria-hidden className="size-4" /> Optional image (JPG, PNG, or WebP; max 5 MB)
            </span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(event) => setImage(event.target.files?.[0] ?? null)}
              className="mt-1 w-full text-base"
            />
            {image ? <p className="mt-1 text-sm text-muted-foreground">{image.name} will upload when saved.</p> : null}
            {!image && form.image_path ? (
              <button
                type="button"
                onClick={() => setForm({ ...form, image_path: null })}
                className="mt-2 text-sm font-bold text-destructive"
              >
                Remove current image
              </button>
            ) : null}
          </label>
          <label className="flex min-h-12 items-center gap-3 text-base font-semibold">
            <input
              type="checkbox"
              className="size-6"
              checked={form.is_published}
              onChange={(event) => setForm({ ...form, is_published: event.target.checked })}
            />
            Publish to every employee now
          </label>
          <button
            type="submit"
            disabled={save.isPending}
            className="min-h-14 w-full rounded-xl bg-primary text-lg font-bold text-primary-foreground"
          >
            {save.isPending ? "Saving…" : form.is_published ? "Publish announcement" : "Save draft"}
          </button>
          <button
            type="button"
            onClick={resetComposer}
            className="min-h-12 w-full rounded-xl border-2 border-border text-base font-bold"
          >
            Cancel
          </button>
        </form>
      ) : null}

      <h2 className="mt-6 text-xl font-bold">Published and draft announcements</h2>
      {(data?.announcements ?? []).length === 0 ? (
        <p className="mt-3 text-lg text-muted-foreground">No announcements yet.</p>
      ) : (
        <ul className="mt-3 space-y-3">
          {(data?.announcements ?? []).map((announcement: any) => (
            <li key={announcement.id} className="card-elevated p-4">
              <div className="flex gap-3">
                <Megaphone aria-hidden className="mt-0.5 size-6 shrink-0 text-primary" />
                <div className="min-w-0 flex-1">
                  <p className="text-lg font-bold">{announcement.title}</p>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground line-clamp-3">
                    {announcement.body}
                  </p>
                  <p className="mt-2 text-sm font-semibold text-muted-foreground">
                    {announcement.is_published ? "Published to employee notifications" : "Draft"}
                    {announcement.image_path ? " · image attached" : ""}
                  </p>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setForm({
                      id: announcement.id,
                      title: announcement.title,
                      body: announcement.body,
                      image_path: announcement.image_path,
                      is_published: announcement.is_published,
                    });
                    setImage(null);
                    setShowComposer(true);
                    setMessage(null);
                  }}
                  className="flex min-h-12 items-center justify-center gap-2 rounded-xl border-2 border-primary text-base font-bold text-primary"
                >
                  <Pencil aria-hidden className="size-5" /> Edit
                </button>
                <button
                  type="button"
                  onClick={() => remove.mutate(announcement.id)}
                  disabled={remove.isPending}
                  className="flex min-h-12 items-center justify-center gap-2 rounded-xl border-2 border-destructive text-base font-bold text-destructive"
                >
                  <Trash2 aria-hidden className="size-5" /> Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function GreetingsTab() {
  const qc = useQueryClient();
  const listFn = useServerFn(adminGetCelebrations);
  const runFn = useServerFn(adminRunCelebrations);

  const { data, isPending, error } = useQuery({
    queryKey: ["admin-greetings"],
    queryFn: () => listFn(),
  });

  const run = useMutation({
    mutationFn: () => runFn(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-greetings"] });
      qc.invalidateQueries({ queryKey: ["admin-overview"] });
    },
  });

  return (
    <div>
      <button
        type="button"
        onClick={() => run.mutate()}
        disabled={run.isPending}
        className="flex min-h-14 w-full items-center justify-center gap-2 rounded-xl bg-primary text-lg font-bold text-primary-foreground"
      >
        {run.isPending ? (
          <Loader2 aria-hidden className="size-5 animate-spin" />
        ) : (
          <Play aria-hidden className="size-5" />
        )}
        Run today's greeting scan now
      </button>
      <p className="mt-2 text-sm text-muted-foreground">
        The database also runs this automatically every day at 9:00 AM India time and sends it to every employee's notification bell.
      </p>
      {run.data ? (
        <p className="mt-2 text-base font-semibold text-accent">
          Scan complete — {run.data.count} greeting{run.data.count === 1 ? "" : "s"} sent for
          today ({run.data.date}).
        </p>
      ) : null}
      {run.error ? (
        <p className="mt-2 text-base font-semibold text-destructive">{run.error.message}</p>
      ) : null}

      {isPending ? (
        <div className="mt-4">
          <Spinner />
        </div>
      ) : error ? (
        <p className="mt-4 text-lg text-destructive">You do not have admin access.</p>
      ) : !data!.greetings.length ? (
        <p className="mt-4 text-lg text-muted-foreground">
          No greetings sent yet. Use the button above or wait for the daily 9:00 AM scan.
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {data!.greetings.map((g: any) => {
            const isBirthday = g.kind === "birthday";
            return (
              <li key={g.id} className="card-elevated flex items-center gap-3 p-4">
                {isBirthday ? (
                  <Cake aria-hidden className="size-7 shrink-0 text-accent" />
                ) : (
                  <PartyPopper aria-hidden className="size-7 shrink-0 text-primary" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-base font-bold">
                    {g.title}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {isBirthday ? "Birthday" : "Work anniversary"} · {g.notice_date} ·{" "}
                    {new Date(g.created_at).toLocaleString()}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function AuditTab() {
  const { data, isPending, error } = useOverview();
  if (isPending) return <Spinner />;
  if (error) return <p className="text-lg text-destructive">You do not have admin access.</p>;

  const logs = data!.logs;
  if (!logs.length) return <p className="text-lg text-muted-foreground">No activity yet.</p>;

  return (
    <ul className="space-y-3">
      {logs.map((l) => (
        <li key={l.id} className="card-elevated p-4">
          <p className="text-base font-bold">{l.action}</p>
          <p className="text-sm text-muted-foreground">
            {l.entity ?? "—"} · {new Date(l.created_at).toLocaleString()}
          </p>
          <pre className="mt-2 overflow-x-auto text-xs text-muted-foreground">
            {JSON.stringify(l.details)}
          </pre>
        </li>
      ))}
    </ul>
  );
}

function FormsTab() {
  const qc = useQueryClient();
  const listFn = useServerFn(adminListForms);
  const uploadFn = useServerFn(adminCreateFormUpload);
  const createFn = useServerFn(adminCreateForm);
  const deleteFn = useServerFn(adminDeleteForm);

  const { data, isPending, error } = useQuery({
    queryKey: ["admin-forms"],
    queryFn: () => listFn(),
  });

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("General");
  const [department, setDepartment] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!file || title.trim().length < 3) {
      setMessage("Add a title and choose a file first.");
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      const slot = await uploadFn({ data: { fileName: file.name } });
      const { error: upErr } = await supabase.storage
        .from("forms")
        .uploadToSignedUrl(slot.path, slot.token, file);
      if (upErr) throw new Error(upErr.message);
      await createFn({
        data: {
          title: title.trim(),
          description: description.trim() || undefined,
          category: category.trim() || "General",
          department: department.trim() || undefined,
          file_url: slot.path,
          file_name: file.name,
        },
      });
      setTitle("");
      setDescription("");
      setDepartment("");
      setFile(null);
      setMessage("Form published for employees.");
      qc.invalidateQueries({ queryKey: ["admin-forms"] });
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  }

  const remove = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-forms"] }),
  });

  return (
    <div>
      <form onSubmit={submit} className="card-elevated space-y-3 p-4">
        <h2 className="text-lg font-bold">Upload a new form</h2>
        <input
          className={inputClass}
          placeholder="Form title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <input
          className={inputClass}
          placeholder="Short description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <div className="grid grid-cols-2 gap-3">
          <input
            className={inputClass}
            placeholder="Category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />
          <input
            className={inputClass}
            placeholder="Department (optional)"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
          />
        </div>
        <input
          type="file"
          aria-label="Form file"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="w-full text-base"
        />
        <button
          type="submit"
          disabled={busy}
          className="flex min-h-14 w-full items-center justify-center gap-2 rounded-xl bg-primary text-lg font-bold text-primary-foreground"
        >
          {busy ? (
            <Loader2 aria-hidden className="size-5 animate-spin" />
          ) : (
            <Plus aria-hidden className="size-5" />
          )}
          Publish form
        </button>
        {message ? <p className="text-base font-semibold text-accent">{message}</p> : null}
      </form>

      {isPending ? (
        <div className="mt-4">
          <Spinner />
        </div>
      ) : error ? (
        <p className="mt-4 text-lg text-destructive">You do not have admin access.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {(data?.forms ?? []).map((f) => (
            <li key={f.id} className="card-elevated p-4">
              <p className="text-lg font-bold">{f.title}</p>
              <p className="text-sm text-muted-foreground">
                {[f.category, f.department, f.file_name].filter(Boolean).join(" · ")}
              </p>
              <button
                type="button"
                onClick={() => remove.mutate(f.id)}
                disabled={remove.isPending}
                className="mt-3 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border-2 border-destructive text-base font-bold text-destructive"
              >
                <Trash2 aria-hidden className="size-5" />
                Delete form
              </button>
            </li>
          ))}
          {(data?.forms ?? []).length === 0 ? (
            <p className="text-lg text-muted-foreground">No forms uploaded yet.</p>
          ) : null}
        </ul>
      )}
    </div>
  );
}


type DraftQuestion = { question: string; options: string[]; correct_index: number; explanation: string };

function emptyQuestion(): DraftQuestion {
  return { question: "", options: ["", "", "", ""], correct_index: 0, explanation: "" };
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function LearningTab() {
  const qc = useQueryClient();
  const listFn = useServerFn(adminListModules);
  const getFn = useServerFn(adminGetModule);
  const saveFn = useServerFn(adminSaveModule);
  const deleteFn = useServerFn(adminDeleteModule);
  const draftFn = useServerFn(adminAiDraftModule);
  const videoUploadFn = useServerFn(adminCreateLearningVideoUpload);

  const { data, isPending, error } = useQuery({
    queryKey: ["admin-modules"],
    queryFn: () => listFn(),
  });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [category, setCategory] = useState("Safety");
  const [videoUrl, setVideoUrl] = useState("");
  const [videoPath, setVideoPath] = useState<string | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [publishDate, setPublishDate] = useState(todayISO());
  const [isPublished, setIsPublished] = useState(true);
  const [questions, setQuestions] = useState<DraftQuestion[]>([emptyQuestion()]);
  const [topic, setTopic] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  function resetForm() {
    setEditingId(null);
    setTitle("");
    setSummary("");
    setCategory("Safety");
    setVideoUrl("");
    setVideoPath(null);
    setVideoFile(null);
    setPublishDate(todayISO());
    setIsPublished(true);
    setQuestions([emptyQuestion()]);
    setMessage(null);
  }

  const load = useMutation({
    mutationFn: (id: string) => getFn({ data: { id } }),
    onSuccess: (r) => {
      setEditingId(r.module.id);
      setTitle(r.module.title);
      setSummary(r.module.summary ?? "");
      setCategory(r.module.category ?? "Safety");
      setVideoUrl(r.module.video_url ?? "");
      setVideoPath(r.module.video_path ?? null);
      setVideoFile(null);
      setPublishDate(r.module.publish_date);
      setIsPublished(r.module.is_published);
      setQuestions(
        r.questions.length
          ? r.questions.map((q) => ({
              question: q.question,
              options: [0, 1, 2, 3].map((i) => q.options[i] ?? ""),
              correct_index: q.correct_index,
              explanation: q.explanation ?? "",
            }))
          : [emptyQuestion()],
      );
      setMessage(null);
      if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
    },
  });

  const aiDraft = useMutation({
    mutationFn: () => draftFn({ data: topic.trim() ? { topic: topic.trim() } : {} }),
    onSuccess: (r) => {
      setTitle(r.title);
      setSummary(r.summary);
      setCategory(r.category || "Safety");
      setVideoUrl(r.video_url);
      setVideoPath(null);
      setVideoFile(null);
      setQuestions(
        (r.questions.length ? r.questions : [emptyQuestion()]).map((q: DraftQuestion) => ({
          question: q.question,
          options: [0, 1, 2, 3].map((i) => q.options[i] ?? ""),
          correct_index: q.correct_index,
          explanation: q.explanation ?? "",
        })),
      );
      setMessage("AI draft ready — check the video link and questions, then save.");
    },
    onError: (e) => setMessage(e instanceof Error ? e.message : "AI draft failed."),
  });

  const save = useMutation({
    mutationFn: async () => {
      let uploadedVideoPath = videoPath;
      let uploadedVideoUrl = videoUrl.trim() || null;

      if (videoFile) {
        if (!LEARNING_VIDEO_TYPES.has(videoFile.type)) {
          throw new Error("Choose an MP4, WebM, or MOV video file.");
        }
        if (videoFile.size > MAX_VIDEO_UPLOAD_BYTES) {
          throw new Error("Video must be 50 MB or smaller on the free Supabase plan.");
        }
        const slot = await videoUploadFn({
          data: {
            fileName: videoFile.name,
            contentType: videoFile.type as "video/mp4" | "video/webm" | "video/quicktime",
          },
        });
        const { error: uploadError } = await supabase.storage
          .from("learning-videos")
          .uploadToSignedUrl(slot.path, slot.token, videoFile);
        if (uploadError) throw new Error(uploadError.message);
        uploadedVideoPath = slot.path;
        uploadedVideoUrl = null;
      }

      return saveFn({
        data: {
          id: editingId,
          title: title.trim(),
          summary: summary.trim() || null,
          category: category.trim() || null,
          video_url: uploadedVideoUrl,
          video_path: uploadedVideoPath,
          publish_date: publishDate,
          is_published: isPublished,
          questions: questions
            .filter((q) => q.question.trim() && q.options.every((o) => o.trim()))
            .slice(0, 5)
            .map((q) => ({
              question: q.question.trim(),
              options: q.options.map((o) => o.trim()),
              correct_index: q.correct_index,
              explanation: q.explanation.trim() || null,
            })),
        },
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-modules"] });
      resetForm();
      setMessage("Saved. Employees will see this lesson and its quiz.");
    },
    onError: (e) => setMessage(e instanceof Error ? e.message : "Could not save."),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-modules"] }),
  });

  function setQuestion(index: number, patch: Partial<DraftQuestion>) {
    setQuestions((qs) => qs.map((q, i) => (i === index ? { ...q, ...patch } : q)));
  }

  return (
    <div>
      <section className="card-elevated space-y-3 p-4">
        <h2 className="text-lg font-bold">Let AI prepare today's lesson</h2>
        <p className="text-sm text-muted-foreground">
          One video and 5 quiz questions per day. You can edit everything before saving.
        </p>
        <input
          className={inputClass}
          placeholder="Topic (optional) — e.g. fire safety, PPE"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
        />
        <button
          type="button"
          onClick={() => aiDraft.mutate()}
          disabled={aiDraft.isPending}
          className="flex min-h-14 w-full items-center justify-center gap-2 rounded-xl border-2 border-primary text-lg font-bold text-primary"
        >
          {aiDraft.isPending ? (
            <Loader2 aria-hidden className="size-5 animate-spin" />
          ) : (
            <Sparkles aria-hidden className="size-5" />
          )}
          Generate with AI
        </button>
      </section>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate();
        }}
        className="card-elevated mt-4 space-y-3 p-4"
      >
        <h2 className="text-lg font-bold">{editingId ? "Edit lesson" : "New lesson"}</h2>
        <input
          className={inputClass}
          placeholder="Lesson title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <textarea
          className="min-h-24 w-full rounded-xl border-2 border-border bg-background p-3 text-base"
          placeholder="Short summary"
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
        />
        <div className="grid grid-cols-2 gap-3">
          <input
            className={inputClass}
            placeholder="Category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />
          <input
            type="date"
            aria-label="Publish date"
            className={inputClass}
            value={publishDate}
            onChange={(e) => setPublishDate(e.target.value)}
          />
        </div>
        <label className="block">
          <span className="text-sm font-semibold text-muted-foreground">
            Upload lesson video (MP4, WebM, or MOV; max 50 MB)
          </span>
          <input
            type="file"
            accept="video/mp4,video/webm,video/quicktime"
            onChange={(e) => {
              const selected = e.target.files?.[0] ?? null;
              setVideoFile(selected);
              if (selected) setVideoUrl("");
            }}
            className="mt-1 w-full text-base"
          />
          <p className="mt-1 text-sm text-muted-foreground">
            {videoFile
              ? `${videoFile.name} will upload when you publish the lesson.`
              : videoPath
                ? "A stored video is already attached to this lesson."
                : "Use a short, compressed video for the most reliable upload."}
          </p>
        </label>
        <input
          className={inputClass}
          placeholder="Or paste a YouTube embed URL"
          value={videoUrl}
          onChange={(e) => {
            setVideoUrl(e.target.value);
            if (e.target.value.trim()) {
              setVideoPath(null);
              setVideoFile(null);
            }
          }}
        />
        {(videoPath || videoUrl || videoFile) && (
          <button
            type="button"
            onClick={() => {
              setVideoUrl("");
              setVideoPath(null);
              setVideoFile(null);
            }}
            className="min-h-11 w-full rounded-xl border-2 border-border text-sm font-bold"
          >
            Remove lesson video
          </button>
        )}
        <label className="flex min-h-12 items-center gap-3 text-base font-semibold">
          <input
            type="checkbox"
            className="size-6"
            checked={isPublished}
            onChange={(e) => setIsPublished(e.target.checked)}
          />
          Visible to employees
        </label>

        <h3 className="pt-2 text-base font-bold">Quiz questions ({questions.length} of 5)</h3>
        {questions.map((q, i) => (
          <div key={i} className="rounded-xl border-2 border-border p-3">
            <div className="flex items-center justify-between">
              <p className="text-base font-bold">Question {i + 1}</p>
              {questions.length > 1 ? (
                <button
                  type="button"
                  onClick={() => setQuestions((qs) => qs.filter((_, x) => x !== i))}
                  className="text-base font-bold text-destructive"
                >
                  Remove
                </button>
              ) : null}
            </div>
            <input
              className={`${inputClass} mt-2`}
              placeholder="Question text"
              value={q.question}
              onChange={(e) => setQuestion(i, { question: e.target.value })}
            />
            {q.options.map((opt, oi) => (
              <label key={oi} className="mt-2 flex items-center gap-2">
                <input
                  type="radio"
                  name={`correct-${i}`}
                  className="size-6"
                  aria-label={`Option ${oi + 1} is correct`}
                  checked={q.correct_index === oi}
                  onChange={() => setQuestion(i, { correct_index: oi })}
                />
                <input
                  className={inputClass}
                  placeholder={`Option ${String.fromCharCode(65 + oi)}`}
                  value={opt}
                  onChange={(e) =>
                    setQuestion(i, {
                      options: q.options.map((o, x) => (x === oi ? e.target.value : o)),
                    })
                  }
                />
              </label>
            ))}
            <input
              className={`${inputClass} mt-2`}
              placeholder="Explanation (optional)"
              value={q.explanation}
              onChange={(e) => setQuestion(i, { explanation: e.target.value })}
            />
          </div>
        ))}
        {questions.length < 5 ? (
          <button
            type="button"
            onClick={() => setQuestions((qs) => [...qs, emptyQuestion()])}
            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border-2 border-border text-base font-bold"
          >
            <Plus aria-hidden className="size-5" />
            Add question
          </button>
        ) : null}

        <button
          type="submit"
          disabled={save.isPending}
          className="flex min-h-14 w-full items-center justify-center gap-2 rounded-xl bg-primary text-lg font-bold text-primary-foreground"
        >
          {save.isPending ? (
            <Loader2 aria-hidden className="size-5 animate-spin" />
          ) : (
            <Plus aria-hidden className="size-5" />
          )}
          {editingId ? "Save changes" : "Publish lesson"}
        </button>
        {editingId ? (
          <button
            type="button"
            onClick={resetForm}
            className="min-h-12 w-full rounded-xl border-2 border-border text-base font-bold"
          >
            Cancel editing
          </button>
        ) : null}
        {message ? <p className="text-base font-semibold text-accent">{message}</p> : null}
      </form>

      {isPending ? (
        <div className="mt-4">
          <Spinner />
        </div>
      ) : error ? (
        <p className="mt-4 text-lg text-destructive">You do not have admin access.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {(data?.modules ?? []).map((m) => (
            <li key={m.id} className="card-elevated p-4">
              <p className="text-lg font-bold">{m.title}</p>
              <p className="text-sm text-muted-foreground">
                {[m.category, m.publish_date, `${m.question_count} questions`]
                  .filter(Boolean)
                  .join(" · ")}
                {m.is_published ? "" : " · hidden"}
              </p>
              <div className="mt-3 flex gap-3">
                <button
                  type="button"
                  onClick={() => load.mutate(m.id)}
                  className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl border-2 border-primary text-base font-bold text-primary"
                >
                  <Pencil aria-hidden className="size-5" />
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => remove.mutate(m.id)}
                  disabled={remove.isPending}
                  className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl border-2 border-destructive text-base font-bold text-destructive"
                >
                  <Trash2 aria-hidden className="size-5" />
                  Delete
                </button>
              </div>
            </li>
          ))}
          {(data?.modules ?? []).length === 0 ? (
            <p className="text-lg text-muted-foreground">No lessons yet.</p>
          ) : null}
        </ul>
      )}
    </div>
  );
}
