import type { DashIcon as Id } from "@/content/dashboard";

/** Line icons for the dashboard sections, 24 unit grid, currentColor. */
export default function DashIcon({ id, className = "" }: { id: Id; className?: string }) {
  const p = { fill: "none", stroke: "currentColor", strokeWidth: 1.2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      {id === "home" && <path d="M4 11 12 4l8 7v9h-5v-6H9v6H4Z" {...p} />}
      {id === "orders" && <path d="M4 7l8-4 8 4v10l-8 4-8-4ZM4 7l8 4 8-4M12 11v10" {...p} />}
      {id === "memo" && <path d="M7 3h8l4 4v14H7ZM15 3v4h4M10 12h6M10 16h6" {...p} />}
      {id === "cart" && <path d="M4 5h2l2 11h10l2-8H7M10 20h.01M17 20h.01" {...p} />}
      {id === "search" && <path d="M8 5h8l4 5-8 10-8-10ZM4 10h16M8 5l-1 5 5 10 5-10-1-5" {...p} />}
      {id === "m2o" && <path d="M12 3v4M12 17v4M3 12h4M17 12h4M9 12l3-4 3 4-3 4Z" {...p} />}
      {id === "legacy" && <path d="M12 21c-4-3-7-6-7-10a7 7 0 0 1 14 0c0 4-3 7-7 10ZM9.5 10l2.5-3 2.5 3-2.5 3Z" {...p} />}
      {id === "custom" && <path d="M4 20l4-1L19 8l-3-3L5 16ZM14 7l3 3" {...p} />}
      {id === "marketing" && <path d="M4 10v4h3l7 4V6l-7 4ZM17 9a4 4 0 0 1 0 6" {...p} />}
      {id === "catalogs" && <path d="M4 5h7v15H4ZM13 5h7v15h-7M7 9h1M16 9h1" {...p} />}
      {id === "social" && <path d="M5 5h14v10H10l-5 4ZM9 10h6" {...p} />}
      {id === "training" && <path d="M3 9l9-4 9 4-9 4ZM7 11v5c3 2 7 2 10 0v-5" {...p} />}
      {id === "website" && <path d="M3 5h18v14H3ZM3 9h18M6 7h.01M8 7h.01" {...p} />}
      {id === "spif" && <path d="M3 7h18v10H3ZM12 10a2 2 0 1 0 0 4 2 2 0 0 0 0-4ZM6 10v4M18 10v4" {...p} />}
      {id === "shows" && <path d="M4 6h16v14H4ZM4 10h16M8 3v4M16 3v4M9 15l2 2 4-4" {...p} />}
      {id === "payments" && <path d="M3 6h18v12H3ZM3 10h18M7 15h4" {...p} />}
      {id === "team" && <path d="M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM3 20c0-3.3 2.7-6 6-6s6 2.7 6 6M16 5a3 3 0 0 1 0 6M18 14c1.8.8 3 2.8 3 6" {...p} />}
      {id === "account" && <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" {...p} />}
      {id === "policies" && <path d="M6 3h12v18H6ZM9 8h6M9 12h6M9 16h3" {...p} />}
    </svg>
  );
}
