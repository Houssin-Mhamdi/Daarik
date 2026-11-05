# Daarik — Stripe Connect configuration & Netherlands limitations

**Status:** pre-implementation report. No payment code has been changed yet.
**Date:** 30 October 2026
**Scope:** NL-only marketplace, EUR, pickup only, one cook per checkout.
**Sources:** Stripe Connect docs (charges, destination vs. separate charges/transfers, MoR, Accounts v2, required verification information), Stripe NL pricing pages, Stripe NL requirement API (`platformCountry=NL`, `accountCountry=NL`, `individual`, `dashboard=none`, capabilities `card_payments` + `transfers` + `ideal_payments`).

---

## 1. Recommended configuration (summary)

| Decision | Recommendation |
| --- | --- |
| Charge type | **Separate charges & transfers** — PaymentIntent on the Daarik platform account, one `Transfer` per order to the cook, created only when the order becomes payout-eligible |
| Settlement merchant / MoR | **Cook** (`on_behalf_of` = connected account) — matches "the cook is the food seller"; **requires your sign-off, see §3** |
| Account API | **Accounts v2** for account creation & onboarding; **Accounts v1** for payout settings (v2 cannot manage payouts) |
| Controller | `dashboard = "none"`, `fees_collector = "application"`, `losses_collector = "application"` |
| Requirement collection | **Stripe-hosted onboarding** (Account Link / embedded component) |
| Entity type | `individual` (eenmanszaak or private person) |
| Capabilities | `card_payments`, `transfers`, `ideal_payments` (+ `bancontact_payments` **only** if Bancontact stays) |
| Country | `NL` only for MVP; reject other countries at creation |
| Stripe processing fees | Paid by **Daarik** out of commission + service fee |
| Earnings release | Per order, after `order.COMPLETED` + hold period + cook eligibility |
| Bank payout | Stripe automatic payout **weekly**, anchor configurable by admin |
| Cook dashboard | **None** — My Earnings in Daarik is the only UI |
| Webhook signing | `STRIPE_WEBHOOK_SECRET`, raw body, idempotent event log |

---

## 2. Why separate charges & transfers, not destination charges

Both are viable; the requirement set decides it.

