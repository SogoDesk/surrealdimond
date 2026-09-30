import type { Metadata } from "next";
import GatePage from "@/components/pages/GatePage";
import { gates } from "@/content/gates";

export const metadata: Metadata = { title: "Made to Order | Surreal Diamond" };

export default function Page() {
  return <GatePage {...gates.madeToOrder} />;
}
