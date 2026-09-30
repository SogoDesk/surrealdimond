"use client";

/**
 * 7. Turntable stories, after Tanishq's styling stories: a centred coverflow
 * of portrait cards on the studio ground. Each card is a paper story frame
 * holding one engagement setting's turntable video, with a progress hairline
 * across the top that follows the video and a product chip at the foot. The centre card plays (muted,
 * looping, only while the section is on screen); its neighbours show their
 * posters, smaller and dimmed, and clicking one brings it to the centre.
 * Arrows, dots, keyboard arrows and swipe all move one card.
 */

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, type CSSProperties, type PointerEvent } from "react";
import { productById, renderSrc, videoSrc } from "@/content/catalog";
import { stories } from "@/content/home";
import { useReducedMotion } from "@/hooks/useMedia";
import SectionHead from "./SectionHead";
import { useLoop } from "./useLoop";
import { useRevealIn } from "./useRevealIn";
import h from "./home.module.css";
import s from "./Stories.module.css";

export default function Stories() {
  const ref = useRef<HTMLElement>(null);
  const videos = useRef<(HTMLVideoElement | null)[]>([]);
  const inView = useRef(false);
  const dragX = useRef<number | null>(null);
  const n = stories.length;
  const { index, rel, jumped, go, next, prev } = useLoop(n);
  const reduced = useReducedMotion();
  useRevealIn(ref);

  /* Only the centre video plays, and only while the section is on screen. */
  const sync = (active: number) => {
    videos.current.forEach((v, i) => {
      if (!v) return;
      if (i === active && inView.current && !reduced) {
        if (!v.src) {
          v.src = videoSrc(stories[i].id).mp4;
          v.load();
        }
        v.play().catch(() => undefined);
      } else {
        v.pause();
      }
    });
  };

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => {
      inView.current = entry.isIntersecting;
      sync(index);
    }, { threshold: 0.35 });
    io.observe(el);
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sync reads refs; the observer is rebuilt when the active card changes
  }, [index, reduced]);

  const onPointerDown = (e: PointerEvent) => {
    dragX.current = e.clientX;
  };
  const onPointerUp = (e: PointerEvent) => {
    if (dragX.current === null) return;
    const dx = e.clientX - dragX.current;
    dragX.current = null;
    if (Math.abs(dx) < 48) return;
    if (dx < 0) next();
    else prev();
  };

  return (
    <section ref={ref} className={`${h.section} ${s.section}`} data-theme="dark" aria-labelledby="stories-title" data-chapter="stories">
      <div className={h.wrap}>
        <SectionHead
          id="stories-title"
          eyebrow="On the turntable"
          title={
            <>
              Settings, <em>in the light</em>
            </>
          }
          sub="Five engagement settings from the catalog, turned in the studio."
        />
      </div>

      <div
        className={s.stage}
        role="region"
        aria-roledescription="carousel"
        aria-label="Engagement settings"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") next();
          if (e.key === "ArrowLeft") prev();
        }}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={() => (dragX.current = null)}
      >
        <ul className={s.ring}>
          {stories.map((story, i) => {
            const r = rel(i);
            const active = r === 0;
            const product = productById(story.productId);
            const poster = videoSrc(story.id).poster;
            return (
              <li
                key={story.id}
                className={s.card}
                style={{ "--rel": r, "--abs": Math.abs(r) } as CSSProperties}
                data-active={active ? "true" : undefined}
                data-jump={jumped(i) || reduced ? "true" : undefined}
                aria-hidden={!active}
                onClick={() => !active && go(i)}
              >
                <div className={s.frame} data-frame>
                  <span className={s.progress} aria-hidden>
                    {stories.map((st, j) => (
                      <span key={st.id} className={s.progressBar} data-state={j < index ? "done" : j === index ? "now" : undefined} />
                    ))}
                  </span>
                  <span className={s.brand} aria-hidden>
                    <span className={s.avatar} />
                    Surreal studio
                  </span>
                  <div className={s.media}>
                    <Image src={poster} alt="" width={720} height={720} sizes="(min-width: 768px) 380px, 70vw" className={s.poster} />
                    <video
                      ref={(el) => {
                        videos.current[i] = el;
                      }}
                      className={s.video}
                      muted
                      playsInline
                      loop
                      preload="none"
                      poster={poster}
                      aria-hidden
                      tabIndex={-1}
                      onTimeUpdate={(e) => {
                        const v = e.currentTarget;
                        if (v.duration) v.closest<HTMLElement>("[data-frame]")?.style.setProperty("--p", String(v.currentTime / v.duration));
                      }}
                    />
                  </div>
                  <p className={s.caption}>{story.line}</p>
                  <Link href={`/jewelry/${product?.category ?? "engagement"}`} className={s.chip} tabIndex={active ? 0 : -1}>
                    <span className={s.chipThumb}>
                      <Image src={renderSrc(product?.image ?? "le2004w442-11741")} alt="" width={96} height={96} sizes="40px" />
                    </span>
                    <span className={s.chipText}>
                      <span className={s.chipName}>{story.title}</span>
                      <span className={s.chipLine}>View setting</span>
                    </span>
                    <span className={s.chipGo} aria-hidden>
                      <svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 8h10M9 4l4 4-4 4" />
                      </svg>
                    </span>
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
        <button type="button" className={`${s.arrow} ${s.arrowPrev}`} onClick={prev} aria-label="Previous setting">
          <svg aria-hidden viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 10H4M9 5l-5 5 5 5" />
          </svg>
        </button>
        <button type="button" className={`${s.arrow} ${s.arrowNext}`} onClick={next} aria-label="Next setting">
          <svg aria-hidden viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 10h12M11 5l5 5-5 5" />
          </svg>
        </button>
      </div>
      <div className={s.dots} role="tablist" aria-label="Choose a setting">
        {stories.map((story, i) => (
          <button key={story.id} type="button" role="tab" aria-selected={i === index} aria-label={story.title} className={s.dot} onClick={() => go(i)} />
        ))}
      </div>
    </section>
  );
}
