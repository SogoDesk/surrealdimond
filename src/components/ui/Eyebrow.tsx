import type { ReactNode } from "react";

/** Eyebrow label, Jost small caps. No leading hairline. */
export default function Eyebrow({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <span className={`t-eyebrow inline-flex items-center ${className}`} data-eyebrow>
      <span>{children}</span>
    </span>
  );
}
