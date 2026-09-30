import type { Metadata } from "next";
import GatePage from "@/components/pages/GatePage";
import { gates } from "@/content/gates";

export const metadata: Metadata = { title: "Contact | Surreal Diamond" };

export default function Page() {
  return <GatePage {...gates.contact} />;
}
