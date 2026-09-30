"use client";

import { useCallback, useState } from "react";

/**
 * Index state for a looping carousel of n items. rel(i) is the item's signed
 * offset from the active one, wrapped into [-n/2, n/2), so every item sits
 * left or right of centre without clones. jumped(i) is true when the item's
 * offset changed by more than half the ring on the last move: that item is
 * wrapping around the back and should move without a transition.
 */
export function useLoop(n: number, start = 0) {
  const [state, setState] = useState({ index: start, prev: start });

  const wrap = useCallback((v: number) => ((v % n) + n) % n, [n]);
  const offset = useCallback(
    (i: number, at: number) => {
      const half = Math.floor(n / 2);
      return ((((i - at + half) % n) + n) % n) - half;
    },
    [n],
  );

  const go = useCallback((to: number) => setState((s) => ({ index: ((to % n) + n) % n, prev: s.index })), [n]);
  const next = useCallback(() => setState((s) => ({ index: (s.index + 1) % n, prev: s.index })), [n]);
  const prev = useCallback(() => setState((s) => ({ index: (s.index - 1 + n) % n, prev: s.index })), [n]);

  const rel = (i: number) => offset(i, state.index);
  const jumped = (i: number) => Math.abs(offset(i, state.index) - offset(i, state.prev)) > Math.floor(n / 2);

  return { index: state.index, rel, jumped, go, next, prev, wrap };
}
