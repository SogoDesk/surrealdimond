"use client";

/**
 * 02. Just weeks (`time`): a pinned chapter where 1,500,000,000 years holds on
 * screen and then collapses into the sky-blue word "weeks" (DESIGN.md).
 *
 * The counter is thirteen fixed-width slots (ten digits, three commas) in a
 * flex row. A numeric proxy tween formatted with Intl.NumberFormat writes the
 * digits; as leading slots become redundant their width animates to 0 so the
 * figure physically shrinks toward the centre. On mobile the slots wrap into
 * two rows (1,500, / 000,000) and collapse toward the centre of the second row.
 * Reduced motion: no pin, no counter, the word weeks shown with the copy.
 */

import Image from "next/image";
import { useRef, type MouseEvent } from "react";
import Section from "@/components/ui/Section";
import Button from "@/components/ui/Button";
import Eyebrow from "@/components/ui/Eyebrow";
import { registerGsap, gsap, ScrollTrigger, SplitText, useGSAP } from "@/lib/gsap";
import { prefersReducedMotion, useBreakpoint, useReducedMotion } from "@/hooks/useMedia";
import { scrollToTarget } from "@/lib/scroll";
import styles from "./TimeCounter.module.css";

const START = 1_500_000_000;
const FIGURE = "1,500,000,000";
/** Mobile rows; on desktop the rows flatten into one line with display: contents. */
const ROWS = ["1,500,", "000,000"];
const SLOT_COUNT = FIGURE.length;
const LAST_SLOT = SLOT_COUNT - 1;
const MOBILE = "(max-width: 767px)";

export interface TimeCounterProps {
  /** id of the section the skip link jumps to. */
  nextId?: string;
}

