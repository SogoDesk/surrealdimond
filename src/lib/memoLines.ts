"use client";

/**
 * The dealer's open memo as lines, shared by the open memo report and the
 * invoices page (items reported sold on memo become invoices). Two sources:
 * stones the dealer requested on memo from the diamond page, and, for the
 * demo account, the labelled sample memo (src/content/memoSample.ts).
 * RightClick supplies the real memo with daily prices later (C-07).
 */

import { useMemo } from "react";
import { metals, productById, productHref, type Product } from "@/content/catalog";
import { SHAPE_LABEL, stoneById, type StoneShape } from "@/content/diamonds";
import { sampleMemo } from "@/content/memoSample";
import { useDealer } from "./dealer";
import { useMemos } from "./memo";
import { jewelryPrice, stonePrice } from "./pricing";
import { useNow } from "./useNow";

export interface MemoLine {
  id: string;
  memo: string;
  date: string;
  stock: string;
  kind: "stone" | "jewelry";
  title: string;
  shape?: StoneShape;
  carat: number;
  cut?: string;
  color?: string;
  clarity?: string;
  sample: boolean;
  href?: string;
  /** Dealer price in US dollars, when known */
  price: number | null;
}

const DAY = 864e5;

export function useMemoLines(): MemoLine[] {
  const dealer = useDealer();
  const memos = useMemos();
  const now = useNow();

  return useMemo<MemoLine[]>(() => {
    const fromRequests: MemoLine[] = memos.map((m) => {
      const st = stoneById(m.stoneId);
      return {
        id: `${m.number}|${m.stoneId}`,
        memo: m.number,
        date: m.requestedAt,
        stock: m.stoneId,
        kind: "stone",
        title: st ? `${st.carat.toFixed(2)} ct ${SHAPE_LABEL[st.shape]}` : `Stone ${m.stoneId}`,
        shape: st?.shape,
        carat: st?.carat ?? 0,
        cut: st?.cut ?? undefined,
        color: st?.color,
        clarity: st?.clarity,
        sample: false,
        href: `/diamonds?stone=${m.stoneId}`,
        price: st ? stonePrice(st) : null,
      };
    });
    const samples: MemoLine[] = dealer?.demo
      ? sampleMemo.map((x) => {
          const p: Product | undefined = x.productId ? productById(x.productId) : undefined;
          return {
            id: `${x.memo}|${x.stock}`,
            memo: x.memo,
            date: new Date(now - x.daysAgo * DAY).toISOString(),
            stock: x.stock,
            kind: x.kind,
            title: x.kind === "jewelry" ? `${p?.name ?? "Jewelry"}, ${metals.find((m) => m.id === x.metal)?.label ?? ""}` : `${x.carat.toFixed(2)} ct ${x.shape ? SHAPE_LABEL[x.shape] : ""}`,
            shape: x.shape,
            carat: x.carat,
            cut: x.cut,
            color: x.color,
            clarity: x.clarity,
            sample: true,
            href: p ? productHref(p) : undefined,
            price: x.kind === "jewelry" ? (p && x.metal ? jewelryPrice(p, x.metal, x.carat) : null) : x.color && x.clarity ? stonePrice({ carat: x.carat, color: x.color, clarity: x.clarity }) : null,
          };
        })
      : [];
    return [...fromRequests, ...samples];
  }, [memos, dealer?.demo, now]);
}
