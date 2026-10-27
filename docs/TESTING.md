# Role testing and customer migration

Client feedback of 27 October 2026 (F-E3): test every role with dummy dealer and console accounts before any live customer data is moved. This file lists the test accounts, the test plan with its latest results, and the steps for moving the live customers.

All accounts below are invented. Every email uses the reserved `.example` domain, so nothing can be sent to a real person. The accounts live in `src/content/testAccounts.ts` and are seeded into the preview's customer list the first time it loads. Remove that file and the seeding in `src/lib/customers.ts` before real accounts go live.

## Test accounts

### Dealers (storefront and Retailer Dashboard, at /login)

On the log in page, Use beside an account fills in its email and password. Password for the active dealer accounts: `Surreal-Preview-2026` (a test value; it unlocks nothing outside the preview).

| Person | Store, account code | Role | Starts as | Use it to test |
|---|---|---|---|---|
| Maria Chen, maria@harborfine.example | Harbor Fine Jewelers, HFJ-001 | Owner | Active | Orders, memo, invoices and payments, payment methods, password change |
| Sam Ortiz, sam@harborfine.example | Harbor Fine Jewelers, HFJ-001 | Associate | Active | Orders and memo without billing; the lockout |
| Priya Shah, priya@lakesidediamond.example | Lakeside Diamond Co., LDC-014 | Owner | Setup link sent | A migrated customer whose link is waiting; Forgot password |
| Tom Becker, tom@westgatejewelers.example | Westgate Jewelers, WGJ-022 | Owner | Not invited | A migrated customer logging in for the first time |

The demo dealer (Explore as the demo dealer on the log in page) stays for walkthroughs; it has no password.

### Console staff (at /admin)

One named account per role. The preview signs in without a password; the access each role gets is the matrix in `src/content/admin.ts`.

| Person | Role |
|---|---|
| Alex Rivera, alex.admin@surreal.example | Administrator |
| Jordan Lee, jordan.finance@surreal.example | Accounts / Finance |
| Casey Morgan, casey.hr@surreal.example | HR |
| Riley Brooks, riley.sales@surreal.example | Sales |
| Taylor Kim, taylor.manager@surreal.example | Manager |

## Test plan and results

Run on 27 October 2026 against the local preview, in Chromium at 1440 px and 390 px, each group in a fresh browser profile. All passed, with no console errors.

### Dealer sign in and password setup

| # | Account | Steps | Expected | Result |
|---|---|---|---|---|
| T-01 | Visitor | Click Retailer Dashboard in the header | Log in page, returning to the dashboard after | Pass |
| T-02 | Any | Log in with an email that has no account | "We could not find a dealer account", with Apply and the office phone | Pass |
| T-03 | Maria | Log in with a wrong password | "Does not match", 4 tries left before a 15 minute lock | Pass |
| T-04 | Maria | Log in with the right password | Dashboard; session is Owner on HFJ-001 | Pass |
| T-05 | Sam | Five wrong passwords, then the right one | Locked for 15 minutes; the right password is refused while locked | Pass |
| T-06 | Tom | Log in with any password | "Set up your password"; Email me a setup link | Pass |
| T-07 | Tom | Open the link, try `westgate123` | Weak; the rules show what is missing (length, case, store name); not saved | Pass |
| T-08 | Tom | Set a password meeting every rule, confirm it | Signed in to the dashboard; Tom is Active in the console | Pass |
| T-09 | Tom | Open the same link again | "This link has been used" | Pass |
| T-10 | Priya | Forgot password; then expire the link (forced in the test) | New link; once expired, "This link has expired" with Send a new link | Pass |
| T-11 | Any | Forgot password with an unknown email | The same "link is on its way" message, no link (does not reveal which emails have accounts) | Pass |
| T-12 | Maria | Account settings: change the password | Changed; the new password logs in | Pass |
| T-13 | Maria | Account settings | Details, account code, role, people on the account (Maria and Sam) | Pass |
| T-14 | Sam | Dashboard navigation; open Invoices | No Billing group; Invoices says billing is with the account owner | Pass |
| T-15 | Maria | Invoices: pay two by card, reconcile, open an invoice | Balance falls by the amount paid, reconciliation number issued, printable invoice | Pass |
| T-16 | Tom | Set up on a phone (390 px) | Fits the screen, no sideways scroll | Pass |

### Console roles

| # | Account | Staff and roles | Dealers | Inventory | Result |
|---|---|---|---|---|---|
| T-20 | Alex, Administrator | Edit | Edit | Edit | Pass |
| T-21 | Jordan, Finance | Locked | View only (no Import, buttons off) | View only | Pass |
| T-22 | Casey, HR | Edit | Locked | Locked | Pass |
| T-23 | Riley, Sales | Locked | Edit | Edit | Pass |
| T-24 | Taylor, Manager | View only | Edit | Edit | Pass |

### Customer import (signed in as Riley, Sales)

| # | Steps | Expected | Result |
|---|---|---|---|
| T-30 | Import customers, Try it with a sample file | Columns matched from the export's own names (E-mail, Store Name, Customer Code, User Type) | Pass |
| T-31 | Check the 8 rows | 4 new, 1 update (Maria, password kept), 3 skipped: a bad email, a repeated email, a missing company; "Manager" read as Owner, noted | Pass |
| T-32 | Download the skipped rows | CSV of the skipped rows with the reason | Pass |
| T-33 | Import with setup links on | 4 added, 1 updated, 3 skipped, 4 links listed | Pass |
| T-34 | Import the Excel template filled with 3 rows | 2 new, 1 skipped; phone numbers formatted, state upper-cased | Pass |
| T-35 | Import a CSV saved with semicolons and a byte order mark | Read and matched | Pass |
| T-36 | Choose a PDF | "Choose an Excel workbook (.xlsx) or a CSV file" | Pass |
| T-37 | Send setup links to all not invited | One link per customer, listed | Pass |
| T-38 | Open a link from the console | Set your password, for that customer and account code | Pass |
| T-39 | Import history | Each import with the file, counts, who and when | Pass |

## Moving the live customers

1. Get the customer list: the current site's dealer organizations and users (C-13) and RightClick's customer list with account codes. Put them in the template (`/templates/surreal-dealer-import.xlsx`, also under Dealers, Import customers), one row per person who logs in.
2. Dry run on the staging site: import, read the Check rows step, fix the skipped rows in Excel, and import again. Rows are matched on email, so re-importing updates rather than duplicates.
3. Have a few friendly dealers set their passwords from their links and confirm their orders, memo and invoices look right.
4. Import on the live site with setup links off, then send links in batches so questions can be handled as they arrive. Customers who do not use their link in 72 hours can still log in with their email: the log in page offers a fresh link.
5. Watch the Dealers counts (Active, Setup link sent, Not invited) and resend where needed.
6. Remove the test accounts (see the top of this file).

## What changes in production

The preview keeps everything in the browser so it can be reviewed without a server. In production:

- Passwords and sessions move to the sign-in service (docs/ARCHITECTURE.md). The rules stay: at least 12 characters, upper and lower case, a number, not the email or store name; 5 wrong tries lock for 15 minutes.
- Setup links are emailed by the email service (C-14). Only a hash of each token is stored, as now; links last 72 hours and work once.
- Customers and the import history live in the database, and the import runs on the server, so every admin sees the same list.
- The log in page tells a visitor when an email has no account, which is friendlier for dealers moving over. If Surreal prefers not to reveal that, it can show the same neutral message Forgot password uses.
