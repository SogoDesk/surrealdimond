import AdminShell from "@/components/admin/AdminShell";
import AdminOverview from "@/components/admin/AdminOverview";

export default function Page() {
  return (
    <AdminShell moduleId="overview">
      <AdminOverview />
    </AdminShell>
  );
}
