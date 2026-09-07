"use client";

/**
 * 06. Made to be worn, not kept (lookbook). DESIGN.md section 06.
 *
 * A free-form editorial grid of five photographs, each a loose print with its
 * own parallax ratio and a clip-path reveal from alternating sides. The first
 * two prints, the statement and the copy scroll in flow; the last three prints
 * live in a position sticky hold so the next dark chapter scrolls up over them.
 * The hold is plain CSS, no ScrollTrigger pin, so it works natively with Lenis
 * (Lenis scrolls the window and transforms nothing). Structure:
 *
 *   <Section id="lookbook">                 relative, z-index 0, margin-bottom -100vh
 *     <div .stage>   eyebrow, print 1, print 2, statement, body and links
 *     <div .hold>    sticky top 0, min-height 100svh, prints 3 to 5
 *     <div .room>    100vh of empty room so the hold has space to stick
 *   </Section>
 *
 * The next chapter must be positioned (Section already is) with an opaque
 * ground, and no ancestor of this section may clip overflow (overflow hidden
 * or a transform would break sticky). Reduced motion: images fade in, no hold.
 */

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, type MouseEvent } from "react";
import Section from "@/components/ui/Section";
import Button from "@/components/ui/Button";
import Eyebrow from "@/components/ui/Eyebrow";
import Reveal from "@/components/motion/Reveal";
import SplitReveal from "@/components/motion/SplitReveal";
import { registerGsap, gsap, useGSAP } from "@/lib/gsap";
import { prefersReducedMotion } from "@/hooks/useMedia";
import { scrollToTarget } from "@/lib/scroll";
import styles from "./Lookbook.module.css";

type Side = "left" | "right" | "bottom";

interface PrintSpec {
  id: string;
  src: string;
  alt: string;
  aspect: string;
  /** Parallax ratio relative to the section scroll; negative runs ahead. */
  ratio: number;
  /** Edge the clip-path reveal starts from. */
  side: Side;
  caption: string;
  href: string;
  sizes: string;
  className: string;
}

const NEXT_SECTION_ID = "foreveryone";

const CLIP_FROM: Record<Side, string> = {
  left: "inset(0% 100% 0% 0%)",
  right: "inset(0% 0% 0% 100%)",
  bottom: "inset(100% 0% 0% 0%)",
};
const CLIP_TO = "inset(0% 0% 0% 0%)";

const STAGE_PRINTS: PrintSpec[] = [
  {
    id: "necklace",
    src: "/media/photos/sb-3614.webp",
    alt: "Gold necklace on bare skin, seen from the back",
    aspect: "3 / 4",
    ratio: 0.18,
    side: "left",
    caption: "Necklaces",
    href: "/jewelry/necklaces",
    sizes: "(max-width: 767px) 56vw, 40vw",
    className: styles.necklace,
  },
  {
    id: "silver",
    src: "/media/photos/sb-3483.webp",
    alt: "Standing in a white shirt with layered sterling silver",
    aspect: "3 / 4",
    ratio: -0.12,
    side: "right",
    caption: "Sterling silver",
    href: "/jewelry/sterling-silver",
    sizes: "40vw",
    className: styles.silver,
  },
];

const HOLD_PRINTS: PrintSpec[] = [
  {
    id: "hands",
    src: "/media/photos/sb-3631.webp",
    alt: "Hands on hips wearing gold rings",
    aspect: "3 / 2",
    ratio: 0.08,
    side: "bottom",
    caption: "Rings",
    href: "/jewelry/rings",
    sizes: "(max-width: 767px) 56vw, 42vw",
    className: styles.hands,
  },
  {
    id: "laughing",
    src: "/media/photos/sb-3594.webp",
    alt: "Laughing with ringed hands held up",
    aspect: "4 / 5",
    ratio: -0.2,
    side: "left",
    caption: "Rings",
    href: "/jewelry/rings",
    sizes: "(max-width: 767px) 40vw, 32vw",
    className: styles.laughing,
  },
  {
    id: "portrait",
    src: "/media/photos/sb-3526.webp",
    alt: "Black and white portrait",
    aspect: "1 / 1",
    ratio: 0.3,
    side: "right",
    caption: "The look",
    href: "/jewelry",
    sizes: "(max-width: 767px) 40vw, 24vw",
    className: styles.portrait,
  },
];

function Print({ print }: { print: PrintSpec }) {
  return (
    <div className={`${styles.print} ${print.className}`} data-print data-parallax={print.ratio} data-side={print.side}>
      <Link href={print.href} className={styles.link} data-cursor="view">
        <span className={styles.frame} data-frame style={{ aspectRatio: print.aspect }}>
          <span className={styles.media} data-media>
            <Image src={print.src} alt={print.alt} fill sizes={print.sizes} className={styles.img} />
          </span>
        </span>
        <span className={`t-caption ${styles.caption}`} data-caption>
          <span className={styles.captionText}>{print.caption}</span>
        </span>
      </Link>
    </div>
  );
}

