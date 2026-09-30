import type { Metadata } from "next";
import ContactPage from "@/components/contact/ContactPage";

export const metadata: Metadata = {
  title: "Inquiries and Contact | Surreal Diamond",
  description: "Contact Surreal Diamond's North American Office at 551 Fifth Avenue, New York. Become a dealer, schedule an appointment, or ask about an order.",
};

export default function Page() {
  return <ContactPage />;
}
