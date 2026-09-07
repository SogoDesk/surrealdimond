import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ShopPage from "@/components/shop/ShopPage";
import { categories } from "@/content/catalog";

interface CategoryPageProps {
  params: Promise<{ category: string }>;
}

const find = (id: string) => categories.find((c) => c.id === id) ?? null;

/** One static page per category id; anything else is a 404. */
export const dynamicParams = false;

export function generateStaticParams() {
  return categories.map((c) => ({ category: c.id }));
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { category } = await params;
  const meta = find(category);
  if (!meta) return {};
  return {
    title: `${meta.label} | Surreal Diamond`,
    description: meta.blurb,
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { category } = await params;
  const meta = find(category);
  if (!meta) notFound();
  return <ShopPage category={meta.id} />;
}
