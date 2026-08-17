"use client";

import Image from "next/image";
import { useState } from "react";

type Props = {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  sizes?: string;
  priority?: boolean;
};

// Tiny neutral SVG placeholder used for blurDataURL when a real blur isn't available.
const BLUR_SVG = `<svg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 10 10'><rect width='10' height='10' fill='%23eee'/></svg>`;
const BLUR_DATA_URL = `data:image/svg+xml;base64,${Buffer.from(BLUR_SVG).toString("base64")}`;

export default function OptimizedImage({ src, alt, width, height, className, sizes, priority }: Props) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    // Fallback to plain img if next/image fails (e.g., unsupported URL)
    return <img src={src} alt={alt} className={className} />;
  }

  const resolvedSizes = sizes || (width ? `${width}px` : "100vw");
  // Disable Next's image optimization in development to avoid the dev-server
  // optimizer proxy which can slow down requests for many remote images.
  const isDev = process.env.NODE_ENV === "development";
  return (
    <Image
      src={src}
      alt={alt}
      width={width ?? 0}
      height={height ?? 0}
      className={className}
      sizes={resolvedSizes}
      priority={priority}
      unoptimized={isDev}
      placeholder="blur"
      blurDataURL={BLUR_DATA_URL}
      onError={() => setFailed(true)}
    />
  );
}
