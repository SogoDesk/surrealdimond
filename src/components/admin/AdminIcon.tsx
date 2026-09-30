import type { AdminIcon as Id } from "@/content/admin";

/** Line icons for the console's modules, 24 unit grid, currentColor. */
export default function AdminIcon({ id, className = "" }: { id: Id; className?: string }) {
  const p = { fill: "none", stroke: "currentColor", strokeWidth: 1.2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      {id === "overview" && <path d="M4 4h7v7H4ZM13 4h7v4h-7ZM13 10h7v10h-7ZM4 13h7v7H4Z" {...p} />}
      {id === "inventory" && <path d="M4 7l8-4 8 4v10l-8 4-8-4ZM4 7l8 4 8-4M12 11v10" {...p} />}
      {id === "merch" && <path d="M12 3l2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.4 6.8 19.1l1-5.8L3.5 9.2l5.9-.8Z" {...p} />}
      {id === "banners" && <path d="M3 5h18v12H3ZM3 14l5-4 4 3 3-2 6 4M8 20h8" {...p} />}
      {id === "dealers" && <path d="M4 10h16M5 10l2-5h10l2 5M6 10v10h12V10M10 20v-5h4v5" {...p} />}
      {id === "orders" && <path d="M6 3h12v18l-3-2-3 2-3-2-3 2ZM9 8h6M9 12h6" {...p} />}
      {id === "memo" && <path d="M7 3h8l4 4v14H7ZM15 3v4h4M10 12h6M10 16h6" {...p} />}
      {id === "requests" && <path d="M3 6h18v12H3ZM3 7l9 6 9-6" {...p} />}
      {id === "content" && <path d="M5 3h14v18H5ZM8 7h8M8 11h8M8 15h5" {...p} />}
      {id === "marketing" && <path d="M4 10v4h3l7 4V6l-7 4ZM17 9a4 4 0 0 1 0 6" {...p} />}
      {id === "staff" && <path d="M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM3 20c0-3.3 2.7-6 6-6s6 2.7 6 6M16 5a3 3 0 0 1 0 6M18 14c1.8.8 3 2.8 3 6" {...p} />}
    </svg>
  );
}
