import type { Metadata, Viewport } from "next";
import { Italiana, Urbanist } from "next/font/google";
import "./globals.css";
import { MODE_SCRIPT } from "@/lib/modeScript";

const display = Italiana({
  variable: "--font-display",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

/*
 * Urbanist is the primary font: headings and item names (the editorial
 * role, Cormorant Garamond before) and all body and interface text (the ui
 * role, Jost before). One variable font, exposed under both role names so
 * every style that names a role picks it up. Italiana stays for the large
 * display figures only.
 */
const editorial = Urbanist({
  variable: "--font-editorial",
  style: ["normal", "italic"],
  subsets: ["latin"],
  display: "swap",
});

const ui = Urbanist({
  variable: "--font-ui",
  style: ["normal", "italic"],
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
    <html lang="en" data-mode="light" className={`${display.variable} ${editorial.variable} ${ui.variable}`} suppressHydrationWarning>
      <head>
        {/* The stored light or dark theme, before the first paint (src/lib/modeScript.ts). */}
        <script dangerouslySetInnerHTML={{ __html: MODE_SCRIPT }} />
      </head>
      {/* Browser extensions add attributes to body before hydration; those are not ours to reconcile. */}
      <body suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
