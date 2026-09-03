import { headers } from "next/headers";
import { Pricing } from "@/components/pricing";
import Link from "next/link";
import { ShieldCheck, ArrowUpRight } from "lucide-react";

export default async function HomePage() {
  // Server-side country detection from incoming request headers
  const headersList = await headers();
  const detectedCountry =
    headersList.get("x-vercel-ip-country") ||
    headersList.get("cf-ipcountry") ||
    headersList.get("x-country-code") ||
    null;

  return (
    <div className="min-h-screen bg-white text-zinc-900 flex flex-col font-sans">
      {/* Navigation Header */}
      <header className="border-b border-zinc-200/80 bg-white/80 backdrop-blur sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-black text-lg shadow-sm">
              P
            </div>
            <span className="font-bold text-lg tracking-tight">Paddle SaaS</span>
            <span className="text-[11px] font-semibold uppercase px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-200">
              Sandbox
            </span>
          </div>

          <nav className="flex items-center gap-4 text-sm font-medium">
            <Link
              href="/"
              className="text-zinc-600 hover:text-zinc-900 transition-colors"
            >
              Pricing
            </Link>
            <Link
              href="/account"
              className="text-zinc-600 hover:text-zinc-900 transition-colors"
            >
              Account & Portal
            </Link>
            <Link
              href="/account"
              className="px-4 py-2 rounded-lg bg-zinc-900 text-white hover:bg-zinc-800 transition-colors flex items-center gap-1.5 text-xs font-semibold"
            >
              <span>Customer Portal</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 py-6">
        {/* Country Detection Banner */}
        {detectedCountry && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-100 text-xs text-zinc-600 font-mono">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>
                Detected region: <strong>{detectedCountry}</strong> (prices localized automatically)
              </span>
            </div>
          </div>
        )}

        <Pricing country={detectedCountry} />
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200 py-8 bg-zinc-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs text-zinc-500">
          <p>
            Powered by Paddle Billing • Sandbox Testing Environment
          </p>
        </div>
      </footer>
    </div>
  );
}
