import type { Metadata } from "next";
import MadeToOrderPage from "@/components/diamonds/MadeToOrderPage";

export const metadata: Metadata = {
  title: "Made to Order | Surreal Diamond",
  description: "A diamond grown to your client's exact specification: any shape, any carat weight, with an IGI certificate. Exclusively for Surreal dealers.",
};

export default function Page() {
  return <MadeToOrderPage />;
}
