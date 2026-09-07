"use client";

/**
 * 04. Nine ways to begin (collections). DESIGN.md, section 04.
 *
 * A pinned horizontal gallery: a fixed header row (eyebrow, headline, body,
 * the Drag or scroll hint, a 240px progress hairline and a masked 01 / 11
 * counter) above a track of eleven panels plus a trailing See everything
 * panel. From 768px up, without reduced motion, ScrollTrigger pins the stage
 * and scrubs the track sideways one pixel per scrolled pixel; every card
 * scales and fades in through containerAnimation, every render or photograph
 * parallaxes inside its card, and an Observer pointer drag writes straight to
 * the Lenis scroll position so the pin never drifts. Below 768px, or with
 * reduced motion, the track is a native horizontal scroll-snap list and the
 * counter follows an IntersectionObserver.
 */

import { useCallback, useRef, useState, type MouseEvent } from "react";
import Section from "@/components/ui/Section";
import Button from "@/components/ui/Button";
import Eyebrow from "@/components/ui/Eyebrow";
import Reveal from "@/components/motion/Reveal";
import { useSplitLines } from "@/components/motion/SplitReveal";
import { registerGsap, gsap, ScrollTrigger, Observer, useGSAP } from "@/lib/gsap";
import { scrollToTarget } from "@/lib/scroll";
import { useBreakpoint, useIsTouch, useReducedMotion } from "@/hooks/useMedia";
import { categories } from "@/content/catalog";
import { footerColumns } from "@/content/site";
import { CategoryCard, Interlude, LooseDiamondsCard, RollingCounter, TrailingPanel } from "./CollectionsPanels";
import s from "./Collections.module.css";

const NEXT_SECTION = "made-to-order";
const SHOP_ALL = "/jewelry";
const LOOSE = "/diamonds";
const PANEL_COUNT = 11;

const jewelry = (id: string) => `/jewelry/${id}`;
const categoryHref = (id: (typeof categories)[number]["id"]) => jewelry(categories.find((c) => c.id === id)?.id ?? id);
const sterlingHref = footerColumns[0].links.find((l) => l.label === "Sterling Silver")?.href ?? jewelry("sterling-silver");

type Panel =
  | { kind: "card"; number: number; label: string; href: string; image: string; alt: string }
  | { kind: "interlude"; src: string; width: number; height: number; caption: string; alt: string }
  | { kind: "loose"; number: number; label: string; href: string };

const PANELS: Panel[] = [
  { kind: "card", number: 1, label: "Engagement Rings", href: categoryHref("engagement"), image: "le2004w442-11741", alt: "Oval halo engagement ring" },
  { kind: "card", number: 2, label: "Wedding Bands", href: categoryHref("wedding-bands"), image: "lgbrdl2658-eng-wg-lgbrdl2658-band-wg", alt: "Engagement ring with its matching wedding band" },
  { kind: "card", number: 3, label: "Earrings", href: categoryHref("earrings"), image: "in-and-out-hoops-yg", alt: "Inside out diamond hoop earrings in yellow gold" },
  { kind: "card", number: 4, label: "Necklaces", href: categoryHref("necklaces"), image: "nkov18w440wg", alt: "Oval diamond tennis necklace" },
  { kind: "interlude", src: "/media/photos/sb-3605.webp", width: 1708, height: 2020, caption: "Worn every day", alt: "Diamond jewelry worn in the studio" },
  { kind: "card", number: 5, label: "Pendants", href: categoryHref("pendants"), image: "branding-images8028", alt: "Teardrop pave pendant" },
  { kind: "card", number: 6, label: "Rings", href: categoryHref("rings"), image: "branding-images8022", alt: "Bypass pave ring" },
  { kind: "card", number: 7, label: "Bracelets", href: categoryHref("bracelets"), image: "ca24mr0083-2725", alt: "Diamond tennis bracelet with an oval center" },
  { kind: "card", number: 8, label: "Sterling Silver", href: sterlingHref, image: "jbii247sil-2638", alt: "Oval bezel pendant in sterling silver" },
  { kind: "interlude", src: "/media/photos/sb-3730.webp", width: 2399, height: 2400, caption: "Gold, stacked", alt: "Stacked gold and diamond jewelry" },
  { kind: "loose", number: 9, label: "Loose Diamonds", href: LOOSE },
];

