# Surreal Diamond, Phase 1 requirements checklist

Every numbered item in the BRD (v1.1 draft for sign-off, 18 September 2026) with where the build stands. Phase 1 only: Phase 2 (Enterprise Level Integration and the invoicing and payment portal) is out of this list. Scope and background are in [CONTEXT.md](CONTEXT.md); the work plan is in [TASKS.md](TASKS.md).

Status: **Done** built and checked in the browser · **In progress** being built now · **Partial** built in part or on preview data · **To do** not started · **Waiting** blocked on a client input (C-) or answer (Q-) · **Conflict** built differently from the BRD, needs a change · **Set aside** not pursued for now by decision.

Last reviewed: 27 October 2026.

## 5.1 Homepage

| # | Requirement | Status | Where it stands, next action |
|---|---|---|---|
| R-01 | Keep the story feel, roughly half the old length | Partial | The client asked for the 9e31102 chapter homepage back (October 2026), re-voiced for dealers. It runs 15.6 screens at 1440 by 900 against 21.4 for the old one, with pins shortened and repeated sections merged; reaching half would mean dropping the Lookbook or Foreveryone, which the client keeps. Confirm the section list against C-01 |
| R-02 | Rotating banners at the top | Done (moved) | Banner carousel of the client's web banners, square artwork on phones. Since the revival the old hero opens the page and the carousel sits mid-page, before Hot this week, by the client's choice |
| R-03 | Featured "Hot this week" area, controlled from admin | Done (preview) | Hot this week on the homepage follows the console's Merchandising list and Inventory switches (`src/lib/merch.ts`, defaults in `src/content/featuring.ts`); empty hides the band. Settings are per browser until the database |
| R-04 | One strong image per category | Done | The Nine ways to begin carousel shows one campaign photograph per type; the render on its story ground shows on hover. Stud Earrings borrows a worn-earrings photograph until Surreal supplies a studs image |
| R-05 | Highlight Surreal's own photography | Done | Campaign photographs across home, store tiles and product galleries |
| R-06 | Remove the cursor shade / trailing effect | Done | Removed 30 Sept; kept out of the homepage revival, as was the 3D stone |
| R-07 | Remove the education section | Done | Removed from home, header, footer |
| R-08 | Personalized homepage for logged-in dealers: greeting, recent items, quick reorder | Done (preview data) | Dealer band under the hero replaces the dealer pitch: greeting by store and time of day, quick doors, quick reorder from past orders (per line or the whole last order), recently viewed pieces, account card with the delivery countdown. Runs on the preview session and browser storage until real accounts |

## 5.2 Jewelry shop pages

| # | Requirement | Status | Where it stands, next action |
|---|---|---|---|
| R-09 | Five cards a row, rounded corners, colored or story backgrounds instead of grey, occasional large hero images | Done | Five a row, rounded, campaign photo tiles in the rows, and each category's story ground (`src/content/grounds.ts`) behind the renders on cards, galleries, cart and mini cart |
| R-10 | Quick View is the ordering point: hover panel with Add to Cart and Buy Now; no separate product page required | Done | Clicking a card opens Quick View (a drawer) with metal, carat, size, quantity, Add to cart and Buy now (straight to checkout), on the store grid and on the card rows of the product and cart pages. The full product page stays, one click away |
| R-11 | Shop the Set / Complete the Set from matching-piece data | Waiting (C-08) | "Complete the look" shows pairs by category today; switch to Surreal's matching-piece data |
| R-12 | Only the metal colors an article exists in, as toggles, one default image each, set in admin | Done (preview) | Cards, Quick View, product page and filters offer only a piece's metals. Console Inventory toggles each metal per piece and sets the default; a metal switched on before its render exists shows the made to order placeholder. Settings are per browser until the database |
| R-13 | Surreal curates yellow gold defaults and supplies metal and color data per article | Partial (C-02) | The default metal per piece is set in the console or by `defaultMetal`; waiting on Surreal's yellow gold list and metal data |

## 5.3 Diamond page