| | Destination charges | Separate charges & transfers |
| --- | --- | --- |
| Where money lands after payment | Immediately on the cook's Stripe balance | Daarik's **Stripe platform balance**, until we transfer |
| Can we hold earnings until order completion? | **No** — transfer is immediate and cannot be delayed per order | **Yes** — `Transfer` is a separate API call |
| Refund/dispute before release | Must claw back from the cook (`reverse_transfer`) | Simply hold / never transfer |
| Who eats a failed clawback | Daarik | Daarik (but exposure is far smaller) |
| Custody | None | Funds sit in a **Stripe** balance (not Daarik's bank account) |
| Complexity | Low | Medium (one Transfer per order, idempotency, reconciliation) |

**Decisive point:** the spec says *"do not release earnings before the configured payout-eligibility status"* and requires both `transfer.*` **and** `payout.*` webhooks, plus My Earnings with pending vs. available. Destination charges cannot express "release later" per order. Separate charges & transfers can, and the two-level model maps cleanly onto the webhooks you asked for:

- **Transfer** = Daarik releases a specific order's earnings to the cook's Stripe balance.
- **Payout** = Stripe moves the cook's Stripe balance to their IBAN (weekly).

> ⚠️ **Critical operational rule.** With separate charges & transfers the money sits in Daarik's Stripe balance until we transfer it. If the platform account keeps automatic payouts to Daarik's business IBAN, Stripe will sweep those funds into Daarik's ordinary bank account — exactly the custody model you ruled out. **Daarik's own platform payout schedule must be set to `manual`** (or a hard minimum balance must be maintained), and transfers must be created with `source_transaction` so they are satisfied by the original charge.
> Source: Stripe — "Automatic payouts can interfere with transfers that don't have a defined `source_transaction`."

`source_transaction` also removes a class of failures: the transfer request succeeds even if the charge hasn't settled yet, but funds only land when the charge's funds are available. Each transfer is capped by the source charge amount and inherits its pending status.

**Destination charges would be the right answer if** you decide earnings are released at payment and only the *bank payout* is gated. That is simpler and involves no platform balance. It is the fallback option if you want the smallest possible operational surface.

---

## 3. Merchant of record — the one decision I need from you

MoR is a **business/legal determination**, not a Stripe setting. Stripe configures the *settlement merchant* to match it. Card-network rules require the MoR's identity on the customer's statement.

**Option A — Cook is MoR (recommended, matches "the cook is the food seller")**
- `on_behalf_of` = `acct_...` on the PaymentIntent; cook's statement descriptor is shown.
- Customer buys from the cook; Daarik is the intermediary earning commission.
- Consistent with the existing product (cook profile, cook name, cook reviews, cook pickup).
- Consequences: Daarik must show the cook's legal/trading name at checkout and on receipts; **each cook is responsible for their own VAT and food-law obligations**; Daarik invoices the cook for commission + service fee (21% BTW on the service).

**Option B — Daarik is MoR**
- No `on_behalf_of`; Daarik's descriptor is shown.
- Daarik is the seller of the food. Food-safety, allergen, labelling, and consumer-recourse obligations land on Daarik, and every cook becomes a supplier that must invoice Daarik.
- Operationally simpler, legally heavier. Only pick this if Daarik is prepared to act as the food seller.

**Recommendation: A.** It is the only option consistent with the rest of the product. But confirm with your accountant — if Daarik is MoR, the VAT treatment (9% food vs. 21% service) and the invoicing flow change completely.

Note: `on_behalf_of` requires the cook to hold a payments capability (`card_payments`), which they do. It also settles the charge in the cook's country/currency — irrelevant while everyone is NL/EUR, but it becomes mandatory if a cook is ever outside NL.

---

## 4. Money flow and exact arithmetic

Current backend logic (`orders.service.ts`) is already structurally correct but uses `Float` and `toFixed(2)`. Replace with **integer cents everywhere**.

```
subtotalCents   = Σ(unitPriceCents × qty)          // server-side, from DB
commissionCents = round(subtotalCents × rate) + fixedCents   // HALF_UP
serviceFeeCents = configured service fee
totalCents      = subtotalCents + serviceFeeCents
cookNetCents    = subtotalCents − commissionCents  // never < 0
platformFeeCents= totalCents − cookNetCents         // = commission + service fee
```

`Transfer.amount = cookNetCents` (NOT `total − commission`), because the customer service fee belongs to Daarik, not the cook.

### Worked example (iDEAL, 15% commission, €1.50 service fee)

| Line | Cents | EUR |
| --- | --- | --- |
| Food subtotal | 2350 | 23.50 |
| Service fee (customer) | 150 | 1.50 |
| **Customer pays** | **2500** | **25.00** |
| Commission 15% of subtotal (rounded) | 353 | 3.53 |
| **Cook receives** | **1997** | **19.97** |
| Daarik gross | 503 | 5.03 |
| Stripe iDEAL fee | −29 | −0.29 |
| **Daarik net** | **474** | **4.74** |

### Card instead of iDEAL
Stripe fee = 1.5% + €0.25 → 0.375 + 0.25 = **€0.625** (round up to the cent when deducting). Daarik net = €4.41 on the same order.

### Two things to decide that the current schema hides
1. **Double-dipping:** today Daarik takes *both* the €1.50 customer service fee *and* the 15% commission — a ~20% effective take rate. Confirm this is intended; otherwise drop one.
2. **Commission base:** on subtotal (recommended, fair to cooks) or on total? The brief's "€25 − 15% = €21.25" example implies *total*, which would double-charge the service fee. I recommend **subtotal**.

---

## 5. Who pays Stripe's processing fee — recommendation: Daarik

Under separate charges & transfers, Stripe fees are always debited from **Daarik's** balance at charge time. You cannot make the cook pay them directly at that moment; the only lever is *how much you transfer*.

- **Recommended:** Daarik absorbs the processing fee out of commission + service fee. Cooks see a clean "subtotal − commission" number, and My Earnings matches the order page. This is also the only approach that is *exactly* correct, because the real fee depends on card type (1.5% EEA standard, 2.8% EEA premium, 2.5% UK, 3.15% international) and cannot be known before capture.
- **Not recommended:** deducting an estimated fee from the cook's transfer. It is always slightly wrong, it is hard to explain, and it invites disputes. If you must pass fees on, do it as an explicit **pricing rule** (e.g. higher commission), not as a variable deduction.

Keep it as an admin setting (`stripeFeeBearer = PLATFORM | COOK_ESTIMATE`) but ship `PLATFORM`.

**Economic floor:** with a €2/active-account/month Connect fee plus 0.25% + €0.10 per payout, very small orders are thin. On a €10 order at 15% commission the gross take is €1.50 and the card fee is €0.625 — viable, but a €6 order is not. Consider a **fixed commission component** (`commissionFixedCents`, already in your spec) and/or a minimum order value.

---

## 6. Netherlands-specific findings

### 6.1 What NL supports (no blocker)
- Individual connected accounts: **supported**.
- Dashboard types: `full`, `express`, **`none`** — `none` is available for NL.
- Capabilities include `card_payments`, `transfers`, `ideal_payments`, `bancontact_payments`.
- Payouts: EUR to a Dutch IBAN (18 chars, e.g. `NL39RABO0300065264`), **minimum €1**.
- Settlement timing NL: **7 calendar days** for the first payout, **T+3 business days** thereafter.
- Payout schedule: daily / weekly / monthly / manual; weekly anchor is settable per account.
- Instant Payouts: NL is in the eligible country list (€0.40 min, €9,999 max, 10/day, 1% fee, eligibility gated). **Do not build the MVP around this** — treat it as a later opt-in feature.

### 6.2 What Stripe will demand from each cook (dashboard `none`, NL individual)
Collected **inside Stripe-hosted onboarding**, never stored by Daarik:
- Legal first/last name, date of birth, residential address (line1, postal code, city), phone, email
- `business_profile.mcc` + `business_profile.url` (the cook's Daarik storefront URL works)
- ID document + **proof of liveness** (Stripe Identity; €1.25 per completed verification, billed to the platform)
- **BSN** (`identity.individual.id_numbers.nl_bsn`, surfaced as "Tax information")
- External IBAN in the cook's own name
- Terms-of-service acceptance (IP + timestamp)

Practical consequences:
- **BSN is unavoidable.** Explain this in the NL onboarding copy, or cooks will abandon. It is also why iDEAL is coupled to a tax ID for sole proprietors.
- **IBAN must be in the cook's own name.** Third-party/parent/spouse IBANs fail verification. Budget support time for this.
- **~5–15% of cooks will need manual document review**, which takes days. Gate ordering on `payouts_enabled`, not on "onboarding started".

### 6.3 Dashboard `none` is irreversible
`dashboard` cannot be changed after account creation. If a cook later needs a Stripe dashboard (e.g. to download payout statements), you must create a **new connected account** and lose history. Mitigation: Daarik must generate downloadable payout statements and an annual summary in My Earnings. Decide `none` now — this report assumes it.

### 6.4 Fees that will actually hit Daarik (NL pricing, Oct 2026)
| Item | Cost |
| --- | --- |
| iDEAL | €0.29 / payment |
| EEA standard card | 1.5% + €0.25 |
| EEA premium card | 2.8% + €0.25 |
| UK card | 2.5% + €0.25 |
| International card | 3.15% + €0.25 |
| Chargeback (received or contested) | €20.00 |
| Connect, platform owns pricing | **€2 / active account / month** + **0.25% + €0.10 per payout** |
| Stripe Identity verification | €1.25 |
| Instant Payout | 1% (min €0.40 in euro area) |

"Active account" = any month in which a payout was sent to the cook's bank. So a cook who sells once a month still costs €2 that month. Confirm the exact Connect tier with Stripe before go-live — the €2 + per-payout tier applies to platforms that set their own pricing and absorb Stripe fees, which is this design.

### 6.5 iDEAL is a strategic advantage
iDEAL is a push payment: **no chargebacks**. Card payments carry the €20 dispute fee and clawback risk. For a homemade-food marketplace with no delivery proof, recommend **iDEAL as default and cards as a secondary option**, and consider disabling cards entirely for the first cohort.

### 6.6 Refunds and disputes are asymmetric
- Refund the charge → **the transfer is not reversed automatically**. Daarik must call `transfers.reverse` (or net it against future transfers) and must handle the case where the cook's balance is already spent.
- If reversal fails, **Daarik absorbs the loss**. With `losses_collector = application` this is explicit: Daarik is liable for negative balances and fraud losses, and Stripe may underwrite accordingly.
- A cook whose balance goes negative may get a **debit payout** from their bank, or the debt is netted from future volume.
- Recommendation: hold `payoutHoldDays` (default 7) after `COMPLETED`, and **do not transfer** while a dispute is open.

### 6.7 Cross-border
If a cook's account country is not NL, `on_behalf_of` becomes mandatory, the fee structure switches to their country, and cross-border payout fees apply (from 0.25%). Keep the MVP NL-only and reject other countries at account creation.

---

## 7. What Stripe approval does **not** cover

Stripe KYC/onboarding is **not** evidence of any of the following. These need a separate, admin-verified `ComplianceStatus` per cook, and a cook must not receive orders until **both** Stripe `payouts_enabled` **and** Daarik compliance are `APPROVED`.

| Requirement | Why it matters for Daarik |
| --- | --- |
| **KVK** registration (or explicit private-individual status) | Determines whether the cook can legally sell food at all |
| **NVWA** registration / notification | Required for food businesses in NL; home kitchens are in scope |
| **HACCP / hygiene** (Warenwet, hygiënecode) | Daarik's own due diligence if a customer gets ill |
| **Allergen information** (14 allergens, Reg. 1169/2011) | Must be available *before* purchase — not just on the dish page |
| **VAT**: 9% on takeaway food vs. 21% on restaurant service | Pickup-only keeps most orders at 9%, but the classification must be documented |
| **KOR** (€20,000 turnover scheme) | Cooks may be VAT-exempt; affects the commission invoice |
| **Municipal permit** (`gemeente`) for home food sales | Varies by city; can shut a cook down overnight |
| **Insurance** (product/bedrijfsaansprakelijkheid) | Not legally mandatory in all cases, but a dispute magnet |

Also: Daarik must issue **its own commission invoices with 21% BTW** to cooks. Stripe does not invoice cooks on Daarik's behalf, and Stripe Tax is only relevant if Daarik becomes MoR.

**GDPR:** identity documents and BSN must go **straight to Stripe**, never through Daarik. The current schema storing `iban` and `accountHolder` on `CookProfile` must be removed — keep only Stripe's display-safe `bank_name` + `last4`. Stripe is a processor; sign the DPA, document retention, and support data-subject requests.

---

## 8. Gap analysis against the current codebase

Nothing below has been changed yet.

**Schema (`backend/prisma/schema.prisma`)**
- `CookProfile`: remove `iban`, `accountHolder`, `walletBalance`, `payoutPreference`. Add `stripeAccountId`, `stripeAccountStatus`, `stripeChargesEnabled`, `stripePayoutsEnabled`, `stripeRequirementsDue String[]`, `stripeSyncedAt`, `complianceStatus`, `complianceCheckedAt`, `payoutHoldDays`.
- `Order`: all money → `Int` cents + `currency`. Add `paymentStatus` (`REQUIRES_PAYMENT → PROCESSING → PAID → REFUNDED/PARTIALLY_REFUNDED/FAILED`), `stripePaymentIntentId`, `stripeChargeId`, `stripeTransferId`, `commissionCents`, `serviceFeeCents`, `cookNetCents`, `stripeFeeCents`, `refundedCents`, `paidAt`, `completedAt`, `transferEligibleAt`. `paid` currently defaults to `true` — must default `false`.
- `Payout`: split into `Transfer` (Daarik → cook, per order or per batch) and `StripePayout` (Stripe → cook's IBAN). `PayoutStatus` needs `IN_TRANSIT`, `FAILED`, `CANCELED`. Keep `code`, `period`, `ordersCount` for the admin UI.
- Add `WebhookEvent { stripeEventId @unique, type, payload Json, processedAt, attempts, error }`.
- Add `Refund` and extend `Dispute` with `stripeDisputeId`, `stripeChargeId`, `evidenceDueBy`.
- `PlatformSetting`: add `commissionFixedCents`, `commissionBase` (`SUBTOTAL|TOTAL`), `stripeFeeBearer`, `payoutInterval` (`DAILY|WEEKLY|MONTHLY|MANUAL`), `payoutWeeklyAnchor`, `payoutHoldDays`, `minOrderCents`.
- Every money field currently `Float` → `Int`.

**Payments service**
- Delete the `acct_daarik_*` fake-account fallback and the `stripeOnboarded = true` shortcut.
- Replace `express` account creation with v2 `individual` / `dashboard: none` / platform fees + losses.
- Replace `requestBankTransferPayout` (which invents €287.35 and zeroes the wallet before any transfer) with real `Transfers` guarded by eligibility.
- Add `Transfer` creation with idempotency key `transfer:{orderId}` and `source_transaction` = charge id.

**Orders service**
- Stop setting `paid: true` on creation. Orders begin `REQUIRES_PAYMENT` and only become `PAID` from a verified webhook.
- Remove wallet crediting (`walletBalance.increment`).
- Fix `resolveCook()` — it silently falls back to demo cook `rana`, which breaks cook isolation. This is a live security bug independent of Stripe.
- Validate that the cook is orderable: `status = VERIFIED`, `stripePayoutsEnabled = true`, `complianceStatus = APPROVED`.

**Checkout (frontend)**
- The current custom card form + `setTimeout` "simulated" payment is **not PCI-compliant** and never confirms a PaymentIntent. Replace with **Stripe-hosted Checkout** (fastest, SCA/iDEAL handled) or Payment Element + `stripe.confirmPayment`.
- Keep the server as the only source of amounts; the client may only send `orderId`.

**Webhooks**
- New module, `@Public()`, registered **before** the global JWT guard, receiving the **raw body** (`rawBody: true` in `NestFactory.create`, or a scoped raw-body parser on `/api/payments/webhook`).
- Verify with `stripe.webhooks.constructEvent(rawBody, sig, STRIPE_WEBHOOK_SECRET)`; reject on failure with 400.
- Idempotency: insert `stripeEventId` first, return 200 on duplicate, process in a transaction, and only then mark `processedAt`.
- `STRIPE_WEBHOOK_SECRET` is **missing** from `backend/.env`; also missing: `STRIPE_PLATFORM_ACCOUNT_ID`, `STRIPE_CONNECT_CLIENT_ID`, `DAARIK_PUBLIC_URL`.
- Handlers: `account.updated`, `checkout.session.completed`, `payment_intent.succeeded`, `payment_intent.payment_failed` (note: the event is `payment_intent.payment_failed`, not `payment_intent.failed`), `charge.refunded`, `charge.dispute.created`/`closed`, `transfer.created`/`reversed`, `payout.paid`/`payout.failed`.
  - `transfer.failed` is **not a Stripe event**. Transfer failures return a synchronous API error; only `transfer.reversed` exists. Handle failures at creation time and record them.

---

## 9. Admin configuration to add

| Setting | Default | Notes |
| --- | --- | --- |
| `commissionRate` | 0.15 | exists |
| `commissionFixedCents` | 0 | new |
| `commissionBase` | `SUBTOTAL` | new |
| `stripeFeeBearer` | `PLATFORM` | new |
| `payoutInterval` | `WEEKLY` | new — written to each account's `settings.payouts.schedule.interval` via Accounts **v1** |
| `payoutWeeklyAnchor` | `monday` | new |
| `payoutHoldDays` | 7 | new — release after `COMPLETED + N days` |
| `minOrderCents` | e.g. 800 | new — protects against fee-destroying orders |

"Stripe Marketplace Payments" admin section should show: platform balance, held funds (paid but not yet transferred), transfers pending/failed, cook onboarding funnel (started / requirements due / payouts enabled / restricted), disputes with evidence deadlines, and payout failures.

---

## 10. Open risks

1. **Platform approval.** Daarik's Connect platform profile must be approved for marketplace + `losses_collector = application`. Stripe underwriting may ask for a business plan and loss-reserve policy. This is a go-live dependency you cannot code around.
2. **Cook KYC attrition.** BSN + ID + liveness + own-name IBAN is a real funnel drop. Plan for a manual review queue and a "why we ask" explainer in NL/EN/AR.
3. **Irreversible `dashboard: none`.** No cook can ever self-serve Stripe. Daarik owns payout support forever.
4. **Negative balances.** Daarik is the loss collector. A single €500 dispute on a cook who already withdrew can wipe out dozens of orders' commission.
5. **Held-funds sweep.** If the platform payout schedule is left automatic, funds land in Daarik's bank account — re-creating the custody model you prohibited.
6. **Tax classification.** 9% vs. 21% VAT on pickup food, and the commission invoice BTW, need an accountant's confirmation before launch.
7. **Prototype debt.** The existing payment code must be *replaced*, not extended: fake accounts, wallet credits, invented payout amounts, `paid: true` default, and a non-PCI card form.

---

## 11. Test plan (Stripe test mode, before any live key)

| Scenario | Test card / trigger | Expected |
| --- | --- | --- |
| iDEAL success | `ideal` + "succeed" | order `PAID`, no transfer yet |
| iDEAL failure/abandon | "fail" / close redirect | order stays `REQUIRES_PAYMENT`, no transfer |
| Card 3DS | `4000002500003155` | webhook confirms only after authentication |
| Card declined | `4000000000009995` | `payment_intent.payment_failed`, order not paid |
| Full refund before release | refund API | order `REFUNDED`, no transfer created |
| Partial refund before release | €5 | transfer amount reduced |
| Refund after release | refund + `transfers.reverse` | transfer reversed, ledger consistent |
| Dispute | `4000000000000259` | transfer blocked, admin alert, evidence deadline |
| Onboarding incomplete | account with `requirements_due` | cook cannot receive orders |
| Payout failure | test IBAN `NL39RABO0300065264` variants / force failure | `payout.failed`, retry surfaced in admin |
| Webhook replay | resend same event | 200, no duplicate side effects |
| Bad signature | tampered payload | 400, nothing written |
| Amount tampering | client sends lower total | server recalculates, mismatch rejected |

---

## 12. Decisions

**Confirmed (30 Oct 2026):**
- ✅ **Earnings timing:** hold until `COMPLETED` + hold days. **Separate charges & transfers** is the chosen architecture. Destination charges are no longer on the table.
- ✅ **Merchant of record: the cook.** `on_behalf_of` = connected account on every PaymentIntent. Cook's statement descriptor, cook owns VAT and food-law duties, Daarik invoices the commission.
- ✅ **Pricing:** 15% commission **plus** a €1.50 service fee paid by the customer (not deducted from the cook).
- ✅ **Commission base:** food subtotal. The service fee is Daarik revenue and is never commissioned. Implemented as admin setting `commissionBase` (default `SUBTOTAL`) so it can be changed without a migration.
- ✅ **Fee bearer:** Daarik absorbs Stripe processing fees out of commission + service fee.

**Derived consequences now locked in:**
- Cook earnings = `subtotal − 15%` (e.g. €23.50 → €19.97).
- Daarik revenue per €25 order = €5.03 gross, €4.74 net after iDEAL.
- `on_behalf_of` requires `card_payments`, so that capability is mandatory (not optional).
- Because Daarik is not MoR, Daarik must **not** describe itself as the seller in checkout copy, receipts, or terms.

**Still open (non-blocking, deploy-time):**
1. **Bancontact:** keep (`bancontact_payments` capability, extra requirements) or drop for MVP? Default: keep the capability request but leave the method disabled in Checkout.
2. **Connect pricing tier** confirmation with Stripe (€2/active account + 0.25% + €0.10 per payout).
