# Surreal Diamond, Phase 1 architecture baseline (M1)

Status: **proposed, awaiting approval** (30 September 2026). Nothing below is provisioned yet. Once the choices are approved, every service is set up in Surreal's own name (BRD A9), and the preview's browser storage is replaced service by service (section 8).

Scope and requirements: [CONTEXT.md](CONTEXT.md), [CHECKLIST.md](CHECKLIST.md). Work plan: [TASKS.md](TASKS.md).

## 1. The choices at a glance

| Need | Proposed | Why | BRD |
|---|---|---|---|
| Hosting and runtime | **Vercel** | Built for Next.js; preview deployments per change; scheduled jobs for the feeds; staging and production in one project | A7, M1 |
| Database | **Neon Postgres** (Vercel Marketplace), Drizzle ORM | Relational data (dealers, orders, memo, stones); branches per preview; billed through Vercel | A7 |
| Sign in and roles | **Clerk** (Vercel Marketplace) | Organizations fit dealer stores and their associates; roles and permissions; named staff logins with two-factor | B-03, B-04, Q10 |
| Files | **Vercel Blob**, one public and one private store | Banners and marketing files public; custom request uploads, lab reports and inventory imports private | R-22, R-35 |
| Email | **Resend** (Vercel Marketplace) | Order, inquiry and request emails from Surreal's own domain | R-24, C-14 |
| Content pages | **Sanity** (Vercel Marketplace) | Legacy, Main Door, About and dealer resources edited without a developer | R-20, A7 |
| Commerce and payment | **Decision D1**, see section 3.6 | Shopify is the standard platform choice; the BRD's payment rule decides whether it fits | B-05, Q2, Q3, C-10 |
| Inventory feeds | Scheduled jobs on Vercel, import in the console | RightClick (likely an Excel export) and supplier feeds about every 30 minutes | R-18, B-01, C-07 |
| Search | Surreal's existing search in the dashboard; Postgres search for the catalog | No extra vendor until volume needs one | R-29, C-06 |
| Monitoring | **Sentry** (Vercel Marketplace), Vercel Analytics and Speed Insights | Errors with context, real-user performance | M3 |

## 2. Principles

- **Managed services, not custom infrastructure** (A7): login, content, email, files and hosting come from established services. We build the dealer and staff experience on top.
- **In Surreal's name** (A9): the Vercel team, each Marketplace integration, the domain and the code repository belong to Surreal. We work as members of their team.
- **One application**: the storefront, the dealer dashboard and the admin console stay one Next.js 16 codebase, as built. Staff and dealers are told apart by their role, not by separate apps.
- **English and US dollars** only (A2).
- **The source of truth for stock is RightClick** (C-07). The site mirrors it and never sells a stone twice (B-01).

## 3. Services

### 3.1 Hosting: Vercel

- Node.js runtime on Fluid Compute for pages, server actions and API routes (the contact form already runs as a server action).
- **Environments**: Production (`main`), Preview (every pull request, its own URL), and a **Staging** environment on a `staging` branch for UAT with Surreal's two testers (C-15).
- **Scheduled jobs** (Vercel Cron): supplier feed sync about every 30 minutes; nightly price refresh for memo lines; cleanup of abandoned carts.
- Vercel Analytics and Speed Insights for real-user performance.
- Access to Preview and Staging protected, so unreleased work is not public.

### 3.2 Database: Neon Postgres with Drizzle

- Installed through the Vercel Marketplace, so connection settings reach every environment automatically.
- **Branching**: each preview gets a copy of the staging data, so changes can be tried safely.
- Drizzle ORM for typed queries and versioned migrations kept in the repository.
- A stone is reserved inside a database transaction at checkout and on memo, so two dealers can never take the same stone (B-01).

### 3.3 Sign in and roles: Clerk

- **Dealers**: each store is a Clerk *organization*; its people are members with a role, **Dealer** (full ordering) or **Dealer Associate** (permissions set per store). The dashboard, pricing and ordering read the organization, so every page reflects that store (B-03, R-30).
- **Staff**: a Surreal organization with the five roles (Administrator, Accounts / Finance, HR, Sales, Manager). The console's access matrix ([src/content/admin.ts](../src/content/admin.ts), proposed until C-05) becomes Clerk permissions.
- **Named logins, one per person** (Q10 recommendation), two-factor sign-in required for staff.
- No public sign-up: dealer accounts are created by Surreal staff or imported from the current site (C-13). The Become a dealer form stays an inquiry.
- The preview's sign-in page is replaced by Clerk's sign-in, styled to the design system.