| # | Requirement | Status | Where it stands, next action |
|---|---|---|---|
| R-14 | One line per diamond, Nivoda style: specs, certificate number, stock ID, ratios, shipment details, price, Add to Cart inline | Partial (sample feed) | Built at `/diamonds` on a 260-stone sample feed (`src/content/diamonds.ts`): shape, carat, color, clarity, cut, polish, symmetry, fluorescence, measurements, ratio, table, depth, lab and certificate, stock ID, shipment, price slot, Quick View and Add inline; cards on phones. Signed-in dealers see a price in US dollars from the sample price list (`src/lib/pricing.ts`) until Surreal's list arrives; live stones wait on RightClick (C-07) |
| R-15 | Quick View opens further detail on any stone | Done | Drawer with the plan drawing and dimensions, every attribute, certificate, shipment, dealer price box, Add to cart, Request on memo, Grow one like it to order, previous and next |
| R-16 | Quick filters above the list, Surreal's parameters | Partial (C-03) | Shape icons, carat range and presets, color and clarity ranges, cut, lab; More filters for polish, symmetry, fluorescence, ratio, source. Swap to Surreal's parameters when C-03 arrives |
| R-17 | Columns follow Surreal's attribute list | Partial (C-04) | Columns follow the live dealer search plus the BRD fields; swap to Surreal's sheet when C-04 arrives |
| R-18 | A stone leaves available inventory the moment a purchase or memo order completes | Partial (preview) | Stones on a placed order or a memo request leave the list at once; the inventory service makes it hold across dealers |
| R-19 | Made to order entry on this page, M2O request prefilled from the search | Done (Q7 open) | Entry banner above the list and in Quick View; `/diamonds/made-to-order` has the live M2O fields prefilled with shape, size, ratio, the source stone and the dealer. Whether it stays its own page is Q7 |

## 5.4 Content pages: Diamond Legacy, Main Door, About Us / Company History

| # | Requirement | Status | Where it stands, next action |
|---|---|---|---|
| R-20 | Short content pages, editable from admin without a developer | Partial | About (`/about`, Company History at `#history`) and Diamond Legacy (`/legacy`) are built as short pages from verified facts on a shared layout (`ContentPage`). Main Door waits on Q6; admin editing comes with the console's Content module |
| R-21 | Content and imagery from Surreal; Legacy and Main Door intent | Waiting (C-11, Q6) | A company timeline for Company History, the Legacy FAQ answers and the Legacy list come from Surreal |

## 5.5 Custom Portal

| # | Requirement | Status | Where it stands, next action |
|---|---|---|---|
| R-22 | Custom diamond request form with the details a dealer's customer wants | Partial (preview) | Built at `/custom` with every live field in four parts, image uploads and a CU request number; open to new accounts as on the live form. Request emails and image storage connect in M1 |
| R-23 | Proposed: live diamond preview updating with shape, size and color (demo first) | Demo built, awaiting approval (A5) | Redraws with item type, metal and gold color, shape, carat (to scale) and D to F color; matching bands and finger size for rings; floating preview on phones |

## 5.6 Inquiries and Contact

| # | Requirement | Status | Where it stands, next action |
|---|---|---|---|
| R-24 | Contact form with an inquiry type selector routing to the right person, automatic acknowledgement | Partial (emails wait on M1, C-14) | `/contact` merges the live Contact Us, Schedule an Appointment and We Want to Hear From You forms: seven inquiry types, each routed to a team (`src/content/inquiries.ts`, to confirm with C-05), type-specific fields, a reference number and the acknowledgement email shown on the page. The contact drawer shares the same types and server action. Sending the two emails waits on the email service |

## 5.7 Retailer Dashboard

| # | Requirement | Status | Where it stands, next action |
|---|---|---|---|
| R-25 | Reorder an exact previous item in a couple of clicks | Done (preview data) | `/dashboard/orders`: frequently reordered pieces and every order line reorder in one click with the same metal, carat weight, size and quantity; Reorder all per order; Change and reorder opens the piece preset. Also on the dashboard home and the homepage band. Loose stones stay one of a kind |
| R-26 | Trade show appointments | Partial (Q9) | `/dashboard/trade-shows`: meeting request form (show, days, time of day, people, notes) with a TS number; the dealer's requests listed and withdrawable. The show list (`src/content/tradeShows.ts`) stays empty until Surreal sends its calendar; time-slot booking if Q9 asks for it |
| R-27 | Payment methods managed by the dealer (invoice payment in Phase 2) | Partial (preview, C-10) | `/dashboard/payments`: cards and bank accounts on the account, a default for checkout, remove; only brand or bank, last four and expiry are kept. Wire, check and Zelle go through finance. The card processor holds the real methods once named |
| R-28 | Open memo items report from existing data | Partial (waiting on C-07) | `/dashboard/memo`: the live columns plus days on memo colored by age, figures, filters, CSV, and the live reconciliation (tick sold, confirm the list, note a discrepancy, RC number). Reads the dealer's memo requests, plus labelled sample lines for the demo account; RightClick supplies the real memo and daily prices |
| R-29 | Dashboard search integrates Surreal's existing search | Partial / Waiting (C-06) | Dashboard search built: sections, the dealer's orders, memo and requests by number, catalog by name or style, stones by stock ID; swap the source to Surreal's search when C-06 arrives |
| R-30 | Whole logged-in experience personalized, WB Mason style | Partial | Header account menu, dealer homepage band and hero doors, dealer prices in US dollars across store, Quick View, product page, Hot this week, diamonds, cart, checkout, orders and memo; Retailer Dashboard home with the store's figures, orders, memo, requests and recently viewed |
| R-31 | Remaining subpages (about 10) | Waiting (Q5) | Every live tile has a dashboard section. Live: home, orders, memo, cart, diamond search, Made to Order, Custom Portal, trade shows, payment methods. The ones in design open a holding page listing what they will hold (`src/content/dashboard.ts`) |

