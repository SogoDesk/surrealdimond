# Surreal Diamond, Phase 1 task list

Scope and reference notes live in [CONTEXT.md](CONTEXT.md). Mark items `[x]` when built, verified in the browser at desktop and phone widths, and committed.

Status key: `[ ]` to do, `[~]` in progress, `[x]` done, `[?]` blocked on the client.

## 0. Groundwork

- [x] Design system (tokens, type, palette, logo, components) exported as a kit
- [x] Shop pages at `/jewelry` and `/jewelry/[category]` with filters, quick view, card selectors
- [x] Project context and task list (this file)
- [x] Header and footer trimmed to the Phase 1 page list
- [x] Remove the 3D opening diamond (three, R3F and drei dependencies, model file)
- [x] Remove the pointer light behind the cursor
- [ ] Shared commerce state: cart store (client side, persisted), wishlist, bag count in the header
- [ ] Route stubs for every Phase 1 page so no header or footer link 404s

## 1. Homepage revamp

- [ ] Confirm the section list in CONTEXT.md, "Homepage plan"
- [ ] Two-tier header: search field with rotating placeholder, utility icons, division row, sticky collapse on scroll
- [ ] Mega menu rebuilt on the Tanishq pattern: facet rail, link grid with thumbnails, promo strip, editorial card
- [ ] Hero banner carousel (web banners, peeking neighbours, dots, autoplay, swipe)
- [ ] Collections bento
- [ ] Shop by division grid with View all tile
- [ ] Diamond Search entry with shape picker and Made to Order card
- [ ] Worlds 2 by 2 photography tiles
- [ ] New arrivals band with overlapping product cards
- [ ] Turntable stories carousel
- [ ] Assurance badges (verified claims only)
- [ ] Programs pair: Diamond Legacy and Custom Portal
- [ ] Experience grid
- [ ] Footer rebuilt as the dark rounded panel with the new columns
- [ ] Retire old chapters no longer used (TimeCounter, Engagement pin, Lookbook, Foreveryone, Education) once replaced
- [ ] Mobile pass, reduced motion pass, Lighthouse pass

## 2. Cart

- [ ] Mini cart popover from the bag icon (items, subtotal, View cart, Checkout or Request)
- [ ] Add to bag from product cards and quick view, bag count badge
- [ ] Cart page `/cart`: line items (image, name, metal, carat, size, quantity, remove, gift note), order summary, promo code field, trust badges, sticky total bar on mobile
- [ ] Empty cart state with Continue shopping
- [?] Prices and checkout: payment in Phase 1 or order request (open question 4 and 5)
- [ ] You may also like row under the cart

## 3. Jewelry

- [ ] Jewelry landing refreshed to the Tanishq listing pattern (breadcrumb, count, filter and sort bar, inline "find your match" panel)
- [?] Division list to about 15 (open question 2)
- [ ] Product detail `/jewelry/[division]/[product]`: gallery with turntable, sticky action bar (metal, carat, size, add to bag), details accordions, similar designs, assurance
- [ ] Wishlist

## 4. Diamond Search

- [ ] Search page: shape, carat, color, clarity, cut filters, list and grid views, compare
- [ ] Stone detail `/diamonds/[id]`
- [ ] Made to Order entry `/diamonds/made-to-order`: request flow
- [?] Data source: RightClick connection and supplier feeds (open question 6); mock feed until then

## 5. Content pages

- [ ] Diamond Legacy `/legacy`
- [ ] Custom Portal `/custom`: brief, uploads, CAD review, approvals, tracking
- [ ] Inquiries and Contact `/contact`: topic form, visit booking, office and map
- [ ] About Us and Company History `/about`
- [?] Main Door `/main-door` (open question 1)
- [ ] Terms and Privacy pages

## 6. Retailer Dashboard

- [ ] Sign in `/login` with roles
- [?] Subpage list (open question 3); working set: overview, inventory search, saved searches, memo, orders, invoices, custom orders, marketing assets, account and users, support
- [ ] Personalized dealer experience: tier pricing, greeting, saved searches, history

## 7. Admin console

- [ ] `/admin`: users, roles and logins, retailer accounts, inventory and feed status, inquiries, custom orders, content

## 8. Integrations and launch

- [?] RightClick inventory API and supplier stone feeds
- [?] Email or CRM for inquiries (open question 8)
- [ ] SEO: metadata, sitemap, structured data for products
- [ ] Analytics
- [ ] Final QA and handover
