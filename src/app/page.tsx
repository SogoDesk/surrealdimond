import Preloader from "@/components/chrome/Preloader";
import SiteChrome from "@/components/chrome/SiteChrome";
import ContactDrawer from "@/components/chrome/ContactDrawer";
import Hero from "@/components/sections/Hero";
import TimeCounter from "@/components/sections/TimeCounter";
import Engagement from "@/components/sections/Engagement";
import Lookbook from "@/components/sections/Lookbook";
import Foreveryone from "@/components/sections/Foreveryone";
import Visit from "@/components/sections/Visit";
import Trade from "@/components/sections/Trade";
import NineWays from "@/components/sections/NineWays";
import HeroCarousel from "@/components/home/HeroCarousel";
import DealerHome from "@/components/home/DealerHome";
import CollectionsBento from "@/components/home/CollectionsBento";
import Featured from "@/components/home/Featured";
import Footer from "@/components/sections/Footer";
import PromoPopup from "@/components/home/PromoPopup";

/**
 * Homepage: the cinematic chapters of the 9e31102 homepage, re-voiced for the
 * trade (dealers who already know Surreal), joined to the dealer and console
 * sections built since. A dark opening (hero, time) hands to the signed-in
 * dealer band and the engagement aperture into light; the lookbook, the
 * Foreveryone collage, the New York visit and the trade door come back as
 * they were, ahead of the navy footer. Fixed layers
 * (preloader, chrome, contact drawer, the console pop-up) sit outside <main>
 * so the pinned and sticky chapters never inherit a transform or clip from a
 * wrapper; the chapters stay direct children of <main> for the same reason.
 */
export default function Home() {
  return (
    <>
      <Preloader />
      <SiteChrome chapters />
      <ContactDrawer />
      <PromoPopup />
      <main id="main">
        <Hero />
        <TimeCounter />
        <DealerHome />
        <Engagement />
        <CollectionsBento />
        <NineWays />
        <HeroCarousel />
        <Featured />
        {/* Restored as they were in 9e31102. Lookbook holds while Foreveryone slides over it, so the two stay adjacent. */}
        <Lookbook />
        <Foreveryone />
        {/* Visit opens its sky circle over a light ground; Trade's seam hands straight to the footer reveal. */}
        <Visit />
        <Trade />
        <Footer />
      </main>
    </>
  );
}
