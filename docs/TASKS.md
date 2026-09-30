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
- [~] Map the live Retailer Dashboard subpages (Ajay signs in, we read)
- [ ] Verified facts and team added to `src/content/site.ts`
- [ ] Catalog divisions extended to the 16 live entries
- [ ] Mock auth: signed-out and signed-in dealer states, route gating with return to the requested page
- [ ] Shared commerce state: cart store, bag count, dealer pricing from a mock price list
- [ ] Route stubs for every Phase 1 page so no header or footer link 404s

## 1. Homepage revamp

- [ ] Confirm the section list in CONTEXT.md, "Homepage plan"
- [ ] Two-tier header: search, signed-out utilities (Log in, Become a dealer), signed-in utilities (store name menu, cart), division row, sticky collapse
- [ ] Mega menu on the Tanishq pattern: group rail (Types, Collections, Programs), link grid with thumbnails, promo strip, editorial card
- [ ] Hero banner carousel
- [ ] Grower proof strip
- [ ] Collections bento
- [ ] Shop by division grid
- [ ] Programs: Made to Order, Legacy, Custom
- [ ] Featured items
- [ ] Turntable stories carousel
- [ ] Why Surreal for your store (dealer benefits) with Apply
- [ ] Experience grid
- [ ] Signed-in dealer bar
- [ ] Footer rebuilt with the new columns
- [ ] Retire old chapters no longer used once replaced
- [ ] Mobile, reduced motion and Lighthouse passes

## 2. Main Door and accounts

- [ ] `/login`: log in, forgot password, Apply panel
- [ ] `/apply`: dealer application (live fields), pending approval state
- [?] Main Door form confirmed with the client (open question 1)

## 3. Cart and checkout (dealer)

- [ ] Mini cart popover from the cart icon
- [ ] Add to cart from product cards, quick view and product detail
- [ ] `/cart`: line items (image, style number, metal, carat, size, quantity, remove, note), order summary at dealer price, trust badges, sticky total bar
- [ ] Empty cart state
- [ ] `/checkout`: Store details, Payment, Review, Confirmation
- [?] Payment provider and methods (open question 3)
- [ ] Memo request path where the program allows

## 4. Jewelry (dealer)

- [ ] Jewelry landing on the Tanishq listing pattern (breadcrumb, count, filter and sort bar, inline "find your match" panel)
- [ ] 16 division pages
- [ ] Product detail `/jewelry/[division]/[product]`: gallery with turntable, sticky action bar, details accordions, similar designs
- [ ] Jewelry order form (bulk by style number)

## 5. Diamond Search (dealer)

- [ ] Search: shape, carat, color, clarity, cut filters, list and grid, compare, call stones
- [ ] Stone detail `/diamonds/[id]`
- [ ] Made to Order request flow `/diamonds/made-to-order`
- [ ] Mock feed with the RightClick record shape
- [?] RightClick and supplier feeds (parked until the meeting)

## 6. Public content pages

- [ ] Diamond Legacy `/legacy` (story public, ordering gated)
- [ ] Custom Portal `/custom` (story public, portal gated)
- [ ] Contact `/contact`: contact, schedule an appointment, feedback, become a dealer, testimonial
- [ ] About `/about` and Team `/about/team`
- [ ] Terms and Privacy

## 7. Retailer Dashboard (dealer)

- [ ] Subpages as mapped from the live dashboard
- [ ] Personalized dealer experience: pricing tier, greeting, saved searches, memo, orders, reorder

## 8. Admin console (staff)

- [ ] `/admin`: dealer applications and approval, users, roles and logins, pricing tiers, territories, orders and payments, memo, custom orders, inquiries, content, feed status

## 9. Integrations and launch

- [?] RightClick inventory API and supplier stone feeds
- [?] Payment provider
- [?] Email or CRM for inquiries and applications
- [ ] SEO for public pages only (dealer pages noindex), sitemap
- [ ] Analytics
- [ ] Final QA and handover
