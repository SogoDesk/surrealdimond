"use client";

/**
 * Drawer mechanics shared by the quick view and the mobile filter sheet,
 * mirroring the contact drawer: a fixed root that is inert while closed, a
 * backdrop that fades, a paper panel that slides in on a GSAP tween (x from
 * the right, or y from the bottom), scroll locked while open, focus moved
 * into the panel on open and returned to the opener on close, Escape closes.
 *
 *   const { onKeyDown } = useDrawer({ open, onClose, rootRef, panelRef, backdropRef, axis: "x" });
 *   <div ref={rootRef} inert={!open} onKeyDown={onKeyDown}>...
 *
 * The panel's own Tab handling keeps focus inside (trapTab).
 */

import { useEffect, useRef, type KeyboardEvent, type RefObject } from "react";
import { registerGsap, gsap, useGSAP } from "@/lib/gsap";
import { prefersReducedMotion } from "@/hooks/useMedia";
import { lockScroll } from "@/lib/scroll";

const FOCUSABLE =
  "a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), video[controls], [tabindex]:not([tabindex='-1'])";

export function focusableIn(panel: HTMLElement): HTMLElement[] {
  return Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => el.tabIndex >= 0 && el.offsetParent !== null);
}

/** Keeps Tab and Shift+Tab inside the panel. */
export function trapTab(e: KeyboardEvent<HTMLElement>, panel: HTMLElement | null) {
  if (e.key !== "Tab" || !panel) return;
  const items = focusableIn(panel);
  if (items.length === 0) return;
  const first = items[0];
  const last = items[items.length - 1];
  const active = document.activeElement;
  if (e.shiftKey && (active === first || !panel.contains(active))) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && active === last) {
    e.preventDefault();
    first.focus();
  }
}

export interface UseDrawerOptions {
  open: boolean;
  onClose: () => void;
  rootRef: RefObject<HTMLElement | null>;
  panelRef: RefObject<HTMLElement | null>;
  backdropRef: RefObject<HTMLElement | null>;
  /** "x" slides in from the right, "y" rises from the bottom. */
  axis?: "x" | "y";
  /** Element to focus once the panel has arrived; defaults to the first focusable item. */
  initialFocus?: (panel: HTMLElement) => HTMLElement | null | undefined;
}

export function useDrawer({ open, onClose, rootRef, panelRef, backdropRef, axis = "x", initialFocus }: UseDrawerOptions) {
  const everOpenedRef = useRef(false);
  const openerRef = useRef<HTMLElement | null>(null);
  const keepLockRef = useRef(false);
  const initialFocusRef = useRef(initialFocus);
  useEffect(() => {
    initialFocusRef.current = initialFocus;
  }, [initialFocus]);

  useGSAP(
    () => {
      registerGsap();
      const root = rootRef.current;
      const panel = panelRef.current;
      const backdrop = backdropRef.current;
      if (!root || !panel || !backdrop) return;
      const reduce = prefersReducedMotion();
      const prop = axis === "x" ? "xPercent" : "yPercent";

      if (!open && !everOpenedRef.current) {
        gsap.set(root, { autoAlpha: 0 });
        gsap.set(panel, { [prop]: 100 });
        gsap.set(backdrop, { autoAlpha: 0 });
        return;
      }

      if (open) {
        everOpenedRef.current = true;
        keepLockRef.current = false;
        openerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        lockScroll(true);
        gsap.set(root, { autoAlpha: 1 });
        gsap.to(backdrop, { autoAlpha: 1, duration: 0.5, ease: "power2.out", overwrite: true });
        gsap.to(panel, {
          [prop]: 0,
          duration: reduce ? 0.3 : 0.6,
          ease: reduce ? "power2.out" : "surreal",
          overwrite: true,
          onComplete: () => {
            const target = initialFocusRef.current?.(panel) ?? focusableIn(panel)[0] ?? panel;
            target.focus({ preventScroll: true });
          },
        });
      } else {
        const keepLock = keepLockRef.current;
        gsap.to(backdrop, { autoAlpha: 0, duration: 0.4, ease: "power2.out", overwrite: true });
        gsap.to(panel, {
          [prop]: 100,
          duration: reduce ? 0.3 : 0.5,
          ease: reduce ? "power2.out" : "surrealInOut",
          overwrite: true,
          onComplete: () => {
            gsap.set(root, { autoAlpha: 0 });
            if (!keepLock) {
              lockScroll(false);
              openerRef.current?.focus({ preventScroll: true });
            }
          },
        });
      }
    },
    { scope: rootRef, dependencies: [open, axis] },
  );

  // If the drawer unmounts while open, hand the page back.
  useEffect(() => () => lockScroll(false), []);

  // Escape closes even when focus is still on the element that opened the drawer.
  useEffect(() => {
    if (!open) return;
    const onDocumentKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    document.addEventListener("keydown", onDocumentKey);
    return () => document.removeEventListener("keydown", onDocumentKey);
  }, [open, onClose]);

  const onKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    if (e.key === "Escape") {
      e.preventDefault();
      onClose();
      return;
    }
    trapTab(e, panelRef.current);
  };

  /** Call before onClose when another layer (the contact drawer) takes over the lock and the focus. */
  const handOff = () => {
    keepLockRef.current = true;
  };

  return { onKeyDown, handOff };
}
