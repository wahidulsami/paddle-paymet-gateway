export interface Tier {
  name: "Starter" | "Pro" | "Advanced";
  id: "starter" | "pro" | "advanced";
  description: string;
  features: string[];
  popular?: boolean;
  priceId: { month: string; year: string };
}

/**
 * Pricing tier configuration.
 *
 * Price IDs are populated with your generated Paddle sandbox price IDs
 * (from env vars or replaced directly after running the catalog seed script).
 */
export const PricingTiers: Tier[] = [
  {
    name: "Starter",
    id: "starter",
    description: "Ideal for individuals, prototypes, and getting started.",
    popular: false,
    features: [
      "7-day free trial included",
      "Core developer tools & SDKs",
      "Single workspace",
      "Up to 5,000 monthly events",
      "Community support",
    ],
    priceId: {
      month: process.env.NEXT_PUBLIC_PADDLE_PRICE_STARTER_MONTH || "pri_01m1jqng22sezrvg4t24yagwd9",
      year: process.env.NEXT_PUBLIC_PADDLE_PRICE_STARTER_YEAR || "pri_01m1jqnggqb576xmp23f7enrhe",
    },
  },
  {
    name: "Pro",
    id: "pro",
    description: "Built for scaling teams, production apps, and modern businesses.",
    popular: true,
    features: [
      "7-day free trial included",
      "Everything in Starter",
      "Unlimited workspaces & team members",
      "Up to 50,000 monthly events",
      "Priority webhooks & fulfillment",
      "Email & chat priority support",
    ],
    priceId: {
      month: process.env.NEXT_PUBLIC_PADDLE_PRICE_PRO_MONTH || "pri_01m1jqnh5q6wjmr7cvgc6emx72",
      year: process.env.NEXT_PUBLIC_PADDLE_PRICE_PRO_YEAR || "pri_01m1jqnhfghqf1bcx30ywk8b1p",
    },
  },
  {
    name: "Advanced",
    id: "advanced",
    description: "For high-scale enterprises demanding maximum performance & SLA.",
    popular: false,
    features: [
      "7-day free trial included",
      "Everything in Pro",
      "Unlimited monthly events & traffic",
      "Dedicated account manager",
      "Custom integrations & webhooks",
      "99.99% uptime SLA guarantee",
      "24/7 emergency phone support",
    ],
    priceId: {
      month: process.env.NEXT_PUBLIC_PADDLE_PRICE_ADVANCED_MONTH || "pri_01m1jqnj4hxgpr8prs7y9zewah",
      year: process.env.NEXT_PUBLIC_PADDLE_PRICE_ADVANCED_YEAR || "pri_01m1jqnjekxf9e5c650xf37qef",
    },
  },
];
