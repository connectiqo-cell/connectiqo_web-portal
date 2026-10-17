import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/supabase/env";

// ffmpeg isn't available in Supabase Edge Functions' Deno isolate, so this
// burn-in step runs here instead, in the Node runtime of this app's own
// Docker container (ffmpeg is installed via the Dockerfile).
export const runtime = "nodejs";

const execFileAsync = promisify(execFile);

const CONTENT_TYPE_BY_EXT: Record<string, string> = {
  mp4: "video/mp4",
  mov: "video/quicktime",
  webm: "video/webm",
  mkv: "video/x-matroska",
};

export async function POST(req: NextRequest) {
  let workDir: string | null = null;
  try {
    const { submissionId } = await req.json();
    if (!submissionId) {
      return NextResponse.json({ error: "submissionId is required" }, { status: 400 });
    }

    const authHeader = req.headers.get("authorization") ?? "";
    const callerClient = createSupabaseClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
      global: { headers: { Authorization: authHeader } },
    });
    const {
      data: { user: caller },
    } = await callerClient.auth.getUser();
    if (!caller) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createAdminClient();
    const { data: submission, error: fetchError } = await admin
      .from("campaign_submissions")
      .select("id, creator_id, original_storage_path")
      .eq("id", submissionId)
      .single();
    if (fetchError || !submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }
    if (submission.creator_id !== caller.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    if (!submission.original_storage_path) {
      return NextResponse.json({ error: "No video uploaded for this submission yet" }, { status: 400 });
    }

    const { data: fileBlob, error: downloadError } = await admin.storage
      .from("campaign-submissions")
      .download(submission.original_storage_path);
    if (downloadError || !fileBlob) {
      throw new Error(downloadError?.message || "Could not download the submitted video");
    }

    const ext = (submission.original_storage_path.split(".").pop() || "mp4").toLowerCase();
    workDir = await mkdtemp(join(tmpdir(), "collabhub-"));
    const inputPath = join(workDir, `input.${ext}`);
    const outputPath = join(workDir, `output.${ext}`);
    await writeFile(inputPath, Buffer.from(await fileBlob.arrayBuffer()));

    // Burn a semi-transparent, repeating "Connectiqo" watermark across the
    // video — this is what the brand reviews before paying; the original
    // (this input file) is never shown to them until payment.
    await execFileAsync("ffmpeg", [
      "-y",
      "-i",
      inputPath,
      "-vf",
      // fontfile is required explicitly — the Alpine image's ffmpeg has no
      // fonts for fontconfig to resolve a bare family name against (see
      // the font-dejavu package added in the Dockerfile).
      "drawtext=fontfile=/usr/share/fonts/dejavu/DejaVuSans-Bold.ttf:text='Connectiqo':fontcolor=white@0.45:fontsize=28:x=(w-text_w)/2:y=(h-text_h)/2:shadowcolor=black@0.4:shadowx=2:shadowy=2",
      "-codec:a",
      "copy",
      outputPath,
    ]);

    const outputBuffer = await readFile(outputPath);
    const watermarkedPath = submission.original_storage_path;
    const { error: uploadError } = await admin.storage
      .from("campaign-submissions-watermarked")
      .upload(watermarkedPath, outputBuffer, {
        contentType: CONTENT_TYPE_BY_EXT[ext] || "video/mp4",
        upsert: true,
      });
    if (uploadError) throw uploadError;

    const { data: publicUrlData } = admin.storage
      .from("campaign-submissions-watermarked")
      .getPublicUrl(watermarkedPath);

    const { error: updateError } = await admin
      .from("campaign_submissions")
      .update({
        watermarked_storage_path: watermarkedPath,
        watermarked_video_url: publicUrlData.publicUrl,
        status: "submitted",
        updated_at: new Date().toISOString(),
      })
      .eq("id", submissionId);
    if (updateError) throw updateError;

    return NextResponse.json({ success: true, watermarkedVideoUrl: publicUrlData.publicUrl });
  } catch (error) {
    console.error("process-submission error:", error);
    return NextResponse.json(
      { error: (error as Error)?.message || "Could not process the submission" },
      { status: 500 },
    );
  } finally {
    if (workDir) await rm(workDir, { recursive: true, force: true }).catch(() => {});
  }
}
