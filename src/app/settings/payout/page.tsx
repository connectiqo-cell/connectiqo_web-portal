"use client";

import { CheckCircle2, Clock, Landmark, XCircle } from "lucide-react";
import { useEffect, useState } from "react";

import { useAuth } from "@/contexts/AuthContext";
import { payoutApi, type AccountStatusResponse } from "@/lib/api/payoutApi";

const STATUS_META: Record<
  AccountStatusResponse["status"],
  { label: string; icon: typeof CheckCircle2; className: string }
> = {
  active: { label: "Active", icon: CheckCircle2, className: "text-accent-success" },
  pending: { label: "Pending review", icon: Clock, className: "text-accent-warning" },
  needs_clarification: { label: "Needs clarification", icon: XCircle, className: "text-accent-warning" },
  suspended: { label: "Suspended", icon: XCircle, className: "text-accent-error" },
  not_started: { label: "Not set up", icon: Clock, className: "text-text-muted" },
};

export default function PayoutSetupPage() {
  const { user } = useAuth();
  const [status, setStatus] = useState<AccountStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [legalName, setLegalName] = useState("");
  const [phone, setPhone] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [upiId, setUpiId] = useState("");

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await payoutApi.getAccountStatus(user.id);
        if (!cancelled) setStatus(data);
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

  const handleSubmit = async () => {
    if (!user) return;
    if (!legalName || !phone || !addressLine1 || !city || !state || !postalCode) {
      setError("Fill in all required fields.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await payoutApi.createLinkedAccount({
        mentorId: user.id,
        legalName,
        phone,
        addressLine1,
        city,
        state,
        postalCode,
        upiId: upiId || undefined,
      });
      const fresh = await payoutApi.getAccountStatus(user.id);
      setStatus(fresh);
    } catch (err) {
      setError((err as Error)?.message || "Could not set up payout account");
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) return null;
  if (loading) return <main className="px-6 py-10 text-sm text-text-muted">Loading…</main>;

  const meta = status ? STATUS_META[status.status] : STATUS_META.not_started;
  const StatusIcon = meta.icon;

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-6 px-6 py-10">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Payout Setup</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Set up a Razorpay payout account to withdraw your earnings.
        </p>
      </div>

      <div className={`flex items-center gap-2 rounded-xl border border-border-light bg-surface-panel px-4 py-3 text-sm font-semibold ${meta.className}`}>
        <StatusIcon size={16} />
        {meta.label}
        {status?.upiId ? (
          <span className="ml-auto text-xs font-normal text-text-muted">UPI: {status.upiId}</span>
        ) : null}
      </div>

      {status?.status !== "active" ? (
        <div className="flex flex-col gap-4">
          {error ? <p className="text-sm text-accent-error">{error}</p> : null}

          <Field label="Legal name">
            <input
              value={legalName}
              onChange={(e) => setLegalName(e.target.value)}
              className="rounded-xl border border-border-light bg-surface-sheet px-3.5 py-2.5 text-sm text-text-primary focus:outline-none"
            />
          </Field>
          <Field label="Phone">
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="rounded-xl border border-border-light bg-surface-sheet px-3.5 py-2.5 text-sm text-text-primary focus:outline-none"
            />
          </Field>
          <Field label="Address">
            <input
              value={addressLine1}
              onChange={(e) => setAddressLine1(e.target.value)}
              className="rounded-xl border border-border-light bg-surface-sheet px-3.5 py-2.5 text-sm text-text-primary focus:outline-none"
            />
          </Field>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="City">
              <input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="rounded-xl border border-border-light bg-surface-sheet px-3.5 py-2.5 text-sm text-text-primary focus:outline-none"
              />
            </Field>
            <Field label="State">
              <input
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="rounded-xl border border-border-light bg-surface-sheet px-3.5 py-2.5 text-sm text-text-primary focus:outline-none"
              />
            </Field>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Postal code">
              <input
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                className="rounded-xl border border-border-light bg-surface-sheet px-3.5 py-2.5 text-sm text-text-primary focus:outline-none"
              />
            </Field>
            <Field label="UPI ID (optional)">
              <input
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                placeholder="name@upi"
                className="rounded-xl border border-border-light bg-surface-sheet px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
              />
            </Field>
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="flex h-11 w-fit items-center justify-center gap-2 rounded-full px-6 text-sm font-semibold text-text-on-accent disabled:opacity-60"
            style={{ backgroundImage: "var(--gradient-button-primary)" }}
          >
            <Landmark size={16} />
            {submitting ? "Submitting…" : "Set up payout account"}
          </button>
        </div>
      ) : null}
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
