"use client";

/**
 * Editorial interlude inside the grid: a two column 8:5 photograph with a
 * slow parallax, a caption in Cormorant italic on a soft studio scrim and a
 * tertiary link into a category. Five photographs cycle after every eighth
 * card.
 */

import Image from "next/image";
import Button from "@/components/ui/Button";
import Parallax from "@/components/motion/Parallax";
import s from "./shop.module.css";

export interface InterludeSpec {
  id: string;
  slug: string;
  caption: string;
  alt: string;
  link: string;
  href: string;
}

export const INTERLUDES: InterludeSpec[] = [
  { id: "sb-3605", slug: "sb-3605", caption: "Worn every day", alt: "Line drop earrings, a flower ring and layered tennis necklaces over a white shirt", link: "Shop earrings", href: "/jewelry/earrings" },
  { id: "sb-3730", slug: "sb-3730", caption: "Gold, stacked", alt: "Stacked gold rings and pave hoops, a finger held to the lips", link: "Shop rings", href: "/jewelry/rings" },
  { id: "sb-3614", slug: "sb-3614", caption: "Made to be worn", alt: "Gold necklace on bare skin, seen from the back", link: "Shop necklaces", href: "/jewelry/necklaces" },
  { id: "sb-4074", slug: "sb-4074", caption: "Light, held", alt: "Diamond hoop earrings hanging from a flower stem", link: "Shop earrings", href: "/jewelry/earrings" },
  { id: "sb-3631", slug: "sb-3631", caption: "On every hand", alt: "Hands on hips wearing gold rings", link: "Shop rings", href: "/jewelry/rings" },
];

const SIZES = "(max-width: 767px) 100vw, (max-width: 1279px) 66vw, 60vw";

export default function Interlude({ spec, ordinal }: { spec: InterludeSpec; ordinal: number }) {
  return (
    <figure className={s.interlude} data-tile data-flip-id={`interlude-${ordinal}`} data-cursor="view">
      <Parallax speed={0.12} scale={1.12} className={s.interludeMedia}>
        <Image src={`/media/photos/${spec.slug}.webp`} alt={spec.alt} fill sizes={SIZES} draggable={false} className={s.interludeImg} />
      </Parallax>
      <span aria-hidden className={s.scrim} />
      <figcaption className={s.interludeCopy}>
        <p className={s.interludeCaption}>{spec.caption}</p>
        <Button variant="tertiary" href={spec.href}>
          {spec.link}
        </Button>
      </figcaption>
    </figure>
  );
}
