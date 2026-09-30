# Surreal Diamond, project context

The working brief for the Phase 1 build. Read this before any task in [TASKS.md](TASKS.md). The visual language (palette, type, motion, components) is defined in [DESIGN.md](../DESIGN.md) and the exported design system kit; this file covers scope, structure and the UX reference.

## The client

Surreal Diamond (surrealdiamond.com), wordmark "SURREAL by JB Bhanderi". A lab-grown CVD diamond grower that sells loose stones and finished jewelry, to consumers and to retailers. North American office at 551 Fifth Avenue, Suite 2601, New York, NY 10176, (844) 999-7262, Monday to Friday 9:30am to 6pm EST.

Verified claims only (source: `src/content/site.ts`): largest lab diamond grower in the world, CVD grown, DEF color, VVS clarity, 1.5 billion years to weeks, Made to Order, Diamond Legacy, custom jewelry with an in-house CAD department, retailer dashboard. Never add prices, a founding year, certifications or a facility location unless the client supplies them.

## Phase 1 scope

The eight-page structure Surreal provided, plus the systems behind it.

| # | Page | Route | Notes |
|---|---|---|---|
| 1 | Homepage | `/` | Revamp in progress, see "Homepage plan" |
| 2 | Diamond Search | `/diamonds` | Loose stone search fed by RightClick and supplier feeds. Made to Order is an entry inside this page, at `/diamonds/made-to-order` |
| 3 | Diamond Legacy | `/legacy` | The Legacy program page |
| 4 | Jewelry | `/jewelry`, `/jewelry/[division]` | Landing plus about 15 division pages. Product detail at `/jewelry/[division]/[product]` |
| 5 | Custom Portal | `/custom` | Brief, inspiration upload, CAD review and approvals, order tracking |
| 6 | Inquiries and Contact | `/contact` | Inquiry form by topic, visit booking, office details. The contact drawer stays as the quick path |
| 7 | About Us, Company History | `/about` | Company story and history timeline |
| 7a | Main Door | `/main-door` (working route) | Requested in the client meeting. Purpose to confirm, see open questions |
| 8 | Retailer Dashboard | `/dashboard/*` | About 10 subpages behind a retailer login |

Commerce pages the scope implies (the cart was requested with the homepage revamp):

| Page | Route | Notes |
|---|---|---|
| Cart | `/cart` | Full cart page plus a mini cart popover from the bag icon |
| Stone detail | `/diamonds/[id]` | Result page for a single loose stone |
| Sign in | `/login` | Shared entry for retailers and staff; roles decide where they land |
| Legal | `/terms`, `/privacy` | Required, kept in the footer |

Systems (no public page of their own):

- RightClick inventory connection and supplier stone feeds, powering Diamond Search and the retailer inventory views.
- Admin console for Surreal staff at `/admin/*`: users, roles and logins, retailer accounts, inventory and feed status, inquiries, custom orders, content.
- Personalized dealer experience: signed-in retailers see their own pricing tier, saved searches, memo and order history, and a greeting in the header.

### Removed from the site

These existed in the earlier homepage concept and are out of Phase 1. Remove them from the header, footer, mega menu and homepage links:

- Education pages (`/education/*`: why CVD, history, diamond guide, FAQ) and the homepage Education chapter
- Journal (`/journal`) and Our Team (`/company/team`)
- Engagement as a top-level nav item (it becomes a jewelry division)
- Made to Order as a standalone page (it lives inside Diamond Search)
- `/company` (replaced by `/about`)
- The 3D opening diamond and the pointer light behind the cursor

## Navigation

Header (desktop), left to right:

- Logo (line mark and wordmark), home
- Primary: Jewelry (opens the mega menu), Diamonds, Legacy, Custom, About, Contact
- Utility: Search diamonds, Retailers (sign in, then the dashboard), Book a visit (opens the contact drawer), Bag with count (opens the mini cart)

Footer columns:

