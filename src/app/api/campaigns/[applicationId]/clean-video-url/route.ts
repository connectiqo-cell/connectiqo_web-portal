import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/supabase/env";

// CollabHub Phase 3: serves a short-lived signed URL to the clean
// (non-watermarked) original — the private "campaign-submissions" bucket has
// no client read policy at all (same reasoning as mentor-videos' private
// paths), so this is the only way to ever see that file, and only once a
// campaign_unlocks row proves the brand actually paid for it.
const SIGNED_URL_TTL_SECONDS = 60 * 10;

interface RouteParams {
  params: Promise<{ applicationId: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { applicationId } = await params;
    if (!applicationId) {
      return NextResponse.json({ error: "applicationId is required" }, { status: 400 });
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
    const { data: unlock, error: unlockError } = await admin
      .from("campaign_unlocks")
      .select("brand_id, creator_id")
      .eq("application_id", applicationId)
      .maybeSingle();
    if (unlockError) throw unlockError;
    if (!unlock) {
      return NextResponse.json({ error: "This video hasn't been unlocked yet" }, { status: 402 });
    }
    if (caller.id !== unlock.brand_id && caller.id !== unlock.creator_id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { data: submission, error: subError } = await admin
      .from("campaign_submissions")
      .select("original_storage_path")
      .eq("application_id", applicationId)
      .single();
    if (subError || !submission?.original_storage_path) {
      return NextResponse.json({ error: "Original video not found" }, { status: 404 });
    }

    const { data: signed, error: signError } = await admin.storage
      .from("campaign-submissions")
      .createSignedUrl(submission.original_storage_path, SIGNED_URL_TTL_SECONDS);
    if (signError || !signed) {
      throw new Error(signError?.message || "Could not create a download link");
    }

    return NextResponse.json({ url: signed.signedUrl });
  } catch (error) {
    console.error("clean-video-url error:", error);
    return NextResponse.json(
      { error: (error as Error)?.message || "Could not get the video download link" },
      { status: 500 },
    );
  }
}
