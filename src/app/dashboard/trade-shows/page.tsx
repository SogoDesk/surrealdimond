import type { Metadata } from "next";
import DashboardShell from "@/components/dashboard/DashboardShell";
import TradeShows from "@/components/dashboard/TradeShows";

export const metadata: Metadata = { title: "Trade show appointments | Retailer Dashboard | Surreal Diamond", robots: { index: false } };

export default function Page() {
  return (
    <DashboardShell>
      <TradeShows />
    </DashboardShell>
  );
}
