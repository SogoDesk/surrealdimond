/** Scroll helpers: smooth where the visitor allows motion, instant otherwise. */
const smooth = (): ScrollBehavior => (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth");

export function scrollToTarget(target: string | HTMLElement, offset = 0) {
  if (typeof window === "undefined") return;
  const el = typeof target === "string" ? document.querySelector<HTMLElement>(target) : target;
  if (!el) return;
  window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY + offset, behavior: smooth() });
}

export function lockScroll(locked: boolean) {
  if (typeof window === "undefined") return;
  document.documentElement.style.overflow = locked ? "hidden" : "";
}
