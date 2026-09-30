import type { Metadata } from "next";
import CustomPortal from "@/components/custom/CustomPortal";

export const metadata: Metadata = {
  title: "Custom Portal | Surreal Diamond",
  description: "Begin a custom design with Surreal's CAD department. F+ color, VS+ clarity diamonds on every custom item, with a live preview of the piece.",
};

export default function Page() {
  return <CustomPortal />;
}
