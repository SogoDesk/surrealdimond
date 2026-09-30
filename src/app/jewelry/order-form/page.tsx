import type { Metadata } from "next";
import GatePage from "@/components/pages/GatePage";
import { gates } from "@/content/gates";

export const metadata: Metadata = { title: "Jewelry Order Form | Surreal Diamond", robots: { index: false } };

export default function Page() {
  return <GatePage {...gates.orderForm} />;
}
