# Surreal Diamond, project context

The working brief for the Phase 1 build. Read this before any task in [TASKS.md](TASKS.md). The visual language (palette, type, motion, components) is defined in [DESIGN.md](../DESIGN.md) and the exported design system kit; this file covers the business, scope, structure and the UX reference.

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
| 8 | Retailer Dashboard | `/dashboard/*` | Dealer | About 10 subpages, mapped from the live dashboard (pending) |

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

- Payments for dealer orders on our site. Provider and methods to confirm (card, ACH, net terms, memo).
- RightClick inventory connection and supplier stone feeds: **parked** until the team meets RightClick. Diamond Search runs on a mock feed with the same shape until then.
- Admin console for Surreal staff at `/admin/*`: dealer applications and approval, users, roles and logins, dealer accounts and pricing tiers, territories, inventory and feed status, orders and payments, memo, custom orders, inquiries, content.
- Personalized dealer experience: dealer pricing tier, greeting, saved searches, memo, order history, reorder, recommended items.

## Jewelry divisions

The live site's jewelry menu, 16 entries:

| Group | Divisions |
|---|---|
| Types | Engagement Rings, Wedding Bands, Rings, Stud Earrings, Earrings, Bracelets, Flexi Bangles, Pendants, Necklaces |
| Collections | Constellation Collection, Enamour Enamel, Laser Pierced, Vermeil Collection, Sterling Silver |
| Programs | 2026 Holiday Catalog, 2026 Flyer Program |

Live URLs use type and sub_type filters (`/jewelry/?type=earrings&sub_type=studs`); the new site gives each division its own route under `/jewelry/[division]`, all data driven. The live Diamonds menu also holds the Jewelry Order Form, Made to Order and Diamond Legacy.

## Removed from the site

- Education pages (why CVD, history, CVD explained, FAQ, diamond guide) and the blog: live today, not in the Phase 1 list
- Engagement as a top-level nav item (it is a jewelry division)
- Made to Order as a standalone top-level page (it lives inside Diamond Search)
- Consumer language: "Shop", consumer prices, "Book a visit" as a shopper appointment
- The 3D opening diamond and the pointer light behind the cursor

## Navigation

Header, left to right:

- Logo, home
- Primary: Jewelry (mega menu with the 16 divisions), Diamonds (Diamond Search, Made to Order, Legacy, Jewelry order form), Legacy, Custom, About, Contact
- Utility, signed out: Search, Log in, Become a dealer (primary pill)
- Utility, signed in: Search, the dealer's store name with an account menu (Dashboard, Orders, Saved searches, Log out), Cart with count

Footer columns: Jewelry; Diamonds (Diamond Search, Made to Order, Diamond Legacy); Surreal (Our Story, Our Team, Custom Portal); Contact (Contact Us, Schedule an Appointment, We Want to Hear From You, Become a Dealer); plus the office block and the legal row. The live Instagram link points to a placeholder account; ask for the real handle.

## UX reference: tanishq.co.in

The reference for components and positioning (home, store, cart). Tanishq is a consumer store and Surreal is B2B, so we borrow its structure and commerce patterns for the dealer experience, not its audience or its look: everything is rendered in our design system (porcelain, ink, sky; Italiana, Cormorant Garamond, Jost; hairlines, pill buttons, white render tiles). Notes from the study on 30 Sept 2026:

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

Public by default, personalized for a signed-in dealer. Built in the design system with calm motion: Lenis stays, reveals and image wipes stay, no WebGL, no cursor effects, no long pinned stages.

1. Hero banner carousel: the eight web banners, peeking neighbours, dots, autoplay. CTAs: Become a dealer, Log in (signed in: Shop new arrivals).
2. Grower proof strip: largest CVD grower, own machines and recipe, DEF and VVS, up to 15 carats.
3. Collections bento: Constellation, Enamour Enamel, Laser Pierced, Vermeil.
4. Shop by division: square white render tiles, last tile View all. Signed out, tiles lead to Log in.
5. Programs: Made to Order, Legacy, Custom (the three live homepage stories, redesigned).
6. Featured items: the live homepage's featured earrings as product cards (no prices signed out).
7. Turntable stories carousel.
8. Why Surreal for your store: the dealer benefits as a badge grid, with Apply.
9. Experience grid: Schedule an appointment, Talk to us, Custom Portal, Legacy, Retailer Dashboard, Our Story.
10. Footer.

Signed in, a dealer bar sits under the hero: greeting with the store name, open orders, memo count, saved searches, Reorder.

## Open questions for the client

1. Main Door: confirm it is the public trade entrance (pitch, Log in, Apply) and whether it replaces the homepage for signed-out visitors or is its own page.
2. Retailer Dashboard subpages: being mapped from the live dashboard.
3. Payment provider and dealer payment methods (card, ACH, net terms), and whether memo orders skip payment.
4. Dealer pricing: one price list or tiers per dealer; shown on every card or only in the cart.
5. RightClick: parked until the meeting. Supplier feeds: which suppliers, format and frequency.
6. Shape list and carat ranges for Diamond Search.
7. Email provider or CRM for inquiries and applications.
8. The real Instagram handle.
9. Whether the education pages and blog move to Phase 2 or are dropped.

## Working rules

- Commits by Ganapathi-AJ only, short one-line messages, no tool or assistant mentions, no co-author lines.
- No em dashes in copy or comments. American spelling in the UI (jewelry, color).
- Every page respects `prefers-reduced-motion` and keeps visible focus styles.
- Verify each change in the browser at desktop and phone widths before committing.
