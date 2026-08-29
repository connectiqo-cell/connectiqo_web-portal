import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { ImageResponse } from "next/og";

// Falls back up the route tree to any segment without its own
// opengraph-image — this one at the root layout covers every page that
// doesn't define a more specific image (none do yet).
export const alt = "Connectiqo — Live 1-on-1 Mentorship";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const logoBuffer = await readFile(join(process.cwd(), "public/connectiqo_logo.png"));
  const logoSrc = `data:image/png;base64,${logoBuffer.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          padding: "88px",
          textAlign: "center",
          backgroundColor: "#000008",
          backgroundImage:
            "radial-gradient(circle at 88% 12%, rgba(94,234,212,0.20), transparent 55%), radial-gradient(circle at 6% 92%, rgba(240,216,117,0.16), transparent 50%)",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: 12,
            display: "flex",
            backgroundImage: "linear-gradient(90deg, #f0d875, #5eead4)",
          }}
        />

        <div style={{ display: "flex", alignItems: "center", gap: 26 }}>
          {/* eslint-disable-next-line @next/next/no-img-element -- next/og renders via Satori, not the DOM; next/image can't be used here */}
          <img src={logoSrc} alt="" width={92} height={92} style={{ borderRadius: 22 }} />
          <span style={{ fontSize: 50, fontWeight: 800, color: "#f0f0fc", letterSpacing: -1 }}>
            Connectiqo
          </span>
        </div>

        <div style={{ display: "flex", marginTop: 56 }}>
          <span style={{ fontSize: 62, fontWeight: 800, color: "#f0f0fc", lineHeight: 1.2, maxWidth: 980 }}>
            Live 1-on-1 mentorship,{" "}anywhere.
          </span>
        </div>

        <div style={{ display: "flex", marginTop: 26 }}>
          <span style={{ fontSize: 28, color: "#b8b8d4", lineHeight: 1.5, maxWidth: 820 }}>
            Connect · Learn · Grow · Earn — book live video sessions with trusted mentors and creators.
          </span>
        </div>
      </div>
    ),
    { ...size },
  );
}