export default function TimeCounter({ nextId = "engagement" }: TimeCounterProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  // Re-run the effect when the layout crosses the tablet breakpoint (pin length and row layout change).
  const desktop = useBreakpoint("md");

  useGSAP(
    (_context, contextSafe) => {
      registerGsap();
      const stage = stageRef.current;
      if (!stage || prefersReducedMotion()) return;
      const root = (stage.closest("[data-chapter]") as HTMLElement | null) ?? stage;
      const q = gsap.utils.selector(stage);

      const photo = q<HTMLElement>("[data-photo]")[0];
      const counter = q<HTMLElement>("[data-counter]")[0];
      const slots = q<HTMLElement>("[data-slot]");
      const chars = slots.map((slot) => slot.firstElementChild as HTMLElement);
      const yearChars = q<HTMLElement>("[data-year-char]");
      const years = q<HTMLElement>("[data-years]")[0];
      const weeks = q<HTMLElement>("[data-weeks]")[0];
      const weeksInner = q<HTMLElement>("[data-weeks-inner]")[0];
      const rule = q<HTMLElement>("[data-eyebrow] > span:first-child")[0];
      const eyebrowLabel = q<HTMLElement>("[data-eyebrow] > span:last-child")[0];
      const headline = q<HTMLElement>("[data-headline]")[0];
      const body = q<HTMLElement>("[data-body]")[0];
      const cta = q<HTMLElement>("[data-cta]")[0];
      const probeDigit = q<HTMLElement>('[data-probe="digit"]')[0];
      const probeComma = q<HTMLElement>('[data-probe="comma"]')[0];
      if (!counter || slots.length !== SLOT_COUNT || !weeks || !weeksInner || !headline || !body || !cta) return;

      const mobile = window.matchMedia(MOBILE).matches;
      const movers = [...chars, ...yearChars, weeksInner, body, cta];

      // Initial states live here, not in CSS, so the copy is never stranded invisible.
      gsap.set([body, cta], { autoAlpha: 0, y: 40 });
      gsap.set(weeks, { autoAlpha: 0 });
      if (eyebrowLabel) gsap.set(eyebrowLabel, { autoAlpha: 0 });
      if (rule) gsap.set(rule, { scaleX: 0, transformOrigin: "0% 50%" });

      /* Counter writer: formats the proxy value and collapses or expands slots. */
      const format = new Intl.NumberFormat("en-US");
      const collapsed = new Array<boolean>(SLOT_COUNT).fill(false);
      let lastText = FIGURE;
      const naturalWidth = (slot: HTMLElement) => {
        const probe = slot.dataset.slot === "comma" ? probeComma : probeDigit;
        const w = probe ? probe.getBoundingClientRect().width : 0;
        return w > 0 ? w : "auto";
      };
      const write = (value: number) => {
        // Below one million the whole figure dissolves with the word years, so the collapse ends in
        // "weeks" rather than a lone digit; the value drives it so it is exact in both scroll directions.
        const dissolve = Math.min(1, Math.max(0, Math.log10(Math.max(value, 1)) / 6));
        gsap.set(counter, { opacity: dissolve, y: (1 - dissolve) * -12 });
        if (years) gsap.set(years, { opacity: dissolve });
        const text = format.format(Math.max(0, Math.round(value)));
        if (text === lastText) return;
        lastText = text;
        const offset = SLOT_COUNT - text.length;
        for (let i = 0; i < SLOT_COUNT; i++) {
          const slot = slots[i];
          if (i >= offset) {
            const next = text[i - offset];
            if (chars[i].textContent !== next) chars[i].textContent = next;
          }
          const shouldCollapse = i < offset && i < LAST_SLOT;
          if (shouldCollapse === collapsed[i]) continue;
          collapsed[i] = shouldCollapse;
          if (shouldCollapse) {
            gsap.to(slot, { width: 0, opacity: 0, duration: 0.3, ease: "power2.inOut", overwrite: true });
          } else {
            gsap.to(slot, {
              width: naturalWidth(slot),
              opacity: 1,
              duration: 0.3,
              ease: "power2.inOut",
              overwrite: true,
              onComplete: () => gsap.set(slot, { clearProps: "width" }),
            });
          }
        }
      };

      /* Scrubbed timeline: 1 unit of time equals the full pin. */
      // The collapse runs on a log scale: the digit count falls steadily rather than all nine digits
      // vanishing in the last few pixels of scroll, so the figure visibly cascades toward a single digit.
      const proxy = { t: 0 };
      const valueAt = (t: number) => START * Math.pow(10, -9.2 * t * t);
      const tl = gsap.timeline({ paused: true, defaults: { ease: "none" }, onUpdate: () => write(valueAt(proxy.t)) });

      // 0 to 0.12: the lingering hero photograph fades, the counter and years reveal by character, the hairline draws.
      if (photo) tl.fromTo(photo, { opacity: 0.12 }, { opacity: 0, duration: 0.12 }, 0);
      tl.fromTo(
        chars,
        { yPercent: 110 },
        { yPercent: 0, duration: 0.07, ease: "power3.out", stagger: { each: 0.004, from: "center" } },
        0,
      );
      if (yearChars.length) {
        tl.fromTo(yearChars, { yPercent: 110 }, { yPercent: 0, duration: 0.06, ease: "power3.out", stagger: 0.005 }, 0.04);
      }
      if (rule) tl.to(rule, { scaleX: 1, duration: 0.08, ease: "power2.out" }, 0.03);
      if (eyebrowLabel) tl.to(eyebrowLabel, { autoAlpha: 1, duration: 0.05 }, 0.09);

      // 0.15 to 0.8: the number holds, then cascades down through the digits.
      tl.to(proxy, { t: 1, duration: 0.65, ease: "power1.in" }, 0.15);

      // 0.8: weeks rises where the figure dissolved (the figure and years fade inside write()).
      tl.to(weeks, { autoAlpha: 1, duration: 0.01 }, 0.8);
      tl.fromTo(weeksInner, { yPercent: 110 }, { yPercent: 0, duration: 0.1, ease: "power3.out" }, 0.8);

      // 0.85 to 1: the right column reveals (headline lines are added once fonts are ready).
      tl.to(body, { autoAlpha: 1, y: 0, duration: 0.12, ease: "power2.out" }, 0.88);
      tl.to(cta, { autoAlpha: 1, y: 0, duration: 0.1, ease: "power2.out" }, 0.9);

      const trigger = ScrollTrigger.create({
        trigger: stage,
        start: "top top",
        end: () => `+=${Math.round(window.innerHeight * (mobile ? 1.2 : 1.5))}`,
        pin: stage,
        pinSpacing: true,
        anticipatePin: 1,
        scrub: 1,
        animation: tl,
        onToggle: (self) => {
          root.dataset.pinActive = self.isActive ? "true" : "false";
          gsap.set(movers, { willChange: self.isActive ? "transform, opacity" : "auto" });
        },
        onUpdate: (self) => root.style.setProperty("--surreal-progress", self.progress.toFixed(4)),
      });

      /* Headline lines split on the final face, then slotted into the timeline. */
      let split: SplitText | undefined;
      let cancelled = false;
      gsap.set(headline, { visibility: "hidden" });
      const buildHeadline = () => {
        if (cancelled) return;
        split = SplitText.create(headline, {
          type: "lines",
          mask: "lines",
          autoSplit: true,
          linesClass: "split-line",
          onSplit: (self) => {
            const tween = gsap.fromTo(
              self.lines,
              { yPercent: 110 },
              { yPercent: 0, duration: 0.1, ease: "power3.out", stagger: 0.02, immediateRender: true },
            );
            tl.add(tween, 0.85);
            gsap.set(headline, { clearProps: "visibility" });
            // The scrub may already be past 0.85 (fonts resolved late), so render the
            // timeline once at its current time instead of waiting for the next scroll.
            tl.render(tl.totalTime(), false, true);
            return tween;
          },
        });
      };
      const fonts = typeof document !== "undefined" ? document.fonts : undefined;
      (fonts ? fonts.ready : Promise.resolve()).then(contextSafe ? (contextSafe(buildHeadline) as () => void) : buildHeadline);

      return () => {
        cancelled = true;
        split?.revert();
        trigger.kill();
        // The collapse tweens run after the context was recorded, so restore the slots by hand.
        gsap.killTweensOf(slots);
        gsap.set(slots, { clearProps: "width,opacity" });
        chars.forEach((char, i) => {
          char.textContent = FIGURE[i];
        });
        root.style.removeProperty("--surreal-progress");
        delete root.dataset.pinActive;
      };
    },
    { scope: stageRef, dependencies: [desktop], revertOnUpdate: true },
  );

  const skip = (e: MouseEvent<HTMLAnchorElement>) => {
    const target = document.getElementById(nextId);
    if (!target) return;
    e.preventDefault();
    if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
    target.focus({ preventScroll: true });
    scrollToTarget(target);
  };

  let slotIndex = 0;

  return (
    <Section id="time" theme="dark" label="Just weeks" className={styles.section}>
      <a href={`#${nextId}`} className={styles.skip} onClick={skip} data-cursor="link">
        Skip to the next section
      </a>
      <div ref={stageRef} className={`${styles.stage} ${reduced ? styles.reduced : ""}`}>
        <div className={styles.photo} data-photo aria-hidden="true">
          <Image
            src="/media/photos/sb-3984.webp"
            alt=""
            fill
            sizes="100vw"
            quality={60}
            className={styles.photoImg}
          />
        </div>

        <div className={styles.center} aria-hidden="true">
          <div className={styles.counter} data-counter>
            {ROWS.map((row) => (
              <div key={row} className={styles.row}>
                {row.split("").map((ch) => {
                  const i = slotIndex++;
                  return (
                    <span key={i} className={styles.slot} data-slot={ch === "," ? "comma" : "digit"}>
                      <span className={styles.char}>{ch}</span>
                    </span>
                  );
                })}
              </div>
            ))}
            <span className={styles.probe} data-probe="digit">
              0
            </span>
            <span className={styles.probe} data-probe="comma">
              ,
            </span>
          </div>
          <span className={styles.years} data-years>
            {"years".split("").map((ch, i) => (
              <span key={i} className={styles.yearChar} data-year-char>
                {ch}
              </span>
            ))}
          </span>
          <span className={styles.weeks} data-weeks>
            <span className={styles.weeksInner} data-weeks-inner>
              weeks
            </span>
          </span>
        </div>

        <div className={`${styles.copyGrid} container grid-12`}>
          <div className={styles.copy}>
            <Eyebrow>Grower, not reseller</Eyebrow>
            <h2 className={styles.headline} data-headline>
              From 1.5 billion years to <em>just weeks</em>.
            </h2>
            <p className={`t-body ${styles.body}`} data-body>
              From inception to final inspection, we grow our own CVD diamonds, primarily DEF color and VVS clarity: the
              world&apos;s most transparent diamond material. Completely identical to a mined diamond, without the
              ecological damage.
            </p>
            <div data-cta>
              <Button variant="tertiary" href="/education/why-cvd">
                How a diamond is grown
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}
