# Surreal Diamond, Phase 1 task list

The work plan for Phase 1 of the BRD (v1.1, 18 September 2026), organised by its four milestones. Requirement status lives in [CHECKLIST.md](CHECKLIST.md); scope and background in [CONTEXT.md](CONTEXT.md). Phase 2 (Enterprise Level Integration, the invoicing and payment portal) is not planned here. Mark items `[x]` when built, verified in the browser at desktop and phone widths, and committed.

Status key: `[ ]` to do, `[~]` in progress, `[x]` done, `[?]` waiting on a client input or answer.

## Next up

In order. Block A (the BRD fixes to built screens) is done. Block B completes the ten key screens for M2 while the client inputs arrive: seven are built, screen 7 is in progress, then the admin console shell; Main Door waits on Q6.

### A. Bring built screens in line with the BRD

- [x] R-12 / B-02: cards, product page, details and filters show only the metals an article exists in; the placeholder covers only carat sizes without a render
- [x] R-13: `defaultMetal` per article drives the opening metal (Surreal's yellow gold list, C-02, fills it)
- [x] B-05: checkout payment is credit or debit card, ACH and wire; check and Zelle stay offline on the dashboard's Payment Methods page
- [x] R-09: category story grounds behind every render (cards, galleries, details, cart, mini cart, Hot this week)
- [x] R-03: Hot this week, fed from `src/content/featuring.ts`, the list the admin console will own
- [x] R-04: one campaign photograph per category in Shop by category, render on hover
- [x] R-08 / R-30: dealer homepage band: greeting, quick doors, quick reorder, recently viewed, account card
- R-10 (Quick View as the ordering point): set aside by decision, 30 Sept 2026

### B. Complete the ten key screens (M2, end of build week 4)

| # | Screen | Status |
|---|---|---|
| 1 | Homepage, signed out and signed in | [x] |
| 2 | Jewelry listing and product page | [x] (Quick View set aside) |
| 3 | Diamond page (Nivoda style list, quick filters, Quick View, M2O entry) | [x] on the sample feed |
| 4 | Custom Portal request form, with the live preview demo (R-23) | [x] demo awaits approval (A5) |
| 5 | Inquiries and Contact | [x] emails wait on M1 |
| 6 | Retailer Dashboard home (personalized) | [x] |
| 7 | Orders with Reorder, and the open memo items report | [~] |
| 8 | Cart and checkout | [x] |
| 9 | Log in and Main Door | [~] log in done; Main Door waits on Q6 |
| 10 | Admin console: inventory, featuring, banners | [ ] |

- [x] Diamond page on a sample feed shaped like the live search: one line per stone (shape, carat, color, clarity, cut, polish, symmetry, fluorescence, measurements, ratio, table, depth, lab and certificate, stock ID, shipment, price slot, Quick View, Add), quick filters and More filters, sort, compare up to four, cards on phones; stones leave the list once ordered or on memo
- [x] M2O request prefilled from the diamond search or a stone (R-19): shape, exact size, ratio, girdle inscription, customer name for the booklet, notes, dealer details
- [x] Diamond story under the search, after Tanishq's natural diamonds page: opening, four truths, seed to stone, the four Cs (each tab applies its filters to the search), certificate facts, lab grown and mined, dealer voices, doors. Signed-out visitors get a line under the lead that jumps to it
- [ ] Replace the story placeholders with Surreal's assets: growth chamber film, five process photos and confirmed process copy, a real lab report, named dealer quotes
- [x] Custom Portal (R-22): the live custom request fields (account status, company and location, contact, in-store delivery deadline, PO number, style number, CAD requested, item type, metal, gold color or two tone, center stone shape and size, finger size, matching bands, instructions, image uploads)
- [x] Live diamond preview demo for the custom form (R-23): shape, size and color update a drawn stone, set as a ring, pendant, studs, bangle or loose, in the chosen metal
- [ ] Show the R-23 demo to Surreal for approval (A5)
- [x] Contact page (R-24): inquiry type selector, routing per type, acknowledgement to the sender; schedule an appointment
- [ ] Confirm the inquiry routing (type to team) with Surreal (C-05) and connect the team inboxes and acknowledgement email (M1, C-14)
- [x] Dashboard home: greeting, open orders, memo count, recent items, tiles for the subpages. Dashboard shell with the sidebar (the live 15 tiles regrouped), order-level Reorder, memo and program request panels, dashboard search (R-29, local until C-06), holding pages for the sections still in design
- [~] Open memo report (R-28) and order history with Reorder (R-25)
- [ ] Admin console shell: inventory table, featured and hot deal toggles, default sort per page, banner manager
- [?] Main Door page (Q6)
- [?] Trade show appointments (Q9)

## M1: scope lock and architecture baseline (end of build week 2)

- [ ] Screen list agreed with Surreal (from the checklist and C-05)
- [ ] Data model: dealers and organizations, users and roles, articles and variants (metals, default metal, images), divisions, collections, matching sets, diamonds (attribute list C-04), memo items, carts, orders, payments, inquiries, content pages, banners, featured lists
- [ ] Managed services chosen and set up in Surreal's name (A7, A9): hosting, authentication with roles, database, content management, email delivery, file storage
- [ ] Environments: development, staging for UAT, production
- [ ] Repository, continuous integration, preview deployments
- [ ] Access matrix implemented from C-05 (B-04)
- [?] RightClick method agreed on the provider call (C-07); import path (likely Excel) designed
- [?] Existing search connection (C-06)
- [?] Card processor details (C-10, Q2, Q3)

## M3: feature complete on staging (end of build week 10)

- [ ] Real authentication replaces the preview session; dealer and dealer associate permissions
- [ ] Catalog from the database: bulk upload in admin (A1), metal and color data per article (C-02)
- [ ] 15 division pages with Surreal's final names (Q4)
- [ ] Shop the Set from matching-piece data (C-08)
- [ ] Diamond inventory from RightClick and supplier feeds (about every 30 minutes), stones removed on order (R-18, B-01)
- [ ] Out-of-stock rule (Q1, B-06)
- [ ] Prices: dealer price list and visibility rule (Q8)
- [ ] Payment through Surreal's existing processor (B-05, Q2, Q3)
- [ ] Order and inquiry emails from Surreal's sending domain (C-14)
- [ ] Remaining dashboard subpages (Q5): payment methods (R-27), trade shows (R-26), dashboard search (R-29)
- [ ] Content pages editable in admin (R-20): Legacy, Main Door, About
- [ ] Admin: users and roles, banners, featured area, metal color options, content (R-35)
- [ ] Think Space content and dealer export migrated (C-13)
- [ ] Accessibility and performance pass before UAT
- [ ] Monitoring in place

## M4: go-live (end of build week 12)

- [ ] UAT with Surreal's two testers (C-15), fixes only after code freeze
- [ ] Domain, DNS and email domain cut over (C-14)
- [ ] SEO for public pages, dealer pages noindex, sitemap, redirects from Think Space URLs
- [ ] Handover documentation and operations runbook

## Done

Design and groundwork

- [x] Design system (tokens, type, palette, logo, components) exported as a kit
- [x] Live site studied: B2B only, 16 jewelry divisions, login gating, checkout steps, forms, verified facts, the 15-tile Retailer Dashboard, dealer Diamond Search, program forms, the Think Space admin
- [x] Verified facts, team, dealer benefits (`src/content/site.ts`); divisions (`src/content/divisions.ts`); campaign photo sets (`src/content/editorial.ts`)
- [x] Holding pages for every Phase 1 route (`GatePage`), session aware
- [x] 3D stone, cursor effect and education section removed (R-06, R-07)

Homepage

- [x] Two-row header with search, mega menu (group rail, thumbnails, promo strip, editorial card), account menu and mini cart when signed in
- [x] Hero banner carousel, grower strip, shop by category, collections bento, programs, featured rail, turntable stories, dealer benefits, experience grid, the Surreal Assurance, footer

Store and product

- [x] Store listing: five a row with a 4/5/6 switch, division rail, sticky toolbar, filter drawer, chips, find your match panel, Made to Order tile, campaign photo tiles, Load more
- [x] Product page for every piece: gallery with turntable, campaign views and viewer, dealer price box, selectors, delivery countdown, program banners, details tabs, see it in New York, you may also like, complete the look, explore by center stone, dealer questions
- [x] Wishlist saved in the browser

Dealer preview

- [x] Log in page with the Apply panel; preview session (any email or the demo dealer)
- [x] Cart, mini cart, checkout (store details, payment, review, confirmation), orders kept in the browser; no prices until the price list is connected

Key screens, 30 Sept 2026

- [x] Diamond page on a 260-stone sample feed with Quick View, compare, memo requests and the M2O request (`/diamonds`, `/diamonds/made-to-order`)
- [x] Diamond story bands under the search, with labelled placeholders for Surreal's assets
- [x] Custom Portal with the live preview demo (`/custom`)
- [x] Inquiries and Contact with seven routed inquiry types and the acknowledgement; the contact drawer shares them (`/contact`)
- [x] Retailer Dashboard shell and home, dashboard search, holding pages for sections in design (`/dashboard`, `/dashboard/*`)
