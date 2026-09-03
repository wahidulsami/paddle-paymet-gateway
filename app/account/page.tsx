import Link from "next/link";
import {
  getAllCustomers,
  getCustomerByEmail,
  getSubscriptionByCustomerId,
  getAllTransactions,
} from "@/lib/db";
import { checkSubscriptionAccess } from "@/lib/access";
import { AccountManager } from "@/components/account-manager";
import { Logo } from "@/components/logo";
import { ArrowLeft } from "lucide-react";

interface AccountPageProps {
  searchParams: Promise<{ email?: string }>;
}

export default async function AccountPage({ searchParams }: AccountPageProps) {
  const { email } = await searchParams;

  console.log(`[Account Page] Loading account for email: "${email || "(none)"}"`);

  const customers = getAllCustomers();
  const selectedEmail = email || (customers.length > 0 ? customers[0].email : "");

  console.log(`[Account Page] Selected email: "${selectedEmail}", Total customers in DB: ${customers.length}`);

  const customer = selectedEmail ? getCustomerByEmail(selectedEmail) ?? null : null;
  const subscription = customer ? getSubscriptionByCustomerId(customer.customer_id) ?? null : null;
  const access = checkSubscriptionAccess(subscription);

  console.log(`[Account Page] Customer found: ${customer ? `${customer.customer_id} (${customer.email})` : "none"}`);
  console.log(`[Account Page] Subscription found: ${subscription ? `${subscription.subscription_id} (status: ${subscription.status})` : "none"}`);

  const allTx = getAllTransactions();
  const transactions = customer
    ? allTx.filter((t) => t.customer_id === customer.customer_id)
    : allTx;

  console.log(`[Account Page] Transactions for this customer: ${transactions.length}`);

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <header className="border-b border-zinc-200 bg-white sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="p-1.5 rounded-md hover:bg-zinc-100 text-zinc-400 hover:text-zinc-600 transition">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="flex items-center gap-2">
              <Logo size={24} />
              <span className="font-semibold text-sm">Account</span>
            </div>
          </div>
          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">
            SANDBOX
          </span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <AccountManager
          customers={customers}
          initialSelectedEmail={selectedEmail}
          customer={customer}
          subscription={subscription}
          access={access}
          transactions={transactions}
        />
      </main>
    </div>
  );
}
