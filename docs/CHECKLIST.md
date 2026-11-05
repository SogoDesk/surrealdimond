# Surreal Diamond, Phase 1 requirements checklist

Every numbered item in the BRD (v1.1 draft for sign-off, 18 September 2026) with where the build stands. Phase 1 only: Phase 2 (Enterprise Level Integration and the invoicing and payment portal) is out of this list. Scope and background are in [CONTEXT.md](CONTEXT.md); the work plan is in [TASKS.md](TASKS.md).

Status: **Done** built and checked in the browser · **In progress** being built now · **Partial** built in part or on preview data · **To do** not started · **Waiting** blocked on a client input (C-) or answer (Q-) · **Conflict** built differently from the BRD, needs a change · **Set aside** not pursued for now by decision.

Last reviewed: 5 November 2026.

## 5.1 Homepage

| # | Requirement | Status | Where it stands, next action |
|---|---|---|---|
| R-01 | Keep the story feel, roughly half the old length | Done | After the 27 October feedback the homepage runs eight sections, about 9 screens at 1440 by 900 (it was 15.6): hero carousel, Hot this week, the dealer band when signed in, bridal, collections, nine ways to begin, the New York visit ending with the trade program (the blue trade band was removed in November, N-16) |
| R-02 | Rotating banners at the top | Done | The hero is now the carousel: campaign photographs crossfading full width behind the fixed headline and buttons, managed in the console (Banners); the separate banner carousel is gone (F-A1) |
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
| R-15 | Quick View opens further detail on any stone | Done | Drawer with the plan drawing and dimensions, every attribute, certificate, price box, Purchase and Get on memo (N-26), Grow one like it to order, previous and next |
| R-16 | Quick filters above the list, Surreal's parameters | Partial (C-03) | Shape icons, carat range and presets, color and clarity ranges, measurements (length, width, depth in mm), cut, Legacy stones in the bar; More filters for lab, polish, symmetry, fluorescence (None only), ratio, table % and depth %; every option read from the feed (N-22 to N-24, N-28). Swap to Surreal's parameters when C-03 arrives |
| R-17 | Columns follow Surreal's attribute list | Partial (C-04) | Trimmed to the essentials after the 27 October feedback: shape (labelled Lab-grown CVD), carat, color, clarity, cut, measurements, lab, price (delivery removed in November, N-22); every other attribute in Quick View. Swap to Surreal's sheet when C-04 arrives |
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
| R-22 | Custom diamond request form with the details a dealer's customer wants | Changed by the client (F-C4) | Surreal asked to keep the existing custom order portal: `/custom` now introduces the program and links to it. The rebuilt four-part form (`components/custom/CustomPortal.tsx`) is parked, not routed, if the portal moves here later |
| R-23 | Proposed: live diamond preview updating with shape, size and color (demo first) | Parked with R-22 | The demo lives in the parked custom form (`components/custom/StonePreview.tsx`) |

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
| R-30 | Whole logged-in experience personalized, WB Mason style | Partial | Header Dealer Options menu (N-06), dealer homepage band and hero doors, dealer prices in US dollars across store, Quick View, product page, Hot this week, diamonds, cart, checkout, orders and memo; Retailer Dashboard home with the store's figures, orders, memo, requests and recently viewed |
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
| B-05 | Card, ACH and wire, through Surreal's existing card processor | Partial / Waiting (Q2, Q3, C-10) | Checkout offers credit or debit card, ACH and wire only; the dashboard's Payment methods page keeps cards and bank accounts, with check and Zelle through finance; the processor connects once named. The console's Orders and payments tracks each payment by method (card authorized then charged on confirmation, ACH initiated then settled, wire awaited then recorded with its reference), refunds or voids on cancellation, and posting in RightClick |
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
| C-20 | Address of the existing custom order portal to link (built against the current site's Custom Orders form); also needed for N-31 | No |
| C-21 | Final copy: home, M2O, Legacy, Contact, FAQ (November change request) | No |
| C-22 | New logo, with the full set of logo styles | No |
| C-23 | Standardised product images: 360 views and angles | No |
| C-24 | The remaining Retailer Dashboard feedback | No |
| C-25 | Surreal blue color codes, to confirm #86DFFF (the palette Surreal shared after the 28 October meeting) | No |

The build-start clock begins when C-01 to C-05 arrive.

## 10. Client feedback, 27 October 2026

Action items from the meeting, in the client's priority order. Work plan in TASKS.md block E.

| # | Item | Status | Where it stands, next action |
|---|---|---|---|
| F-D1 | Retailer Dashboard through a prominent navigation button | Done | A Retailer Dashboard pill in the header: filled when signed in; outlined for visitors, through log in to the dashboard |
| F-D2 | Open invoices, outstanding payments, invoice and memo reconciliation | Done (sample data) | `/dashboard/invoices`: balance due, past due, due this week, aging bar (current to over 90 days; credit available removed in November, N-29); tabs for invoices (select and pay, pay all past due, full balance), payments, and statement (running balance, CSV, print). The invoice Reconcile tab and its Reconciliation sidebar link were removed at the client's request (5 November 2026); memo reconciliation stays on Open memo items. Printable invoice at `/dashboard/invoices/[id]`. Memo items reported sold become invoices awaiting issue; wire orders become invoices due on receipt. Payments made here show "pending posting" (RightClick cannot record payments; finance posts them) |
| F-D3 | Unnecessary dashboard fields and pages removed | Done (confirm with Surreal, Q5) | Navigation trimmed to Dashboard, Billing, Orders and memo, Order and Your account; the eight holding tiles (marketing, catalogs, social, training, website, SPIF, authorized users, policies) removed; the home loses recently viewed and the resource tiles and leads with the account |
| F-D4 | Invoicing in Phase 1, subject to feasibility | Done (docs) | Moved from Phase 2 into Phase 1 in CONTEXT.md. Feasible on RightClick's reads (balance and aging, open invoices, statement); payments need the card processor (C-10) and a posting step by finance, since RightClick has no payment call |
| F-D5 | Sample customer data and invoice templates | Partial (C-19) | Seeded sample invoices per dealer and a placeholder invoice template; replaced by Surreal's template and data |
| F-B1 | Measurements filter | Done (layout to confirm, C-16) | Length, width and depth ranges in mm among the quick filters, also readable from the address; Surreal's reference may change the layout (for example a single size range) |
| F-B2 | Fewer sort options, simpler diamond table | Done, changed (N-22) | Sort cut from seven to carat both ways, plus price both ways for signed-in dealers (Next day delivery first removed in November); table from seventeen columns to eight (shape, carat, color, clarity, cut, measurements, lab, price) |
| F-B3 | Full specifications in Quick View | Done | Quick View keeps every attribute (polish, symmetry, fluorescence, ratio, table, depth, lab and certificate, type Lab-grown CVD, Legacy when it is one, stock ID); a line above the list says so |
| F-B4 | Shipment information more visible | Reversed (N-22) | Reversed by Surreal in November: the delivery column, chip, filter, next day sort, cutoff line above the list and Quick View delivery block are gone (the cutoff countdown stays on the dashboard, product page and cart). Built in October: delivery column as a chip (Next day delivery, Supplier lead time); the cutoff rule with a live countdown above the list and in Quick View; Next day delivery filter in the sticky bar; sort puts next day stones first. Wording and per-source lead times from C-18 |
| F-B5 | Site search on real inventory | Done | Header search suggests as you type from the catalog, the stone feed and the pages; reads stone words (shape, carat, color, clarity, lab, stock ID, certificate; "next day" dropped with N-22) into Diamond Search filters. `/search` results page open to everyone, prices behind log in; phones get a search icon in the header |
| F-C1 | M2O request reachable from the diamond page | Done | Request Made to Order in the sticky results bar (always in reach) and the banner above the list, both carrying the search; Quick View offers Grow one like it; no stone found in site search offers it too |
| F-C2 | M2O fields and placeholders | Done (wording to confirm, C-17) | Fields, labels, placeholders and hints moved into `src/content/m2o.ts` so Surreal's specification replaces one file; dimensions (mm) added beside the carat size (the program grows any carat weight or dimensions), either one required; the grade promise for the size shows as it is typed |
| F-C3 | Navigation to Legacy | Done | Legacy in the header, mega menu, footer, dashboard navigation and home, site search; added on the diamond page (Programs line), in Quick View and beside the M2O form |
| F-C4 | Custom jewelry links to the existing portal | Done (address to confirm, C-20) | `/custom` introduces the program and opens the existing custom order portal in a new tab (it sits behind the current site's dealer log in); the rebuilt form is parked, not routed; dashboard links go straight to the portal |
| F-E1 | Excel customer import for administrators | Done (preview) | Console, Dealers (`/admin/dealers`, live): customer list with status, search, CSV, per-customer setup link and remove. Import in four steps: upload (.xlsx or CSV, Excel template provided), match columns (recognises export names), check rows (new, update matched on email, skipped with the reason, skipped rows as CSV), done (optional setup links, import history). Administrator, Sales, Manager edit; Finance views; HR none |
| F-E2 | Password setup for existing customers | Done (preview) | Log in checks email and password (hashed, 5 tries then a 15 minute lock). A migrated customer without a password is offered a setup link; Forgot password sends one without revealing whether the email exists. `/account/setup`: one-time link, 72 hours, password rules with a live checklist and strength, confirm, then straight into the dashboard. `/dashboard/account`: details, people on the account, change password. Emails wait on C-14; the preview shows the link |
| F-E3 | Role testing with dummy dealer and admin accounts | Done | Four dummy dealers (owner, associate, invited, not invited) and five named console staff, one per role, all on `.example` emails; test plan and results (all pass) and the live migration steps in TESTING.md |
| F-E4 | RightClick sync approach with periodic refresh | Done (plan; connection waits on C-07) | RIGHTCLICK.md: one stored session, one queue capped at 20 calls a minute, bulk reads only, per-dealer calls only when a dealer opens Billing (cached 15 minutes), live check and hold before selling, last good data on failure. Console, RightClick sync (`/admin/sync`): connection status, schedule with editable intervals, on-demand estimates, live call budget |
| F-E5 | Refresh interval feasibility | Done | Recommended plan about 1,500 calls a day (1.7 a minute in business hours, limit 30); every interval down to 1 minute fits, because the frequent calls are bulk calls. Heavy calls kept at 15 to 30 minutes at CFI's request. To confirm with CFI: per-call charges, session lifetime, allow-listing, movements call for all items |
| F-A1 | Full-width moving hero carousel, text and buttons fixed | Done | Six campaign photographs (no baked-in text) crossfade with a slow settle, about 6.5 s each; eyebrow, SURREAL, the trade line and both buttons stay fixed. Caption with the category link, progress bars, previous, pause, next, arrow keys and swipe; keeps moving on hover, pauses on keyboard focus; no autoplay under reduced motion. On phones the photograph sits above the headline. Console Banners now picks the photographs |
| F-A2 | Hot this week under the hero | Done | Directly after the hero |
| F-A3 | Repetitive sections removed, fewer animations | Done | Removed: the mid-page banner carousel, the lookbook, the Foreveryone collage and the time counter, with the preloader. Bridal lost its pinned 96 frame scroll turntable (a still render now). Smooth scrolling (Lenis) is gone site-wide; scroll-driven pins, scrubs, parallax and hand-offs are off (`src/lib/motion.ts`, one switch), leaving short one-time fades. Page height down from about 14,000 to 8,200 px at 1440 |
| F-A4 | Navigation stays accessible while scrolling | Done, changed (N-09) | The links row no longer folds away past 80 px; both rows stay, and sticky bars sit under the full header. Since November the bar fades while the page scrolls and returns on hover, on focus or when scrolling stops |
| F-A5 | Light and dark themes, brand blue secondary | Done (for Surreal's review) | A labelled Light / Dark switch in the header's top right corner (N-08; in the menu on phones), remembered per browser and applied before the first paint. Dark: deep ink page and panels, light text, the agreed brand blue (#86DFFF and its tints; #70C0E0 retired in N-03) for accents, Surreal blue box edges (N-04), focus and button hovers; contrast chapters (hero, sky panels, navy footer) and the jewelry trays keep their brand colours; the console and printed invoices stay light. Light stays the default. The earlier gold onyx store experiment is retired |

## 11. Client change request, November 2026

The to-do list from Surreal's meeting notes (32 items), received 5 November 2026. N-31 and N-32 are assessments only; nothing is built for them. All built items are on local commits, not yet pushed.

| # | To-do | Status | What was done |
|---|---|---|---|
| N-01 | Remove all "grower" wording everywhere | Done | "Largest CVD grower", "direct from the grower", "Grown by Surreal", "food chain" and "positioning you as a grower" removed from the hero, About, the diamond page and story, Quick Views, the product page, checkout, the Assurance band, the login, contact and apply lists, site search and page descriptions. "Lab grown", "CVD" and the M2O "grown to order" wording stay |
| N-02 | "Dealer price" to "Price" everywhere; remove the Dealer Pricing tab | Done | Every "Dealer price" or "Dealer pricing" now reads "Price" or "Pricing" (cards, Quick Views, product page, Hot this week, cart, search, mega menu, login, console orders, page descriptions); the product page's Dealer pricing tab is gone |
| N-03 | Correct Surreal blue; solid blue for hero text and dashboard tiles | Done (hex to confirm, C-25) | The hero headline and the dashboard tiles (On memo, Last payment, Next day delivery) in solid Surreal blue #86DFFF with navy text; about 15 off-brand blues (#70C0E0, the steel blues, the pale tints) moved onto Surreal blue, its tints, and its deep shade #00698F for text on light; status chips such as Shipped are Surreal blue boxes |
| N-04 | Fix dark-mode legibility (Surreal blue boxes) | Done | Dark mode: box edges and keylines in Surreal blue, the dashboard's current page a solid blue box, the balance card outlined; the ring section blue from the start (no navy text on black before its splash); the contact form no longer see-through; past due red and Delivered green brightened; the Light / Dark labels solid. Checked with a contrast sweep of 25 pages |
| N-05 | Resolve the site lag; confirm once on Surreal's server | Done (confirm on Surreal's server) | A production build showed the homepage pulling three ring turntable videos of about 2 MB each up front (about 9 MB in all) and stalling 583 ms while scrolling. The clips now load on first hover (on touch, when in view): the homepage is 2.3 MB, the worst frame 17 ms, and every page measured scrolls at 60 frames a second. To confirm on Surreal's server after the move |
| N-06 | Header: logged out, Login and Become a Dealer only; logged in, a trimmed Dealer Options dropdown | Done | Visitors: logo, search, Log in, Become a dealer and the Light / Dark switch (appointments and cart come with log in). Dealers: appointments, Dealer Options (Orders, Invoices and payments for owners, Open memo items, Account settings, Log out), Retailer Dashboard and the cart. Phones get the same links in the menu sheet |
| N-07 | Logo slightly bigger | Done (new logo waits on C-22) | Mark from 30 to 36 px, wordmark from 20 to 24 px; the new logo drops in when it arrives |
| N-08 | Clearly labelled Light / Dark switch in the corner | Done | The switch shows Light and Dark wherever it appears, in the header's top right corner (in the menu sheet on phones) |
| N-09 | Sticky bar fades while scrolling, back on hover or when scrolling stops | Done | Past the first 80 px the header fades out while the page scrolls and returns once scrolling has stopped for under half a second, with a smooth half second fade both ways (follow-up, 5 November 2026), on hover, on keyboard focus, or with a menu open ("sticky bar" read as the header) |
| N-10 | Become a Dealer for logged-in users goes to the Retailer Dashboard | Done | The About page door shows Retailer Dashboard for dealers; the footer's Become a Retailer gives way to the Retailer Dashboard link; /apply sends a signed-in dealer to /dashboard. The header, hero, menus and gates already did |
| N-11 | Hot This Week: products not showing, scroll control at the bottom, 12 pieces | Done | The cards were hidden by a slide-in that waited on a scroll trigger, which could be measured before the sections above settled; the slide-in is gone. The row always shows 12 pieces (the console's list topped up from the house picks), with the arrows under the row beside the thumb |
| N-12 | Store-at-a-glance strip slightly bigger; cutoff countdown in Surreal's time zone | Done | The strip about an eighth larger throughout. The countdown already ran on New York time; one New York clock now serves the countdown and checkout, and every mention reads "4:00pm ET" (it said EST, wrong in summer) |
| N-13 | Ring section titled "The ring she says yes to"; remove the stock-count row | Done | Title changed; the shape strip with stock counts removed |
| N-14 | Collections heading "Shop our exclusive collections" (no names or counts); Sterling Silver and Vermeil separate | Done | Heading changed and the subline naming the collections removed. Sterling Silver and Vermeil were already separate tiles and divisions |
| N-15 | Calm the Nine Ways to Begin animation | Done | The strip drifts at 16 px a second (it was 34); the hover lift, zoom and arrow movement halved |
| N-16 | Remove the blue "food chain" bar, move the selling points and CTA buttons up; simplify the footer | Done | The blue Trade band is gone; its twelve selling points and doors (Retailer Dashboard, Talk to us) close the Visit section above it. The footer keeps the link columns, the Visit column and the legal row; the newsletter, the animated mark and wordmark band and the back-cover reveal are gone. Follow-up (5 November 2026): the footer now leads with the logo and company name (line mark, SURREAL wordmark, by JB Bhanderi), The New Forever line, the office and Instagram, beside sky-titled link columns, in a more modern layout |
| N-17 | Bring back the mega-menu dropdown | Done (to confirm) | It still opened on hover on desktop; Jewelry now opens it on click and tap too (View all and Shop all inside go to /jewelry), and phones and tablets get the categories and collections in the menu sheet |
| N-18 | Separate categories from collections; no cut-off rows; bigger carat markers | Done | The division rail is in labelled groups: Jewelry (round thumbnails, shared evenly across the row), then Collections and Programs (rounded squares); nothing runs off the page edge. Carat markers from 22 to 28 px, text from 11 to 13 px |
| N-19 | Remove Rose Gold; change M2O to Custom; rename "Worn necklaces" to "Shop the look" | Done | Rose gold removed from the catalog, filters, match panel, swatches, console and pricing. In the jewelry area the M2O tile and banner are now Custom, linking to /custom. The necklace "Worn" tiles read Shop the look |
| N-20 | Quick view and detail: remove ring size and all sizing, Grown by and Available; keep quantity, Add to Cart, Buy Now, Special instructions, Ask a question, Certificates on request | Done | Ring size and all sizing removed from Quick View, the product page and the cart (no more size step before checkout), with Grown by and Available in. Quick View gains Special instructions, Ask a question and Certificates on request; the product page gains Buy now |
| N-21 | Admin field to map "Complete the look" pairings | Done (preview) | Console, Merchandising, Complete the look: choose a piece, then up to four pairings in order; its product page shows them, or the automatic picks when none are set. Kept in this browser until the database |
| N-22 | Remove the Source filter, the next-day delivery sort and the delivery column | Done | Source filter and next-day sort removed (the default sort is now carat, low to high); the delivery column was already out. The next-day toggle, the cutoff line above the list and delivery in Quick View, Compare, the cart and the search results removed with them (reverses F-B4) |
| N-23 | Fluorescence None only; Table % and Depth % filters; label stones Lab-grown CVD | Done | Fluorescence offers None; Table % and Depth % ranges in More filters; every stone labelled Lab-grown CVD in the list, Quick View, Compare, the cart and search |
| N-24 | Filter options data-driven from the inventory feed | Done (sample feed) | Shapes, color and clarity grades, cut, polish, symmetry, labs and the carat presets come from the feed; the ranges show the feed's span as placeholders. The live feed takes over with RightClick (C-07) |
| N-25 | Compare panel bigger and wider; keep Show More | Done | Compare from 1100 to 1480 px wide with larger figures and text, and a Type row; Show more on the list unchanged |
| N-26 | Purchase and Get on Memo per stone, one cart, memo lines colour-coded and flagged in the order; no memo for jewelry | Done (memo price waits on RightClick) | Both buttons on every row and in Quick View; choosing the other switches the line. Memo lines carry a Surreal blue edge and a Memo tag in the cart, mini cart and the dealer and console orders, read "Memo price confirmed by Surreal", stay out of totals and invoices, and open as memo items when the order is placed. Jewelry is purchase only |
| N-27 | M2O form: shape Other opens a text box; size and dimensions mutually exclusive | Done (wording waits on C-17) | Other shows a required "Which shape?" box; "Order by" chooses Carat size or Dimensions, showing one field and clearing the other |
| N-28 | Legacy becomes an info page; Start a Legacy opens the search on Legacy stones (one inventory) | Done (sample flag) | Start a Legacy opens /diamonds?legacy=1; a Legacy stones toggle in the bar; Legacy stones marked in the list and Quick View. The sample feed flags one stone in eight until RightClick carries the flag. Follow-up (5 November 2026): /legacy is now a standalone page of its own design (seed line of milestones, the three steps on a line, the program, the questions), and Start a Legacy transitions the page into the Legacy stone search at /legacy/stones (Legacy stones only, the Legacy filter always on, its own heading, the photograph settling into it); the links back play the transition in reverse |
| N-29 | Dashboard: remove Credit Available; keep On memo, Balance due, Last payment and the cutoff timer | Done | Credit available removed from the dashboard home and the Invoices page; the kept tiles are solid Surreal blue |
| N-30 | Recent orders show all orders, phone orders included, through RightClick | Done (sample data) | Recent orders gains a Channel column and lists phone orders beside the site's; an "Orders, every channel" job added to the RightClick sync plan (/admin/sync). Three sample phone orders per account until the connection |
| N-31 | Assess: the custom order portal rebuilt natively, with its order history | Assessed | Feasible. Needs the portal link (C-20), file storage for uploads, a status workflow (request, CAD sent, approved, in production, shipped), a dealer history list and a console queue, emails (C-14), and an import of past orders. About 2 to 3 weeks once the backend exists, plus 2 to 5 days for the import |
| N-32 | Assess: "Switch to retailer mode" pricing, 2.5x default markup with per-dealer multipliers | Assessed (Surreal checking with retailers) | Feasible: every price comes from one helper. A switch multiplies shown prices by the dealer's multiplier (default 2.5, set per dealer in the console); the cart, checkout and invoices stay at cost. About 3 to 5 days. Open: rounding, a separate multiplier for stones, a PIN to leave retailer mode |
