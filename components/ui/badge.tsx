import { cn } from "@/lib/cn";

export function Badge({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <span className={cn("inline-flex items-center rounded-full border border-[var(--card-border)] bg-[var(--muted)] px-2.5 py-1 text-xs text-[var(--muted-foreground)]", className)}>
      {children}
    </span>
  );
}
