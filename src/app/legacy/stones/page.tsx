import type { Metadata } from "next";
import DiamondSearch from "@/components/diamonds/DiamondSearch";

export const metadata: Metadata = {
  title: "Legacy stones | Surreal Diamond",
  description: "The Diamond Legacy stones: every diamond in a Legacy collection is grown from the same seed line. Pricing after log in.",
};

/** The Legacy stone search: Start a Legacy on /legacy transitions here. */
export default function Page() {
  return <DiamondSearch program="legacy" />;
}
