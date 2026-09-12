import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Published circulars, newest first. */
export const getCirculars = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("circulars")
      .select(
        "id, circular_number, title, summary, category, department, issued_date, file_url",
      )
      .eq("is_published", true)
      .order("issued_date", { ascending: false });
    if (error) throw new Error("Unable to load circulars");
    return { circulars: data ?? [] };
  });

/** One published circular with its full text. */
export const getCircular = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { circularId: string }) => {
    if (!data?.circularId) throw new Error("circularId is required");
    return { circularId: data.circularId };
  })
  .handler(async ({ data, context }) => {
    const { data: circular } = await context.supabase
      .from("circulars")
      .select(
        "id, circular_number, title, summary, body, category, department, issued_date, file_url",
      )
      .eq("id", data.circularId)
      .eq("is_published", true)
      .maybeSingle();
    if (!circular) throw new Error("Circular not found");

    // New attachments are stored in a private bucket. Older records can still
    // contain an external URL, so keep those links unchanged.
    let fileUrl = circular.file_url;
    if (fileUrl && !/^https?:\/\//i.test(fileUrl)) {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data: signed, error } = await supabaseAdmin.storage
        .from("circular-files")
        .createSignedUrl(fileUrl, 600, { download: true });
      if (error || !signed) throw new Error("Unable to prepare circular attachment");
      fileUrl = signed.signedUrl;
    }
    return { circular: { ...circular, file_url: fileUrl } };
  });
