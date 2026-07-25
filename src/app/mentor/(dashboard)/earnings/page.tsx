"use client";

import { ArrowDownToLine, Clock, Wallet as WalletIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";

import { useAuth } from "@/contexts/AuthContext";
import { earningsApi, type EarningRow } from "@/lib/api/earningsApi";
import { paymentApi } from "@/lib/api/paymentApi";

function formatWeekday(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-IN", { weekday: "short" });
}

export default function MentorEarningsPage() {
  const { user } = useAuth();
  const [wallet, setWallet] = useState({ balance: 0, total_earned: 0, total_withdrawn: 0 });
  const [weekly, setWeekly] = useState<{ date: string; amount: number }[]>([]);
  const [earnings, setEarnings] = useState<EarningRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [withdrawing, setWithdrawing] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
        const [walletData, weeklyData, earningsData] = await Promise.all([
          paymentApi.getWallet(user.id),
          earningsApi.getEarningsByWeek(user.id),
          earningsApi.getEarningsByMentor(user.id),
        ]);
        if (cancelled) return;
        setWallet(walletData);
        setWeekly(weeklyData);
        setEarnings(earningsData);
      } catch (err) {
        if (!cancelled) setError((err as Error)?.message || "Could not load earnings");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const handleWithdraw = async () => {
    if (!user || wallet.balance <= 0) return;
    setWithdrawing(true);
    setNotice("");
    setError("");
    try {
      await paymentApi.requestWithdrawal({ mentorId: user.id, amount: wallet.balance });
      setNotice("Withdrawal requested.");
      const fresh = await paymentApi.getWallet(user.id);
      setWallet(fresh);
    } catch (err) {
      setError((err as Error)?.message || "Withdrawal failed");
    } finally {
      setWithdrawing(false);
    }
  };

  const chartData = weekly.map((w) => ({ day: formatWeekday(w.date), amount: w.amount }));

  if (loading) return <p className="text-sm text-text-muted">Loading…</p>;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-3 gap-3">
        <WalletTile icon={WalletIcon} label="Available" value={wallet.balance} />
        <WalletTile icon={Clock} label="Total earned" value={wallet.total_earned} />
        <WalletTile icon={ArrowDownToLine} label="Withdrawn" value={wallet.total_withdrawn} />
      </div>

      <button
        type="button"
        onClick={handleWithdraw}
        disabled={withdrawing || wallet.balance <= 0}
        className="flex h-11 w-fit items-center justify-center gap-2 rounded-full px-6 text-sm font-semibold text-text-on-accent disabled:opacity-50"
        style={{ backgroundImage: "var(--gradient-button-primary)" }}
      >
        {withdrawing ? "Requesting…" : "Withdraw available balance"}
      </button>

      {notice ? <p className="text-sm text-accent-success">{notice}</p> : null}
      {error ? <p className="text-sm text-accent-error">{error}</p> : null}

      <div className="flex flex-col gap-3 rounded-2xl border border-border-light bg-surface-panel p-4">
        <h2 className="text-sm font-semibold text-text-primary">This week</h2>
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <XAxis
                dataKey="day"
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
              />
              <Bar dataKey="amount" fill="var(--color-accent-link)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-text-primary">Recent earnings</h2>
        {earnings.length === 0 ? (
          <p className="py-8 text-center text-sm text-text-muted">No earnings yet.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {earnings.map((earning) => (
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
      </div>
    </div>
  );
}

function WalletTile({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof WalletIcon;
  label: string;
  value: number;
}) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-xl border border-border-light bg-surface-panel py-3">
      <Icon size={16} className="text-accent-link" />
      <span className="text-sm font-bold text-text-primary">₹{value.toFixed(0)}</span>
      <span className="text-[11px] text-text-muted">{label}</span>
    </div>
  );
}
