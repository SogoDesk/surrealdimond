import type { Metadata } from "next";
import LoginPage from "@/components/account/LoginPage";

export const metadata: Metadata = { title: "Dealer log in | Surreal Diamond", robots: { index: false } };

export default function Page() {
  return <LoginPage />;
}
