import type { Metadata } from "next";
import AdminShell from "@/components/admin/AdminShell";
import AdminSync from "@/components/admin/AdminSync";

export const metadata: Metadata = { title: "RightClick sync" };

export default function Page() {
  return (
    <AdminShell moduleId="sync">
      <AdminSync />
    </AdminShell>
  );
}
