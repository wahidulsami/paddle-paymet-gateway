import { Environment, LogLevel, Paddle, type CountryCode } from "@paddle/paddle-node-sdk";
import fs from "fs";
import path from "path";

/**
 * Script to create the Paddle Product Catalog in Sandbox (or Production).
 *
 * Requirements:
 * - Starter: USD 10.00/month ("1000"), USD 100.00/year ("10000")
 * - Pro: USD 40.00/month ("4000"), USD 400.00/year ("40000")
 * - Advanced: USD 120.00/month ("12000"), USD 1200.00/year ("120000")
 * - 7-day free trial on all plans
 * - Country overrides for UK (GBP), Ireland (EUR), Australia (AUD), adjusted for purchasing power
 *
 * Run with:
 * npx tsx scripts/seed-catalog.ts
 */

interface TierConfig {
  name: "Starter" | "Pro" | "Advanced";
  description: string;
  monthly: {
    usd: string;
    overrides: { countryCodes: CountryCode[]; currencyCode: "GBP" | "EUR" | "AUD"; amount: string }[];
  };
  yearly: {
    usd: string;
    overrides: { countryCodes: CountryCode[]; currencyCode: "GBP" | "EUR" | "AUD"; amount: string }[];
  };
}

const CATALOG_CONFIG: TierConfig[] = [
  {
    name: "Starter",
    description: "Ideal for individuals, prototypes, and getting started.",
    monthly: {
      usd: "1000", // $10.00
      overrides: [
        { countryCodes: ["GB"], currencyCode: "GBP", amount: "800" }, // £8.00
        { countryCodes: ["IE"], currencyCode: "EUR", amount: "900" }, // €9.00
        { countryCodes: ["AU"], currencyCode: "AUD", amount: "1400" }, // A$14.00
      ],
    },
    yearly: {
      usd: "10000", // $100.00 (2 months free)
      overrides: [
        { countryCodes: ["GB"], currencyCode: "GBP", amount: "8000" }, // £80.00
        { countryCodes: ["IE"], currencyCode: "EUR", amount: "9000" }, // €90.00
        { countryCodes: ["AU"], currencyCode: "AUD", amount: "14000" }, // A$140.00
      ],
    },
  },
  {
    name: "Pro",
    description: "Built for scaling teams, production apps, and modern businesses.",
    monthly: {
      usd: "4000", // $40.00
      overrides: [
        { countryCodes: ["GB"], currencyCode: "GBP", amount: "3200" }, // £32.00
        { countryCodes: ["IE"], currencyCode: "EUR", amount: "3600" }, // €36.00
        { countryCodes: ["AU"], currencyCode: "AUD", amount: "5500" }, // A$55.00
      ],
    },
    yearly: {
      usd: "40000", // $400.00 (2 months free)
      overrides: [
        { countryCodes: ["GB"], currencyCode: "GBP", amount: "32000" }, // £320.00
        { countryCodes: ["IE"], currencyCode: "EUR", amount: "36000" }, // €360.00
        { countryCodes: ["AU"], currencyCode: "AUD", amount: "55000" }, // A$550.00
      ],
    },
  },
  {
    name: "Advanced",
    description: "For high-scale enterprises demanding maximum performance & SLA.",
    monthly: {
      usd: "12000", // $120.00
      overrides: [
        { countryCodes: ["GB"], currencyCode: "GBP", amount: "9500" }, // £95.00
        { countryCodes: ["IE"], currencyCode: "EUR", amount: "11000" }, // €110.00
        { countryCodes: ["AU"], currencyCode: "AUD", amount: "16500" }, // A$165.00
      ],
    },
    yearly: {
      usd: "120000", // $1200.00 (2 months free)
      overrides: [
        { countryCodes: ["GB"], currencyCode: "GBP", amount: "95000" }, // £950.00
        { countryCodes: ["IE"], currencyCode: "EUR", amount: "110000" }, // €1100.00
        { countryCodes: ["AU"], currencyCode: "AUD", amount: "165000" }, // A$1650.00
      ],
    },
  },
];

