import type { Metadata } from "next";
import CartPage from "@/components/checkout/CartPage";

export const metadata: Metadata = { title: "Cart | Surreal Diamond", robots: { index: false } };

export default function Page() {
  return <CartPage />;
}
