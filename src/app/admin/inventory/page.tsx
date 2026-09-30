import type { Metadata } from "next";
import AdminShell from "@/components/admin/AdminShell";
import AdminInventory from "@/components/admin/AdminInventory";

export const metadata: Metadata = { title: "Inventory" };

export default function Page() {
  return (
    <AdminShell moduleId="inventory">
      <AdminInventory />
    </AdminShell>
  );
}