async function seedCatalog() {
  const apiKey = process.env.PADDLE_API_KEY;
  const envStr = process.env.NEXT_PUBLIC_PADDLE_ENV || "sandbox";

  if (!apiKey) {
    console.error("❌ ERROR: PADDLE_API_KEY is not set in environment variables.");
    console.error("   Please set PADDLE_API_KEY in .env.local or export it in your shell.");
    console.error("   You can generate an API key in Paddle Dashboard: Developer tools > Authentication.");
    process.exit(1);
  }

  const environment = envStr === "production" ? Environment.production : Environment.sandbox;

  console.log(`🚀 Starting Paddle catalog seed against [${envStr.toUpperCase()}] environment...`);
  const paddle = new Paddle(apiKey, {
    environment,
    logLevel: LogLevel.error,
  });

  const results: Record<
    string,
    {
      productId: string;
      productName: string;
      monthlyPriceId: string;
      yearlyPriceId: string;
    }
  > = {};

  for (const tier of CATALOG_CONFIG) {
    console.log(`\n📦 Creating product: ${tier.name}...`);

    // 1. Create Product
    const product = await paddle.products.create({
      name: tier.name,
      taxCategory: "saas",
      description: tier.description,
    });
    console.log(`   ✅ Product created: ${product.id} (${product.name})`);

    // 2. Create Monthly Price (with 7-day trial and regional overrides)
    console.log(`   ⏳ Creating monthly price for ${tier.name} ($${parseInt(tier.monthly.usd) / 100}/mo)...`);
    const monthlyPrice = await paddle.prices.create({
      productId: product.id,
      description: `${tier.name} Monthly`,
      unitPrice: {
        amount: tier.monthly.usd,
        currencyCode: "USD",
      },
      billingCycle: {
        interval: "month",
        frequency: 1,
      },
      trialPeriod: {
        interval: "day",
        frequency: 7,
      },
      unitPriceOverrides: tier.monthly.overrides.map((ov) => ({
        countryCodes: ov.countryCodes,
        unitPrice: {
          amount: ov.amount,
          currencyCode: ov.currencyCode,
        },
      })),
    });
    console.log(`   ✅ Monthly Price created: ${monthlyPrice.id}`);

    // 3. Create Yearly Price (with 7-day trial and regional overrides)
    console.log(`   ⏳ Creating yearly price for ${tier.name} ($${parseInt(tier.yearly.usd) / 100}/yr)...`);
    const yearlyPrice = await paddle.prices.create({
      productId: product.id,
      description: `${tier.name} Annual`,
      unitPrice: {
        amount: tier.yearly.usd,
        currencyCode: "USD",
      },
      billingCycle: {
        interval: "year",
        frequency: 1,
      },
      trialPeriod: {
        interval: "day",
        frequency: 7,
      },
      unitPriceOverrides: tier.yearly.overrides.map((ov) => ({
        countryCodes: ov.countryCodes,
        unitPrice: {
          amount: ov.amount,
          currencyCode: ov.currencyCode,
        },
      })),
    });
    console.log(`   ✅ Yearly Price created: ${yearlyPrice.id}`);

    results[tier.name.toLowerCase()] = {
      productId: product.id,
      productName: tier.name,
      monthlyPriceId: monthlyPrice.id,
      yearlyPriceId: yearlyPrice.id,
    };
  }

  console.log("\n" + "=".repeat(60));
  console.log("🎉 PADDLE CATALOG SEEDED SUCCESSFULLY!");
  console.log("=".repeat(60));
  console.log("\nMapping of Created Entities:\n");
  console.table(
    Object.entries(results).map(([, val]) => ({
      Tier: val.productName,
      "Product ID": val.productId,
      "Monthly Price ID": val.monthlyPriceId,
      "Yearly Price ID": val.yearlyPriceId,
    }))
  );

  console.log("\nEnvironment variables for your .env.local file:");
  console.log("--------------------------------------------------");
  console.log(`NEXT_PUBLIC_PADDLE_PRICE_STARTER_MONTH="${results.starter.monthlyPriceId}"`);
  console.log(`NEXT_PUBLIC_PADDLE_PRICE_STARTER_YEAR="${results.starter.yearlyPriceId}"`);
  console.log(`NEXT_PUBLIC_PADDLE_PRICE_PRO_MONTH="${results.pro.monthlyPriceId}"`);
  console.log(`NEXT_PUBLIC_PADDLE_PRICE_PRO_YEAR="${results.pro.yearlyPriceId}"`);
  console.log(`NEXT_PUBLIC_PADDLE_PRICE_ADVANCED_MONTH="${results.advanced.monthlyPriceId}"`);
  console.log(`NEXT_PUBLIC_PADDLE_PRICE_ADVANCED_YEAR="${results.advanced.yearlyPriceId}"`);
  console.log("--------------------------------------------------\n");

  const outputPath = path.join(process.cwd(), "catalog-ids.json");
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
  console.log(`💾 Saved catalog IDs to ${outputPath}\n`);
}

seedCatalog().catch((err) => {
  console.error("\n❌ Seed script failed:", err);
  process.exit(1);
});
