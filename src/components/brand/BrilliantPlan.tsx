"use client";

import { useMemo } from "react";
import s from "./BrilliantPlan.module.css";

/* Plan view of a round brilliant: girdle, table, star, bezel and upper girdle facet lines. */
const C = 110;
const GIRDLE = 100;
const TABLE = 54;
const STAR = 78;

function point(deg: number, r: number): string {
  const a = (deg * Math.PI) / 180;
  return `${(C + r * Math.cos(a)).toFixed(2)} ${(C + r * Math.sin(a)).toFixed(2)}`;
}

function brilliantPaths(): string[] {
  const paths: string[] = [];
  const table = Array.from({ length: 8 }, (_, k) => point(k * 45, TABLE));
  paths.push(`M${table.join(" L")} Z`);
  for (let k = 0; k < 8; k += 1) {
    const t0 = table[k];
    const t1 = table[(k + 1) % 8];
    const star = point(k * 45 + 22.5, STAR);
    const starPrev = point(k * 45 - 22.5, STAR);
    const bezelTip = point(k * 45, GIRDLE);
    const girdle = point(k * 45 + 22.5, GIRDLE);
    paths.push(`M${t0} L${star} L${t1}`);
    paths.push(`M${starPrev} L${bezelTip} L${star}`);
    paths.push(`M${t0} L${bezelTip}`);
    paths.push(`M${star} L${girdle}`);
  }
  return paths;
}

/** The brilliant in plan, drawn in currentColor and turning slowly (still under reduced motion). */
export function BrilliantPlan() {
  const paths = useMemo(() => brilliantPaths(), []);
  return (
    <svg viewBox="0 0 220 220" className={s.brilliant} role="img" aria-label="Plan view of a round brilliant cut" data-brilliant>
      <g className={s.spin} fill="none" stroke="currentColor" strokeWidth="1" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke">
        <circle data-facet cx={C} cy={C} r={GIRDLE} vectorEffect="non-scaling-stroke" />
        {paths.map((d, i) => (
          <path key={i} data-facet d={d} vectorEffect="non-scaling-stroke" />
        ))}
      </g>
    </svg>
  );
}

export default BrilliantPlan;
