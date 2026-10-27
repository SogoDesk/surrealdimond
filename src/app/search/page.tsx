import type { Metadata } from "next";
import SearchPage from "@/components/search/SearchPage";

export const metadata: Metadata = { title: "Search | Surreal Diamond", robots: { index: false } };

export default function Page() {
  return <SearchPage />;
}
