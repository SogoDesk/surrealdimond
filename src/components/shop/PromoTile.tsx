"use client";

/**
 * Made to order promo inside the grid, once, after the sixteenth card: a two
 * column tile on the studio ground with the line mark small in sky and
 * porcelain, an eyebrow, a Cormorant line, a short body and a porcelain pill.
 */

import Button from "@/components/ui/Button";
import Eyebrow from "@/components/ui/Eyebrow";
import LineMark from "@/components/brand/LineMark";
import { LINE_MARK_ASPECT } from "@/components/brand/lineMarkPaths";
import s from "./shop.module.css";

const HREF = "/made-to-order";

export default function PromoTile() {
  return (
    <div className={s.promo} data-tile data-flip-id="promo" data-theme="dark">
      <div className={s.promoTop}>
        <LineMark navy="var(--porcelain)" sky="var(--sky)" alternating strokeCount={12} strokeScale={5} className={s.promoMark} style={{ width: 72 * LINE_MARK_ASPECT }} />
        <div className={s.promoCopy}>
          <Eyebrow>Made to Order</Eyebrow>
          <h3 className={s.promoHead}>Do not see the stone you want? We grow it.</h3>
          <p className={`t-body ${s.promoBody}`}>Tell us the shape, the size and the color and we grow the stone to your specification.</p>
        </div>
      </div>
      <div className={s.promoAction}>
        <Button variant="primary" href={HREF} arrow>
          Start a made to order diamond
        </Button>
      </div>
    </div>
  );
}
