"use client";

/**
 * 03. Say yes (engagement), calm since the client's feedback of 27 October
 * 2026 (F-A3): the copy and doors beside the oval halo render, then the
 * solitaire settings row (the shape strip with stock counts was removed in
 * the client change request of November 2026). The scroll-scrubbed 96 frame turntable, the pinned stage and the
 * circle of light that opened it are gone; the section is light from the
 * start, so the header follows it without a mid-scroll flip.
 *
 * Surreal blue (client feedback, 28 October 2026): the chapter is a sky
 * chapter. As it arrives the blue splashes out from the ring once, a circle
 * opening over the page ground (1.4s, not scrubbed), and the copy rises in
 * behind it. The ring sits in a pool of white light, so the render keeps its
 * true metal (it multiplies onto white, not onto the blue). Reduced motion:
 * the blue is simply there.
 *
 *   <Engagement />
 */

import Image from "next/image";
import { useRef } from "react";
import { registerGsap, gsap, useGSAP } from "@/lib/gsap";
import { prefersReducedMotion } from "@/hooks/useMedia";
import Section from "@/components/ui/Section";
import Button from "@/components/ui/Button";
import Eyebrow from "@/components/ui/Eyebrow";
import SettingTiles from "./SettingTiles";
import styles from "./Engagement.module.css";

const STILL = "/media/renders/le2004w442-11741.webp";
const CHAPTER = "engagement";

export default function Engagement() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  // The splash: the blue opens as a circle from the ring, then the copy and the ring's light arrive.
  useGSAP(
    () => {
      registerGsap();
      const root = sectionRef.current;
      const splash = root?.querySelector<HTMLElement>("[data-splash]");
      const pool = root?.querySelector<HTMLElement>("[data-pool]");
      if (!root || !splash || !pool || prefersReducedMotion()) return;
      const rise = gsap.utils.toArray<HTMLElement>("[data-rise]", root);
      const origin = () => {
        const a = root.getBoundingClientRect();
        const b = pool.getBoundingClientRect();
        const x = b.left + b.width / 2 - a.left;
        const y = b.top + b.height / 2 - a.top;
        const r = Math.hypot(Math.max(x, a.width - x), Math.max(y, a.height - y));
        return { x, y, r };
      };
      const o = origin();
      gsap.set(splash, { clipPath: `circle(0px at ${o.x}px ${o.y}px)` });
      gsap.set(rise, { autoAlpha: 0, y: 28 });
      gsap.set(pool, { autoAlpha: 0, scale: 0.92 });
      // An observer rather than a ScrollTrigger: the chapters above change height after hydration (Hot this week fills in), which would set a measured start off early.
      const io = new IntersectionObserver(
        ([entry]) => {
          if (!entry?.isIntersecting) return;
          io.disconnect();
          const { x, y, r } = origin();
          gsap
            .timeline()
            .fromTo(splash, { clipPath: `circle(0px at ${x}px ${y}px)` }, { clipPath: `circle(${r}px at ${x}px ${y}px)`, duration: 1.4, ease: "power3.inOut", clearProps: "clipPath" })
            .to(pool, { autoAlpha: 1, scale: 1, duration: 1.2, ease: "surreal", clearProps: "transform" }, 0.6)
            .to(rise, { autoAlpha: 1, y: 0, duration: 1, ease: "surreal", stagger: 0.08, clearProps: "transform" }, 0.45);
        },
        { rootMargin: "0px 0px -30% 0px" },
      );
      if (stageRef.current) io.observe(stageRef.current);
      return () => io.disconnect();
    },
    { scope: sectionRef },
  );


  return (
    <Section id={CHAPTER} theme="sky" label="Engagement" className={styles.section}>
      <div ref={sectionRef} className={styles.inner}>
        <span aria-hidden className={styles.splash} data-splash />
        <div ref={stageRef} className={styles.stage}>
          <div className={styles.porcelain} data-open>
            <div className={`container grid-12 ${styles.body}`}>
              <div className={styles.copy}>
                <span data-rise>
                  <Eyebrow>Bridal</Eyebrow>
                </span>
                <h2 className="t-headline" data-rise>
                  The ring she <em>says yes&nbsp;to</em>.
                </h2>
                <p className="t-body" data-rise>
                  Engagement rings handcrafted around diamonds we grew, in every shape your counter needs. When the stone
                  a client asks for does not exist yet, we grow it to order.
                </p>
                <div className={styles.ctas} data-ctas data-rise>
                  <Button href="/jewelry/engagement" arrow>
                    Shop engagement rings
                  </Button>
                  <Button href="/diamonds" variant="secondary">
                    Search loose diamonds
                  </Button>
                </div>
              </div>
              <div className={styles.stoneCol}>
                <div className={styles.turntable} data-pool>
                  <span className={styles.shadow} aria-hidden />
                  <Image src={STILL} alt="Oval halo engagement ring on a pave band" width={1200} height={1200} sizes="(max-width: 767px) 80vw, 40vw" className={styles.still} />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className={`container grid-12 ${styles.settings}`}>
          <div className={styles.settingsIntro}>
            <Eyebrow>Solitaires</Eyebrow>
            <h3 className={styles.settingsTitle}>
              Ready for the stone <em>your client picks</em>.
            </h3>
            <p className={styles.settingsLine}>Classic solitaire settings, handcrafted to order. Move across a ring to turn it.</p>
            <Button href="/jewelry/engagement" variant="tertiary">
              All engagement rings
            </Button>
          </div>
          <SettingTiles className={styles.settingsTiles} />
        </div>
      </div>
    </Section>
  );
}
