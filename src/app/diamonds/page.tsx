import type { Metadata } from "next";
import GatePage from "@/components/pages/GatePage";
import { gates } from "@/content/gates";

export const metadata: Metadata = { title: "Lab Diamond Search | Surreal Diamond", robots: { index: false } };

export default function Page() {
  return <GatePage {...gates.diamonds} />;
}
