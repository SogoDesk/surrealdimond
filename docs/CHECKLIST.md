# Surreal Diamond, Phase 1 requirements checklist

Every numbered item in the BRD (v1.1 draft for sign-off, 18 September 2026) with where the build stands. Phase 1 only: Phase 2 (Enterprise Level Integration and the invoicing and payment portal) is out of this list. Scope and background are in [CONTEXT.md](CONTEXT.md); the work plan is in [TASKS.md](TASKS.md).

Status: **Done** built and checked in the browser · **Partial** built in part or on preview data · **To do** not started · **Waiting** blocked on a client input (C-) or answer (Q-) · **Conflict** built differently from the BRD, needs a change · **Set aside** not pursued for now by decision.

Last reviewed: 30 September 2026.

## 5.1 Homepage

| # | Requirement | Status | Where it stands, next action |
|---|---|---|---|
| R-01 | Keep the story feel, roughly half the old length | Partial | Ten compact sections replace the thirteen-chapter concept; confirm the section list against C-01 |
| R-02 | Rotating banners at the top | Done | Hero carousel of the client's web banners, square artwork on phones |
| R-03 | Featured "Hot this week" area, controlled from admin | Partial | Hot this week on the homepage, fed from one featuring list (`src/content/featuring.ts`); the admin console takes it over with R-33 |
| R-04 | One strong image per category | Done | Shop by category leads with one campaign photograph per type; the render on its colored ground shows on hover. Stud Earrings borrows a worn-earrings photograph until Surreal supplies a studs image |
| R-05 | Highlight Surreal's own photography | Done | Campaign photographs across home, store tiles and product galleries |
| R-06 | Remove the cursor shade / trailing effect | Done | Removed 30 Sept |
| R-07 | Remove the education section | Done | Removed from home, header, footer |
| R-08 | Personalized homepage for logged-in dealers: greeting, recent items, quick reorder | Done (preview data) | Dealer band under the hero replaces the dealer pitch: greeting by store and time of day, quick doors, quick reorder from past orders (per line or the whole last order), recently viewed pieces, account card with the delivery countdown. Runs on the preview session and browser storage until real accounts |

## 5.2 Jewelry shop pages

| # | Requirement | Status | Where it stands, next action |
|---|---|---|---|
| R-09 | Five cards a row, rounded corners, colored or story backgrounds instead of grey, occasional large hero images | Done | Five a row, rounded, campaign photo tiles in the rows, and each category's story ground (`src/content/grounds.ts`) behind the renders on cards, galleries, cart and mini cart |
| R-10 | Quick View is the ordering point: hover panel with Add to Cart and Buy Now; no separate product page required | Set aside | Not pursued for now by decision (30 Sept 2026): ordering stays on the product page and the card's Add to cart |
| R-11 | Shop the Set / Complete the Set from matching-piece data | Waiting (C-08) | "Complete the look" shows pairs by category today; switch to Surreal's matching-piece data |
| R-12 | Only the metal colors an article exists in, as toggles, one default image each, set in admin | Done | Cards, product page, details and filters offer only the metals a piece exists in; the made to order placeholder now covers only carat sizes without a render. Admin configuration comes with the console |
| R-13 | Surreal curates yellow gold defaults and supplies metal and color data per article | Partial (C-02) | `defaultMetal` field per article drives the opening metal everywhere; waiting on Surreal's yellow gold list and metal data |

## 5.3 Diamond page

| # | Requirement | Status | Where it stands, next action |
|---|---|---|---|
| R-14 | One line per diamond, Nivoda style: specs, certificate number, stock ID, ratios, shipment details, price, Add to Cart inline | To do | Build on a sample feed shaped like the live search columns |
| R-15 | Quick View opens further detail on any stone | To do | |
| R-16 | Quick filters above the list, Surreal's parameters | Waiting (C-03) | Start with the live filters: shape, price, carat, color, cut, clarity, polish, symmetry, fluorescence, lab |
| R-17 | Columns follow Surreal's attribute list | Waiting (C-04) | Start with the live columns |
| R-18 | A stone leaves available inventory the moment a purchase or memo order completes | To do | Needs the inventory service; preview can mark stones sold in the browser |
| R-19 | Made to order entry on this page, M2O request prefilled from the search | Partial (Q7) | `/diamonds/made-to-order` holding page; build the prefilled request |

