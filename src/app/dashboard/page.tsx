import type { Metadata } from "next";
import DashboardShell from "@/components/dashboard/DashboardShell";
import DashboardHome from "@/components/dashboard/DashboardHome";

export const metadata: Metadata = { title: "Retailer Dashboard | Surreal Diamond", robots: { index: false } };

export default function Page() {
  return (
    <DashboardShell>
      <DashboardHome />
    </DashboardShell>
  );
}
