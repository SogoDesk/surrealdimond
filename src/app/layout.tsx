import type { Metadata, Viewport } from "next";
import { Italiana, Cormorant_Garamond, Jost } from "next/font/google";
import "./globals.css";
import SmoothScroll from "@/components/providers/SmoothScroll";

const display = Italiana({
  variable: "--font-display",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

const editorial = Cormorant_Garamond({
  variable: "--font-editorial",
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
  subsets: ["latin"],
  display: "swap",
});

const ui = Jost({
  variable: "--font-ui",
  weight: ["300", "400", "500"],
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Surreal Diamond | Lab Grown Diamonds and Fine Jewelry, New York",
  description:
    "Surreal grows DEF color, VVS clarity lab diamonds and sets them in handcrafted fine jewelry. Engagement rings, wedding bands, earrings, necklaces, pendants and bracelets, plus made to order and legacy diamonds.",
  metadataBase: new URL("https://surrealdiamond.com"),
  openGraph: {
    title: "Surreal Diamond | The New Forever",
    description: "Lab grown diamonds, grown in weeks and perfected for a lifetime.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#07090C",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${display.variable} ${editorial.variable} ${ui.variable}`}>
      <body>
        <SmoothScroll>{children}</SmoothScroll>
      </body>
    </html>
  );
}
