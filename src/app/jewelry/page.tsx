import type { Metadata } from "next";
import StorePage from "@/components/store/StorePage";

export const metadata: Metadata = {
  title: "The Collection | Surreal Diamond",
  description:
    "Earrings, engagement rings, wedding bands, necklaces, pendants, rings, bracelets and a sterling silver collection. Every piece set with a diamond we grew.",
};

/** Every piece. Filters and the sort are read from the query string on the client. */
export default function JewelryPage() {
  return <StorePage category={null} />;
}
