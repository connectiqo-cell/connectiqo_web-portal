import { Plus } from "lucide-react";

/** Left-side branding panel for the split auth layout (Login/Signup). Hidden below lg. */
export function AuthVisualPanel() {
  return (
    <div
      className="relative hidden shrink-0 flex-col overflow-hidden p-10 text-white lg:flex lg:w-[60%]"
      style={{ backgroundImage: "var(--gradient-button-primary)" }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            "repeating-linear-gradient(115deg, transparent, transparent 40px, rgba(255,255,255,0.5) 40px, rgba(255,255,255,0.5) 42px)",
        }}
      />

      <span className="relative text-xl font-extrabold">
        Connect<span className="text-white/70">iqo</span>
      </span>

      <div className="relative mt-auto flex flex-col gap-5">
        <h2 className="max-w-md text-3xl font-extrabold leading-tight">
          Learn, Connect &amp; Grow with <span className="text-white/80">Connectiqo</span>
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
