/** Scroll helpers that go through Lenis when it is active. */
export function scrollToTarget(target: string | HTMLElement, offset = 0) {
  if (typeof window === "undefined") return;
  const lenis = window.__lenis;
  if (lenis) {
    lenis.scrollTo(target, { offset, duration: 1.6 });
    return;
  }
  const el = typeof target === "string" ? document.querySelector<HTMLElement>(target) : target;
  el?.scrollIntoView({ behavior: "smooth" });
}

export function lockScroll(locked: boolean) {
  if (typeof window === "undefined") return;
  const lenis = window.__lenis;
  if (lenis) (locked ? lenis.stop : lenis.start).call(lenis);
  document.documentElement.style.overflow = locked ? "hidden" : "";
}
