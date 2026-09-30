import Preloader from "@/components/chrome/Preloader";
import SiteChrome from "@/components/chrome/SiteChrome";
import ContactDrawer from "@/components/chrome/ContactDrawer";
import HeroCarousel from "@/components/home/HeroCarousel";
import GrowerStrip from "@/components/home/GrowerStrip";
import DivisionGrid from "@/components/home/DivisionGrid";
import CollectionsBento from "@/components/home/CollectionsBento";
import Programs from "@/components/home/Programs";
import Featured from "@/components/home/Featured";
import Stories from "@/components/home/Stories";
import Benefits from "@/components/home/Benefits";
import Experience from "@/components/home/Experience";
import Assurance from "@/components/brand/Assurance";
import Footer from "@/components/sections/Footer";

/**
 * Homepage (docs/CONTEXT.md, "Homepage plan"): the public front door for the
 * trade, on Tanishq's commerce structure in the Surreal design system. Hero
 * banners, the grower pitch, shop by category, collections, programs,
 * featured pieces, turntable stories, the dealer program and the experience
 * grid and the Surreal Assurance, closed by the navy footer. Fixed layers (preloader, chrome, contact
 * drawer) sit outside <main>.
 */
export default function Home() {
  return (
    <>
      <Preloader />
      <SiteChrome />
      <ContactDrawer />
      <main id="main">
        <HeroCarousel />
        <GrowerStrip />
        <DivisionGrid />
        <CollectionsBento />
        <Programs />
        <Featured />
        <Stories />
        <Benefits />
        <Experience />
        <Assurance />
        <Footer />
      </main>
    </>
  );
}
