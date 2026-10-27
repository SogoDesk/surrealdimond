import type { Metadata } from "next";
import AdminShell from "@/components/admin/AdminShell";
import AdminOrders from "@/components/admin/AdminOrders";

export const metadata: Metadata = { title: "Orders and payments" };

export default function Page() {
  return (
    <AdminShell moduleId="orders">
      <AdminOrders />
    </AdminShell>
  );
}
