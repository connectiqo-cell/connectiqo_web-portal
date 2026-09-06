"use client";

import { Search, Snowflake, Sun } from "lucide-react";
import { useState } from "react";

import { adminApi, type AdminProfileRow } from "@/lib/api/adminApi";

function isoDateDaysFromNow(days: number): string {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
}

export default function AdminUsersPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<AdminProfileRow[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError("");
    try {
      setResults(await adminApi.searchProfiles(query.trim()));
      setSearched(true);
    } catch (err) {
      setError((err as Error)?.message || "Search failed");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleBanLogin = async (profile: AdminProfileRow) => {
    const action = profile.is_frozen ? "restore login for" : "ban login for";
    if (!window.confirm(`${action} ${profile.name || profile.email}?`)) return;
    setBusyId(profile.id);
    setError("");
    try {
      await adminApi.setUserFrozen(profile.id, !profile.is_frozen);
      setResults((prev) =>
        prev.map((p) => (p.id === profile.id ? { ...p, is_frozen: !p.is_frozen } : p)),
      );
    } catch (err) {
      setError((err as Error)?.message || `Could not ${action} user`);
    } finally {
      setBusyId(null);
    }
  };

  const handleMentorFreeze = async (profile: AdminProfileRow) => {
    const days = window.prompt(
      "Freeze mentor for how many days? (blank = indefinite)",
      "7",
    );
    if (days === null) return;
    const trimmed = days.trim();
    let until: string | null = null;
    if (trimmed) {
      const n = Number(trimmed);
      if (!Number.isFinite(n) || n <= 0) {
        setError("Enter a positive number of days, or leave blank for indefinite.");
        return;
      }
      until = isoDateDaysFromNow(n);
    }
    const reason = window.prompt("Reason (optional)") || null;
    setBusyId(profile.id);
    setError("");
    try {
      await adminApi.freezeMentor({ mentorId: profile.id, until, reason });
      window.alert("Mentor side frozen (learner access stays open).");
    } catch (err) {
      setError((err as Error)?.message || "Mentor freeze failed — run mentor_side_freeze migration");
    } finally {
      setBusyId(null);
    }
  };

  const handleMentorUnfreeze = async (profile: AdminProfileRow) => {
    if (!window.confirm(`Unfreeze mentor side for ${profile.name || profile.email}?`)) return;
    setBusyId(profile.id);
    setError("");
    try {
      await adminApi.unfreezeMentor(profile.id);
      window.alert("Mentor side restored.");
    } catch (err) {
      setError((err as Error)?.message || "Mentor unfreeze failed");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-text-secondary">
        <strong>Ban login</strong> blocks the whole account. <strong>Freeze mentor</strong> only hides
        their mentor profile/videos and pauses unlocks.
      </p>

      <div className="flex gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          placeholder="Search by name, email, or username"
          className="flex-1 rounded-xl border border-border-light bg-surface-sheet px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
        />
        <button
          type="button"
          onClick={handleSearch}
          disabled={loading || !query.trim()}
          className="flex items-center justify-center gap-1.5 rounded-xl bg-accent-link/15 px-4 py-2 text-sm font-semibold text-accent-link disabled:opacity-50"
        >
          <Search size={16} />
          Search
        </button>
      </div>

      {error ? <p className="text-sm text-accent-error">{error}</p> : null}

      {loading ? (
        <p className="text-sm text-text-muted">Searching…</p>
      ) : searched && results.length === 0 ? (
        <p className="py-8 text-center text-sm text-text-muted">No users found.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {results.map((profile) => (
            <div
              key={profile.id}
              className="flex flex-col gap-3 rounded-xl border border-border-light bg-surface-panel px-4 py-3 sm:flex-row sm:items-center"
            >
              <div className="flex-1">
                <p className="text-sm font-semibold text-text-primary">
                  {profile.name || "Unnamed"}
                  {profile.is_admin ? (
                    <span className="ml-2 rounded-full bg-accent-link/15 px-2 py-0.5 text-[10px] font-bold uppercase text-accent-link">
                      Admin
                    </span>
                  ) : null}
                </p>
                <p className="text-xs text-text-muted">{profile.email}</p>
                <p className="text-[11px] text-text-muted">role: {profile.role || "—"}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={busyId === profile.id}
                  onClick={() => handleMentorFreeze(profile)}
                  className="flex items-center gap-1.5 rounded-full bg-amber-500/15 px-3 py-1.5 text-xs font-semibold text-amber-700 disabled:opacity-50"
                >
                  <Snowflake size={13} />
                  Freeze mentor
                </button>
                <button
                  type="button"
                  disabled={busyId === profile.id}
                  onClick={() => handleMentorUnfreeze(profile)}
                  className="flex items-center gap-1.5 rounded-full bg-accent-success/15 px-3 py-1.5 text-xs font-semibold text-accent-success disabled:opacity-50"
                >
                  <Sun size={13} />
                  Unfreeze mentor
                </button>
                <button
                  type="button"
                  disabled={busyId === profile.id}
                  onClick={() => handleToggleBanLogin(profile)}
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold disabled:opacity-50 ${
                    profile.is_frozen
                      ? "bg-accent-success/15 text-accent-success"
                      : "bg-accent-error/15 text-accent-error"
                  }`}
                >
                  {profile.is_frozen ? <Sun size={13} /> : <Snowflake size={13} />}
                  {profile.is_frozen ? "Restore login" : "Ban login"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
