import type { Metadata } from "next";
import { notFound } from "next/navigation";
import DashboardShell from "@/components/dashboard/DashboardShell";
import SectionHolding from "@/components/dashboard/SectionHolding";
import { holdingSections } from "@/content/dashboard";

type Props = { params: Promise<{ section: string }> };

const find = (slug: string) => holdingSections.find((d) => d.href === `/dashboard/${slug}`);

export function generateStaticParams() {
  return holdingSections.map((d) => ({ section: d.href.replace("/dashboard/", "") }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const section = find((await params).section);
  return { title: `${section?.label ?? "Dashboard"} | Retailer Dashboard | Surreal Diamond`, robots: { index: false } };
}

export default async function Page({ params }: Props) {
  const section = find((await params).section);
  if (!section) notFound();
  return (
    <DashboardShell>
      <SectionHolding section={section} />
    </DashboardShell>
  );
}
