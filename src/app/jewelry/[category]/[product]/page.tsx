import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ProductPage from "@/components/product/ProductPage";
import { categoryLabel, productById, products, renderSrc } from "@/content/catalog";

interface ProductRouteProps {
  params: Promise<{ category: string; product: string }>;
}

/** One static page per catalog piece; anything else is a 404. */
export const dynamicParams = false;

export function generateStaticParams() {
  return products.map((p) => ({ category: p.category, product: p.id }));
}

export async function generateMetadata({ params }: ProductRouteProps): Promise<Metadata> {
  const { product: id } = await params;
  const p = productById(id);
  if (!p) return {};
  return {
    title: `${p.name}, ${categoryLabel(p.category)} | Surreal Diamond`,
    description: `${p.name}: ${p.detail}. Lab grown diamond jewelry from Surreal, for Surreal dealers.`,
    openGraph: { images: [{ url: renderSrc(p.image), width: 1200, height: 1200 }] },
  };
}

export default async function ProductRoute({ params }: ProductRouteProps) {
  const { category, product: id } = await params;
  const p = productById(id);
  if (!p || p.category !== category) notFound();
  return <ProductPage productId={p.id} />;
}
