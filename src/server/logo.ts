import { ACCEPTED_LOGO_TYPES, MAX_LOGO_BYTES } from "@/lib/constants";
import { createAdminClient } from "@/lib/supabase/admin";

const EXTENSIONS: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

export async function uploadBusinessLogo(
  file: File | null,
  businessId: string,
): Promise<{ url?: string; error?: string }> {
  if (!file || file.size === 0) return {};

  if (!ACCEPTED_LOGO_TYPES.includes(file.type as (typeof ACCEPTED_LOGO_TYPES)[number])) {
    return { error: "Upload a PNG, JPG or WebP image." };
  }
  if (file.size > MAX_LOGO_BYTES) {
    return { error: "Keep the logo under 2 MB." };
  }

  const admin = createAdminClient();
  if (!admin) {
    return {
      error:
        "Logo uploads are unavailable until Supabase Storage and the service role key are configured.",
    };
  }

  const extension = EXTENSIONS[file.type];
  const path = `${businessId}/logo-${Date.now()}.${extension}`;
  const bytes = Buffer.from(await file.arrayBuffer());

  const { error } = await admin.storage
    .from("business-logos")
    .upload(path, bytes, { contentType: file.type, upsert: false });

  if (error) {
    console.warn("logo upload failed");
    return { error: "We could not upload that image. Try a smaller file." };
  }

  const { data } = admin.storage.from("business-logos").getPublicUrl(path);
  return { url: data.publicUrl };
}
