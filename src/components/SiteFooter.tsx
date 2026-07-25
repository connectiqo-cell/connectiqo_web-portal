import Link from "next/link";

import { ROUTES } from "@/lib/routes";

export function SiteFooter() {
  return (
    <footer className="border-t border-border-light px-6 py-6">
      <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-3 text-xs text-text-muted">
        <span>© {new Date().getFullYear()} Connectiqo</span>
        <div className="flex gap-4">
          <Link href={ROUTES.privacy} className="hover:text-text-secondary">
            Privacy Policy
          </Link>
          <Link href={ROUTES.terms} className="hover:text-text-secondary">
            Terms of Service
          </Link>
          <a href="mailto:support@connectiqo.app" className="hover:text-text-secondary">
            Support
          </a>
        </div>
      </div>
    </footer>
  );
}
