/**
 * Money helpers.
 *
 * Every monetary value that is persisted or sent to Stripe is an integer
 * number of euro cents. Floats are only used at the API edge (euros), and are
 * converted exactly once.
 */

export const toCents = (euros: number): number => Math.round(euros * 100);

export const toEuros = (cents: number): number => Math.round(cents) / 100;

export interface PricingSettings {
  serviceFeeCents: number;
  commissionRate: number;
  commissionFixedCents: number;
  commissionBase: string;
  minOrderCents?: number;
}

export interface OrderMoney {
  subtotalCents: number;
  serviceFeeCents: number;
  commissionCents: number;
  cookNetCents: number;
  totalCents: number;
}

/**
 * Single source of truth for order pricing.
 *
 * The commission is computed on the food subtotal (default) so that Daarik's
 * own service fee is never commissioned. `Math.round` on non-negative values
 * is half-up, which is what Dutch invoicing expects.
 */
export function computeOrderMoney(
  subtotalCents: number,
  settings: PricingSettings,
): OrderMoney {
  const subtotal = Math.max(0, Math.round(subtotalCents));
  const serviceFeeCents = Math.max(0, Math.round(settings.serviceFeeCents));

  const base =
    settings.commissionBase === "TOTAL" ? subtotal + serviceFeeCents : subtotal;

  const raw =
    Math.round(base * settings.commissionRate) +
    Math.max(0, Math.round(settings.commissionFixedCents || 0));

  // A commission can never exceed the food value, otherwise the cook would owe
  // Daarik money for selling food.
  const commissionCents = Math.min(Math.max(0, raw), subtotal);

  return {
    subtotalCents: subtotal,
    serviceFeeCents,
    commissionCents,
    cookNetCents: subtotal - commissionCents,
    totalCents: subtotal + serviceFeeCents,
  };
}

/** Stripe expects lowercase ISO currency codes. */
export const CURRENCY = "eur";
