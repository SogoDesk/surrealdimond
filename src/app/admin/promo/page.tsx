import type { Metadata } from "next";
import AdminShell from "@/components/admin/AdminShell";
import AdminPromo from "@/components/admin/AdminPromo";

export const metadata: Metadata = { title: "Pop-up banner" };

export default function Page() {
  return (
    <AdminShell moduleId="promo">
      <AdminPromo />
    </AdminShell>
  );
}
