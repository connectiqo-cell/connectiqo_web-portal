/**
 * Grabs a frame from a video file and returns it as a JPEG File, for use as
 * a fallback thumbnail when a mentor uploads a video without picking one.
 */
export function captureVideoFrame(file: File, seekTo = 1): Promise<File> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    video.playsInline = true;
    const url = URL.createObjectURL(file);
    video.src = url;

    const cleanup = () => URL.revokeObjectURL(url);

    video.onloadedmetadata = () => {
      const duration = video.duration || 0;
      video.currentTime = Math.min(seekTo, Math.max(0, duration - 0.1));
    };

    video.onseeked = () => {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        cleanup();
        reject(new Error("Could not create canvas context"));
        return;
      }
      ctx.drawImage(video, 0, 0);
      canvas.toBlob(
        (blob) => {
          cleanup();
          if (!blob) {
            reject(new Error("Could not capture video frame"));
            return;
          }
          resolve(new File([blob], "thumbnail.jpg", { type: "image/jpeg" }));
        },
        "image/jpeg",
        0.85,
      );
    };

    video.onerror = () => {
      cleanup();
      reject(new Error("Could not load video for thumbnail capture"));
    };
  });
}
