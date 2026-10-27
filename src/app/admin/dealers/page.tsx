import type { Metadata } from "next";
import AdminShell from "@/components/admin/AdminShell";
import AdminDealers from "@/components/admin/AdminDealers";

export const metadata: Metadata = { title: "Dealers" };

export default function Page() {
  return (
    <AdminShell moduleId="dealers">
      <AdminDealers />
    </AdminShell>
  );
}
