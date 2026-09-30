import type { Metadata } from "next";
import { notFound } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import AdminHolding from "@/components/admin/AdminHolding";
import { adminHolding } from "@/content/admin";

type Props = { params: Promise<{ module: string }> };

const find = (slug: string) => adminHolding.find((m) => m.href === `/admin/${slug}`);

export function generateStaticParams() {
  return adminHolding.map((m) => ({ module: m.href.replace("/admin/", "") }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: find((await params).module)?.label ?? "Console" };
}

export default async function Page({ params }: Props) {
  const mod = find((await params).module);
  if (!mod) notFound();
  return (
    <AdminShell moduleId={mod.id}>
      <AdminHolding mod={mod} />
    </AdminShell>
  );
}
