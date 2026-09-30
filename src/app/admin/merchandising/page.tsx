import type { Metadata } from "next";
import AdminShell from "@/components/admin/AdminShell";
import AdminMerch from "@/components/admin/AdminMerch";

export const metadata: Metadata = { title: "Merchandising" };

export default function Page() {
  return (
    <AdminShell moduleId="merchandising">
      <AdminMerch />
    </AdminShell>
  );
}
