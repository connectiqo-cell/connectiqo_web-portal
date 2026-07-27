"use client";

import { Search, Snowflake, Sun } from "lucide-react";
import { useState } from "react";

import { adminApi, type AdminProfileRow } from "@/lib/api/adminApi";

export default function AdminUsersPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<AdminProfileRow[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  

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

  const handleToggleFrozen = async (profile: AdminProfileRow) => {
    const action = profile.is_frozen ? "unfreeze" : "freeze";
    if (!window.confirm(`${action === "freeze" ? "Freeze" : "Unfreeze"} ${profile.name || profile.email}?`)) {
      return;

    }
   
    try {
      await adminApi.setUserFrozen(profile.id, !profile.is_frozen);
      setResults((prev) =>
        prev.map((p) => (p.id === profile.id ? { ...p, is_frozen: !p.is_frozen } : p)),
      );
    
    } catch (err) {
      setError((err as Error)?.message || `Could not ${action} user`);
    }

  };
  

  return (
    <div className="flex flex-col gap-6">
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
              className="flex items-center gap-3 rounded-xl border border-border-light bg-surface-panel px-4 py-3"
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
              </div>
              <button
                type="button"
                onClick={() => handleToggleFrozen(profile)}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${
                  profile.is_frozen
                    ? "bg-accent-success/15 text-accent-success"
                    : "bg-accent-error/15 text-accent-error"
                }`}
              >
                {profile.is_frozen ? <Sun size={13} /> : <Snowflake size={13} />}
                {profile.is_frozen ? "Unfreeze" : "Freeze"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