## 5.8 Admin console

| # | Requirement | Status | Where it stands, next action |
|---|---|---|---|
| R-32 | Full inventory view | Partial (sample feed) | `/admin/inventory`: every piece (style, category, metals, default metal) and every stone (grades, lab and certificate, source, status available, on memo or ordered), search, filters, CSV. Stones are the sample feed until RightClick (C-07); pieces move to the database with bulk upload (A1) |
| R-33 | Feature or toggle any product to the top of any page, including hot deal items | Done (preview) | Inventory switches and `/admin/merchandising`: Hot this week, and pieces featured to the top of All jewelry or any category, in order; the store pages follow |
| R-34 | Admin-defined default sort per page; customers can still re-sort | Done (preview) | Default sort per jewelry page in Merchandising; the page opens in it, customers can re-sort, and featured pieces lead only the default order |
| R-35 | Manage banners, featured area, metal color options, content pages, users and roles per the access matrix | Partial | Banners (on or off, order, labels, links, add from the library) and the featured area work; the access matrix locks modules per role (proposed until C-05); metal options per piece are editable in Inventory; content pages and named staff users come with the database and authentication |

## 6. Rules across the site

| # | Rule | Status | Where it stands, next action |
|---|---|---|---|
| B-01 | Every stone is one of a kind; gone from availability the moment an order completes | Partial (preview) | Stones are quantity one in the cart and leave the list once ordered or on memo; enforced server side with the inventory service |
| B-02 | An article never shows a metal color it does not exist in | Done | With R-12 |
| B-03 | Each dealer's logged-in experience reflects their own account and history | Partial | Homepage band, dashboard, cart, checkout and forms use the dealer's store, orders, memo and requests; preview session until real accounts with the auth service |
| B-04 | Access by roles, no approval step | Partial | The console enforces a proposed access matrix per staff role (edit, view, none); confirm with C-05; dealer associate permissions with real accounts |
| B-05 | Card, ACH and wire, through Surreal's existing card processor | Partial / Waiting (Q2, Q3, C-10) | Checkout offers credit or debit card, ACH and wire only; the dashboard's Payment methods page keeps cards and bank accounts, with check and Zelle through finance; the processor connects once named |
| B-06 | Out-of-stock display rule | Waiting (Q1) | Not built; can be prepared behind a console switch so either answer is quick |

## 4. Roles

| Role | Status |
|---|---|
| Administrator, Accounts / Finance, HR, Sales, Manager | Partial (console by role in the preview, proposed access matrix; named logins Q10, confirm C-05) |
| Dealer, Dealer Associate | Partial (one preview dealer session; associates and permissions to do) |
| Public visitor | Done (marketing pages, no ordering, dealer holding pages) |

## 7. Integrations

| System | Status |
|---|---|
| RightClick (stock, memo, invoicing data, likely Excel export) | Waiting (C-07 call) |
| Surreal's existing search | Waiting (C-06) |
| Card processor (existing) | Waiting (C-10, Q2, Q3) |
| Supplier stone feeds (about every 30 minutes) | Waiting (feed details per supplier) |
| Think Space extraction (content, dealers) | Waiting (C-13) |

## 8. Milestones

| Milestone | Due | Status |
|---|---|---|
| M1 Scope lock and architecture baseline: screen list, data model, working environments | End of build week 2 | In progress: architecture proposal and data model in ARCHITECTURE.md, decisions D1 to D8 awaiting approval; screen list waits on C-05 |
| M2 Design approval: design system and ten key screens | End of build week 4 | Ahead: design system and nine of ten key screens built as working pages, plus About, Legacy, payment methods and trade shows; Main Door waits on Q6 |
| M3 Feature complete on staging for UAT, code freeze | End of build week 10 | To do |
| M4 Go-live, handover documentation, operations runbook | End of build week 12 | To do |

