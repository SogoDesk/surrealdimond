import type { Metadata } from "next";
import DashboardShell from "@/components/dashboard/DashboardShell";
import MemoReport from "@/components/dashboard/MemoReport";

export const metadata: Metadata = { title: "Open memo items | Retailer Dashboard | Surreal Diamond", robots: { index: false } };

export default function Page() {
  return (
    <DashboardShell>
      <MemoReport />
    </DashboardShell>
  );
}
