import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Published forms for employees, newest first. */
export const getForms = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("forms")
      .select("id, title, description, category, department, file_name, created_at")
      .eq("is_published", true)
      .order("created_at", { ascending: false });
    if (error) throw new Error("Unable to load forms");
    return { forms: data ?? [] };
  });

/** Short-lived download link for one published form. */
export const getFormDownloadUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { formId: string }) =>
    z.object({ formId: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: form } = await context.supabase
      .from("forms")
      .select("id, file_url, file_name")
      .eq("id", data.formId)
      .eq("is_published", true)
      .maybeSingle();
    if (!form) throw new Error("Form not found");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: signed, error } = await supabaseAdmin.storage
      .from("forms")
      .createSignedUrl(form.file_url, 300, { download: form.file_name ?? true });
    if (error || !signed) throw new Error("Unable to prepare download");
    return { url: signed.signedUrl, fileName: form.file_name };
  });