## 9. Inputs from Surreal

| # | Input | Received |
|---|---|---|
| C-01 | Homepage content and section list | No |
| C-02 | Curated yellow gold selection, metal and color data per article | No |
| C-03 | Quick filter parameters | No |
| C-04 | Diamond attributes to display | No |
| C-05 | Role-to-page access breakdown | No |
| C-06 | Search integration details (Nia) | No |
| C-07 | Time for the inventory provider call | No |
| C-08 | Matching-piece data for Shop the Set | No |
| C-09 | Account and user structure | No |
| C-10 | Card processor name and contact | No |
| C-11 | Legacy, Main Door and About content; for the diamond story: growth chamber film, process photos and copy, a sample lab report, named dealer quotes | No |
| C-12 | Nominated decision-maker | No |
| C-13 | Read access to the current site, export of dealer organizations and users | No |
| C-14 | Domain, DNS and email-sending domain control | No |
| C-15 | Two named testers for the final two weeks | No |
| C-16 | Reference for the Measurements filter (27 October meeting) | No |
| C-17 | M2O field specification and placeholder wording | No |
| C-18 | Finalised shipment wording and lead times per stone source | No |
| C-19 | Invoice template, sample customer data and invoice data | No |
| C-20 | Address of the existing custom order portal to link (built against the current site's Custom Orders form) | No |

The build-start clock begins when C-01 to C-05 arrive.

## 10. Client feedback, 27 October 2026

Action items from the meeting, in the client's priority order. Work plan in TASKS.md block E.

| # | Item | Status | Where it stands, next action |
|---|---|---|---|
| F-D1 | Retailer Dashboard through a prominent navigation button | Done | A Retailer Dashboard pill in the header: filled when signed in; outlined for visitors, through log in to the dashboard |
| F-D2 | Open invoices, outstanding payments, invoice and memo reconciliation | Done (sample data) | `/dashboard/invoices`: balance due, past due, due this week, credit available, aging bar (current to over 90 days); tabs for invoices (select and pay, pay all past due, full balance), payments, statement (running balance, CSV, print) and reconcile (match or flag each invoice, confirm the balance, RC number). Printable invoice at `/dashboard/invoices/[id]`. Memo items reported sold become invoices awaiting issue; wire orders become invoices due on receipt. Payments made here show "pending posting" (RightClick cannot record payments; finance posts them) |
| F-D3 | Unnecessary dashboard fields and pages removed | Done (confirm with Surreal, Q5) | Navigation trimmed to Dashboard, Billing, Orders and memo, Order and Your account; the eight holding tiles (marketing, catalogs, social, training, website, SPIF, authorized users, policies) removed; the home loses recently viewed and the resource tiles and leads with the account |
| F-D4 | Invoicing in Phase 1, subject to feasibility | Done (docs) | Moved from Phase 2 into Phase 1 in CONTEXT.md. Feasible on RightClick's reads (balance and aging, open invoices, statement); payments need the card processor (C-10) and a posting step by finance, since RightClick has no payment call |
| F-D5 | Sample customer data and invoice templates | Partial (C-19) | Seeded sample invoices per dealer and a placeholder invoice template; replaced by Surreal's template and data |
| F-B1 | Measurements filter | To do (C-16) | |
| F-B2 | Fewer sort options, simpler diamond table | To do | |
| F-B3 | Full specifications in Quick View | To do | |
| F-B4 | Shipment information more visible | To do (C-18) | |
| F-B5 | Site search on real inventory | To do | |
| F-C1 | M2O request reachable from the diamond page | To do | |
| F-C2 | M2O fields and placeholders | To do (C-17) | |
| F-C3 | Navigation to Legacy | To do | |
| F-C4 | Custom jewelry links to the existing portal | Partial (C-20) | Dashboard navigation and home link to the custom order portal; the /custom page and header next |
| F-E1 | Excel customer import for administrators | To do | |
| F-E2 | Password setup for existing customers | To do | |
| F-E3 | Role testing with dummy dealer and admin accounts | To do | |
| F-E4 | RightClick sync approach with periodic refresh | To do | |
| F-E5 | Refresh interval feasibility | To do | |
| F-A1 | Full-width moving hero carousel, text and buttons fixed | To do | |
| F-A2 | Hot this week under the hero | To do | |
| F-A3 | Repetitive sections removed, fewer animations | To do | |
| F-A4 | Navigation stays accessible while scrolling | To do | |
| F-A5 | Light and dark themes, brand blue secondary | To do | |
