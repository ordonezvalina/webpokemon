import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL || process.env.PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing SUPABASE_SERVICE_ROLE_KEY (and SUPABASE_URL or PUBLIC_SUPABASE_URL) environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false }
});

async function recreateBucket() {
  console.log("Deleting bucket fotos-figuras...");
  const { error: deleteError } = await supabase.storage.deleteBucket("fotos-figuras");
  if (deleteError && !deleteError.message?.includes("not found")) {
    throw deleteError;
  }

  console.log("Creating new bucket fotos-figuras...");
  const { data, error: createError } = await supabase.storage.createBucket("fotos-figuras", {
    public: true,
    fileSizeLimit: 5242880,
    allowedMimeTypes: ["image/webp", "image/jpeg", "image/png", "image/jpg"]
  });
  if (createError) throw createError;

  console.log("Bucket created:", data);

  console.log("Clearing image URLs from figures table...");
  const { error: dbError } = await supabase
    .from("figures")
    .update({ images_urls: [], image_url: null })
    .not("id", "is", null);
  if (dbError) throw dbError;

  console.log("Done");
}

recreateBucket().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
