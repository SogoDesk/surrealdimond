import type { Metadata } from "next";
import GatePage from "@/components/pages/GatePage";
import DashboardForDealers from "@/components/pages/DashboardForDealers";
import { gates } from "@/content/gates";

export const metadata: Metadata = { title: "Apply for an Account | Surreal Diamond" };

export default function Page() {
  return (
    <>
      <DashboardForDealers />
      <GatePage {...gates.apply} />
    </>
  );
}
