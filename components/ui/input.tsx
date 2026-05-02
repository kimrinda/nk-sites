import * as React from "react";

import { cn } from "@/lib/cn";

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-11 w-full rounded-full border border-[var(--card-border)] bg-[var(--card)] px-4 text-sm text-[var(--foreground)] outline-none ring-0 placeholder:text-[var(--muted-foreground)] focus:border-[var(--accent)]",
        className,
      )}
      {...props}
    />
  );
}