### 3.4 Files: Vercel Blob

- **Public store**: banners, product renders and photographs, marketing resources for the dashboard.
- **Private store**: Custom Portal image uploads, lab reports, RightClick import files, anything tied to one dealer. Served only through our own routes after a sign-in check.

### 3.5 Email: Resend

- From Surreal's sending domain (C-14), set up with the DNS records Resend gives.
- Emails in Phase 1: order confirmation to the dealer and to Surreal; the inquiry to its team plus the automatic acknowledgement (R-24); M2O, Custom and memo reconciliation receipts; staff invitations come from Clerk.
- Templates in the repository, in the house style.

### 3.6 Commerce and payment: decision D1

The platform guidance for a store with a catalog is **Shopify** (catalog, cart, checkout and payments in one). It is listed first because it is the standard choice. The BRD adds three constraints that decide whether it fits:

1. **Payment must go through Surreal's existing card processor** (B-05). Shopify's checkout takes cards through Shopify Payments or a supported third-party gateway. If Surreal's processor is one of those, the rule holds; if not, Shopify's checkout cannot be used.
2. **Stones are one of a kind and change every 30 minutes** from RightClick and suppliers (R-18, B-01), and the **memo program** has no Shopify equivalent. Stones, memo and reconciliation stay in our database either way.
3. **The dealer cart and checkout are already built** in the design system (card, ACH and wire; store details; review). Choosing Shopify replaces them with Shopify's checkout.

| | Option A: Shopify (B2B) | Option B: our own orders |
|---|---|---|
| Jewelry catalog, cart, checkout | Shopify | Neon, with the pages already built |
| Card payment | Shopify Payments or a supported gateway | Surreal's existing processor, through its hosted payment fields (C-10) |
| ACH and wire | Manual payment methods | Payment instructions on the order, marked paid in the console |
| Dealer price lists (Q8) | Shopify B2B price lists | A price list table per pricing group |
| Stones, memo, requests | Our database | Our database |
| Staff work in | Shopify admin and our console | Our console only |

**Recommendation:** Shopify, **if** C-10 confirms Surreal's processor runs as a Shopify payment gateway. If it does not, B-05 rules Shopify's checkout out and Option B is the path. Either way we need the processor's name and contact (C-10) and the answers to Q2 and Q3 before M3.

### 3.7 Inventory: RightClick and supplier feeds

- **RightClick** (C-07, the provider call): the likely path is an Excel export. A staff member uploads it in the console (Inventory, Import); the file goes to the private Blob store; the import updates stones, memo lines and prices, and reports what changed. If RightClick offers an API or a scheduled export, the same import runs on a schedule instead.
- **Supplier feeds**: a scheduled job about every 30 minutes fetches each feed, adds and updates stones, and marks missing ones unavailable.
- Every stone keeps its source (Surreal or the supplier) and its last-seen time; the diamond page shows only available stones.

### 3.8 Search

- The dashboard search (R-29) connects to Surreal's existing search once Nia shares the details (C-06); the screens are built.
- Catalog and stock ID search runs in Postgres (full text and trigram) until volume calls for a dedicated service.

### 3.9 Monitoring

- **Sentry** for errors in the browser and on the server, with releases tied to deployments.
- Vercel Analytics and Speed Insights; uptime checks can follow at M3.

## 4. Environments and domains

| Environment | Branch | Data | Who |
|---|---|---|---|
| Local | any | a Neon branch or local Postgres | the team |
| Preview | pull requests | a Neon branch from staging | the team, reviewers |
| Staging | `staging` | staging database, test payments | the team, Surreal's two testers (C-15) |
| Production | `main` | production database, live payments | everyone |

Proposed domains: `surrealdiamond.com` for production and `staging.surrealdiamond.com` for staging, after the DNS cut-over (C-14, M4).

## 5. Repository and delivery

- The code is on GitHub today. Per A9, the repository moves to Surreal's GitHub organization (or Surreal is given ownership) before production.
- Checks on every pull request: lint, type check, build. Vercel posts a preview link.
- `main` is protected; production deploys only from it, after the preview is reviewed.
- Secrets live only in Vercel's environment settings, never in the repository.

## 6. Data model

The first schema, in Postgres. Money is stored in cents, USD only.

