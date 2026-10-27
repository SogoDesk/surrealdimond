import type { Metadata } from "next";
import DashboardShell from "@/components/dashboard/DashboardShell";
import AccountSettings from "@/components/dashboard/AccountSettings";

export const metadata: Metadata = { title: "Account settings | Retailer Dashboard | Surreal Diamond", robots: { index: false } };

export default function Page() {
  return (
    <DashboardShell>
      <AccountSettings />
    </DashboardShell>
  );
}
