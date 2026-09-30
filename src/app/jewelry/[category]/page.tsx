import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ShopPage from "@/components/shop/ShopPage";
import GatePage from "@/components/pages/GatePage";
import { categories } from "@/content/catalog";
import { pendingDivisions, divisionById } from "@/content/divisions";

interface CategoryPageProps {
  params: Promise<{ category: string }>;
}

const find = (id: string) => categories.find((c) => c.id === id) ?? null;

/** One static page per catalog category, plus a dealer page for each division still waiting on its grid; anything else is a 404. */
export const dynamicParams = false;

export function generateStaticParams() {
  return [...categories.map((c) => ({ category: c.id })), ...pendingDivisions.map((d) => ({ category: d.id }))];
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { category } = await params;
  const meta = find(category);
  if (meta) return { title: `${meta.label} | Surreal Diamond`, description: meta.blurb };
  const division = divisionById(category);
  return division ? { title: `${division.label} | Surreal Diamond` } : {};
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { category } = await params;
  const meta = find(category);
  if (meta) return <ShopPage category={meta.id} />;
  const division = divisionById(category);
  if (!division?.pending) notFound();
  return (
    <GatePage
      kind="dealer"
      eyebrow={division.group === "collections" ? "Collection" : division.group === "programs" ? "Program" : "Jewelry"}
      title={division.label}
      line={`${division.note ? `${division.note}. ` : ""}Pieces, pricing and ordering for this division are open to Surreal dealers.`}
      crumbs={[{ label: "Jewelry", href: "/jewelry" }, { label: division.label }]}
      motif={division.image ? undefined : division.motif}
      image={division.image ? `/media/renders/${division.image}.webp` : undefined}
    />
  );
}
