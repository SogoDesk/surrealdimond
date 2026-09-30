import type { Metadata } from "next";
import AdminShell from "@/components/admin/AdminShell";
import AdminStaff from "@/components/admin/AdminStaff";

export const metadata: Metadata = { title: "Staff and roles" };

export default function Page() {
  return (
    <AdminShell moduleId="staff">
      <AdminStaff />
    </AdminShell>
  );
}
