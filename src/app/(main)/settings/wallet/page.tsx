"use client";

import {
  ArrowDownToLine,
  ChevronRight,
  Clock,
  HeadphonesIcon,
  Landmark,
  Receipt,
  TrendingUp,
  Wallet as WalletIcon,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";

import { useAuth } from "@/contexts/AuthContext";
import { earningsApi, type EarningRow } from "@/lib/api/earningsApi";
import { paymentApi, type WithdrawalRequestRow } from "@/lib/api/paymentApi";
import { payoutApi, type AccountStatusResponse } from "@/lib/api/payoutApi";
import { useWithdrawalRequestsRealtime } from "@/lib/hooks/useWithdrawalRequestsRealtime";
import { ROUTES } from "@/lib/routes";

const SUPPORT_EMAIL = "contact@connectiqo.com";
const MIN_WITHDRAWAL = 5000;

const WITHDRAWAL_STATUS_STYLE: Record<string, string> = {
  pending: "bg-accent-warning/15 text-accent-warning",
  processing: "bg-accent-link/15 text-accent-link",
  completed: "bg-accent-success/15 text-accent-success",
  rejected: "bg-accent-error/15 text-accent-error",
};
const WITHDRAWAL_STATUS_LABEL: Record<string, string> = {
  pending: "Pending",
  processing: "Processing",
  completed: "Completed",
  rejected: "Rejected",
};

type Period = "week" | "month" | "year";

const PERIOD_LABEL: Record<Period, string> = { week: "Weekly trend", month: "Monthly trend", year: "Yearly trend" };

function fmtCompact(n: number) {
  return `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

function formatWeekday(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-IN", { weekday: "short" });
}

type ActivityRow = {
  id: string;
  date: string;
  description: string;
  type: "Earning" | "Withdrawal";
  amount: number;
  status: string;
};

export default function WalletPage() {
  const { user } = useAuth();
  const [wallet, setWallet] = useState({ balance: 0, total_earned: 0, total_withdrawn: 0 });
  const [payoutStatus, setPayoutStatus] = useState<AccountStatusResponse | null>(null);
  const [earnings, setEarnings] = useState<EarningRow[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequestRow[]>([]);
  const [period, setPeriod] = useState<Period>("week");
  const [periodData, setPeriodData] = useState<{ label: string; amount: number }[]>([]);
  const [periodLoading, setPeriodLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadWallet = async (userId: string) => {
    const [w, status, earningsData, withdrawalData] = await Promise.all([
      paymentApi.getWallet(userId),
      payoutApi.getAccountStatus(userId).catch(() => null),
      earningsApi.getEarningsByMentor(userId),
      paymentApi.getWithdrawalRequests(userId).catch(() => []),
    ]);
    setWallet(w);
    setPayoutStatus(status);
    setEarnings(earningsData);
    setWithdrawals(withdrawalData);
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

  useWithdrawalRequestsRealtime(
    user?.id,
    useMemo(() => () => { if (user) void loadWallet(user.id); }, [user]),
  );

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      setPeriodLoading(true);
      try {
        const rows =
          period === "week"
            ? (await earningsApi.getEarningsByWeek(user.id)).map((r) => ({
                label: formatWeekday(r.date),
                amount: r.amount,
              }))
            : period === "month"
              ? await earningsApi.getEarningsByMonth(user.id)
              : await earningsApi.getEarningsByYear(user.id);
        if (!cancelled) setPeriodData(rows);
      } catch {
        if (!cancelled) setPeriodData([]);
      } finally {
        if (!cancelled) setPeriodLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, period]);

  const hasUpi = Boolean(payoutStatus?.upiId);
  const hasBankDetails = Boolean(payoutStatus?.bankAccount && payoutStatus?.ifsc);
  const hasPayoutMethod = hasUpi || hasBankDetails;
  const canWithdraw = wallet.balance >= MIN_WITHDRAWAL && hasPayoutMethod;
  const pending = withdrawals.filter((w) => w.status === "pending" || w.status === "processing");
  const pendingTotal = pending.reduce((sum, w) => sum + w.amount, 0);

  const activity = useMemo<ActivityRow[]>(() => {
    const earningRows: ActivityRow[] = earnings.map((e) => ({
      id: `e-${e.id}`,
      date: e.created_at,
      description: `Session with ${e.bookings?.profiles?.name || "Learner"}`,
      type: "Earning",
      amount: parseFloat(String(e.amount)) || 0,
      status: e.status === "completed" ? "Completed" : "Pending",
    }));
    const withdrawalRows: ActivityRow[] = withdrawals.map((w) => ({
      id: `w-${w.id}`,
      date: w.created_at,
      description: `Withdrawal to ${w.upi_id || "bank"}`,
      type: "Withdrawal",
      amount: -w.amount,
      status: w.status,
    }));
    return [...earningRows, ...withdrawalRows].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
  }, [earnings, withdrawals]);

  const peak = useMemo(
    () => earnings.reduce((max, e) => Math.max(max, parseFloat(String(e.amount)) || 0), 0),
    [earnings],
  );
  const thisMonthTotal = useMemo(() => {
    const now = new Date();
    return earnings
      .filter((e) => {
        const d = new Date(e.created_at);
        return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
      })
      .reduce((sum, e) => sum + (parseFloat(String(e.amount)) || 0), 0);
  }, [earnings]);

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
    const destination =
      payoutStatus?.upiId ||
      (payoutStatus?.bankAccount ? `${payoutStatus.bankAccount} (${payoutStatus.ifsc})` : "your saved payout details");
    const confirmed = window.confirm(
      `Send ${fmtCompact(value)} to ${destination}?\n\nProcessed within 1–2 business days.`,
    );
    if (!confirmed) return;

    setSubmitting(true);
    try {
      await paymentApi.requestWithdrawal({ mentorId: user.id, amount: value });
      setSuccess("Withdrawal requested — you'll be notified once it's processed.");
      setAmount("");
      setShowWithdraw(false);
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
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-6 py-10">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Earnings</h1>
        <p className="mt-1 text-sm text-text-secondary">Track your income and transactions</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px] lg:items-start">
        <div className="flex flex-col gap-6">
          <div
            className="flex items-center justify-between rounded-2xl border border-border-light p-6"
            style={{ backgroundImage: "linear-gradient(135deg, var(--color-accent-link)/8, var(--color-accent-secondary)/8)" }}
          >
            <div className="flex items-center gap-4">
              <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-accent-link/15 text-accent-link">
                <WalletIcon size={32} />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">Total Earnings</p>
                <p className="text-3xl font-bold text-text-primary">{fmtCompact(wallet.total_earned)}</p>
                <p className="text-xs text-text-muted">Lifetime from completed sessions</p>
              </div>
            </div>
            <svg width="100" height="80" viewBox="0 0 100 80" fill="none" className="hidden shrink-0 sm:block" style={{ opacity: 0.3 }}>
              {/* Wallet body */}
              <rect x="20" y="25" width="50" height="45" rx="8" fill="#8b5fbf" />
              {/* Wallet shine */}
              <ellipse cx="45" cy="35" rx="20" ry="8" fill="#a68edd" />
              {/* Coin 1 - top right */}
              <circle cx="75" cy="10" r="12" fill="#ffd700" />
              <circle cx="75" cy="10" r="10" fill="#ffed4e" />
              {/* Coin 2 - middle right */}
              <circle cx="85" cy="35" r="10" fill="#ffd700" />
              <circle cx="85" cy="35" r="8" fill="#ffed4e" />
              {/* Coin 3 - bottom */}
              <circle cx="55" cy="65" r="9" fill="#ffd700" />
              <circle cx="55" cy="65" r="7" fill="#ffed4e" />
            </svg>
          </div>

          {error ? <p className="text-sm text-accent-error">{error}</p> : null}

          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <StatTile icon={Receipt} label="Transactions" value={String(earnings.length)} />
            <StatTile icon={Clock} label="Peak Earning" value={fmtCompact(peak)} />
            <StatTile icon={TrendingUp} label="This Month" value={fmtCompact(thisMonthTotal)} />
          </div>

          <div className="flex flex-col gap-3 rounded-2xl border border-border-light bg-surface-panel p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-text-primary">{PERIOD_LABEL[period]}</h2>
              <div className="flex gap-1 rounded-full border border-border-light bg-surface-sheet p-1">
                {(["week", "month", "year"] as Period[]).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPeriod(p)}
                    className={`rounded-full px-3 py-1 text-xs font-semibold capitalize transition-colors ${
                      period === p ? "bg-accent-link/15 text-accent-link" : "text-text-muted hover:text-text-secondary"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
            <div className="h-48 w-full">
              {periodLoading ? (
                <div className="flex h-full items-center justify-center text-xs text-text-muted">Loading…</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={periodData}>
                    <XAxis dataKey="label" stroke="var(--color-text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip
                      cursor={{ fill: "var(--color-surface-chip)" }}
                      contentStyle={{
                        background: "var(--color-surface-sheet)",
                        border: "1px solid var(--color-border-light)",
                        borderRadius: 12,
                        fontSize: 12,
                      }}
                      formatter={(value) => [`₹${value}`, "Earned"]}
                    />
                    <Bar dataKey="amount" fill="var(--color-accent-link)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-3 rounded-2xl border border-border-light bg-surface-panel p-4">
            <h2 className="text-sm font-semibold text-text-primary">Transactions</h2>
            {activity.length === 0 ? (
              <p className="py-8 text-center text-sm text-text-muted">No transactions yet.</p>
            ) : (
              <>
                {/* Mobile: stacked cards instead of a horizontally-scrolling table */}
                <div className="flex flex-col gap-3 sm:hidden">
                  {activity.slice(0, 5).map((row) => (
                    <div key={row.id} className="flex flex-col gap-1.5 rounded-xl border border-border-light p-3">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs font-medium text-text-primary">{row.description}</span>
                        <span
                          className={`shrink-0 text-xs font-semibold ${row.amount >= 0 ? "text-accent-success" : "text-accent-error"}`}
                        >
                          {row.amount >= 0 ? "+" : "−"}₹{Math.abs(row.amount).toFixed(0)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] text-text-muted">
                          {new Date(row.date).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                        </span>
                        <span
                          className={`rounded-full px-2 py-1 text-[11px] font-semibold ${
                            row.type === "Withdrawal"
                              ? WITHDRAWAL_STATUS_STYLE[row.status] || "bg-surface-chip text-text-secondary"
                              : "bg-surface-chip text-text-secondary"
                          }`}
                        >
                          {row.type === "Withdrawal" ? WITHDRAWAL_STATUS_LABEL[row.status] || row.status : row.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* sm and up: full table */}
                <div className="hidden overflow-x-auto sm:block">
                  <table className="w-full min-w-[500px] border-collapse text-left text-sm">
                    <thead>
                      <tr className="text-[11px] uppercase tracking-wide text-text-muted">
                        <th className="pb-2 font-semibold">Date &amp; Time</th>
                        <th className="pb-2 font-semibold">Description</th>
                        <th className="pb-2 font-semibold">Amount</th>
                        <th className="pb-2 text-right font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activity.slice(0, 5).map((row) => (
                        <tr key={row.id} className="border-t border-border-light">
                          <td className="py-3 pr-3 text-xs text-text-secondary">
                            {new Date(row.date).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                          </td>
                          <td className="py-3 pr-3 text-xs font-medium text-text-primary">{row.description}</td>
                          <td
                            className={`py-3 pr-3 text-xs font-semibold ${row.amount >= 0 ? "text-accent-success" : "text-accent-error"}`}
                          >
                            {row.amount >= 0 ? "+" : "−"}₹{Math.abs(row.amount).toFixed(0)}
                          </td>
                          <td className="py-3 text-right">
                            <span
                              className={`rounded-full px-2 py-1 text-[11px] font-semibold ${
                                row.type === "Withdrawal"
                                  ? WITHDRAWAL_STATUS_STYLE[row.status] || "bg-surface-chip text-text-secondary"
                                  : "bg-surface-chip text-text-secondary"
                              }`}
                            >
                              {row.type === "Withdrawal" ? WITHDRAWAL_STATUS_LABEL[row.status] || row.status : row.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
            <Link
              href={ROUTES.transactions}
              className="flex items-center justify-center gap-1 text-sm font-semibold text-accent-link"
            >
              View All Transactions
              <ChevronRight size={14} />
            </Link>
          </div>
        </div>

        <aside className="flex flex-col gap-4">
          <div className="rounded-2xl border border-border-light bg-surface-panel p-4">
            <div className="mb-3 flex items-center gap-2 text-text-muted">
              <WalletIcon size={15} className="text-accent-link" />
              <h3 className="text-sm font-bold text-text-primary">Payout Balance</h3>
            </div>
            <p className="mb-3 text-2xl font-bold text-text-primary">{fmtCompact(wallet.balance)}</p>
            <p className="mb-4 text-xs text-text-muted">Available for payout</p>

            {!hasPayoutMethod ? (
              <Link
                href={ROUTES.payoutSetup}
                className="flex items-center justify-center gap-1.5 rounded-full border border-border-light px-4 py-2.5 text-xs font-semibold text-text-secondary hover:text-text-primary"
              >
                <Landmark size={13} />
                Set up payout account
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => setShowWithdraw((v) => !v)}
                disabled={!canWithdraw}
                className="w-full rounded-full px-4 py-2.5 text-sm font-semibold text-text-on-accent disabled:opacity-50"
                style={{ backgroundImage: "var(--gradient-button-primary)" }}
              >
                Withdraw Earnings
              </button>
            )}
            {!canWithdraw && hasPayoutMethod ? (
              <p className="mt-2 text-[11px] text-text-muted">
                Minimum {fmtCompact(MIN_WITHDRAWAL)} balance required to withdraw.
              </p>
            ) : null}

            {showWithdraw ? (
              <div className="mt-3 flex flex-col gap-2 border-t border-border-light pt-3">
                {success ? <p className="text-xs text-accent-success">{success}</p> : null}
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder={`Min ${fmtCompact(MIN_WITHDRAWAL)}`}
                  disabled={submitting}
                  className="rounded-xl border border-border-light bg-surface-sheet px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none disabled:opacity-50"
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
                      disabled={submitting}
                      className="rounded-full border border-border-light px-2.5 py-1 text-[11px] font-semibold text-text-secondary hover:text-text-primary disabled:opacity-50"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={handleWithdraw}
                  disabled={submitting}
                  className="flex h-9 items-center justify-center rounded-full text-xs font-semibold text-text-on-accent disabled:opacity-60"
                  style={{ backgroundImage: "var(--gradient-button-primary)" }}
                >
                  {submitting ? "Requesting…" : "Confirm withdrawal"}
                </button>
              </div>
            ) : null}

            <div className="mt-4 flex flex-col gap-1.5 border-t border-border-light pt-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-text-muted">Total Earnings</span>
                <span className="font-semibold text-text-secondary">{fmtCompact(wallet.total_earned)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text-muted">Withdrawn</span>
                <span className="font-semibold text-text-secondary">{fmtCompact(wallet.total_withdrawn)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text-muted">Pending</span>
                <span className="font-semibold text-text-secondary">{fmtCompact(pendingTotal)}</span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border-light bg-surface-panel p-4">
            <h3 className="mb-3 text-sm font-bold text-text-primary">Withdrawal History</h3>
            {withdrawals.length === 0 ? (
              <p className="text-xs text-text-muted">No withdrawal requests yet.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {withdrawals.slice(0, 5).map((w) => (
                  <div key={w.id} className="flex flex-col gap-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-text-primary">{fmtCompact(w.amount)}</span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          WITHDRAWAL_STATUS_STYLE[w.status] || "bg-surface-chip text-text-secondary"
                        }`}
                      >
                        {WITHDRAWAL_STATUS_LABEL[w.status] || w.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-text-muted">
                      {new Date(w.created_at).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                      {w.status === "completed" && w.payout_reference ? ` · Ref ${w.payout_reference}` : ""}
                    </p>
                    {w.status === "rejected" && w.rejected_reason ? (
                      <p className="text-[11px] text-accent-error">{w.rejected_reason}</p>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-border-light bg-surface-panel p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-bold text-text-primary">Recent Activity</h3>
              <Link href={ROUTES.transactions} className="text-xs font-semibold text-accent-link">
                View all
              </Link>
            </div>
            {activity.length === 0 ? (
              <p className="text-xs text-text-muted">No activity yet.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {activity.slice(0, 5).map((row) => (
                  <div key={row.id} className="flex items-center gap-2.5">
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                        row.type === "Withdrawal" ? "bg-accent-secondary/10 text-accent-secondary" : "bg-accent-success/10 text-accent-success"
                      }`}
                    >
                      {row.type === "Withdrawal" ? <ArrowDownToLine size={14} /> : <TrendingUp size={14} />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold text-text-primary">{row.description}</p>
                      <p className="text-[11px] text-text-muted">
                        {new Date(row.date).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 text-xs font-semibold ${row.amount >= 0 ? "text-accent-success" : "text-accent-error"}`}
                    >
                      {row.amount >= 0 ? "+" : "−"}₹{Math.abs(row.amount).toFixed(0)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3 rounded-2xl border border-border-light bg-surface-panel p-4">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-link/10 text-accent-link">
                <HeadphonesIcon size={16} />
              </span>
              <h3 className="text-sm font-bold text-text-primary">Need Help?</h3>
            </div>
            <p className="text-xs text-text-muted">
              Our support team is here to help you with your earnings and payouts.
            </p>
            <a
              href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent("Connectiqo Support")}`}
              className="rounded-full border border-border-light px-4 py-2 text-center text-xs font-semibold text-text-secondary hover:text-text-primary"
            >
              Contact Support
            </a>
          </div>
        </aside>
      </div>
    </main>
  );
}

function StatTile({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof WalletIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-xl border border-border-light bg-surface-panel px-1 py-2 sm:py-3">
      <Icon size={16} className="text-accent-link" />
      <span className="text-xs sm:text-sm font-bold text-text-primary whitespace-nowrap">{value}</span>
      <span className="text-[10px] sm:text-[11px] text-text-muted text-center leading-tight">{label}</span>
    </div>
  );
}
