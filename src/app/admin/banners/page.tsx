import type { Metadata } from "next";
import AdminShell from "@/components/admin/AdminShell";
import AdminBanners from "@/components/admin/AdminBanners";

export const metadata: Metadata = { title: "Banners" };

export default function Page() {
  return (
    <AdminShell moduleId="banners">
      <AdminBanners />
    </AdminShell>
  );
}
