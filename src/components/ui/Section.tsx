import type { CSSProperties, ReactNode } from "react";

export type Theme = "light" | "dark" | "sky" | "navy";

/**
 * Chapter wrapper. Sets data-theme so the section paints its own ground and
 * exposes its theme to the header and cursor, plus an id for anchors.
 */
export default function Section({
  id,
  theme = "light",
  className = "",
  style,
  children,
  as: Tag = "section",
  label,
}: {
  id: string;
  theme?: Theme;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
  as?: "section" | "div" | "footer" | "header";
  label?: string;
}) {
  return (
    <Tag id={id} data-theme={theme} data-chapter={id} aria-label={label} className={`relative ${className}`} style={style}>
      {children}
    </Tag>
  );
}
