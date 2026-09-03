import { headers } from "next/headers";
import { Pricing } from "@/components/pricing";
import { Logo } from "@/components/logo";
import Link from "next/link";

export default async function HomePage() {
  const headersList = await headers();
  const country =
    headersList.get("x-vercel-ip-country") ||
    headersList.get("cf-ipcountry") ||
    headersList.get("x-country-code") ||
    null;

  return (
    <div className="min-h-screen bg-white text-zinc-900 flex flex-col">
      <header className="border-b border-zinc-100 bg-white/80 backdrop-blur sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <Logo />
            <span className="font-semibold text-sm">Paddle Billing Demo</span>
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">
              SANDBOX
            </span>
          </Link>

          <nav className="flex items-center gap-1 text-sm">
            <Link href="/" className="px-3 py-1.5 rounded-md text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 transition font-medium text-xs">
              Pricing
            </Link>
            <Link href="/account" className="px-3 py-1.5 rounded-md text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 transition font-medium text-xs">
              Account
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <Pricing country={country} />
      </main>

      <footer className="border-t border-zinc-100 py-6">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center text-xs text-zinc-400">
          Built with Paddle Billing &middot; Sandbox environment
        </div>
      </footer>
    </div>
  );
}
