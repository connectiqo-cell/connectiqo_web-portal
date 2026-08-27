"use client";

import { Check, Copy, QrCode, X } from "lucide-react";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { useState } from "react";

import { ROUTES } from "@/lib/routes";

interface ShareProfileModalProps {
  mentorId: string;
  name: string;
  username?: string | null;
  specialization?: string | null;
}

export function ShareProfileModal({ mentorId, name, username, specialization }: ShareProfileModalProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const path = ROUTES.mentorProfile(username || mentorId);
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const url = `${origin}${path}`;
  const displayUrl = url.replace(/^https?:\/\//, "");

  const close = () => {
    setOpen(false);
    setTimeout(() => setCopied(false), 200);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard permission denied — nothing to do
    }
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: `${name} on Connectiqo`, url });
        return;
      }
      await handleCopy();
    } catch {
      // user cancelled the share sheet — nothing to do
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-fit items-center gap-1.5 rounded-full border border-border-light px-4 py-2 text-sm font-semibold text-text-secondary hover:text-text-primary"
      >
        <QrCode size={14} />
        Share profile
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-6">
          <div className="w-full max-w-sm rounded-2xl border border-border-light bg-surface-panel p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-bold text-text-primary">Share profile</h2>
              <button type="button" onClick={close} aria-label="Close">
                <X size={18} className="text-text-muted" />
              </button>
            </div>

            <div className="flex flex-col items-center gap-4">
              <div className="rounded-2xl bg-white p-4">
                <QRCodeSVG
                  value={url}
                  size={200}
                  level="H"
                  marginSize={0}
                  imageSettings={{
                    src: "/connectiqo_logo.png",
                    height: 36,
                    width: 36,
                    excavate: true,
                  }}
                />
              </div>

              <div className="flex flex-col items-center gap-1 text-center">
                <p className="text-sm font-bold text-text-primary">{name}</p>
                {specialization ? <p className="text-xs text-text-muted">{specialization}</p> : null}
              </div>

              <div className="flex w-full items-center gap-2 rounded-xl border border-border-light bg-surface-sheet px-3 py-2">
                <span className="min-w-0 flex-1 truncate font-mono text-xs text-text-secondary">
                  {displayUrl}
                </span>
                <button
                  type="button"
                  onClick={handleCopy}
                  aria-label="Copy link"
                  className="flex shrink-0 items-center gap-1 text-xs font-semibold text-accent-link"
                >
                  {copied ? <Check size={13} /> : <Copy size={13} />}
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>

              {!username ? (
                <p className="text-center text-xs text-text-muted">
                  Set a username in{" "}
                  <Link href={ROUTES.editProfileForm} onClick={close} className="text-accent-link">
                    Edit Profile
                  </Link>{" "}
                  for a cleaner link.
                </p>
              ) : null}

              <button
                type="button"
                onClick={handleShare}
                className="flex h-11 w-full items-center justify-center rounded-full text-sm font-semibold text-text-on-accent"
                style={{ backgroundImage: "var(--gradient-button-primary)" }}
              >
                Share
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