export default function Lookbook() {
  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const holdRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      registerGsap();
      const root = rootRef.current;
      const stage = stageRef.current;
      if (!root || !stage) return;
      const prints = gsap.utils.toArray<HTMLElement>("[data-print]", root);

      if (prefersReducedMotion()) {
        prints.forEach((print) => {
          gsap.fromTo(
            print,
            { autoAlpha: 0 },
            { autoAlpha: 1, duration: 0.3, ease: "none", scrollTrigger: { trigger: print, start: "top 90%", once: true } },
          );
        });
        return;
      }

      // The eyebrow hairline draws in with the section.
      const rule = root.querySelector<HTMLElement>(".eyebrow-rule");
      if (rule) {
        gsap.fromTo(
          rule,
          { scaleX: 0, transformOrigin: "left center" },
          { scaleX: 1, duration: 1.1, ease: "surreal", scrollTrigger: { trigger: rule, start: "top 90%", once: true } },
        );
      }

      // Clip-path reveals from alternating sides, the image settling from 1.12 to 1.
      prints.forEach((print) => {
        const frame = print.querySelector<HTMLElement>("[data-frame]");
        const media = print.querySelector<HTMLElement>("[data-media]");
        const caption = print.querySelector<HTMLElement>("[data-caption]");
        if (!frame || !media) return;
        const side = (print.dataset.side as Side | undefined) ?? "left";
        gsap.set(frame, { clipPath: CLIP_FROM[side], willChange: "clip-path" });
        gsap.set(media, { scale: 1.12, transformOrigin: "50% 50%", willChange: "transform" });
        if (caption) gsap.set(caption, { autoAlpha: 0, y: 12 });

        const tl = gsap.timeline({
          scrollTrigger: { trigger: print, start: "top 80%", once: true },
          onComplete: () => gsap.set([frame, media], { clearProps: "willChange" }),
        });
        tl.to(frame, { clipPath: CLIP_TO, duration: 1.4, ease: "surreal" }, 0).to(
          media,
          { scale: 1, duration: 1.4, ease: "surreal" },
          0,
        );
        if (caption) tl.to(caption, { autoAlpha: 1, y: 0, duration: 0.8, ease: "surreal" }, 0.5);
      });

      // Parallax per print, relative to the section scroll, halved on mobile.
      // The scrub ends where the hold begins so the frozen page is really still.
      // Prints in flow travel through zero; prints inside the hold end at zero so
      // the held page is exactly the authored layout and nothing sits off screen.
      const hold = holdRef.current;
      const mm = gsap.matchMedia();
      mm.add({ desktop: "(min-width: 768px)", mobile: "(max-width: 767px)" }, (context) => {
        const mobile = Boolean(context.conditions?.mobile);
        prints.forEach((print) => {
          const ratio = Number(print.dataset.parallax ?? 0) * (mobile ? 0.5 : 1);
          if (!ratio) return;
          const held = Boolean(hold?.contains(print));
          const travel = () => window.innerHeight * ratio * 0.5;
          gsap.fromTo(
            print,
            { y: () => (held ? -2 * travel() : -travel()) },
            {
              y: () => (held ? 0 : travel()),
              ease: "none",
              scrollTrigger: {
                trigger: root,
                start: "top bottom",
                endTrigger: stage,
                end: "bottom top",
                scrub: 0.8,
                invalidateOnRefresh: true,
                onToggle: (self) => {
                  print.style.willChange = self.isActive ? "transform" : "";
                },
              },
            },
          );
        });
      });
      return () => mm.revert();
    },
    { scope: rootRef },
  );

  // If the hold ever grows taller than the viewport (small phones), stick it by
  // its bottom edge instead so the frozen page is always its last viewport.
  useEffect(() => {
    const hold = holdRef.current;
    if (!hold || prefersReducedMotion()) return;
    const update = () => {
      hold.style.top = `${Math.min(0, window.innerHeight - hold.offsetHeight)}px`;
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(hold);
    window.addEventListener("resize", update);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", update);
      hold.style.top = "";
    };
  }, []);

  const skip = (event: MouseEvent<HTMLAnchorElement>) => {
    const target = document.getElementById(NEXT_SECTION_ID);
    if (!target) return;
    event.preventDefault();
    scrollToTarget(target);
  };

  return (
    <Section id="lookbook" theme="light" label="The lookbook" className={styles.section}>
      <div ref={rootRef}>
        <a href={`#${NEXT_SECTION_ID}`} className={`t-nav ${styles.skip}`} onClick={skip}>
          Skip the lookbook
        </a>

        <div ref={stageRef} className={styles.stage}>
          <Reveal className={styles.eyebrow}>
            <Eyebrow>The lookbook</Eyebrow>
          </Reveal>

          {STAGE_PRINTS.map((print) => (
            <Print key={print.id} print={print} />
          ))}

          <SplitReveal as="h2" className={`t-statement ${styles.statement}`}>
            Made to be worn, not kept.
          </SplitReveal>

          <div className={styles.copy}>
            <Reveal as="p" className="t-body">
              Layered silver over a white shirt. Gold on bare skin. A diamond that comes out on a Tuesday, handcrafted for
              the rest of your life.
            </Reveal>
            <Reveal className={styles.links} delay={0.15}>
              <Button variant="tertiary" href="/jewelry">
                Shop all jewelry
              </Button>
              <Button variant="tertiary" href="/jewelry/sterling-silver">
                Sterling silver
              </Button>
            </Reveal>
          </div>
        </div>

        <div ref={holdRef} className={styles.hold}>
          {HOLD_PRINTS.map((print) => (
            <Print key={print.id} print={print} />
          ))}
        </div>

        <div className={styles.room} aria-hidden />
      </div>
    </Section>
  );
}
