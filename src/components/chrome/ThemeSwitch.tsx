"use client";

import { setMode, useMode, useModeSync } from "@/lib/theme";
import styles from "./chrome.module.css";

function SunIcon() {
  return (
    <svg aria-hidden viewBox="0 0 18 18" className={styles.modeIcon} fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="9" r="3.25" />
      <path d="M9 1.75v1.5M9 14.75v1.5M1.75 9h1.5M14.75 9h1.5M3.9 3.9l1.05 1.05M13.05 13.05l1.05 1.05M3.9 14.1l1.05-1.05M13.05 4.95l1.05-1.05" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg aria-hidden viewBox="0 0 18 18" className={styles.modeIcon} fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.75 10.9A6.25 6.25 0 0 1 7.1 3.25a6.25 6.25 0 1 0 7.65 7.65Z" />
    </svg>
  );
}

/**
 * Light or dark theme (F-A5), remembered in this browser. A labelled two-way
 * switch with the current side filled in Surreal blue, so it reads as a
 * control at a glance (client feedback, 28 October 2026: the bare icon was
 * missed). The mobile sheet shows the same switch.
 */
export default function ThemeSwitch({ className = "" }: { className?: string }) {
  useModeSync();
  const mode = useMode();
  const dark = mode === "dark";
  return (
    <button
      type="button"
      role="switch"
      aria-checked={dark}
      aria-label="Dark theme"
      title={dark ? "Switch to the light theme" : "Switch to the dark theme"}
      className={`${styles.mode} ${className}`}
      data-mode={mode}
      onClick={() => setMode(dark ? "light" : "dark")}
    >
      <span aria-hidden className={styles.modeThumb} />
      <span className={styles.modeOpt} data-on={!dark ? "true" : undefined}>
        <SunIcon />
        <span className={styles.modeLabel}>Light</span>
      </span>
      <span className={styles.modeOpt} data-on={dark ? "true" : undefined}>
        <MoonIcon />
        <span className={styles.modeLabel}>Dark</span>
      </span>
    </button>
  );
}