## 5.4 Content pages: Diamond Legacy, Main Door, About Us / Company History

| # | Requirement | Status | Where it stands, next action |
|---|---|---|---|
| R-20 | Short content pages, editable from admin without a developer | To do | Holding pages exist; build on the content system |
| R-21 | Content and imagery from Surreal; Legacy and Main Door intent | Waiting (C-11, Q6) | |

## 5.5 Custom Portal

| # | Requirement | Status | Where it stands, next action |
|---|---|---|---|
| R-22 | Custom diamond request form with the details a dealer's customer wants | To do | Live form fields are mapped in CONTEXT.md |
| R-23 | Proposed: live diamond preview updating with shape, size and color (demo first) | To do | Build the demo for approval (A5) |

## 5.6 Inquiries and Contact

| # | Requirement | Status | Where it stands, next action |
|---|---|---|---|
| R-24 | Contact form with an inquiry type selector routing to the right person, automatic acknowledgement | Partial | Contact drawer has the topic selector and validation; build the page, routing and the acknowledgement email (C-14 for the sending domain) |

## 5.7 Retailer Dashboard

| # | Requirement | Status | Where it stands, next action |
|---|---|---|---|
| R-25 | Reorder an exact previous item in a couple of clicks | To do | Orders are kept in the preview; build order history with Reorder |
| R-26 | Trade show appointments | Waiting (Q9) | Request form or time-slot booking |
| R-27 | Payment methods managed by the dealer (invoice payment in Phase 2) | To do | |
| R-28 | Open memo items report from existing data | To do | Live memo table mapped (memo date, memo number, stock number, price, shape, size, cut, color, clarity) |
| R-29 | Dashboard search integrates Surreal's existing search | Waiting (C-06) | Build the search screens now |
| R-30 | Whole logged-in experience personalized, WB Mason style | Partial | Header account menu, dealer homepage band, dealer pricing notes, cart and checkout know the store |
| R-31 | Remaining subpages (about 10) | Waiting (Q5) | Live dashboard has 15 tiles, mapped in CONTEXT.md |

## 5.8 Admin console

| # | Requirement | Status | Where it stands, next action |
|---|---|---|---|
| R-32 | Full inventory view | To do | |
| R-33 | Feature or toggle any product to the top of any page, including hot deal items | To do | |
| R-34 | Admin-defined default sort per page; customers can still re-sort | To do | Store already re-sorts client side |
| R-35 | Manage banners, featured area, metal color options, content pages, users and roles per the access matrix | To do | |

## 6. Rules across the site

| # | Rule | Status | Where it stands, next action |
|---|---|---|---|
| B-01 | Every stone is one of a kind; gone from availability the moment an order completes | To do | With R-18 |
| B-02 | An article never shows a metal color it does not exist in | Done | With R-12 |
| B-03 | Each dealer's logged-in experience reflects their own account and history | Partial | Preview session; real accounts with the auth service |
| B-04 | Access by roles, no approval step | To do | Roles below; page access from C-05 |
| B-05 | Card, ACH and wire, through Surreal's existing card processor | Partial / Waiting (Q2, Q3, C-10) | Checkout offers credit or debit card, ACH and wire only; check and Zelle stay offline on the dashboard's Payment Methods page; the processor connects once named |
| B-06 | Out-of-stock display rule | Waiting (Q1) | |

## 4. Roles

| Role | Status |
|---|---|
| Administrator, Accounts / Finance, HR, Sales, Manager | To do (admin console, access matrix C-05) |
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
| M1 Scope lock and architecture baseline: screen list, data model, working environments | End of build week 2 | To do |
| M2 Design approval: design system and ten key screens | End of build week 4 | Ahead: design system and most key screens exist as working pages (list in TASKS.md) |
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
| C-11 | Legacy, Main Door and About content | No |
| C-12 | Nominated decision-maker | No |
| C-13 | Read access to the current site, export of dealer organizations and users | No |
| C-14 | Domain, DNS and email-sending domain control | No |
| C-15 | Two named testers for the final two weeks | No |

The build-start clock begins when C-01 to C-05 arrive.
