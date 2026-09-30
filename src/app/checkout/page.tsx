import type { Metadata } from "next";
import CheckoutPage from "@/components/checkout/CheckoutPage";

export const metadata: Metadata = { title: "Checkout | Surreal Diamond", robots: { index: false } };

export default function Page() {
  return <CheckoutPage />;
}
