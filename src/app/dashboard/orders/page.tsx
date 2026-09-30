import type { Metadata } from "next";
import DashboardShell from "@/components/dashboard/DashboardShell";
import OrdersPage from "@/components/dashboard/OrdersPage";

export const metadata: Metadata = { title: "Orders | Retailer Dashboard | Surreal Diamond", robots: { index: false } };

export default function Page() {
  return (
    <DashboardShell>
      <OrdersPage />
    </DashboardShell>
  );
}
