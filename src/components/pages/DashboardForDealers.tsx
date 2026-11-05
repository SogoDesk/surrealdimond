"use client";

/** On the apply page: a signed-in dealer is already a dealer, so they go to the Retailer Dashboard instead (client change request, November 2026). */

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { account } from "@/content/site";
import { useDealer } from "@/lib/dealer";

export default function DashboardForDealers() {
  const dealer = useDealer();
  const router = useRouter();
  useEffect(() => {
    if (dealer) router.replace(account.dashboard);
  }, [dealer, router]);
  return null;
}
