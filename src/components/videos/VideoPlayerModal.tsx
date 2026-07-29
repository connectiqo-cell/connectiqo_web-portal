"use client";

import { Heart, MessageCircle, MoreVertical, Maximize, Pause, Play, Share2, Volume2, VolumeX } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export function VideoPlayerModal({
  isOpen,
  onClose,
  videoUrl,
  thumbnailUrl,
  title,
}: {
  isOpen: boolean;
  onClose: () => void;
  videoUrl: string;
  thumbnailUrl?: string;
  title: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(7400);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const video = videoRef.current;
    if (!video) return;
    video.play().catch(() => {});
    setIsPlaying(true);
  }, [isOpen]);

  const handlePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;
    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
    } else {
      video.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const handleStop = () => {
    const video = videoRef.current;
    if (!video) return;
    video.pause();
    video.currentTime = 0;
    setIsPlaying(false);
    setProgress(0);
  };

  const handleMuteToggle = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video) return;
    setCurrentTime(video.currentTime);
    setProgress((video.currentTime / video.duration) * 100 || 0);
  };

  const handleLoadedMetadata = () => {
    const video = videoRef.current;
    if (!video) return;
    setDuration(video.duration);
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current;
    if (!video) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    video.currentTime = percent * video.duration;
  };

  const formatTime = (seconds: number) => {
    if (!seconds || !isFinite(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 3000);
    }
  };

  const handleFullscreen = () => {
    if (!containerRef.current) return;
    if (!isFullscreen) {
      containerRef.current.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
    setIsFullscreen(!isFullscreen);
  };

  if (!isOpen) return null;

  return (
    <div className="relative flex w-full flex-row overflow-hidden bg-black">
      <div
        ref={containerRef}
        className="relative flex h-[600px] w-full flex-row overflow-hidden bg-black"
      >
        {/* Left section - Video player */}
        <div className="relative flex flex-1 flex-col overflow-hidden bg-black">
          {/* Top controls */}
          <div
            className={`absolute top-0 left-0 right-0 z-10 flex items-center justify-between bg-gradient-to-b from-black/60 to-transparent px-4 py-3 transition-opacity duration-200 ${
              showControls ? "opacity-100" : "opacity-0"
            }`}
          >
            <div className="flex items-center gap-2">
              <button
                onClick={handlePlayPause}
                className="flex h-9 w-9 items-center justify-center text-white hover:text-gray-200 transition-colors"
                aria-label={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? <Pause size={20} /> : <Play size={20} className="ml-0.5" />}
              </button>
              <button
                onClick={handleMuteToggle}
                className="flex h-9 w-9 items-center justify-center text-white hover:text-gray-200 transition-colors"
                aria-label={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button
                className="flex h-9 w-9 items-center justify-center text-white hover:text-gray-200 transition-colors"
                aria-label="More options"
              >
                <MoreVertical size={20} />
              </button>
              <button
                onClick={handleFullscreen}
                className="flex h-9 w-9 items-center justify-center text-white hover:text-gray-200 transition-colors"
                aria-label="Fullscreen"
              >
                <Maximize size={20} />
              </button>
            </div>
          </div>

          {/* Video player */}
          <div
            className="relative flex flex-1 items-center justify-center overflow-hidden bg-black"
            onMouseMove={handleMouseMove}
            onMouseLeave={() => isPlaying && setShowControls(false)}
          >
          <video
            ref={videoRef}
            src={videoUrl}
            poster={thumbnailUrl}
            playsInline
            className="h-full w-full object-contain"
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onEnded={() => setIsPlaying(false)}
            onClick={handlePlayPause}
          />

          {/* Center play/pause overlay */}
          {!isPlaying && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
              <button
                onClick={handlePlayPause}
                className="flex h-20 w-20 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 transition-all backdrop-blur"
              >
                <Play size={48} className="ml-1" />
              </button>
            </div>
          )}

          {/* Pause indicator */}
          {!isPlaying && (
            <div className="absolute left-4 top-16 flex items-center gap-2 bg-black/50 backdrop-blur rounded-full px-3 py-1.5">
              <Pause size={16} className="text-white" />
              <span className="text-xs font-medium text-white">PAUSED</span>
            </div>
          )}

          {/* Progress bar (always visible) */}
          <div
            onClick={handleProgressClick}
            className="h-1 w-full cursor-pointer bg-surface-chip hover:h-1.5 transition-all"
          >
            <div
              className="h-full bg-accent-link transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Bottom controls (show/hide based on showControls) */}
          <div
            className={`overflow-hidden bg-gradient-to-t from-black to-transparent px-4 pb-4 pt-8 text-white transition-opacity duration-200 ${
              showControls ? "opacity-100" : "opacity-0"
            }`}
          >
            <p className="mb-3 line-clamp-1 text-sm font-semibold text-text-primary">{title}</p>

            {/* Control buttons */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePlayPause}
                  className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-white/20 transition-colors text-white"
                  aria-label={isPlaying ? "Pause" : "Play"}
                >
                  {isPlaying ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
                </button>

                <button
                  onClick={handleStop}
                  className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-white/20 transition-colors text-white"
                  aria-label="Stop"
                >
                  <div className="h-1.5 w-1.5 rounded-sm bg-current" />
                </button>

                <button
                  onClick={handleMuteToggle}
                  className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-white/20 transition-colors text-white"
                  aria-label={isMuted ? "Unmute" : "Mute"}
                >
                  {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                </button>

                <span className="ml-2 text-xs text-white/70">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right sidebar - Engagement */}
        <div className="flex flex-col items-center justify-center gap-6 bg-black/50 px-4 py-6 w-24 border-l border-white/10">
          {/* Like button */}
          <button
            onClick={() => {
              setIsLiked(!isLiked);
              setLikeCount(isLiked ? likeCount - 1 : likeCount + 1);
            }}
            className="flex flex-col items-center gap-2 text-white hover:text-red-500 transition-colors"
            aria-label="Like"
          >
            <Heart
              size={28}
              className={isLiked ? "fill-red-500 text-red-500" : ""}
            />
            <span className="text-xs font-medium text-center">
              {likeCount > 999 ? `${(likeCount / 1000).toFixed(1)}k` : likeCount}
            </span>
          </button>

          {/* Comment button */}
          <button
            className="flex flex-col items-center gap-2 text-white hover:text-blue-400 transition-colors"
            aria-label="Comment"
          >
            <MessageCircle size={28} />
            <span className="text-xs font-medium">137</span>
          </button>

          {/* Share button */}
          <button
            className="flex flex-col items-center gap-2 text-white hover:text-green-400 transition-colors"
            aria-label="Share"
          >
            <Share2 size={28} />
            <span className="text-xs font-medium">Share</span>
          </button>

          {/* More options button */}
          <button
            className="flex flex-col items-center gap-2 text-white hover:text-gray-300 transition-colors"
            aria-label="More"
          >
            <MoreVertical size={28} />
          </button>
        </div>
      </div>
    </div>
  );
}
