import { SITE_NAME } from "@/lib/constants";

export function SiteFooter() {
  return (
    <footer className="border-t border-[var(--card-border)] bg-[color:color-mix(in_oklab,var(--background)_88%,transparent)] px-3 py-6 sm:px-5 lg:px-6">
      <div className="text-center text-sm text-[var(--muted-foreground)]">
        &copy; {new Date().getFullYear()} {SITE_NAME}. All rights reserved.
      </div>
    </footer>
  );
}
