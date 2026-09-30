# Surreal Diamond, Phase 1 task list

The work plan for Phase 1 of the BRD (v1.1, 18 September 2026), organised by its four milestones. Requirement status lives in [CHECKLIST.md](CHECKLIST.md); scope and background in [CONTEXT.md](CONTEXT.md). Phase 2 (Enterprise Level Integration, the invoicing and payment portal) is not planned here. Mark items `[x]` when built, verified in the browser at desktop and phone widths, and committed.

Status key: `[ ]` to do, `[~]` in progress, `[x]` done, `[?]` waiting on a client input or answer.

## Next up

In order. The first block brings what is already built in line with the BRD; the rest completes the ten key screens for M2 while the client inputs arrive.

### A. Bring built screens in line with the BRD

- [ ] R-12 / B-02: cards, Quick View and the product page show only the metals an article exists in; drop the made to order placeholder for metals (keep it for carat sizes without a render, or drop carat if Surreal confirms)
- [ ] R-10: Quick View panel on every store card (hover on desktop, tap on phones) with metal toggles, carat, quantity, Add to Cart and Buy Now (Buy Now adds and opens checkout); decide with Surreal whether the product page stays as the shareable link
- [ ] B-05: checkout payment trimmed to credit or debit card, ACH and wire; check and Zelle move to the dashboard's Payment Methods page
- [ ] R-09: colored or story grounds for card wells instead of the white on porcelain
- [ ] R-03: rename the featured rail to Hot this week, fed from one featured list that the admin console will own (R-33)
- [ ] R-04: one strong campaign photograph per category in Shop by category (keep the render as the hover)
- [ ] R-08 / R-30: dealer band on the homepage when signed in: greeting with the store name, recent items, quick reorder from past orders

### B. Complete the ten key screens (M2, end of build week 4)

| # | Screen | Status |
|---|---|---|
| 1 | Homepage, signed out and signed in | [~] signed out done; dealer band in A |
| 2 | Jewelry listing with Quick View | [~] listing done; Quick View in A |
| 3 | Diamond page (Nivoda style list, quick filters, Quick View, M2O entry) | [ ] |
| 4 | Custom Portal request form, with the live preview demo (R-23) | [ ] |
| 5 | Inquiries and Contact | [ ] |
| 6 | Retailer Dashboard home (personalized) | [ ] |
| 7 | Open memo items report and Reorder | [ ] |
| 8 | Cart and checkout | [x] (payment methods trimmed in A) |
| 9 | Log in and Main Door | [~] log in done; Main Door waits on Q6 |
| 10 | Admin console: inventory, featuring, banners | [ ] |

- [ ] Diamond page on a sample feed shaped like the live search: one line per stone with shape, carat, color, clarity, cut, polish, symmetry, fluorescence, measurements, ratio, table, depth, lab and certificate number, stock ID, shipment details, price slot and Add to Cart; quick filters; Quick View; compare
- [ ] M2O request prefilled from the diamond search (R-19): shape, exact size, ratio, girdle inscription, customer name for the booklet, notes
- [ ] Custom Portal (R-22): the live custom request fields (account status, company and location, contact, in-store delivery deadline, PO number, style number, CAD requested, item type, metal, gold color or two tone, center stone shape and size, finger size, matching bands, instructions, image uploads)
- [ ] Live diamond preview demo for the custom form (R-23): shape, size and color update a drawn stone
- [ ] Contact page (R-24): inquiry type selector, routing per type, acknowledgement to the sender; schedule an appointment
- [ ] Dashboard home: greeting, open orders, memo count, recent items, tiles for the subpages
- [ ] Open memo report (R-28) and order history with Reorder (R-25)
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
