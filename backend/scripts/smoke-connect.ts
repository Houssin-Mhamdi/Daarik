/* Smoke test for Accounts v2 creation + hosted onboarding link. */
import Stripe from "stripe";
import "dotenv/config";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  maxNetworkRetries: 0,
});

async function main() {
  const account = await stripe.v2.core.accounts.create({
    display_name: "Daarik smoke test",
    contact_email: "smoke-test@daarik.nl",
    dashboard: "none",
    identity: {
      country: "NL",
      entity_type: "individual",
      individual: { email: "smoke-test@daarik.nl" },
    },
    defaults: {
      currency: "eur",
      locales: ["nl", "en"],
      responsibilities: {
        fees_collector: "application",
        losses_collector: "application",
      },
    },
    configuration: {
      merchant: {
        capabilities: {
          card_payments: { requested: true },
          ideal_payments: { requested: true },
        },
      },
      recipient: {
        capabilities: {
          stripe_balance: { stripe_transfers: { requested: true } },
        },
      },
    },
    metadata: { platform: "Daarik", purpose: "smoke-test" },
    include: [
      "configuration.merchant",
      "configuration.recipient",
      "requirements",
    ],
  });

  console.log("ACCOUNT CREATED:", account.id, "dashboard:", account.dashboard);

  const link = await stripe.accountLinks.create({
    account: account.id,
    type: "account_onboarding",
    refresh_url: "http://localhost:3000/cook/earnings?stripe=refresh",
    return_url: "http://localhost:3000/cook/earnings?stripe=return",
    collection_options: {
      fields: "eventually_due",
      future_requirements: "include",
    },
  });

  console.log("ONBOARDING LINK:", link.url, "expires:", link.expires_at);

  // Clean up both the previous test account (if still open) and the new one.
  for (const id of ["acct_1UWNgKC00EBurBlz", account.id]) {
    try {
      await stripe.v2.core.accounts.close(id, {
        applied_configurations: ["merchant", "recipient"],
      });
      console.log("CLOSED:", id);
    } catch (err: any) {
      console.log("CLOSE SKIPPED:", id, err.message);
    }
  }
}

main().catch((err) => {
  console.error("FAILED", err.type, err.statusCode, err.message);
  process.exit(1);
});
