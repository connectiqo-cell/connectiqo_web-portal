/**
 * Web has no custom branded recording template (mobile does, via a separate
 * headless template app + VideoSDK's REST API). This is the SDK-native
 * fallback config mobile itself uses when no template is involved — it
 * still lets us pick a landscape, side-by-side layout instead of VideoSDK's
 * default, just without custom branding overlays.
 */
export interface RecordingConfig {
  layout: {
    type: "GRID" | "SPOTLIGHT" | "SIDEBAR";
    priority: "SPEAKER" | "PIN";
    gridSize: number;
  };
  orientation: "landscape" | "portrait";
  theme: "DEFAULT" | "DARK" | "LIGHT";
  quality: "low" | "med" | "high";
  mode: "video-and-audio" | "audio";
}

/**
 * Landscape, side-by-side (2-up grid) layout for 1:1 mentor sessions.
 * `priority: "PIN"` (not "SPEAKER") keeps both tiles fixed and equally
 * sized regardless of who's talking — "SPEAKER" would dynamically enlarge
 * whoever is active, which drifts away from the live side-by-side view's
 * always-even split.
 */
export function buildOneToOneRecordingConfig(activeParticipantCount = 2): RecordingConfig {
  const count = Math.max(1, Math.min(activeParticipantCount, 4));
  return {
    theme: "DARK",
    mode: "video-and-audio",
    // Matches the "med" test in startTemplateRecording's REST config —
    // see the comment there for why.
    quality: "med",
    orientation: "landscape",
    layout: { type: "GRID", priority: "PIN", gridSize: count },
  };
}
