import { createClient } from "@/lib/supabase/client";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/supabase/env";

/**
 * Uploads a file to Supabase Storage via XHR instead of the SDK's
 * fetch-based `.upload()` — fetch doesn't expose upload progress in any
 * browser, XHR does. Mirrors storage-js's own wire format exactly: a
 * multipart POST to /object/{bucket}/{path} with a `cacheControl` field
 * and the file under an unnamed field.
 */
export async function uploadFileWithProgress({
  bucket,
  path,
  file,
  onProgress,
}: {
  bucket: string;
  path: string;
  file: File;
  onProgress?: (pct: number) => void;
}): Promise<void> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const formData = new FormData();
  formData.append("cacheControl", "3600");
  formData.append("", file);

  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${SUPABASE_URL}/storage/v1/object/${bucket}/${path}`);
    xhr.setRequestHeader("apikey", SUPABASE_ANON_KEY!);
    xhr.setRequestHeader("Authorization", `Bearer ${session?.access_token || SUPABASE_ANON_KEY}`);
    xhr.setRequestHeader("x-upsert", "false");

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error(`Upload failed (${xhr.status})`));
      }
    };
    xhr.onerror = () => reject(new Error("Upload failed — network error"));
    xhr.send(formData);
  });
}
