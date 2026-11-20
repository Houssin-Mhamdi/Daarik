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
  /** Pass-through amount chosen by the cook for "meet at a location" orders. */
  meetFeeCents?: number;
}

export interface OrderMoney {
  subtotalCents: number;
  serviceFeeCents: number;
  meetFeeCents: number;
  commissionCents: number;
  cookNetCents: number;
  totalCents: number;
}

/**
 * Single source of truth for order pricing.
 *
 * The commission is computed on the food subtotal (default) so that neither
 * Daarik's service fee nor the cook's pass-through meet fee is commissioned.
 * `Math.round` on non-negative values is half-up, as Dutch invoicing expects.
 */
export function computeOrderMoney(
  subtotalCents: number,
  settings: PricingSettings,
): OrderMoney {
  const subtotal = Math.max(0, Math.round(subtotalCents));
  const serviceFeeCents = Math.max(0, Math.round(settings.serviceFeeCents));
  const meetFeeCents = Math.max(0, Math.round(settings.meetFeeCents ?? 0));

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
    meetFeeCents,
    commissionCents,
    // The meet fee is a pass-through: the cook receives every cent of it.
    cookNetCents: subtotal - commissionCents + meetFeeCents,
    totalCents: subtotal + serviceFeeCents + meetFeeCents,
  };
}

/** Stripe expects lowercase ISO currency codes. */
export const CURRENCY = "eur";
