"use client";

/**
 * 2. Grower strip: the trade pitch under the hero. A two column intro (who
 * this site is for, and the two doors: Become a dealer, Log in) over a row of
 * four proof figures, each a large Italiana figure over a Jost line, split by
 * hairlines. Facts from site.ts and the live Learn More page only. A signed-in
 * dealer sees their own band (DealerHome) in its place.
 */

import { useRef } from "react";
import Button from "@/components/ui/Button";
import Eyebrow from "@/components/ui/Eyebrow";
import { growerProof } from "@/content/home";
import { account } from "@/content/site";
import { useRevealIn } from "./useRevealIn";
import { useDealer } from "@/lib/dealer";
import h from "./home.module.css";
import s from "./GrowerStrip.module.css";

export default function GrowerStrip() {
  const ref = useRef<HTMLElement>(null);
  const dealer = useDealer();
  useRevealIn(ref);

  if (dealer) return null;
  return (
    <section ref={ref} className={s.section} aria-labelledby="grower-title" data-chapter="grower">
      <div className={h.wrap}>
        <div className={s.intro}>
          <div className={s.lead}>
            <span data-rise>
              <Eyebrow>For jewelry retailers</Eyebrow>
            </span>
            <h2 id="grower-title" className={s.title} data-rise>
              The grower&apos;s own diamonds, <em>for your store.</em>
            </h2>
          </div>
          <div className={s.side}>
            <p className={s.body} data-rise>
              We grow our own CVD diamonds, primarily DEF color and VVS clarity, and handcraft the jewelry they are set in. Surreal sells only to
              retailers: apply for a dealer account for direct-from-the-grower pricing and an exclusive territory.
            </p>
            <div className={s.doors} data-rise>
              <Button href={account.apply} variant="primary" arrow>
                Become a dealer
              </Button>
              <Button href={account.login} variant="secondary">
                Dealer log in
              </Button>
            </div>
          </div>
        </div>

        <ul className={s.proof}>
          {growerProof.map((p) => (
            <li key={p.figure} className={s.cell} data-rise>
              <span className={s.figure}>{p.figure}</span>
              <span className={s.label}>{p.label}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
