"use client";

import { CheckCircle2, Clock, Landmark, Pencil } from "lucide-react";
import { useEffect, useState } from "react";

import { useAuth } from "@/contexts/AuthContext";
import { payoutApi, type AccountStatusResponse } from "@/lib/api/payoutApi";

const STATUS_META: Record<
  AccountStatusResponse["status"],
  { label: string; icon: typeof CheckCircle2; className: string }
> = {
  active: { label: "Active", icon: CheckCircle2, className: "text-accent-success" },
  not_started: { label: "Not set up", icon: Clock, className: "text-text-muted" },
};

export default function PayoutSetupPage() {
  const { user } = useAuth();
  const [status, setStatus] = useState<AccountStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [upiId, setUpiId] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [ifsc, setIfsc] = useState("");
  const [accountHolderName, setAccountHolderName] = useState("");
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await payoutApi.getAccountStatus(user.id);
        if (!cancelled) {
          setStatus(data);
          if (data.upiId) setUpiId((prev) => prev || data.upiId || "");
          if (data.bankAccount) setBankAccount((prev) => prev || data.bankAccount || "");
          if (data.ifsc) setIfsc((prev) => prev || data.ifsc || "");
          if (data.accountHolderName) setAccountHolderName((prev) => prev || data.accountHolderName || "");
        }
      } catch (err) {
        if (!cancelled) setError((err as Error)?.message || "Could not load payout status");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const startEdit = () => {
    setUpiId(status?.upiId || "");
    setBankAccount(status?.bankAccount || "");
    setIfsc(status?.ifsc || "");
    setError("");
    setSuccess("");
    setEditMode(true);
  };

  const cancelEdit = () => {
    setUpiId(status?.upiId || "");
    setBankAccount(status?.bankAccount || "");
    setIfsc(status?.ifsc || "");
    setError("");
    setEditMode(false);
  };

  const handleSubmit = async () => {
    if (!user) return;
    const hasBank = bankAccount.trim() || ifsc.trim();
    if (!upiId.trim() && !hasBank) {
      setError("Enter a UPI ID or a bank account + IFSC.");
      return;
    }
    if (hasBank && (!bankAccount.trim() || !ifsc.trim())) {
      setError("Bank account number and IFSC are both required together.");
      return;
    }
    setSubmitting(true);
    setError("");
    setSuccess("");
    try {
      const res = await payoutApi.createLinkedAccount({
        mentorId: user.id,
        upiId: upiId.trim() || undefined,
        bankAccount: bankAccount.trim() || undefined,
        ifsc: ifsc.trim() || undefined,
        accountHolderName: accountHolderName.trim() || undefined,
      });
      setStatus(res as AccountStatusResponse);
      setSuccess("Payout details saved.");
      setEditMode(false);
    } catch (err) {
      setError((err as Error)?.message || "Could not save payout details");
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) return null;
  if (loading) return <main className="px-6 py-10 text-sm text-text-muted">Loading…</main>;

  const meta = status ? STATUS_META[status.status] : STATUS_META.not_started;
  const StatusIcon = meta.icon;
  const isActive = status?.status === "active";
  const showForm = editMode || !isActive;

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-6 px-6 py-10">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Payout Setup</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Add a UPI ID, a bank account, or both — used to send your withdrawals.
        </p>
      </div>

      <div className={`flex items-center gap-2 rounded-xl border border-border-light bg-surface-panel px-4 py-3 text-sm font-semibold ${meta.className}`}>
        <StatusIcon size={16} />
        {meta.label}
        {status?.upiId ? (
          <span className="ml-auto text-xs font-normal text-text-muted">UPI: {status.upiId}</span>
        ) : status?.bankAccount ? (
          <span className="ml-auto text-xs font-normal text-text-muted">
            {status.bankAccount} · {status.ifsc}
          </span>
        ) : null}
      </div>

      {error ? <p className="text-sm text-accent-error">{error}</p> : null}
      {success ? <p className="text-sm text-accent-success">{success}</p> : null}

      {!showForm ? (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2 rounded-xl border border-border-light bg-surface-panel p-4">
            {status?.upiId ? (
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-muted">UPI ID</span>
                <span className="font-semibold text-text-primary">{status.upiId}</span>
              </div>
            ) : null}
            {status?.bankAccount ? (
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-muted">Bank account</span>
                <span className="font-semibold text-text-primary">
                  {status.bankAccount} · {status.ifsc}
                </span>
              </div>
            ) : null}
          </div>
          <button
            type="button"
            onClick={startEdit}
            className="flex h-10 w-fit items-center justify-center gap-2 rounded-full border border-border-light px-5 text-sm font-semibold text-text-secondary hover:text-text-primary"
          >
            <Pencil size={14} />
            Edit UPI / bank details
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <Field label="UPI ID">
            <input
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              placeholder="name@upi"
              className="rounded-xl border border-border-light bg-surface-sheet px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
            />
          </Field>

          <div className="flex flex-col gap-3 rounded-xl border border-border-light p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
              Bank account (for NEFT/IMPS) — optional
            </p>
            <Field label="Account number">
              <input
                value={bankAccount}
                onChange={(e) => setBankAccount(e.target.value)}
                placeholder="1234567890"
                className="rounded-xl border border-border-light bg-surface-sheet px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
              />
            </Field>
            <Field label="IFSC code">
              <input
                value={ifsc}
                onChange={(e) => setIfsc(e.target.value.toUpperCase())}
                placeholder="HDFC0001234"
                className="rounded-xl border border-border-light bg-surface-sheet px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
              />
            </Field>
            <Field label="Account holder name">
              <input
                value={accountHolderName}
                onChange={(e) => setAccountHolderName(e.target.value)}
                placeholder="As per bank records"
                className="rounded-xl border border-border-light bg-surface-sheet px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
              />
            </Field>
          </div>

          <p className="text-xs text-text-muted">
            We never share your payout details outside the payout team. Withdrawals are settled
            manually via UPI/IMPS/NEFT within 1–2 business days.
          </p>

          <div className="flex items-center gap-2">
            {isActive ? (
              <button
                type="button"
                onClick={cancelEdit}
                disabled={submitting}
                className="flex h-11 items-center justify-center rounded-full border border-border-light px-5 text-sm font-semibold text-text-secondary hover:text-text-primary disabled:opacity-60"
              >
                Cancel
              </button>
            ) : null}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="flex h-11 items-center justify-center gap-2 rounded-full px-6 text-sm font-semibold text-text-on-accent disabled:opacity-60"
              style={{ backgroundImage: "var(--gradient-button-primary)" }}
            >
              <Landmark size={16} />
              {submitting ? "Saving…" : isActive ? "Save changes" : "Save payout details"}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold uppercase tracking-wide text-text-muted">
        {label}
      </span>
      {children}
    </label>
  );
}
