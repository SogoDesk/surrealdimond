import type { Metadata } from "next";
import ShopPage from "@/components/shop/ShopPage";

export const metadata: Metadata = {
  title: "The Collection | Surreal Diamond",
  description:
    "Earrings, engagement rings, wedding bands, necklaces, pendants, rings, bracelets and a sterling silver collection. Every piece set with a diamond we grew.",
};

/** Every piece. Filters and the sort are read from the query string on the client. */
export default function JewelryPage() {
  return <ShopPage category={null} />;
}
