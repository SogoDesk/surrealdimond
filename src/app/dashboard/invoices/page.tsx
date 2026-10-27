import type { Metadata } from "next";
import DashboardShell from "@/components/dashboard/DashboardShell";
import InvoicesPage from "@/components/dashboard/InvoicesPage";

export const metadata: Metadata = { title: "Invoices and payments | Retailer Dashboard | Surreal Diamond", robots: { index: false } };

export default function Page() {
  return (
    <DashboardShell>
      <InvoicesPage />
    </DashboardShell>
  );
}
