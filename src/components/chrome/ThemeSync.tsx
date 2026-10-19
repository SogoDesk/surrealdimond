"use client";

/**
 * Keeps the chrome in step with the page (DESIGN.md, "Navigation").
 *
 * - Watches every [data-chapter] element with a ScrollTrigger and copies its
 *   data-theme onto the header (data-theme) and the root element
 *   (data-page-theme) as the chapter's top edge crosses the bar. The colour
 *   change itself is a 0.4s CSS transition in chrome.module.css.
 * - Marks the centre link whose data-chapter-match names the active chapter.
 * - Renders the 1px sky progress hairline at the top edge of the bar, visible
 *   only while a pinned section is active, scaled to that pin's progress.
 *
 * Must render inside the header element it controls. Restored from 9e31102
 * for the homepage only (SiteChrome mounts it when the page asks for chapter
 * theming); the two-row header folds on its own, so the old hide-on-scroll
 * behaviour is gone.
 */

import { useRef, type RefObject } from "react";
import { registerGsap, gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import styles from "./chrome.module.css";

export interface ThemeSyncProps {
  headerRef?: RefObject<HTMLElement | null>;
}

export default function ThemeSync({ headerRef }: ThemeSyncProps) {
  const barRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      registerGsap();
      const bar = barRef.current;
      /* This runs as a layout effect inside the header, before React attaches the
         parent's ref, so the header is resolved from the DOM when the ref is empty. */
      const header = headerRef?.current ?? bar?.closest<HTMLElement>("[data-site-header]") ?? bar?.closest<HTMLElement>("header") ?? null;
      if (!header || !bar) return;
      const root = document.documentElement;
      const navHeight = () => header.offsetHeight || 72;

      /* Theme hand-off */
      let currentChapter = "";
      const apply = (el: HTMLElement) => {
        const chapter = el.dataset.chapter ?? "";
        const theme = el.dataset.theme ?? "light";
        if (chapter === currentChapter && header.dataset.theme === theme) return;
        currentChapter = chapter;
        header.dataset.theme = theme;
        header.dataset.activeChapter = chapter;
        root.dataset.pageTheme = theme;
        if (window.location.pathname === "/") {
          header.querySelectorAll<HTMLElement>("[data-chapter-match]").forEach((link) => {
            const match = (link.dataset.chapterMatch ?? "").split(" ").includes(chapter);
            if (match) link.dataset.active = "true";
            else delete link.dataset.active;
          });
        }
      };

      const chapterTriggers: ScrollTrigger[] = [];
      const sync = () => {
        const active = [...chapterTriggers].reverse().find((t) => t.isActive);
        if (active) {
          apply(active.trigger as HTMLElement);
          return;
        }
        // Between chapters (or above the first one) keep the nearest chapter above the bar.
        const y = window.scrollY;
        const above = [...chapterTriggers].reverse().find((t) => t.start <= y);
        const fallback = above ?? chapterTriggers[0];
        if (fallback) apply(fallback.trigger as HTMLElement);
      };
      const build = () => {
        chapterTriggers.forEach((t) => t.kill());
        chapterTriggers.length = 0;
        gsap.utils.toArray<HTMLElement>("[data-chapter]").forEach((el) => {
          chapterTriggers.push(
            ScrollTrigger.create({
              trigger: el,
              start: () => `top ${navHeight()}px`,
              end: () => `bottom ${navHeight()}px`,
              refreshPriority: -10,
              onToggle: (self) => {
                if (self.isActive) apply(el);
              },
            }),
          );
        });
        sync();
      };
      build();
      ScrollTrigger.addEventListener("refresh", sync);

      /* Chapters that mount later (lazy sections) get their own trigger. */
      let rebuildTimer = 0;
      const observer = new MutationObserver(() => {
        window.clearTimeout(rebuildTimer);
        rebuildTimer = window.setTimeout(() => {
          const count = document.querySelectorAll("[data-chapter]").length;
          if (count !== chapterTriggers.length) build();
        }, 200);
      });
      observer.observe(document.body, { childList: true, subtree: true });

      /* Pin progress hairline */
      const setProgress = gsap.quickSetter(bar, "scaleX");
      let barVisible = false;
      const setBarVisible = (visible: boolean) => {
        if (visible === barVisible) return;
        barVisible = visible;
        bar.dataset.visible = visible ? "true" : "false";
      };

      const scrollTrigger = ScrollTrigger.create({
        start: 0,
        end: "max",
        onUpdate: () => {
          const activePin = ScrollTrigger.getAll().find((t) => t.pin && t.isActive);
          if (activePin) {
            setProgress(activePin.progress);
            setBarVisible(true);
          } else {
            setBarVisible(false);
          }
        },
      });

      return () => {
        window.clearTimeout(rebuildTimer);
        observer.disconnect();
        ScrollTrigger.removeEventListener("refresh", sync);
        chapterTriggers.forEach((t) => t.kill());
        scrollTrigger.kill();
        delete root.dataset.pageTheme;
        header.dataset.theme = "light";
      };
    },
    /* No selector scope: the header ref is not attached yet when this layout
       effect runs, and every element is reached through refs or the document. */
    { dependencies: [] },
  );

  return <div ref={barRef} className={styles.progress} aria-hidden data-visible="false" />;
}
