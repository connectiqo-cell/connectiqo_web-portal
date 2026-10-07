import { createClient } from "@/lib/supabase/client";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/supabase/env";

/**
 * Uploads a file to Supabase Storage via XHR instead of the SDK's
 * fetch-based `.upload()` — fetch doesn't expose upload progress in any
 * browser, XHR does. Mirrors storage-js's own wire format exactly: a
 * multipart POST to /object/{bucket}/{path} with a `cacheControl` field
 * and the file under an unnamed field.
 */
function send({
  bucket,
  path,
  file,
  accessToken,
  onProgress,
}: {
  bucket: string;
  path: string;
  file: File;
  accessToken: string;
  onProgress?: (pct: number) => void;
}): Promise<void> {
  const formData = new FormData();
  formData.append("cacheControl", "3600");
  formData.append("", file);

  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${SUPABASE_URL}/storage/v1/object/${bucket}/${path}`);
    xhr.setRequestHeader("apikey", SUPABASE_ANON_KEY!);
    xhr.setRequestHeader("Authorization", `Bearer ${accessToken}`);
    xhr.setRequestHeader("x-upsert", "false");

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
        return;
      }
      const err = new Error(`Upload failed (${xhr.status}): ${xhr.responseText || "no response body"}`);
      (err as Error & { status?: number }).status = xhr.status;
      reject(err);
    };
    xhr.onerror = () => reject(new Error("Upload failed — network error"));
    xhr.send(formData);
  });
}

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

  try {
    await send({ bucket, path, file, accessToken: session?.access_token || SUPABASE_ANON_KEY!, onProgress });
  } catch (err) {
    // A stale/expired access token (tab left idle before starting a large
    // upload, or sitting past refresh) gets rejected by the bucket's RLS
    // policy as a 400/401 before the file body is even looked at. Force a
    // real refresh and retry once rather than failing the whole upload on
    // what's really just a token that needed renewing.
    const status = (err as Error & { status?: number }).status;
    if (status !== 400 && status !== 401) throw err;

    const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession();
    if (refreshError || !refreshed.session) throw err;

    await send({ bucket, path, file, accessToken: refreshed.session.access_token, onProgress });
  }
}
