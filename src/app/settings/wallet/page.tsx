"use client";

import { Landmark, Wallet as WalletIcon } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { useAuth } from "@/contexts/AuthContext";
import { paymentApi } from "@/lib/api/paymentApi";
import { payoutApi, type AccountStatusResponse } from "@/lib/api/payoutApi";
import { ROUTES } from "@/lib/routes";

const MIN_WITHDRAWAL = 5000;

function fmt(n: number) {
  return `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtCompact(n: number) {
  return `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

export default function WalletPage() {
  const { user } = useAuth();
  const [wallet, setWallet] = useState({ balance: 0, total_earned: 0, total_withdrawn: 0 });
  const [payoutStatus, setPayoutStatus] = useState<AccountStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadWallet = async (userId: string) => {
    const [w, status] = await Promise.all([
      paymentApi.getWallet(userId),
      payoutApi.getAccountStatus(userId).catch(() => null),
    ]);
    setWallet(w);
    setPayoutStatus(status);
  };

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
        await loadWallet(user.id);
      } catch (err) {
        if (!cancelled) setError((err as Error)?.message || "Could not load wallet");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const hasUpi = Boolean(payoutStatus?.upiId);
  const canWithdraw = wallet.balance >= MIN_WITHDRAWAL && hasUpi;
  const progressPct = Math.min((wallet.balance / MIN_WITHDRAWAL) * 100, 100);
  const amountNeeded = Math.max(MIN_WITHDRAWAL - wallet.balance, 0);

  const handleWithdraw = async () => {
    if (!user) return;
    const value = parseFloat(amount);
    setError("");
    setSuccess("");
    if (!value || Number.isNaN(value) || value <= 0) {
      setError("Enter a valid amount");
      return;
    }
    if (value > wallet.balance) {
      setError("Amount exceeds your available balance");
      return;
    }
    if (value < MIN_WITHDRAWAL) {
      setError(`Minimum withdrawal is ${fmtCompact(MIN_WITHDRAWAL)}`);
      return;
    }
    const confirmed = window.confirm(
      `Send ${fmt(value)} to ${payoutStatus?.upiId}?\n\nProcessed within 1–2 business days.`,
    );
    if (!confirmed) return;

    setSubmitting(true);
    try {
      await paymentApi.requestWithdrawal({ mentorId: user.id, amount: value });
      setSuccess("Withdrawal requested — you'll be notified once it's processed.");
      setAmount("");
      await loadWallet(user.id);
    } catch (err) {
      setError((err as Error)?.message || "Withdrawal failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) return null;
  if (loading) return <main className="px-6 py-10 text-sm text-text-muted">Loading…</main>;

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-6 px-6 py-10">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Wallet</h1>
        <p className="mt-1 text-sm text-text-secondary">View your balance and withdraw earnings.</p>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-border-light bg-surface-panel p-5">
        <div className="flex items-center gap-2 text-text-muted">
          <WalletIcon size={16} />
          <span className="text-xs font-semibold uppercase tracking-wide">Available balance</span>
        </div>
        <p className="text-3xl font-bold text-text-primary">{fmt(wallet.balance)}</p>

        <div className="mt-2 flex items-center justify-between text-xs text-text-muted">
          <span>Total earned</span>
          <span className="font-semibold text-text-secondary">{fmt(wallet.total_earned)}</span>
        </div>
        <div className="flex items-center justify-between text-xs text-text-muted">
          <span>Total withdrawn</span>
          <span className="font-semibold text-text-secondary">{fmt(wallet.total_withdrawn)}</span>
        </div>

        {!canWithdraw ? (
          <div className="mt-3 flex flex-col gap-1.5">
            <div className="h-2 w-full overflow-hidden rounded-full bg-surface-chip">
              <div
                className="h-full rounded-full bg-accent-link"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <p className="text-xs text-text-muted">
              {fmtCompact(wallet.balance)} of {fmtCompact(MIN_WITHDRAWAL)} minimum
              {amountNeeded > 0 ? ` — ${fmtCompact(amountNeeded)} more to unlock withdrawals` : ""}
            </p>
          </div>
        ) : null}
      </div>

      {!hasUpi ? (
        <div className="flex items-center gap-3 rounded-xl border border-border-light bg-surface-panel px-4 py-3.5">
          <Landmark size={16} className="text-accent-link" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-text-primary">No payout account set up</p>
            <p className="text-xs text-text-muted">Add a UPI ID to enable withdrawals.</p>
          </div>
          <Link href={ROUTES.payoutSetup} className="text-xs font-semibold text-accent-link">
            Set up
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3 rounded-2xl border border-border-light bg-surface-panel p-5">
          <p className="text-sm font-semibold text-text-primary">Withdraw to {payoutStatus?.upiId}</p>

          {error ? <p className="text-sm text-accent-error">{error}</p> : null}
          {success ? <p className="text-sm text-accent-success">{success}</p> : null}

          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder={`Min ${fmtCompact(MIN_WITHDRAWAL)}`}
            disabled={!canWithdraw || submitting}
            className="rounded-xl border border-border-light bg-surface-sheet px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none disabled:opacity-50"
          />

          <div className="flex gap-2">
            {[
              { label: "Min", value: MIN_WITHDRAWAL },
              { label: "50%", value: Math.max(MIN_WITHDRAWAL, wallet.balance * 0.5) },
              { label: "Max", value: wallet.balance },
            ].map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => setAmount(String(Math.floor(preset.value)))}
                disabled={!canWithdraw || submitting}
                className="rounded-full border border-border-light px-3 py-1.5 text-xs font-semibold text-text-secondary hover:text-text-primary disabled:opacity-50"
              >
                {preset.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleWithdraw}
            disabled={!canWithdraw || submitting}
            className="mt-1 flex h-11 items-center justify-center gap-2 rounded-full text-sm font-semibold text-text-on-accent disabled:opacity-60"
            style={{ backgroundImage: "var(--gradient-button-primary)" }}
          >
            {submitting ? "Requesting…" : "Withdraw"}
          </button>

          <p className="text-xs text-text-muted">Minimum withdrawal amount is {fmtCompact(MIN_WITHDRAWAL)}.</p>
        </div>
      )}
    </main>
  );
}
