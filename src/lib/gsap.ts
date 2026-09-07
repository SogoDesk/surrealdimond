import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { MorphSVGPlugin } from "gsap/MorphSVGPlugin";
import { Flip } from "gsap/Flip";
import { Observer } from "gsap/Observer";
import { CustomEase } from "gsap/CustomEase";
import { useGSAP } from "@gsap/react";

let registered = false;

export function registerGsap() {
  if (registered || typeof window === "undefined") return gsap;
  gsap.registerPlugin(ScrollTrigger, SplitText, DrawSVGPlugin, MorphSVGPlugin, Flip, Observer, CustomEase, useGSAP);
  // House easing: a slow, expensive settle used for reveals and page transitions.
  CustomEase.create("surreal", "M0,0 C0.16,1 0.3,1 1,1");
  CustomEase.create("surrealInOut", "M0,0 C0.76,0 0.24,1 1,1");
  gsap.defaults({ ease: "surreal", duration: 1.2 });
  ScrollTrigger.config({ ignoreMobileResize: true });
  registered = true;
  return gsap;
}

export { gsap, ScrollTrigger, SplitText, DrawSVGPlugin, MorphSVGPlugin, Flip, Observer, CustomEase, useGSAP };
