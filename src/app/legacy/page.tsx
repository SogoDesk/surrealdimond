import type { Metadata } from "next";
import LegacyPage from "@/components/legacy/LegacyPage";

export const metadata: Metadata = { title: "Diamond Legacy | Surreal Diamond" };

/** Diamond Legacy: the standalone information page; Start a Legacy transitions to /legacy/stones. */
export default function Page() {
  return <LegacyPage />;
}
