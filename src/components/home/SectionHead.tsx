import type { ReactNode } from "react";
import Eyebrow from "@/components/ui/Eyebrow";
import s from "./home.module.css";

/**
 * Section heading: eyebrow, Cormorant title with one italic phrase, a Jost
 * subline, and an optional action on the right when align is "row".
 */
export default function SectionHead({
  eyebrow,
  title,
  sub,
  action,
  align = "center",
  id,
}: {
  eyebrow?: string;
  title: ReactNode;
  sub?: ReactNode;
  action?: ReactNode;
  align?: "center" | "row";
  id?: string;
}) {
  const text = (
    <>
      {eyebrow && (
        <span data-rise>
          <Eyebrow rule={align === "row"}>{eyebrow}</Eyebrow>
        </span>
      )}
      <h2 id={id} className={s.title} data-rise>
        {title}
      </h2>
      {sub && (
        <p className={s.sub} data-rise>
          {sub}
        </p>
      )}
    </>
  );
  if (align === "center") return <header className={s.head}>{text}</header>;
  return (
    <header className={s.headRow}>
      <div className={s.headText}>{text}</div>
      {action && <div data-rise>{action}</div>}
    </header>
  );
}
