import SiteChrome from "@/components/chrome/SiteChrome";
import ContactDrawer from "@/components/chrome/ContactDrawer";
import Hero from "@/components/sections/Hero";
import Engagement from "@/components/sections/Engagement";
import Visit from "@/components/sections/Visit";
import Trade from "@/components/sections/Trade";
import NineWays from "@/components/sections/NineWays";
import DealerHome from "@/components/home/DealerHome";
import CollectionsBento from "@/components/home/CollectionsBento";
import Featured from "@/components/home/Featured";
import Footer from "@/components/sections/Footer";
import PromoPopup from "@/components/home/PromoPopup";

/**
 * Homepage, reworked after the client's feedback of 27 October 2026 (F-A1
 * to F-A3): the hero is a full-width carousel of photographs behind the
 * fixed headline and buttons, Hot this week follows it directly, then the
 * signed-in dealer band, bridal, the collections, the nine ways to shop,
 * the New York visit and the trade door. The banner carousel, the lookbook,
 * the Foreveryone collage and the time counter repeated what the hero and
 * the sections around them already say, so they are gone, with the
 * preloader. The chapters keep still (src/lib/motion.ts). The contact
 * drawer and the console's pop-up sit outside <main>.
 */
export default function Home() {
  return (
    <>
      <SiteChrome chapters />
      <ContactDrawer />
      <PromoPopup />
      <main id="main">
        <Hero />
        <Featured />
        <DealerHome />
        <Engagement />
        <CollectionsBento />
        <NineWays />
        <Visit />
        <Trade />
        <Footer />
      </main>
    </>
  );
}