| Area | Tables | Key fields |
|---|---|---|
| Dealers | `dealer_orgs` | Clerk organization id, store name, address, territory, pricing group, status |
| | `dealer_users` | Clerk user id, organization, role (dealer, associate), permissions |
| Staff | `staff_users` | Clerk user id, role (administrator, finance, hr, sales, manager) |
| Catalog | `products` | id, name, style number, category, division, detail, default metal, featured |
| | `product_variants` | product, metal, carat, image slugs, active (R-12: only metals that exist) |
| | `divisions`, `collections`, `matching_sets` | the 16 divisions (Q4), collections, Shop the Set pairs (C-08) |
| Diamonds | `stones` | stock id, shape, carat, color, clarity, cut, polish, symmetry, fluorescence, measurements, ratio, table, depth, lab, certificate, source, status (available, reserved, memo, sold), last seen (C-04 finalizes the attributes) |
| Prices | `price_lists`, `price_list_items` | pricing group, product variant or stone, price, valid from (Q8) |
| Orders | `carts`, `cart_lines` | dealer, lines as built today (product or stone, metal, carat, size, quantity, note) |
| | `orders`, `order_lines` | number, dealer, store details, PO, deadline, payment method, status, placed before cutoff |
| | `payments` | order, method (card, ACH, wire), processor reference, status (B-05) |
| Memo | `memo_lines` | dealer, memo number, stock, memo date, price (daily), status |
| | `memo_reconciliations` | dealer, number, lines reported sold, confirmed, note |
| Requests | `m2o_requests`, `custom_requests`, `legacy_requests` | the fields of each built form, files in the private Blob store, status |
| | `inquiries` | type, team, sender, fields, reference, acknowledgement sent (R-24) |
| Storefront | `merch_settings` | Hot this week, pins per page, default sort per page (R-03, R-33, R-34) |
| | `banners` | images, label, link, order, active, schedule (R-35) |
| Records | `audit_log` | who changed what in the console, and when |

Content pages (R-20) and dealer resources live in Sanity, not in these tables.

## 7. Access

- Storefront pages are public; prices and ordering need a dealer sign-in, as today.
- `/dashboard/*` needs a dealer or associate; `/admin/*` needs a staff role, each module gated by the access matrix.
- Every server action and API route checks the role on the server; hiding a button is never the only guard.

## 8. From the preview to real services

What the preview keeps in the browser today, and what replaces it:

| Preview store | Replaced by |
|---|---|
| `surreal-dealer` (demo session) | Clerk sign-in, dealer organizations |
| `surreal-staff` (role picker) | Clerk staff organization and roles |
| `surreal-cart`, `surreal-orders` | `carts`, `orders`, `payments` |
| `surreal-memo`, `surreal-memo-reports` | `memo_lines`, `memo_reconciliations` |
| `surreal-m2o`, `surreal-custom` | `m2o_requests`, `custom_requests`, files in private Blob |
| `surreal-merch` | `merch_settings`, `banners` |
| `surreal-recent`, wishlist | per-dealer tables, so they follow the dealer across devices |
| Sample stone feed | `stones` from RightClick and the supplier feeds |

The pages keep their design; only the data source changes.

## 9. Decisions needed

| # | Decision | Proposed | Who |
|---|---|---|---|
| D1 | Commerce and payment platform | Shopify if C-10 confirms the processor works as a Shopify gateway; otherwise our own orders with the existing processor | Surreal, after C-10, Q2, Q3 |
| D2 | Hosting | Vercel, in Surreal's team | Approval |
| D3 | Database | Neon Postgres through the Vercel Marketplace | Approval |
| D4 | Sign in and roles | Clerk | Approval |
| D5 | Email | Resend, from Surreal's domain | Approval, C-14 |
| D6 | Content pages | Sanity | Approval |
| D7 | Error monitoring | Sentry | Approval |
| D8 | Repository ownership | Move to Surreal's GitHub organization before production | Surreal |

## 10. After approval

1. Surreal creates (or invites us to) a Vercel team in their name; we link this project to it.
2. We add the approved integrations through the Vercel Marketplace (Neon, Clerk, Resend, Sanity, Sentry) and create the two Blob stores; their settings reach every environment automatically.
3. Drizzle schema and first migrations from section 6; seed from the current catalog content.
4. Replace the preview stores in the order of section 8, starting with sign-in and the catalog.
5. Staging live for Surreal's review; production after UAT (M4).
