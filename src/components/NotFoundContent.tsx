import Link from "next/link";

export function NotFoundContent() {
  return (
    <div className="flex min-h-[70vh] flex-1 flex-col items-center justify-center gap-6 px-6 py-16 text-center">
      <img src="/connectiqo_logo.png" alt="" width={56} height={56} className="h-14 w-14" />
      <div>
        <p className="text-sm font-semibold tracking-wide text-accent-link">404</p>
        <h1 className="mt-2 text-2xl font-extrabold sm:text-3xl">Page not found</h1>
        <p className="mt-2 max-w-sm text-sm text-text-secondary">
          The page you&apos;re looking for doesn&apos;t exist or may have been moved.
        </p>
      </div>
      <Link
        href="/"
        className="rounded-full bg-gradient-to-r from-accent-primary to-accent-secondary px-5 py-2.5 text-sm font-semibold text-text-on-accent"
      >
        Back to home
      </Link>
    </div>
  );
}
