"use client";

/**
 * The trade door on server-rendered pages: "Become a dealer" for visitors,
 * the Retailer Dashboard for a signed-in dealer, never the sign-up (client
 * change request, November 2026).
 *
 *   <TradeDoor variant="primary" arrow />
 */

import Button, { type ButtonProps } from "@/components/ui/Button";
import { account } from "@/content/site";
import { useDealer } from "@/lib/dealer";

export default function TradeDoor({ label = "Become a dealer", variant = "primary", arrow = false }: { label?: string; variant?: ButtonProps["variant"]; arrow?: boolean }) {
  const dealer = useDealer();
  return (
    <Button href={dealer ? account.dashboard : account.apply} variant={variant} arrow={arrow}>
      {dealer ? "Retailer Dashboard" : label}
    </Button>
  );
}
