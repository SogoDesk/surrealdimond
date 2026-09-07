# Surreal Diamond website

The new homepage experience for Surreal Diamond (surrealdiamond.com): a lab-grown diamond grower and fine jewelry house in New York. The design direction, section specifications and motion language are documented in [DESIGN.md](DESIGN.md).

## Stack

- Next.js 16 (App Router, `src/` directory), React 19, TypeScript
- Tailwind CSS v4 with the brand tokens declared in `src/app/globals.css`
- GSAP 3.15 (ScrollTrigger, SplitText, DrawSVG, Flip, Observer, CustomEase) registered once in `src/lib/gsap.ts`
- Lenis smooth scrolling (`src/components/providers/SmoothScroll.tsx`), which drives ScrollTrigger from the same ticker
- three.js with React Three Fiber and drei for the single WebGL element on the page, the hero diamond
- Fonts through `next/font/google`: Italiana (display), Cormorant Garamond (editorial), Jost (interface)

## Getting started

```bash
npm install
npm run dev
```

The site runs at http://localhost:3000 by default. `npm run build` produces the production build and `npm run lint` runs ESLint.

## Project structure

```
src/app                 layout, homepage, global styles, icons and social images
src/components/brand    the logo line mark (procedural SVG), wordmark and lockup
src/components/chrome   header, mega menu, mobile menu, preloader, cursor, contact drawer
src/components/motion   reusable scroll and reveal primitives (sequence, parallax, horizontal scroll, split text)
src/components/sections one component per homepage chapter, in page order
src/components/three    the procedural round brilliant and its lazy WebGL scene
src/components/ui       buttons, eyebrow labels, section wrapper
src/content             verified brand facts, navigation, footer links and the product catalog
src/hooks               media query and viewport hooks
src/lib                 GSAP registration, scroll helpers, diamond geometry
public/media            processed photography, renders, turntable videos and frame sequences
```

## Media

Everything in `public/media` is derived from the client's asset library and optimised for the web (WebP photography at 2400px and 1200px, 1200px renders on a true white ground, 720px H.264 turntables, 96-frame scroll sequences at 900px). `public/media/manifest.json` lists every file. Replace or extend media by adding files with the same naming pattern and updating `src/content/catalog.ts`.

## Content

All copy on the homepage lives in the section components and uses only the facts recorded in `src/content/site.ts`. The office address, phone number and hours are defined there once and reused by the header, the Visit chapter, the contact drawer and the footer.

## Forms

The contact drawer submits through a server action in `src/app/actions/contact.ts`. It validates input and returns success; email delivery still needs to be connected to the client's provider before launch.

## Accessibility and motion

Every chapter respects `prefers-reduced-motion`: pinned stages become static, scrubbed sequences show their final frame and reveals become short fades. Pinned stages carry skip links, the custom cursor only appears on fine pointers, and all interactive elements keep visible focus styles.

## Credits

The diamond model in `public/media/models/diamond.glb` is "Diamond" by RBG_illustrations on Sketchfab (https://sketchfab.com/3d-models/diamond-7acd98d5c8df4e04a73ea5d5a81c8911), licensed CC BY 4.0. That license requires a visible credit wherever the model is used, so either keep a credit line on the site or replace the model with one the client owns before launch.

## End
