export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between bg-ink p-10 text-white lg:flex">
        <div className="absolute inset-0 bg-ledger bg-ledger opacity-40" aria-hidden />
        <div className="relative flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-emerald font-display text-sm font-bold">
            L
          </span>
          <span className="font-display text-lg font-semibold">Ledger</span>
        </div>
        <div className="relative space-y-4">
          <p className="font-display text-3xl font-semibold leading-tight tracking-tight">
            Every dollar,
            <br />
            accounted for.
          </p>
          <p className="max-w-sm text-sm text-ink-200">
            Track accounts, set budgets, and watch your savings goals move — all in one
            clear ledger.
          </p>
        </div>
        <p className="relative font-mono text-xs text-ink-400">© {new Date().getFullYear()} Ledger</p>
      </div>

      <div className="flex items-center justify-center p-6 lg:p-10">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}
