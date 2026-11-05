import type { Metadata } from "next";
import DiamondSearch from "@/components/diamonds/DiamondSearch";

export const metadata: Metadata = {
  title: "Lab Diamond Search | Surreal Diamond",
  description: "CVD lab grown diamonds, primarily DEF color and VVS clarity, up to 15 carats. Pricing after log in.",
};

export default function Page() {
  return <DiamondSearch />;
}