- Jewelry: the divisions
- Diamonds: Diamond Search, Made to Order, Diamond Legacy
- Surreal: About Us, Company History, Custom Portal, Inquiries and Contact
- Trade: Retailer Dashboard, Become a Retailer
- Legal row: Terms and Conditions, Privacy Policy

The header will move to the two-tier Tanishq pattern during the homepage revamp (see below). The link set stays as listed.

## Jewelry divisions

Eight exist in `src/content/catalog.ts`: Engagement Rings, Wedding Bands, Earrings, Necklaces, Pendants, Rings, Bracelets, Sterling Silver. The client says about 15. Proposed additions from the render library, to confirm: Eternity Bands, Stud Earrings, Hoop Earrings, Tennis Necklaces, Tennis Bracelets, Bangles, Men's. Divisions are data driven (`/jewelry/[division]` with `generateStaticParams`), so adding one is a catalog entry.

## UX reference: tanishq.co.in

The client picked Tanishq as the reference for components and positioning (home, store, cart). We borrow its structure and commerce patterns, not its look: everything is rendered in our design system (porcelain, ink, sky; Italiana, Cormorant Garamond, Jost; hairlines, pill buttons, white render tiles). Notes from the study on 30 Sept 2026:

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

- Prices are not verified, so price text, price filters and budget chips appear only where the client supplies prices, or for signed-in retailers. Until then cards show metal and carat selectors, and the cart shows an "Inquire" or "Request pricing" path alongside the order summary layout.
- Tanishq's gold rate and exchange programs map to Surreal's programs: Made to Order, Diamond Legacy, Custom, and For the trade.
- Their brand world tiles map to Engagement, Bridal and bands, Everyday, and Sterling Silver, using the editorial photography.
- Styling stories map to the turntable videos (five MP4s) and the social banners.
- Assurance badges map to verified claims only: CVD grown, DEF color, VVS clarity, ethically made, in-house CAD.
- Experience grid maps to Visit New York, Book an appointment, Talk to an expert, Custom Portal, Retailer Dashboard, Diamond Legacy.

## Homepage plan

Built in the design system, with calm motion: Lenis smooth scroll stays, reveals and image wipes stay, no WebGL, no cursor effects, no long pinned scroll stages. Sections, in order:

1. Hero banner carousel: the eight web banners (3:1, logo in the artwork), peeking neighbours, dots, autoplay with pause on hover.
2. Collections bento: one tall editorial photograph plus two stacked tiles.
3. Shop by division: square white render tiles, last tile "View all".
4. Diamond Search entry: shape picker and a Made to Order card, leading into `/diamonds`.
5. Worlds: 2 by 2 photography tiles.
6. New arrivals: banner band with overlapping product cards (the existing ProductCard).
7. Turntable stories: video card carousel.
8. Assurance: brand line plus verified claim badges.
9. Programs: Diamond Legacy and Custom Portal cards side by side.
10. Experience grid: Visit, Book, Talk to an expert, Custom, Retailers, Legacy.
11. Footer.

The final section list is confirmed before build.

## Open questions for the client

1. The Main Door page: what it is for. Working assumption, a gateway that splits shoppers from the trade (Shop the collection or Enter as a retailer).
2. The full list of about 15 jewelry divisions.
3. Retailer Dashboard: the list of about 10 subpages. Working assumption: overview, inventory search, saved searches, memo, orders, invoices, custom orders, marketing assets, account and users, support.
4. Prices: shown to consumers, to retailers only, or on request.
5. Checkout: does the consumer cart take payment in Phase 1, or does it submit an order request.
6. RightClick: API access, credentials process and feed format; which supplier feeds and how often.
7. Shape list for Diamond Search, and the carat ranges (current values are placeholders).
8. Email provider or CRM for inquiries.
9. Diamond model credit is no longer needed once the 3D stone is removed.

## Working rules

- Commits by Ganapathi-AJ only, short one-line messages, no tool or assistant mentions, no co-author lines.
- No em dashes in copy or comments. American spelling in the UI (jewelry, color).
- Every page respects `prefers-reduced-motion` and keeps visible focus styles.
- Verify each change in the browser at desktop and phone widths before committing.
