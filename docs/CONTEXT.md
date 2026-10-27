# Surreal Diamond, project context

The working brief for the Phase 1 build. Read this before any task in [TASKS.md](TASKS.md); requirement by requirement status is in [CHECKLIST.md](CHECKLIST.md). The visual language (palette, type, motion, components) is defined in [DESIGN.md](../DESIGN.md) and the exported design system kit; this file covers the business, scope, structure and the UX reference.

## The BRD is the source of truth

The Business Requirements Document v1.1 (draft for sign-off, 18 September 2026) sets the agreed scope. **We are building Phase 1 only.** Where anything below disagrees with the BRD, the BRD wins; the checklist records each numbered requirement (R-01 to R-35, rules B-01 to B-06) and its status.

- **Phase 1:** the complete website and dealer web application replacing the current Think Space site: shop, diamond page, content pages, custom portal, retailer dashboard, admin console, and the RightClick inventory connection with supplier stone feeds, so live inventory is on the site at launch.
- **Phase 2 (not ours now):** Enterprise Level Integration (accounting, payment settlement, further supplier or marketplace feeds).
- **Brought into Phase 1 (client feedback, 27 October 2026, subject to feasibility):** the invoicing and payment portal modelled on the WB Mason customer portal: open invoices, outstanding payments (total and past due, aging colors, pay one, several or all), statement, and invoice and memo reconciliation. Feasibility: RightClick returns each customer's balance with aging, open invoices and statement, so the screens can run on real data; it has no call to record a payment, so payments taken on the site go through Surreal's card processor (C-10) and finance posts the cash receipt in RightClick, after which the next sync clears "pending posting". Built on sample data at `/dashboard/invoices` until then.
- **Out of scope by agreement:** the education section, a separate order approval workflow (roles replace it), and everything on the old platform not listed, including blog, gift cards, gift registry, promotions and white-label embeds. **Deferred:** credit lines (Q12).
- **Timeline:** build starts one to two weeks after the inputs C-01 to C-05 arrive and runs twelve weeks. Milestones: M1 scope lock and architecture baseline (week 2), M2 design approval of the design system and ten key screens (week 4), M3 feature complete on staging for UAT, code freeze (week 10), M4 go-live with handover documentation and runbook (week 12). Each milestone is signed off within three working days. Design includes two revision rounds; each testing cycle includes one.
- **Cadence:** weekly meetings until the build starts, then every two weeks, each a working demo.
- **Assumptions that shape the build:** products load and are managed in the admin console with bulk upload, before and alongside RightClick (A1); English and USD only (A2); Surreal supplies photography and copy (A3); supporting services (login and security, content management, email delivery, hosting) are established managed services, not custom built (A7); platform subscriptions are held in Surreal's own name (A9).

### Roles (BRD section 4)

| Role | Who | In one line |
|---|---|---|
| Administrator | Surreal staff managing the site | Full control of products, content, featuring, users |
| Accounts / Finance | Surreal finance staff | Orders, invoices, payment records |
| HR | Surreal staff | Access per the matrix |
| Sales | Surreal sales staff | Dealer accounts and their activity |
| Manager | Per the matrix | Access per the matrix |
| Dealer | Dealer account owner or manager | Orders, memo, payment methods, their team |
| Dealer Associate | Dealer staff | Browse, search, order per their permissions |
| Public visitor | Anyone | Marketing pages, no ordering |

There is no approval step for orders: what a person can do is set by their role (B-04). The page access for each role comes from Surreal (C-05). The BRD recommends a named login per administrator rather than a shared one (Q10).

### Rules across the site (BRD section 6)

- B-01: every stone is one of a kind and leaves availability the moment an order completes.
- B-02: an article never shows a metal color it does not exist in.
- B-03: each dealer's logged-in experience reflects their own account and history.
- B-04: access by roles, not an approval step.
- B-05: dealers pay by credit or debit card, ACH or wire, through Surreal's existing card processor.
- B-06: the out-of-stock display rule is pending (Q1).

### Where the BRD changes our earlier plans

