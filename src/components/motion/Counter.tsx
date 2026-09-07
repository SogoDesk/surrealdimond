"use client";

/**
 * Number that counts up when scrolled into view.
 *
 *   <Counter to={2500} suffix="+" />
 *   <Counter from={0} to={99.9} decimals={1} suffix="%" duration={2} />
 *
 * Formats with Intl.NumberFormat (locale, default en-US). The server renders
 * the final value; on mount it resets to `from` and counts once when the
 * element reaches `start`. Reduced motion: the final value, no animation.
 */

import { useMemo, useRef, type HTMLAttributes, type ComponentType, type Ref, type ReactNode } from "react";
import { registerGsap, gsap, useGSAP } from "@/lib/gsap";
import { prefersReducedMotion } from "@/hooks/useMedia";

export interface CounterProps extends Omit<HTMLAttributes<HTMLElement>, "children"> {
  as?: keyof HTMLElementTagNameMap;
  from?: number;
  to: number;
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  locale?: string;
  start?: string;
}

export default function Counter({
  as = "span",
  from = 0,
  to,
  duration = 1.8,
  decimals = 0,
  prefix = "",
  suffix = "",
  locale = "en-US",
  start = "top 85%",
  className = "",
  ...rest
}: CounterProps) {
  const ref = useRef<HTMLElement>(null);

  const format = useMemo(() => {
    const formatter = new Intl.NumberFormat(locale, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
    return (value: number) => `${prefix}${formatter.format(value)}${suffix}`;
  }, [locale, decimals, prefix, suffix]);

  useGSAP(
    () => {
      registerGsap();
      const el = ref.current;
      if (!el) return;
      // Write into the existing text node so React keeps ownership of it.
      const write = (value: number) => {
        const text = format(value);
        if (el.firstChild && el.firstChild.nodeType === Node.TEXT_NODE) el.firstChild.nodeValue = text;
        else el.textContent = text;
      };
      if (prefersReducedMotion()) {
        write(to);
        return;
      }
      const state = { value: from };
      write(from);
      gsap.to(state, {
        value: to,
        duration,
        ease: "power2.out",
        onUpdate: () => write(state.value),
        scrollTrigger: { trigger: el, start, once: true },
      });
    },
    { scope: ref, dependencies: [from, to, duration, start, format], revertOnUpdate: true },
  );

  const Tag = as as unknown as ComponentType<HTMLAttributes<HTMLElement> & { ref?: Ref<HTMLElement | null>; children?: ReactNode }>;
  return (
    <Tag ref={ref} className={`tabular-nums ${className}`} {...rest}>
      {format(to)}
    </Tag>
  );
}
