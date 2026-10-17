import { Plus } from "lucide-react";
import Image from "next/image";

type Props = {
  /** Square artwork that replaces the gradient + copy. The artwork is expected to carry its own branding. */
  imageSrc?: string;
};

/** Left-side branding panel for the split auth layout (Login/Signup). Hidden below lg. */
export function AuthVisualPanel({ imageSrc }: Props) {
  if (imageSrc) {
    return (
      // Square artwork: the panel is as wide as the viewport is tall, so the image fills it edge to edge uncropped.
      <div className="hidden shrink-0 bg-[#0d0b14] lg:block lg:w-[min(60%,100dvh)]">
        <div className="sticky top-0 h-dvh overflow-hidden">
          {/* Blurred copy covers the bars left when the 60% cap kicks in on narrow screens. */}
          <Image
            src={imageSrc}
            alt=""
            aria-hidden
            fill
            sizes="60vw"
            className="scale-110 object-cover opacity-60 blur-2xl"
          />
          <Image
            src={imageSrc}
            alt="Creators connecting with fans on Connectiqo"
            fill
            sizes="60vw"
            className="object-contain"
          />
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative hidden shrink-0 flex-col overflow-hidden p-10 text-white lg:flex lg:w-[60%]"
      style={{ backgroundImage: "var(--auth-panel-bg, var(--gradient-button-primary))" }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-20 [.auth-landing-theme_&]:opacity-5"
        style={{
          backgroundImage:
            "repeating-linear-gradient(115deg, transparent, transparent 40px, rgba(255,255,255,0.5) 40px, rgba(255,255,255,0.5) 42px)",
        }}
      />

      <span className="relative text-xl font-extrabold">
        Connect<span className="text-[var(--auth-panel-accent,rgba(255,255,255,0.7))]">iqo</span>
      </span>

      <div className="relative mt-auto flex flex-col gap-5">
        <h2 className="max-w-md text-3xl font-extrabold leading-tight">
          Learn, Connect &amp; Grow with <span className="text-[var(--auth-panel-accent,rgba(255,255,255,0.8))]">Connectiqo</span>
        </h2>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm font-semibold">
          <span className="flex items-center gap-1.5">
            <Plus size={14} /> 1-on-1 Video Calls
          </span>
          <span className="flex items-center gap-1.5">
            <Plus size={14} /> Trusted Creators
          </span>
          <span className="flex items-center gap-1.5">
            <Plus size={14} /> Secure &amp; Safe
          </span>
        </div>
      </div>
    </div>
  );
}