- **Ordering from Quick View (R-10):** set aside for now by decision (30 Sept 2026). Ordering stays on the product page and the card's Add to cart.
- **Metals (R-12, B-02, R-13):** only the metals an article exists in are offered, one default image per article, and a `defaultMetal` per article for Surreal's yellow gold picks (C-02). Done 30 Sept 2026.
- **Payment (B-05):** card, ACH and wire only at checkout; check and Zelle stay offline on the dashboard's Payment Methods page. Done 30 Sept 2026.
- **RightClick is Phase 1:** the provider supplies stock, memo and invoicing data through the RightClick API (CFI's reference, 15 July 2026, confidential). The sync approach and interval feasibility are in RIGHTCLICK.md; access for the site (API user, key, serial, allow-listed address) is still to come (C-07).
- **Homepage:** a "Hot this week" featured area controlled from admin (R-03), one strong image per category (R-04), and a personalized homepage for signed-in dealers with greeting, recent items and quick reorder in the WB Mason style (R-08).
- **Diamond page:** one line per stone in the Nivoda style dealers already like (R-14), with Quick View, quick filters and columns from Surreal's lists (C-03, C-04).
- **Custom Portal:** the custom diamond request form (R-22), plus a proposed live diamond preview that is included only if its demo is approved (R-23, A5).

### Integrations (BRD section 7)

| System | Purpose | Status |
|---|---|---|
| RightClick | Stock, memo and invoicing data | Provider confirmed; call being scheduled (C-07) |
| Surreal's existing search | Search in the dashboard and site | Nia to advise; screens proceed now (C-06) |
| Card processor (existing) | Card payments, ACH and wire alongside | Name and contact needed (C-10, Q2, Q3) |
| Supplier stone feeds | Supplier stones, refreshed about every 30 minutes | Details per supplier |
| Think Space (current site) | Content and data during changeover | Extract as needed (C-13) |

## The business: B2B only

Surreal Diamond (surrealdiamond.com), wordmark "SURREAL by JB Bhanderi", is a lab-grown CVD diamond grower that sells loose diamonds and finished jewelry **to retailers only**. The live site states "We will never sell directly to consumers". Every shopper on the new site is a dealer (a jewelry store); consumers only ever meet Surreal through those stores.

What that means for the build:

- **Public side** (no login): the brand, the programs, company and team, contact, and the dealer pitch with Apply and Log in. No prices, no cart.
- **Dealer side** (after login): the jewelry catalog, Diamond Search, Made to Order, Legacy and Custom ordering, dealer pricing, cart, **payment on our site**, orders and the Retailer Dashboard. This is where the Tanishq style store and cart live.
- Every catalog, diamond and program page redirects a signed-out visitor to Log in, with the Apply panel beside it, exactly as the live site does.

North American office: 551 Fifth Avenue, Suite 2601, New York, NY 10176, (844) 999-7262, Monday to Friday 9:30am to 6pm EST, closed weekends.

## Verified facts

From `src/content/site.ts` and the live site (read 30 Sept 2026). Never add prices, a founding year, certifications or a facility location unless the client supplies them.

- Largest lab diamond grower in the world; the largest CVD grower on planet Earth. Grows primarily DEF color, VVS clarity. The world's most transparent diamond material. Surreal manufactures its own CVD machines and created its growing recipe.
- 1.5 billion years to just weeks, from inception to final inspection. Diamonds grown with high technology, jewelry handcrafted by the finest craftspeople.
- Mission: democratize diamonds so they can truly be foreveryone; a compassionate, sustainable, inclusive jewelry industry. Environmentally responsible, ethically made, identical to a mined diamond.
- "If a Diamond is Forever, Surreal Diamond is the New Forever."
- Made to Order (M2O): a diamond grown to the dealer's exact specification, carat weight and shape.
- LEGACY by Surreal: every diamond in a collection grown from the same seed line, for milestones such as a push present, an anniversary or a future engagement.
- Custom jewelry: a state of the art CAD department that can make just about any jewelry item.
- Dealer benefits: globally competitive direct-from-the-grower pricing; comprehensive brand strategy; digital marketing support positioning the dealer as a grower; exclusive dealer territories; a large scale, individually curated loose diamond memo program; dynamic price adjustments on standing memo items; immediate replenishment of sold items; larger stones up to 15 carats; a curated diamond feed of 10,000 to 15,000 call stones; branding, display, marketing and dual tier advertising support; sales training for associates; spiff incentives; shared aggregated sales data.
- Team: Jitu Surani (Co-Chairman), Shubham Surani (Chief Executive Officer), Aaditya Surani (Vice President), Ruten Bhanderi (Executive Director), Linda Pike (Director of Customer Experience).

## Phase 1 scope

The eight-page structure Surreal provided, plus the systems behind it. "Public" pages are open; "Dealer" pages need a login.

| # | Page | Route | Access | Notes |
|---|---|---|---|---|
| 1 | Homepage | `/` | Public, personalized when signed in | Brand showcase and dealer entry. Signed-in dealers also see their greeting, recent orders and shortcuts |
| 2 | Diamond Search | `/diamonds` | Dealer | Loose stone search with dealer pricing and call stones. Made to Order entry at `/diamonds/made-to-order` |
| 3 | Diamond Legacy | `/legacy` | Public story, dealer ordering | Program story public; starting a Legacy order needs a login |
| 4 | Jewelry | `/jewelry`, `/jewelry/[division]` | Dealer | Landing plus 16 divisions (below). Product detail `/jewelry/[division]/[product]` |
| 5 | Custom Portal | `/custom` | Public story, dealer portal | Brief, uploads, CAD review, approvals, tracking |
| 6 | Inquiries and Contact | `/contact` | Public | Contact, schedule an appointment, feedback, become a dealer, testimonial |
| 7 | About Us, Company History | `/about`, `/about/team` | Public | Our story, mission, team |
| 7a | Main Door | `/` for signed-out visitors, plus `/login` | Public | The front door for the trade: the dealer pitch with Log in and Apply. Working interpretation, since the business is B2B only; confirm the exact form with the client |
| 8 | Retailer Dashboard | `/dashboard/*` | Dealer | Confirmed in the BRD: reorder in a couple of clicks (R-25), trade show appointments (R-26), payment methods managed by the dealer (R-27), open memo items report (R-28), search on Surreal's existing search (R-29), personalized throughout (R-30). The rest of the roughly 10 subpages come from Q5; the live dashboard's 15 tiles are mapped below |

Account and commerce pages:

| Page | Route | Access | Notes |
|---|---|---|---|
| Log in | `/login` | Public | Email and password, forgot password, Apply panel with the four headline dealer benefits |
| Apply for an account | `/apply` | Public | Live fields: email, password, confirm; first name, last name, store phone; store name, address, city, state, zip. Applications await staff approval |
| Cart | `/cart` | Dealer | Mini cart popover plus the full page |
| Checkout | `/checkout` | Dealer | Live steps: Cart, Store Details, Review, Confirmation. New: a Payment step on our site |
| Jewelry order form | `/jewelry/order-form` | Dealer | Exists on the live site; bulk ordering by style number |
| Stone detail | `/diamonds/[id]` | Dealer | Single loose stone |
| Legal | `/terms`, `/privacy` | Public | Footer |

Systems (no page of their own):

- Payments for dealer orders: card, ACH and wire through Surreal's existing processor (B-05); whether Buy Now takes payment in Phase 1 or orders go on invoice until Phase 2 is Q2.
- RightClick inventory connection and supplier stone feeds: Phase 1. The provider call is being scheduled (C-07); until the feed is connected the diamond page runs on a sample feed with the same shape.
- Admin console for Surreal staff at `/admin/*`: dealer applications and approval, users, roles and logins, dealer accounts and pricing tiers, territories, inventory and feed status, orders and payments, memo, custom orders, inquiries, content.
- Personalized dealer experience: dealer pricing tier, greeting, saved searches, memo, order history, reorder, recommended items.

## The live dealer side (read 30 Sept 2026, signed in)

The current site runs on the Thinkspace jewelry platform. Signed-in dealers see the same header plus Account, Cart and Log out, a banner "Order before 4:00pm EST to receive next day delivery", and "Customer Service: Mon to Fri, 9:30am to 6pm EST".

### Retailer Dashboard (`/dashboard/`)

Intro: resources to help the dealer promote the Surreal brand in their market. Fifteen tiles, each with an icon, title and one line:

| # | Tile | Live route | What it holds | New route |
|---|---|---|---|---|
| 1 | My Open Memo Items | `/diamonds/memo/` | Memo reconciliation: table of on-hand long-term memo (LTM) diamonds and jewelry (Sold?, memo date, memo number, stock number, price, shape, size, cut, color, clarity), prices updated daily; form to report sales, confirm the list is accurate or note discrepancies | `/dashboard/memo` |
| 2 | Start Your Diamond Search | `/diamonds/` | Diamond Search | `/diamonds` |
| 3 | M2O Order Form | `/form/custom-diamond-order-form/` | Your name, company, customer name for the booklet, phone, email, exact size, shape, length to width ratio, girdle inscription, notes | `/diamonds/made-to-order` |
| 4 | Legacy Program and Order Form | `/diamonds/diamond-legacy/` | Link to the list of Legacy diamonds, then call or complete the order form | `/legacy/order` |
| 5 | SPIF Program | `/dashboard/spif-program/` | Sales incentives for store associates on a Jewelry Rewards cash debit card; associates register, store managers approve, monthly loads on qualifying sales | `/dashboard/spif` |
| 6 | Marketing Programs and Resources | `/dashboard/social-media-program/` | "We're a Grower" campaign video, digital brand assets (logo, product images), television and video content | `/dashboard/marketing` |
| 7 | Surreal Catalog and Flyer Programs | `/dashboard/surreal-catalog-flyer-programs/` | Turn-key catalog and flyer mailings by year (holiday flyer, Christmas catalog, postcards) | `/dashboard/catalogs` |
| 8 | Social Media Resource Center | `/dashboard/social-media-resources/` | Weekly auto-published social content through the JewelPost Network, free sign-up | `/dashboard/social` |
| 9 | Training Videos | `/surreal-university/` | Surreal University: "Seven Steps to Making the Proactive Sale" and training videos | `/dashboard/university` |
| 10 | Website Solutions | `/dashboard/website-solutions/` | Getting the Surreal diamond feed and catalog onto the dealer's own site (direct feeds for Thinkspace and Punchmark sites, embeds), data and embed request form | `/dashboard/website` |
| 11 | Trade Show Appointments | `/dashboard/trade-show-schedule/` | Show dates and attendance (empty today) | `/dashboard/trade-shows` |
| 12 | Payment Methods | `/dashboard/payment-methods/` | Check, ACH or wire, credit card, Zelle, to keep the account current | `/dashboard/payments` |
| 13 | Authorized Users | `/team/` | Store team table: name, email, role, permissions; add and remove members | `/dashboard/team` |
| 14 | Policies and Processes | `/terms-and-conditions/` | The small print | `/dashboard/policies` |
| 15 | Account Settings | `/account/settings/` | Full name, email, phone, password | `/dashboard/account` |

Plus a feedback line linking to We Want to Hear From You. New pages the dealer experience needs on top of these: Orders and invoices (`/dashboard/orders`), Saved searches, and a dashboard overview with the dealer's numbers.

### Diamond Search (dealer)

- Note at the top: all prices shown are for Asset (purchase); short-term memo pricing by phone.
- Filters: shape (Round, Oval, Pear, Emerald, Princess, Radiant, Cushion, Marquise, Asscher, Heart), price range, carat range, color (D to K) range, cut, clarity (FL to SI2), polish and symmetry (Ideal to Fair) ranges, fluorescence (None to Very Strong), certificate lab (GCAL, IGI).
- Results table: Compare, shape, size, color, clarity, Memo PPC, Asset PPC, Memo price, Asset price, cut, polish, symmetry, measurements, lab, table percent, depth percent. Default sort is off Rap ascending.

### Jewelry catalog (dealer)

- 375 items. Listing: sort (Featured, Newest, Name), page size (24, 48, 72, 96), filter rail by product type and subtype (for earrings: diamond jackets, drops and dangles, fashion, halo, hearts, hoops and huggies, huggies, pave, studs), style, collection and material (14K white, yellow and rose gold, enamel, sterling silver, yellow sterling silver).
- Product page: name and style number, quality line (for example Color E to F, Clarity VVS to VS, certificates on request for a fee), dealer price, metal and total carat weight options, quantity, special instructions, Add to Cart, Ask a Question, share, Drop a Hint, print.
- Checkout steps: Cart, Store Details, Review, Confirmation.

### Programs (dealer)

- Made to Order: exclusively for Surreal dealers. Any shape in any carat weight or dimensions. Under 4 carats FG+ color and VS+ clarity; over 4 carats G+ color and VS+ clarity. Every stone has an IGI certificate and a brochure with nine visual touchpoints. Priced as a fixed program fee plus the stone.
- Legacy: list of Legacy diamonds; FAQ (shapes, growing two at once, timing, whether the seed is returned, color and clarity, growing larger than the original); the SEED time capsule; priced as a fixed program fee.
- Custom Orders: request form (active account or new; company and location; contact; in-store delivery deadline; PO number; style number; CAD requested; item type ring, pendant, earring, bracelet or bangle, other; metal 14K, 18K or platinum; gold color or two tone; center stone shape and size; finger size; matching bands; image uploads). Diamond quality F+ and VS+ on all custom items.

### Admin (Thinkspace, the baseline for our staff console)

| Area | Modules |
|---|---|
| Shop | Orders, Carts, Order Transactions, Point of Sale, Price Rules, Price List, Promotional Codes, Tax Classes, Financing Terms, Gift Cards, Warranties, Currencies, Exchange Rates, Shipping Carriers, Shipping Costs, Shipping Emails |
| Catalog | Products, Brands, Collections, Departments, Types, Subtypes, Styles, Categories, Variant Options and Values, Product Feeds, Product Imports |
| Inbox | Email responses, Appointments, Career responses, Webhook responses |
| Diamonds | Diamonds, Certifiers, Diamond Markups, Lab Grown Markups, grading tables (clarity, color, cut, fluorescence, fancy colors) |
| Content | Pages, Menus, FAQ, Media, Slideshows, Page Redirects |
| Blog | Posts, Categories, Tags |
| Company | Store Locations, Employees, Corporate Contacts, Testimonials, Career Postings, Organizations, Embeds, Sales Incentives |
| Forms | Forms, Notifications, System Emails, Newsletters, Webhooks |
| Users | Users, User Groups, Wishlists |
| Settings | Website, Commerce, Catalog, Diamond, Email, Analytics, Social, User Accounts, Vendor |

Phase 1 console, proposed: Dealers (applications and approval, stores, authorized users, pricing groups, territories), Orders and payments, Memo, Catalog and imports, Diamonds and markups (feed status for RightClick later), Program requests (M2O, Legacy, Custom), Inbox (forms and appointments), Content (banners, pages), Marketing resources for the dashboard, Staff users and roles.

## Jewelry divisions

The BRD counts about 15 division pages; the final names are Q4. The live menu below has 16 entries.

The live site's jewelry menu, 16 entries:

| Group | Divisions |
|---|---|
| Types | Engagement Rings, Wedding Bands, Rings, Stud Earrings, Earrings, Bracelets, Flexi Bangles, Pendants, Necklaces |
| Collections | Constellation Collection, Enamour Enamel, Laser Pierced, Vermeil Collection, Sterling Silver |
| Programs | 2026 Holiday Catalog, 2026 Flyer Program |

Live URLs use type and sub_type filters (`/jewelry/?type=earrings&sub_type=studs`); the new site gives each division its own route under `/jewelry/[division]`, all data driven. The live Diamonds menu also holds the Jewelry Order Form, Made to Order and Diamond Legacy.

## Removed from the site

- Education pages and section (why CVD, history, CVD explained, FAQ, diamond guide): out by agreement (R-07)
- Blog, gift cards, gift registry, promotions, white-label embeds: out by agreement
- A separate order approval workflow: roles replace it
- Credit lines: deferred (Q12)
- Engagement as a top-level nav item (it is a jewelry division)
- Consumer language: "Shop", consumer prices, "Book a visit" as a shopper appointment
- The 3D opening diamond and the pointer light behind the cursor (R-06)

## Navigation

Header, left to right:

- Logo, home
- Primary: Jewelry (mega menu with the 16 divisions), Diamonds (Diamond Search, Made to Order, Legacy, Jewelry order form), Legacy, Custom, About, Contact
- Utility, signed out: Search, Log in, Become a dealer (primary pill)
- Utility, signed in: Search, the dealer's store name with an account menu (Dashboard, Orders, Saved searches, Log out), Cart with count

Footer columns: Jewelry; Diamonds (Diamond Search, Made to Order, Diamond Legacy); Surreal (Our Story, Our Team, Custom Portal); Contact (Contact Us, Schedule an Appointment, We Want to Hear From You, Become a Dealer); plus the office block and the legal row. The live Instagram link points to a placeholder account; ask for the real handle.

## UX reference: tanishq.co.in

The reference for components and positioning (home, store, cart). Tanishq is a consumer store and Surreal is B2B, so we borrow its structure and commerce patterns for the dealer experience, not its audience or its look: everything is rendered in our design system (porcelain, ink, sky; Urbanist as the primary font since October 2026, Italiana for display figures; hairlines, pill buttons, white render tiles). Notes from the study on 30 Sept 2026:

**Header.** Two tiers. Top row: logo left, a wide rounded search field centred with rotating placeholder text ("Search for diamond jewellery", "Search for engagement rings"), icons right (store, wishlist, account, cart with count badge). Second row: category links with small line icons, each opening a full-width mega panel with a left rail of facets (Category, Price, Occasion, Gender), a three-column grid of links with round thumbnails, a promo strip with a View All button, and an editorial image card on the right. Sticky; the second row collapses on scroll.

**Homepage order.**
1. Hero banner carousel: rounded full-width slides with the neighbours peeking at the edges, dot pagination under it.
2. Collections bento: one tall tile left, two stacked tiles right, title set on the image.
3. A promotional program band (their gold rate lock) as a framed card.
4. Shop by category: a 4 by 2 grid of square tiles with captions under them, the last tile a "10+ categories, View all" card.
5. Trending now: three wide image cards with captions.
6. Brand world: a 2 by 2 grid of lifestyle photographs (Wedding, Diamond, Gold, Dailywear) with a colour scrim and the label on the image.
7. New arrivals: a banner band with a count chip, product cards overlapping its lower edge.
8. Styling stories: a centred vertical video card carousel with the product chip inside each story.
9. Assurance: brand title left, three icon badges right, then a row of four trust badges.
10. Curated for you: three large portrait tiles (Women, Men, Kids).
11. Two program cards side by side (Gift of Choice, Exchange).
12. Experience grid: 3 by 2 image tiles (Visit our store, Book an appointment, Talk to an expert, Digital gold, Blogs, Jewellery guide).
13. Footer.

**Listing.** Breadcrumb, title with result count, Filter button left and Sort right, three-column product grid with wishlist hearts, name and price under a light grey image well, scarcity note. After the first row an inline "Find your perfect match, faster" panel with tabs (Price, Brand, Gender), range chips and an Apply button.

**Product.** Centred title and price, a two-up image gallery, and a sticky bottom action bar with price, size and weight selectors and Add to Cart. Below: availability check, program bands, a Jewellery Details section with Product Details and Price Breakup tabs and accordions (metal, diamond, general, description) beside the SKU image, find in store, you may also like with All and Similar tabs, reviews, budget chips, assurance.

**Mini cart.** A popover under the bag icon: "Your Mini Cart (1 item)", line item with thumbnail, weight and size, subtotal, View Cart and Quick Checkout buttons. The header Add to Cart turns into Go to Cart.

**Cart page.** Two columns. Left: delivery details (country and postcode check), line item cards (thumbnail, price, name, size and weight, quantity, remove, add a gift message), then three trust badges (purity, secure delivery, secure payment). Right: a sign in for rewards banner, Order Summary with a promo code accordion, subtotal, discount, delivery, total and savings. A sticky bottom bar with the total and Proceed to Checkout. Empty state: an illustrated bag, "Your cart is empty", Continue Shopping and Log in buttons.

**Footer.** A dark rounded panel: logo, app download, Useful Links, Information, Contact Us and Chat, social icons, payment marks, copyright and legal links.

### How it maps to Surreal

- The Tanishq store, product and cart patterns become the **dealer** store. Prices shown are the signed-in dealer's prices; nothing is priced on the public side.
- Signed-out visitors who click any product, diamond or division land on Log in with Apply beside it, and return to the page they wanted after signing in.
- Tanishq's program bands (gold rate, exchange) map to Made to Order, Legacy, Custom and the memo program.
- Brand world tiles map to Engagement, Bands, Everyday and the collections (Constellation, Enamour Enamel, Laser Pierced, Vermeil, Sterling Silver).
- Styling stories map to the turntable videos and the social banners.
- Assurance badges map to verified facts only: largest CVD grower, grows its own machines and recipe, DEF color and VVS clarity, stones up to 15 carats, in-house CAD.
- The experience grid maps to Schedule an appointment, Talk to your account manager, Custom Portal, Legacy, Become a dealer, Retailer Dashboard.
- Tanishq's cart becomes a dealer cart: line items with style number, metal, carat, size and quantity; store details (ship to the store); order summary with dealer pricing; Payment; Review; Confirmation. A memo request can sit beside Buy where the program allows.

## Homepage plan

The chapter homepage of commit 9e31102, which the client asked to have back (October 2026), re-voiced for dealers who already know Surreal and joined to the commerce sections built since. Lenis smooth scroll, GSAP reveals and scrubbed hand-offs; no WebGL, no 3D stone, no cursor effects. The header follows each chapter's ground (ThemeSync). About 15.6 screens at 1440 by 900 (the old one ran 21.4).

1. Hero (dark): the SURREAL wordmark over the ring film; Search diamonds and Retailer Dashboard when signed in, Dealer log in and Become a dealer otherwise.
2. Time (dark, short pin): the counter from 1.5 billion years to weeks beside a drawn CVD growth sequence, with the grower proof figures.
3. Dealer band (signed in only): greeting, quick doors, quick reorder, recently viewed.
4. Engagement: the circle opens into the turntable ring, shapes with live stock from the diamond feed, solitaire settings.
5. Collections bento: Constellation, Enamour Enamel, Laser Pierced, Vermeil, Sterling Silver.
6. Nine ways to begin: carousel of the nine types (one campaign photograph each, render on hover), loose diamonds, all divisions.
7. Banner carousel: the client's web banners (managed in the console).
8. Hot this week: the console's list, with dealer prices when signed in.
9. Lookbook, held while Foreveryone (dark) rises over it.
10. Visit New York.
11. For the trade (sky): the pitch and the twelve-point dealer program, then the footer.

Sections 5 to 7 sink and dim as the next slides over them. The console's pop-up banner opens over the page after a delay.

## Open questions for the client

From the BRD (section 10), to be answered with the sign-off or at the next meeting:

1. Q1: should out-of-stock items automatically show a 5 to 6 week order lead time?
2. Q2: in Phase 1, does Buy Now take payment at checkout, or place the order with payment on invoice until the Phase 2 portal?
3. Q3: which card processor, and does it also handle ACH?
4. Q4: the final names of the 15 jewelry divisions.
5. Q5: the final list of the roughly 10 Retailer Dashboard subpages, beyond the four confirmed features.
6. Q6: what the Diamond Legacy and Main Door pages should each contain.
7. Q7: does the made-to-order request live on the diamond page or as its own page?
8. Q8: can visitors see prices before logging in, or are prices for dealers only? Answered (October 2026): dealers only, in US dollars. The figures are a sample list until Surreal's arrives.
9. Q9: trade show appointments: a request form, or real time-slot booking?
10. Q10: a named login per administrator instead of one shared login?
11. Q11: resale or exemption paperwork stored per dealer for tax purposes?
12. Q12: when to revisit credit lines, before or after Phase 2?

Ours, not in the BRD:

- The real Instagram handle (the live footer links to a placeholder account).
- Whether the reference numbers shown on product pages (taken from the render file names, e.g. LE2004W442) are Surreal's style numbers.
- Whether the product page stays alongside Quick View (R-10). Settled: both stay; Quick View orders, the product page holds full details.

## Working rules

- Commits by Ganapathi-AJ only, short one-line messages, no tool or assistant mentions, no co-author lines.
- No em dashes in copy or comments. American spelling in the UI (jewelry, color).
- Every page respects `prefers-reduced-motion` and keeps visible focus styles.
- Verify each change in the browser at desktop and phone widths before committing.
