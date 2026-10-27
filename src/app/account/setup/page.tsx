import type { Metadata } from "next";
import SetupPage from "@/components/account/SetupPage";

export const metadata: Metadata = { title: "Set up your password | Surreal Diamond", robots: { index: false } };

export default function Page() {
  return <SetupPage />;
}
