# Surreal Diamond, Phase 1 task list

Scope and reference notes live in [CONTEXT.md](CONTEXT.md). The business is B2B only: public pages sell the brand to retailers, everything with a price sits behind the dealer login. Mark items `[x]` when built, verified in the browser at desktop and phone widths, and committed.

Status key: `[ ]` to do, `[~]` in progress, `[x]` done, `[?]` blocked on the client.

## 0. Groundwork

- [x] Design system (tokens, type, palette, logo, components) exported as a kit
- [x] Shop pages at `/jewelry` and `/jewelry/[category]` with filters, quick view, card selectors (to be moved behind the login)
- [x] Project context and task list
- [x] Header and footer trimmed to the Phase 1 page list
- [x] Remove the 3D opening diamond (three, R3F and drei dependencies, model file)
- [x] Remove the pointer light behind the cursor
- [x] Study the live site: B2B only, 16 jewelry divisions, login gating, checkout steps, forms, verified facts
- [x] Map the live Retailer Dashboard (15 tiles), dealer Diamond Search, catalog, program forms and the Thinkspace admin
- [x] Verified facts and team added to `src/content/site.ts`
- [x] Divisions data for the 16 live entries (`src/content/divisions.ts`); the 8 without a grid yet open a dealer holding page
- [ ] Mock auth: signed-out and signed-in dealer states, route gating with return to the requested page
- [ ] Shared commerce state: cart store, bag count, dealer pricing from a mock price list
- [x] Holding pages for every Phase 1 route (`GatePage`: dealer login for gated routes, in design for public ones)

## 1. Homepage revamp

- [x] Confirm the section list in CONTEXT.md, "Homepage plan"
- [x] Two-tier header: search with rotating prompts, appointments, Log in, Become a dealer, cart, link row that folds on scroll
- [ ] Signed-in header utilities (store name menu) once mock auth exists
- [x] Mega menu on the Tanishq pattern: group rail (Types, Collections, Programs), link grid with thumbnails, promo strip, editorial card
- [x] Hero banner carousel
- [x] Grower proof strip
- [x] Collections bento
- [x] Shop by division grid
- [x] Programs: Made to Order, Legacy, Custom
- [x] Featured items
- [x] Turntable stories carousel
- [x] Why Surreal for your store (dealer benefits) with Apply
- [x] Experience grid
- [ ] Signed-in dealer bar (needs mock auth)
- [ ] Footer rebuilt with the new columns
- [x] Retire old chapters no longer used once replaced
- [ ] Mobile, reduced motion and Lighthouse passes

## 2. Main Door and accounts

- [ ] `/login`: log in, forgot password, Apply panel
- [ ] `/apply`: dealer application (live fields), pending approval state
- [?] Main Door form confirmed with the client (open question 1)

## 3. Cart and checkout (dealer)

- [ ] Mini cart popover from the cart icon
- [ ] Add to cart from product cards and the product page (after auth)
- [ ] `/cart`: line items (image, style number, metal, carat, size, quantity, remove, note), order summary at dealer price, trust badges, sticky total bar
- [ ] Empty cart state
- [ ] `/checkout`: Store details, Payment, Review, Confirmation; next day delivery cutoff note (order before 4:00pm EST)
- [?] Online payment provider for card and ACH (open question 3); check, wire and Zelle shown as offline options
- [ ] Memo request path where the program allows

## 4. Jewelry (dealer)

- [x] Store listing (`components/store`): breadcrumb, title with count, dealer pricing note, round division rail, sticky toolbar (Filters, Metal, Center stone, 4/5/6 per row, Sort), filter chips, compact cards with metal and carat selectors and wishlist, find your match panel, Made to Order tile, Load more, filter drawer
- [ ] 16 division pages
- [ ] Listing filters from the live catalog once the full 375 piece catalog is imported: type and subtype, style, collection, material; sort Newest
- [x] Product page `/jewelry/[category]/[product]` for every piece: two-up gallery with the turntable, reference from the render file name, dealer price box, metal, total carat weight, ring size, quantity, special instructions, Log in to add to cart, Ask a question, share, wishlist, service notes, details cards, similar designs, sticky action bar
- [~] Wishlist: saved in this browser for now (`useWishlist`); moves to the dealer account with auth
- [ ] Jewelry order form (bulk by style number)

## 5. Diamond Search (dealer)

- [ ] Search: 10 shapes, price, carat, color, cut, clarity, polish, symmetry, fluorescence, lab (GCAL, IGI); results with Memo and Asset PPC and price, measurements, table and depth; compare; sort off Rap
- [ ] Stone detail `/diamonds/[id]`
- [ ] Made to Order request flow `/diamonds/made-to-order` (live M2O fields)
- [ ] Legacy list and order form `/legacy/order`
- [ ] Mock feed with the RightClick record shape
- [?] RightClick and supplier feeds (parked until the meeting)

## 6. Public content pages

- [ ] Diamond Legacy `/legacy` (story public, ordering gated)
- [ ] Custom Portal `/custom` (story public, portal gated)
- [ ] Contact `/contact`: contact, schedule an appointment, feedback, become a dealer, testimonial
- [ ] About `/about` and Team `/about/team`
- [ ] Terms and Privacy

## 7. Retailer Dashboard (dealer)

- [ ] Dashboard overview: greeting, open orders, memo count, saved searches, tiles
- [ ] Memo reconciliation `/dashboard/memo` (table, report sales, confirm, notes)
- [ ] Orders and invoices `/dashboard/orders`, reorder
- [ ] SPIF program `/dashboard/spif`
- [ ] Marketing programs and resources `/dashboard/marketing`
- [ ] Catalog and flyer programs `/dashboard/catalogs`
- [ ] Social media resource center `/dashboard/social`
- [ ] Surreal University `/dashboard/university`
- [ ] Website solutions `/dashboard/website` (feed and embed request)
- [ ] Trade show appointments `/dashboard/trade-shows`
- [ ] Payment methods `/dashboard/payments`
- [ ] Authorized users `/dashboard/team` (store roles and permissions)
- [ ] Policies and processes `/dashboard/policies`
- [ ] Account settings `/dashboard/account`
- [ ] Saved searches

## 8. Admin console (staff)

- [ ] Dealers: applications and approval, stores, authorized users, pricing groups, territories
- [ ] Orders, payments and shipping
- [ ] Memo records
- [ ] Catalog and product imports
- [ ] Diamonds and markups (feed status later)
- [ ] Program requests: M2O, Legacy, Custom
- [ ] Inbox: forms and appointments
- [ ] Content: banners, pages, dashboard resources
- [ ] Staff users and roles
- [?] Migration from Thinkspace (open question 2)

## 9. Integrations and launch

- [?] RightClick inventory API and supplier stone feeds
- [?] Payment provider
- [?] Email or CRM for inquiries and applications
- [ ] SEO for public pages only (dealer pages noindex), sitemap
- [ ] Analytics
- [ ] Final QA and handover
