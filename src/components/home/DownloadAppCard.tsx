import { Apple, Smartphone, Zap } from "lucide-react";

export function DownloadAppCard() {
  return (
    <div className="rounded-2xl border border-border-light bg-surface-panel p-6">
      <div className="flex flex-col items-center text-center">
        <h3 className="text-lg font-bold text-text-primary mb-1">Download the App</h3>
        <p className="text-sm text-text-muted mb-6">Book sessions on the go!</p>

        <div className="flex flex-col gap-3 w-full mb-6">
          {/* App Store */}
          <a
            href="https://apps.apple.com/app/connectiqo"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors"
          >
            <Apple size={20} className="text-gray-700 shrink-0" />
            <div className="text-left">
              <p className="text-xs text-text-muted">Download on the</p>
              <p className="text-sm font-bold text-text-primary">App Store</p>
            </div>
          </a>

          {/* Google Play */}
          <a
            href="https://play.google.com/store/apps/details?id=com.connectiqo"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors"
          >
            <Smartphone size={20} className="text-gray-700 shrink-0" />
            <div className="text-left">
              <p className="text-xs text-text-muted">Get it on</p>
              <p className="text-sm font-bold text-text-primary">Google Play</p>
            </div>
          </a>
        </div>

        {/* App Icon */}
        <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-indigo-500 to-indigo-600">
          <Zap size={32} className="text-white" />
        </div>
      </div>
    </div>
  );
}
