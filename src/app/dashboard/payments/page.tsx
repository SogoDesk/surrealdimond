import type { Metadata } from "next";
import DashboardShell from "@/components/dashboard/DashboardShell";
import PaymentMethods from "@/components/dashboard/PaymentMethods";

export const metadata: Metadata = { title: "Payment methods | Retailer Dashboard | Surreal Diamond", robots: { index: false } };

export default function Page() {
  return (
    <DashboardShell>
      <PaymentMethods />
    </DashboardShell>
  );
}
