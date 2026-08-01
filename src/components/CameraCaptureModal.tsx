"use client";

import { Camera, RotateCcw, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

/**
 * Laptop-webcam equivalent of mobile's "Take Photo" option in
 * pickProfileAvatar.js (which offers Take Photo vs Choose from Library via
 * the native camera). getUserMedia + a canvas grab is the browser analogue —
 * there's no native camera roll on desktop web.
 */
export function CameraCaptureModal({
  onCapture,
  onClose,
}: {
  onCapture: (file: File) => void;
  onClose: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState("");
  const [capturedUrl, setCapturedUrl] = useState<string | null>(null);
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch (err) {
        if (!cancelled) {
          const error = err as DOMException;
          if (error.name === "NotAllowedError") {
            setError("Camera permission denied.");
          } else if (error.name === "NotFoundError") {
            setError("No camera found on this device.");
          } else {
            setError("Could not access camera.");
          }
        }
      }
    })();
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const handleCapture = () => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        setCapturedBlob(blob);
        setCapturedUrl(URL.createObjectURL(blob));
      },
      "image/jpeg",
      0.92,
    );
  };

  const handleRetake = () => {
    if (capturedUrl) URL.revokeObjectURL(capturedUrl);
    setCapturedUrl(null);
    setCapturedBlob(null);
  };

  const handleUse = () => {
    if (!capturedBlob) return;
    onCapture(new File([capturedBlob], `avatar-${Date.now()}.jpg`, { type: "image/jpeg" }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div
        className="flex w-full max-w-md flex-col gap-3 rounded-2xl border border-border-light bg-surface-panel p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-text-primary">Take a photo</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="text-text-muted hover:text-text-primary">
            <X size={18} />
          </button>
        </div>

        {error ? (
          <div className="flex flex-col items-center justify-center gap-3 py-12">
            <p className="text-sm text-accent-error">{error}</p>
          </div>
        ) : (
          <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-black">
            {capturedUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- local object URL, not a remote asset
              <img src={capturedUrl} alt="Captured preview" className="h-full w-full object-cover" />
            ) : (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="h-full w-full -scale-x-100 object-cover"
              />
            )}
          </div>
        )}

        <div className="flex gap-2">
          {capturedUrl ? (
            <>
              <button
                type="button"
                onClick={handleRetake}
                className="flex flex-1 items-center justify-center gap-2 rounded-full border border-border-light px-4 py-2.5 text-sm font-semibold text-text-secondary"
              >
                <RotateCcw size={16} />
                Retake
              </button>
              <button
                type="button"
                onClick={handleUse}
                className="flex-1 rounded-full px-4 py-2.5 text-sm font-semibold text-text-on-accent"
                style={{ backgroundImage: "var(--gradient-button-primary)" }}
              >
                Use photo
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={handleCapture}
              className="flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold text-text-on-accent"
              style={{ backgroundImage: "var(--gradient-button-primary)" }}
            >
              <Camera size={16} />
              Capture
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
