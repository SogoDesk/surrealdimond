"use client";

import { useSyncExternalStore } from "react";

/**
 * The current time to the minute, for pages that count days or filter by
 * date. Read through useSyncExternalStore so render stays pure; the value
 * only changes when the minute turns. The server snapshot is 0, and the
 * dashboard renders its pages only after hydration.
 */
const read = () => Math.floor(Date.now() / 60_000) * 60_000;
const subscribe = (cb: () => void) => {
  const id = window.setInterval(cb, 30_000);
  return () => window.clearInterval(id);
};

export const useNow = () => useSyncExternalStore(subscribe, read, () => 0);
