"use client";

import { Clock, Receipt, TrendingUp, Wallet as WalletIcon } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";

import { useAuth } from "@/contexts/AuthContext";
import { earningsApi, type EarningRow } from "@/lib/api/earningsApi";
import { paymentApi } from "@/lib/api/paymentApi";
import { ROUTES } from "@/lib/routes";

type Period = "week" | "month" | "year";

const PERIOD_LABEL: Record<Period, string> = { week: "Weekly trend", month: "Monthly trend", year: "Yearly trend" };
const PERIOD_TOTAL_LABEL: Record<Period, string> = { week: "This week", month: "This month", year: "This year" };

function formatWeekday(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-IN", { weekday: "short" });
}

export default function MentorEarningsPage() {
  const { user } = useAuth();
  const [wallet, setWallet] = useState({ balance: 0, total_earned: 0, total_withdrawn: 0 });
  const [period, setPeriod] = useState<Period>("week");
  const [periodData, setPeriodData] = useState<{ label: string; amount: number }[]>([]);
  const [periodLoading, setPeriodLoading] = useState(false);
  const [earnings, setEarnings] = useState<EarningRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
        const [walletData, earningsData] = await Promise.all([
          paymentApi.getWallet(user.id),
          earningsApi.getEarningsByMentor(user.id),
        ]);
        if (cancelled) return;
        setWallet(walletData);
        setEarnings(earningsData);
      } catch {
        // Silently fail, show empty state.
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

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

  const periodTotal = useMemo(() => periodData.reduce((sum, p) => sum + p.amount, 0), [periodData]);
  const peak = useMemo(
    () => earnings.reduce((max, e) => Math.max(max, parseFloat(String(e.amount)) || 0), 0),
    [earnings],
  );

  if (loading) return <p className="text-sm text-text-muted">Loading…</p>;

  return (
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
            <p className="text-3xl font-bold text-text-primary">₹{wallet.total_earned.toFixed(0)}</p>
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

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatTile icon={Receipt} label="Transactions" value={String(earnings.length)} />
        <StatTile icon={Clock} label="Peak Earning" value={`₹${peak.toFixed(0)}`} />
        <StatTile icon={TrendingUp} label={PERIOD_TOTAL_LABEL[period]} value={`₹${periodTotal.toFixed(0)}`} />
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-border-light bg-surface-panel p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-text-primary">Earnings Trend</h2>
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
                {p === "week" ? "Week" : p === "month" ? "Month" : "Year"}
              </button>
            ))}
          </div>
        </div>
        <div className="h-56 w-full">
          {periodLoading ? (
            <div className="flex h-full items-center justify-center text-xs text-text-muted">Loading…</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={periodData} margin={{ top: 20, right: 10, left: 0, bottom: 20 }}>
                <XAxis
                  dataKey="label"
                  stroke="var(--color-text-muted)"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  cursor={{ fill: "var(--color-surface-chip)" }}
                  contentStyle={{
                    background: "var(--color-surface-sheet)",
                    border: "1px solid var(--color-border-light)",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                  formatter={(value) => [`₹${value}`, "Earned"]}
                  labelFormatter={() => ""}
                />
                <Bar dataKey="amount" fill="var(--color-accent-link)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-text-primary">Transactions</h2>
        {earnings.length === 0 ? (
          <p className="py-8 text-center text-sm text-text-muted">No transactions yet.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {earnings.slice(0, 5).map((earning) => (
              <div
                key={earning.id}
                className="flex items-center justify-between rounded-xl border border-border-light bg-surface-panel px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-text-primary">
                    {earning.bookings?.profiles?.name || "Learner"}
                  </p>
                  <p className="text-xs text-text-muted">
                    {new Date(earning.created_at).toLocaleDateString("en-IN", {
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <span className="text-sm font-semibold text-accent-success">
                  +₹{parseFloat(String(earning.amount)).toFixed(0)}
                </span>
              </div>
            ))}
          </div>
        )}
        {earnings.length > 5 ? (
          <Link
            href={ROUTES.transactions}
            className="flex items-center justify-center gap-1 text-sm font-semibold text-accent-link"
          >
            View all transactions
          </Link>
        ) : null}
      </div>
    </div>
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
    <div className="flex flex-col items-center gap-1 rounded-xl border border-border-light bg-surface-panel py-3">
      <Icon size={16} className="text-accent-link" />
      <span className="text-sm font-bold text-text-primary">{value}</span>
      <span className="text-[11px] text-text-muted">{label}</span>
    </div>
  );
}
