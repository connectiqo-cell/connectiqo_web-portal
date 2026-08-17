"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useAuth } from "@/contexts/AuthContext";
import { paymentApi, type TransactionRow } from "@/lib/api/paymentApi";
import { ROUTES } from "@/lib/routes";
import { createClient } from "@/lib/supabase/client";

interface Profile {
  id: string;
  name: string | null;
}

export default function TransactionsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [transactions, setTransactions] = useState<TransactionRow[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authLoading && !user) router.replace(ROUTES.login);
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
        const rows = await paymentApi.getTransactions(user.id);
        if (cancelled) return;
        setTransactions(rows);

        const otherIds = [
          ...new Set(
            rows.map((t) => (t.learner_id === user.id ? t.mentor_id : t.learner_id)),
          ),
        ];
        if (otherIds.length) {
          const supabase = createClient();
          const { data } = await supabase.from("profiles").select("id, name").in("id", otherIds);
          if (!cancelled && data) {
            setProfiles(Object.fromEntries(data.map((p) => [p.id, p as Profile])));
          }
        }
      } catch (err) {
        if (!cancelled) setError((err as Error)?.message || "Could not load transactions");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  if (!user) return null;

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-12">
      <h1 className="text-2xl font-bold text-text-primary">Transaction History</h1>

      {error ? <p className="text-sm text-accent-error">{error}</p> : null}

      {loading ? (
        <p className="py-8 text-center text-sm text-text-muted">Loading…</p>
      ) : transactions.length === 0 ? (
        <p className="py-8 text-center text-sm text-text-muted">No transactions yet.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {transactions.map((txn) => {
            const asLearner = txn.learner_id === user.id;
            const otherId = asLearner ? txn.mentor_id : txn.learner_id;
            const otherName = profiles[otherId]?.name || (asLearner ? "Mentor" : "Learner");
            const amount = asLearner
              ? txn.amount_total_paise / 100
              : txn.mentor_earning_paise / 100;

            return (
              <div
                key={txn.id}
                className="flex items-center justify-between rounded-xl border border-border-light bg-surface-panel px-4 py-3.5"
              >
                <div>
                  <p className="text-sm font-semibold text-text-primary">
                    {asLearner ? `Session with ${otherName}` : `Payment from ${otherName}`}
                  </p>
                  <p className="text-xs text-text-muted">
                    {new Date(txn.created_at).toLocaleDateString("en-IN", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <span
                  className={`text-sm font-semibold ${asLearner ? "text-text-primary" : "text-accent-success"}`}
                >
                  {asLearner ? "−" : "+"}₹{amount.toFixed(0)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
