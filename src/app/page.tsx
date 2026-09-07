import Preloader from "@/components/chrome/Preloader";
import SiteChrome from "@/components/chrome/SiteChrome";
import ContactDrawer from "@/components/chrome/ContactDrawer";
import Hero from "@/components/sections/Hero";
import TimeCounter from "@/components/sections/TimeCounter";
import Engagement from "@/components/sections/Engagement";
import Collections from "@/components/sections/Collections";
import MadeToOrder from "@/components/sections/MadeToOrder";
import Lookbook from "@/components/sections/Lookbook";
import Foreveryone from "@/components/sections/Foreveryone";
import Legacy from "@/components/sections/Legacy";
import Custom from "@/components/sections/Custom";
import Education from "@/components/sections/Education";
import Visit from "@/components/sections/Visit";
import Trade from "@/components/sections/Trade";
import Footer from "@/components/sections/Footer";

/**
 * Homepage. The chapters run in the order set out in DESIGN.md: a dark opening
 * (hero, time), the engagement aperture into light, the light commerce and
 * program chapters, a second dark chapter (foreveryone, legacy), the light
 * service chapters, the sky arrival (visit, trade) and the navy back cover.
 * Fixed layers (preloader, chrome, contact drawer) sit outside <main> so the
 * pinned and sticky chapters never inherit a transform or clip from a wrapper.
 */
export default function Home() {
  return (
    <>
      <Preloader />
      <SiteChrome initialTheme="dark" />
      <ContactDrawer />
      <main id="main">
        <Hero />
        <TimeCounter />
        <Engagement />
        <Collections />
        <MadeToOrder />
        <Lookbook />
        <Foreveryone />
        <Legacy />
        <Custom />
        <Education />
        <Visit />
        <Trade />
        <Footer />
      </main>
    </>
  );
}
