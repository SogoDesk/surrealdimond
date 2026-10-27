"use client";

/**
 * 03. Say yes (engagement), calm since the client's feedback of 27 October
 * 2026 (F-A3): the copy and doors beside the oval halo render, the shop by
 * shape strip with stock counts at the foot, then the solitaire settings
 * row. The scroll-scrubbed 96 frame turntable, the pinned stage and the
 * circle of light that opened it are gone; the section is light from the
 * start, so the header follows it without a mid-scroll flip.
 *
 *   <Engagement />
 */

import Image from "next/image";
import { useEffect, useRef } from "react";
import Section from "@/components/ui/Section";
import Button from "@/components/ui/Button";
import Eyebrow from "@/components/ui/Eyebrow";
import ShapeStrip, { type ShapeStripHandle } from "./ShapeStrip";
import SettingTiles from "./SettingTiles";
import styles from "./Engagement.module.css";

const STILL = "/media/renders/le2004w442-11741.webp";
const CHAPTER = "engagement";

export default function Engagement() {
  const stageRef = useRef<HTMLDivElement>(null);
  const stripRef = useRef<ShapeStripHandle>(null);

  // The shape outlines draw in once, as the strip comes into view.
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        stripRef.current?.draw();
        observer.disconnect();
      },
      { threshold: 0.35 },
    );
    observer.observe(stage);
    return () => observer.disconnect();
  }, []);

  return (
    <Section id={CHAPTER} theme="light" label="Engagement" className={styles.section}>
      <div ref={stageRef} className={styles.stage}>
        <div className={styles.porcelain} data-open>
          <div className={`container grid-12 ${styles.body}`}>
            <div className={styles.copy}>
              <Eyebrow>Bridal</Eyebrow>
              <h2 className="t-headline">
                The ring your client <em>says yes&nbsp;to</em>.
              </h2>
              <p className="t-body">
                Engagement rings handcrafted around diamonds we grew, in every shape your counter needs. When the stone
                a client asks for does not exist yet, we grow it to order.
              </p>
              <div className={styles.ctas} data-ctas>
                <Button href="/jewelry/engagement" arrow>
                  Shop engagement rings
                </Button>
                <Button href="/diamonds" variant="secondary">
                  Search loose diamonds
                </Button>
              </div>
            </div>
            <div className={styles.stoneCol}>
              <div className={styles.turntable}>
                <span className={styles.shadow} aria-hidden />
                <Image src={STILL} alt="Oval halo engagement ring on a pave band" width={1200} height={1200} sizes="(max-width: 767px) 80vw, 40vw" className={styles.still} />
              </div>
            </div>
          </div>
          <ShapeStrip ref={stripRef} className={styles.strip} />
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
    </Section>
  );
}
