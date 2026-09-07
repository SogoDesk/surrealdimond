import type { ReactNode } from "react";

/** Eyebrow label preceded by a 24px hairline (draws in with the section reveal). */
export default function Eyebrow({ children, className = "", rule = true }: { children: ReactNode; className?: string; rule?: boolean }) {
  return (
    <span className={`t-eyebrow inline-flex items-center gap-4 ${className}`} data-eyebrow>
      {rule && <span aria-hidden className="eyebrow-rule block h-px w-6 bg-current opacity-70" />}
      <span>{children}</span>
    </span>
  );
}
