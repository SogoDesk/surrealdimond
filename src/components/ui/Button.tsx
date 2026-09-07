"use client";

import Link from "next/link";
import { useRef, type ReactNode, type MouseEvent } from "react";
import { gsap, registerGsap } from "@/lib/gsap";

/**
 * Pill buttons and text links (DESIGN.md, "Cursor and micro").
 * - primary: filled pill; a contrasting fill rises from the bottom on hover while
 *   the label slides up out of a mask and its duplicate arrives beneath it.
 * - secondary: hairline outline pill that fills with a soft tint on hover.
 * - tertiary: text link with a drawn underline and an arrow that slides right.
 * Colours follow the chapter through the data-theme custom properties.
 * Every pill is magnetic on fine pointers (drift up to 8px, elastic return).
 */
export type ButtonVariant = "primary" | "secondary" | "tertiary";

export interface ButtonProps {
  href?: string;
  onClick?: (e: MouseEvent<HTMLElement>) => void;
  variant?: ButtonVariant;
  children: ReactNode;
  className?: string;
  arrow?: boolean;
  type?: "button" | "submit";
  ariaLabel?: string;
  magnetic?: boolean;
  target?: string;
}

const base =
  "group relative inline-flex shrink-0 items-center justify-center gap-3 select-none whitespace-nowrap t-nav transition-colors duration-500";

export default function Button({
  href,
  onClick,
  variant = "primary",
  children,
  className = "",
  arrow = false,
  type = "button",
  ariaLabel,
  magnetic = true,
  target,
}: ButtonProps) {
  const ref = useRef<HTMLElement | null>(null);

  const handleMove = (e: MouseEvent<HTMLElement>) => {
    const el = ref.current;
    if (!magnetic || !el || variant === "tertiary") return;
    if (!window.matchMedia("(pointer: fine)").matches) return;
    registerGsap();
    const r = el.getBoundingClientRect();
    const dx = e.clientX - (r.left + r.width / 2);
    const dy = e.clientY - (r.top + r.height / 2);
    const dist = Math.hypot(dx, dy);
    const max = 96;
    const k = Math.max(0, 1 - dist / max) * 8;
    gsap.to(el, { x: (dx / dist || 0) * k, y: (dy / dist || 0) * k, duration: 0.4, ease: "power3.out", overwrite: "auto" });
  };
  const handleLeave = () => {
    const el = ref.current;
    if (!el) return;
    gsap.to(el, { x: 0, y: 0, duration: 0.9, ease: "elastic.out(1, 0.6)", overwrite: "auto" });
  };

  const isPill = variant !== "tertiary";
  const cls = [
    base,
    isPill ? "h-[52px] px-8 rounded-full overflow-hidden" : "h-auto",
    variant === "primary" ? "btn-primary" : variant === "secondary" ? "btn-secondary" : "btn-tertiary",
    className,
  ].join(" ");

  const inner = (
    <>
      {variant === "primary" && <span aria-hidden className="btn-fill" />}
      <span className="relative block overflow-hidden">
        <span className="btn-label block">{children}</span>
        {variant === "primary" && (
          <span aria-hidden className="btn-label btn-label-dup absolute inset-0 block">
            {children}
          </span>
        )}
      </span>
      {(arrow || variant === "tertiary") && (
        <svg aria-hidden viewBox="0 0 24 24" width="14" height="14" className="btn-arrow relative shrink-0" fill="none" stroke="currentColor" strokeWidth="1.2">
          <path d="M4 12h15M13 6l6 6-6 6" />
        </svg>
      )}
      {variant === "tertiary" && <span aria-hidden className="btn-underline" />}
    </>
  );

  const shared = {
    className: cls,
    onMouseMove: handleMove,
    onMouseLeave: handleLeave,
    "aria-label": ariaLabel,
    "data-cursor": "link",
  } as const;

  if (href) {
    const external = /^https?:|^mailto:|^tel:/.test(href);
    if (external) {
      return (
        <a ref={(el) => { ref.current = el; }} href={href} target={target} rel={target === "_blank" ? "noreferrer" : undefined} onClick={onClick} {...shared}>
          {inner}
        </a>
      );
    }
    return (
      <Link ref={(el) => { ref.current = el; }} href={href} onClick={onClick} {...shared}>
        {inner}
      </Link>
    );
  }
  return (
    <button ref={(el) => { ref.current = el; }} type={type} onClick={onClick} {...shared}>
      {inner}
    </button>
  );
}