export default function Collections() {
  const stageRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLOListElement>(null);
  const lineRef = useRef<HTMLSpanElement>(null);
  const activeRef = useRef(1);
  const [active, setActive] = useState(1);

  const desktop = useBreakpoint("md");
  const reduced = useReducedMotion();
  const touch = useIsTouch();
  const pinned = desktop && !reduced;
  const hint = pinned ? "Drag or scroll" : touch ? "Swipe" : "Scroll";

  const setActiveIndex = useCallback((n: number) => {
    const next = Math.max(1, Math.min(PANEL_COUNT, n));
    if (activeRef.current === next) return;
    activeRef.current = next;
    setActive(next);
  }, []);

  const skip = (e: MouseEvent<HTMLAnchorElement>) => {
    const target = document.getElementById(NEXT_SECTION);
    if (!target) return;
    e.preventDefault();
    scrollToTarget(target);
  };

  /* Headline lines rise out of their masks; the eyebrow rule draws in. */
  useSplitLines(
    headlineRef,
    (split) =>
      gsap.fromTo(
        split.lines,
        { yPercent: 110 },
        { yPercent: 0, duration: 1.1, ease: "surreal", stagger: 0.08, scrollTrigger: { trigger: headerRef.current, start: "top 85%", once: true } },
      ),
    { enabled: !reduced },
  );

  useGSAP(
    () => {
      registerGsap();
      const header = headerRef.current;
      if (!header || reduced) return;
      gsap.fromTo(
        header.querySelectorAll(".eyebrow-rule"),
        { scaleX: 0, transformOrigin: "left center" },
        { scaleX: 1, duration: 1, ease: "surreal", scrollTrigger: { trigger: header, start: "top 85%", once: true } },
      );
    },
    { scope: headerRef, dependencies: [reduced], revertOnUpdate: true },
  );

  /* The gallery itself: pinned scrub on desktop, native snap scroll otherwise. */
  useGSAP(
    () => {
      registerGsap();
      const stage = stageRef.current;
      const viewport = viewportRef.current;
      const track = trackRef.current;
      if (!stage || !viewport || !track) return;

      const panels = Array.from(track.querySelectorAll<HTMLElement>("[data-panel]"));
      const counted = panels.filter((p) => p.dataset.panel !== "trailing");
      const loose = track.querySelector<HTMLElement>('[data-panel="loose"]');
      const facets = loose ? Array.from(loose.querySelectorAll<SVGElement>("[data-facet]")) : [];
      const setProgress = (p: number) => {
        if (lineRef.current) lineRef.current.style.transform = `scaleX(${p.toFixed(4)})`;
      };
      const drawFacets = () =>
        gsap.fromTo(facets, { drawSVG: "0%" }, { drawSVG: "100%", duration: 1.4, ease: "surreal", stagger: { each: 0.03, from: "start" } });

      if (!pinned) {
        stage.dataset.mode = "scroll";
        const onScroll = () => setProgress(viewport.scrollLeft / Math.max(1, viewport.scrollWidth - viewport.clientWidth));
        viewport.addEventListener("scroll", onScroll, { passive: true });
        onScroll();
        const io = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (!entry.isIntersecting) return;
              const i = counted.indexOf(entry.target as HTMLElement);
              if (i >= 0) setActiveIndex(i + 1);
            });
          },
          { root: viewport, threshold: 0.5 },
        );
        counted.forEach((p) => io.observe(p));
        let drawIo: IntersectionObserver | undefined;
        if (loose && facets.length && !reduced) {
          gsap.set(facets, { drawSVG: "0%" });
          drawIo = new IntersectionObserver(
            (entries) => {
              if (!entries.some((e) => e.isIntersecting)) return;
              drawFacets();
              drawIo?.disconnect();
            },
            { root: viewport, threshold: 0.3 },
          );
          drawIo.observe(loose);
        }
        return () => {
          viewport.removeEventListener("scroll", onScroll);
          io.disconnect();
          drawIo?.disconnect();
        };
      }

      stage.dataset.mode = "pin";
      const distance = () => Math.max(0, track.scrollWidth - viewport.clientWidth);
      const updateCounter = () => {
        const x = Number(gsap.getProperty(track, "x")) || 0;
        const centre = viewport.clientWidth / 2;
        let index = 1;
        counted.forEach((panel, i) => {
          if (panel.offsetLeft + x < centre) index = i + 1;
        });
        setActiveIndex(index);
      };

      const movers = panels.flatMap((panel) => Array.from(panel.querySelectorAll<HTMLElement>("[data-parallax]")));
      const leadOffset = () => parseFloat(getComputedStyle(track).paddingLeft) || 0;

      const tween = gsap.to(track, {
        x: () => -distance(),
        ease: "none",
        onUpdate: updateCounter,
        scrollTrigger: {
          trigger: stage,
          pin: true,
          anticipatePin: 1,
          scrub: 0.8,
          start: "top top",
          end: () => `+=${distance()}`,
          invalidateOnRefresh: true,
          onToggle: (self) => {
            /* Compositor hints live only while the pin is active. */
            const hint = self.isActive ? "transform" : "";
            track.style.willChange = hint;
            movers.forEach((m) => {
              m.style.willChange = hint;
            });
          },
          onUpdate: (self) => setProgress(self.progress),
        },
      });
      const st = tween.scrollTrigger;

      /* Per-card entrance within 20vw of the centre, and the two parallax velocities. */
      panels.forEach((panel) => {
        gsap.fromTo(
          panel,
          { scale: 0.96, opacity: 0.6, transformOrigin: "50% 50%" },
          {
            scale: 1,
            opacity: 1,
            ease: "none",
            scrollTrigger: { trigger: panel, containerAnimation: tween, start: "center 70%", end: "center 50%", scrub: true },
          },
        );
        const moving = panel.querySelector<HTMLElement>("[data-parallax]");
        if (moving) {
          gsap.fromTo(
            moving,
            { xPercent: -6 },
            { xPercent: 6, ease: "none", scrollTrigger: { trigger: panel, containerAnimation: tween, start: "left right", end: "right left", scrub: true } },
          );
        }
      });

      if (loose && facets.length) {
        gsap.set(facets, { drawSVG: "0%" });
        ScrollTrigger.create({
          trigger: loose,
          containerAnimation: tween,
          start: "left 85%",
          once: true,
          onEnter: () => {
            drawFacets();
          },
        });
      }

      /* Pointer drag with inertia, written to the Lenis scroll position. */
      let inertia: gsap.core.Tween | null = null;
      let dragged = false;
      const scrollPosition = () => window.__lenis?.scroll ?? window.scrollY;
      const scrollTo = (value: number) => {
        if (!st) return;
        const clamped = gsap.utils.clamp(st.start, st.end, value);
        const lenis = window.__lenis;
        if (lenis) lenis.scrollTo(clamped, { immediate: true, force: true });
        else window.scrollTo(0, clamped);
      };
      const observer = Observer.create({
        target: viewport,
        type: "pointer",
        dragMinimum: 4,
        onPress: () => {
          inertia?.kill();
          dragged = false;
        },
        onDragStart: () => {
          dragged = true;
          viewport.dataset.dragging = "";
        },
        onDrag: (self) => scrollTo(scrollPosition() - self.deltaX),
        onDragEnd: (self) => {
          delete viewport.dataset.dragging;
          const velocity = self.velocityX * 0.8;
          if (Math.abs(velocity) < 40) return;
          const proxy = { value: scrollPosition() };
          inertia = gsap.to(proxy, {
            value: proxy.value - velocity * 0.6,
            duration: 1.2,
            ease: "power2.out",
            onUpdate: () => scrollTo(proxy.value),
          });
        },
      });
      const swallowClick = (e: Event) => {
        if (!dragged) return;
        e.preventDefault();
        e.stopPropagation();
        dragged = false;
      };
      const stopInertia = () => inertia?.kill();
      /* Keyboard focus: the hidden-overflow viewport must never scroll on its
         own, so undo the browser's focus scroll and move the page instead. */
      const onFocusIn = (e: FocusEvent) => {
        viewport.scrollLeft = 0;
        const panel = (e.target as HTMLElement | null)?.closest<HTMLElement>("[data-panel]");
        if (!panel || !st) return;
        inertia?.kill();
        const target = st.start + gsap.utils.clamp(0, distance(), panel.offsetLeft - leadOffset());
        const lenis = window.__lenis;
        if (lenis) lenis.scrollTo(target, { duration: 0.8 });
        else window.scrollTo(0, target);
      };
      viewport.addEventListener("click", swallowClick, true);
      viewport.addEventListener("focusin", onFocusIn);
      window.addEventListener("wheel", stopInertia, { passive: true });

      /* Re-measure when the track resizes or its images arrive. */
      let timer = 0;
      const refresh = () => {
        window.clearTimeout(timer);
        timer = window.setTimeout(() => ScrollTrigger.refresh(), 150);
      };
      const resize = new ResizeObserver(refresh);
      resize.observe(track);
      const pending = Array.from(track.querySelectorAll("img")).filter((img) => !img.complete);
      pending.forEach((img) => img.addEventListener("load", refresh, { once: true }));
      updateCounter();

      return () => {
        observer.kill();
        inertia?.kill();
        viewport.removeEventListener("click", swallowClick, true);
        viewport.removeEventListener("focusin", onFocusIn);
        window.removeEventListener("wheel", stopInertia);
        window.clearTimeout(timer);
        resize.disconnect();
        pending.forEach((img) => img.removeEventListener("load", refresh));
        track.style.willChange = "";
        movers.forEach((m) => {
          m.style.willChange = "";
        });
        delete stage.dataset.mode;
      };
    },
    { scope: stageRef, dependencies: [pinned, reduced, setActiveIndex], revertOnUpdate: true },
  );

  return (
    <Section id="collections" theme="light" label="The collection" className={s.root}>
      <a href={`#${NEXT_SECTION}`} onClick={skip} className={s.skip}>
        Skip the collection gallery
      </a>
      <div ref={stageRef} className={s.stage}>
        <div ref={headerRef} className={`container ${s.header}`}>
          <div className={s.headingCol}>
            <Eyebrow>The collection</Eyebrow>
            <h2 ref={headlineRef} className={s.headline}>
              Nine ways to <em>begin</em>.
            </h2>
          </div>
          <div className={s.bodyCol}>
            <Reveal effect="fade-up" duration={1.2} delay={0.2}>
              <p className={`t-body ${s.body}`}>
                Earrings, engagement rings, wedding bands, necklaces, pendants, rings, bracelets, a sterling silver collection, and loose
                diamonds by the stone. Every piece set with a diamond we grew.
              </p>
            </Reveal>
            <Button variant="tertiary" href={SHOP_ALL} className={s.shopAllLink}>
              Shop all
            </Button>
          </div>
          <div className={s.wayfinding}>
            <span className={`t-caption ${s.hint}`}>{hint}</span>
            <span className={s.progress} aria-hidden>
              <span ref={lineRef} className={s.progressLine} />
            </span>
            <RollingCounter value={active} total={PANEL_COUNT} />
          </div>
        </div>

        <div ref={viewportRef} className={s.viewport} data-cursor="drag" data-lenis-prevent={pinned ? undefined : ""}>
          <ol ref={trackRef} role="list" className={s.track} aria-label="Collection categories">
            {PANELS.map((panel, i) => {
              if (panel.kind === "interlude") {
                return <Interlude key={i} src={panel.src} width={panel.width} height={panel.height} caption={panel.caption} alt={panel.alt} />;
              }
              if (panel.kind === "loose") return <LooseDiamondsCard key={i} number={panel.number} label={panel.label} href={panel.href} />;
              return <CategoryCard key={i} number={panel.number} label={panel.label} href={panel.href} image={panel.image} alt={panel.alt} />;
            })}
            <TrailingPanel href={SHOP_ALL} />
          </ol>
        </div>

        <div className={`container ${s.mobileCta}`}>
          <Button variant="secondary" href={SHOP_ALL} className={s.shopAllButton} arrow>
            Shop all
          </Button>
        </div>
      </div>
    </Section>
  );
}
