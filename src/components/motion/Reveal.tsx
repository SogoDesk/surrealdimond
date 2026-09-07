"use client";

/**
 * Scroll reveal wrapper.
 *
 *   <Reveal effect="fade-up" delay={0.1}>...</Reveal>
 *   <Reveal as="ul" effect="mask-up" staggerChildren stagger={0.08}>{items}</Reveal>
 *
 * effect: fade-up | mask-up | clip-right | scale-in | blur-in
 * once (default true) plays a single time; once={false} reverses on the way out.
 * staggerChildren animates the direct children in sequence instead of the
 * wrapper. mask-up clips at the wrapper, so content rises from its bottom edge.
 * Reduced motion: the final state renders with no animation.
 */

import { useRef, type HTMLAttributes, type ReactNode, type ComponentType, type Ref } from "react";
import { registerGsap, gsap, useGSAP } from "@/lib/gsap";
import { prefersReducedMotion } from "@/hooks/useMedia";

export type RevealEffect = "fade-up" | "mask-up" | "clip-right" | "scale-in" | "blur-in";

export interface RevealProps extends HTMLAttributes<HTMLElement> {
  as?: keyof HTMLElementTagNameMap;
  effect?: RevealEffect;
  delay?: number;
  duration?: number;
  once?: boolean;
  /** ScrollTrigger start, relative to the wrapper. */
  start?: string;
  stagger?: number;
  staggerChildren?: boolean;
  children?: ReactNode;
}

const EFFECTS: Record<RevealEffect, [gsap.TweenVars, gsap.TweenVars]> = {
  "fade-up": [{ autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0 }],
  "mask-up": [{ yPercent: 110 }, { yPercent: 0 }],
  "clip-right": [{ clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0% 0 0)" }],
  "scale-in": [{ autoAlpha: 0, scale: 0.92, transformOrigin: "50% 50%" }, { autoAlpha: 1, scale: 1 }],
  "blur-in": [{ autoAlpha: 0, filter: "blur(14px)" }, { autoAlpha: 1, filter: "blur(0px)" }],
};

export default function Reveal({
  as = "div",
  effect = "fade-up",
  delay = 0,
  duration = 1.2,
  once = true,
  start = "top 85%",
  stagger = 0.08,
  staggerChildren = false,
  className,
  style,
  children,
  ...rest
}: RevealProps) {
  const ref = useRef<HTMLElement>(null);
  const masked = effect === "mask-up";

  useGSAP(
    () => {
      registerGsap();
      const root = ref.current;
      if (!root || prefersReducedMotion()) return;
      // mask-up animates an inner box so the wrapper can act as the mask.
      const box = masked ? (root.firstElementChild as HTMLElement | null) : root;
      if (!box) return;
      const targets = staggerChildren ? Array.from(box.children) : box;
      if (Array.isArray(targets) && targets.length === 0) return;
      const [from, to] = EFFECTS[effect];
      gsap.fromTo(targets, from, {
        ...to,
        duration,
        delay,
        ease: "surreal",
        stagger: staggerChildren ? stagger : 0,
        clearProps: once && effect === "blur-in" ? "filter" : "",
        scrollTrigger: {
          trigger: root,
          start,
          once,
          toggleActions: once ? "play none none none" : "play none none reverse",
        },
      });
    },
    {
      scope: ref,
      dependencies: [effect, delay, duration, once, start, stagger, staggerChildren, masked],
      revertOnUpdate: true,
    },
  );

  const Tag = as as unknown as ComponentType<HTMLAttributes<HTMLElement> & { ref?: Ref<HTMLElement | null>; children?: ReactNode }>;
  return (
    <Tag ref={ref} className={className} style={masked ? { overflow: "hidden", ...style } : style} {...rest}>
      {masked ? <div>{children}</div> : children}
    </Tag>
  );
}
