"use client";

import { Film, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { adminApi } from "@/lib/api/adminApi";

type AdminVideoRow = {
  id: string;
  mentor_id: string;
  title: string | null;
  description: string | null;
  thumbnail_url: string | null;
  is_free: boolean | null;
  is_promoted: boolean | null;
  promoted_at: string | null;
  created_at: string | null;
  storage_path: string | null;
  video_url: string | null;
};

export default function AdminVideosPage() {
  const [rows, setRows] = useState<AdminVideoRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const pageSize = 25;

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { rows: next, total: count } = await adminApi.listMentorVideos({
        page,
        pageSize,
        search: appliedSearch,
      });
      setRows((next || []) as AdminVideoRow[]);
      setTotal(count || 0);
    } catch (err) {
      setRows([]);
      setTotal(0);
      setError((err as Error)?.message || "Failed to load videos");
    } finally {
      setLoading(false);
    }
  }, [page, appliedSearch]);

  useEffect(() => {
    void load();
  }, [load]);

  const togglePromote = async (row: AdminVideoRow) => {
    setBusyId(row.id);
    setError("");
    try {
      await adminApi.setMentorVideoPromoted(row.id, !row.is_promoted);
      await load();
    } catch (err) {
      setError((err as Error)?.message || "Promote failed — run mentor_videos_promote migration");
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (row: AdminVideoRow) => {
    if (!window.confirm(`Delete "${row.title || "this video"}"?`)) return;
    setBusyId(row.id);
    setError("");
    try {
      await adminApi.deleteMentorVideo(row);
      await load();
    } catch (err) {
      setError((err as Error)?.message || "Delete failed — run mentor_videos admin migration");
    } finally {
      setBusyId(null);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-text-secondary">
        Mentor library videos (app / web Videos feed). Promote pins a video to the top.
      </p>

      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          setPage(1);
          setAppliedSearch(search.trim());
        }}
      >
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search title or description"
          className="flex-1 rounded-xl border border-border-light bg-surface-sheet px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
        />
        <button
          type="submit"
          className="rounded-xl bg-accent-link/15 px-4 py-2 text-sm font-semibold text-accent-link"
        >
          Search
        </button>
      </form>

      {error ? <p className="text-sm text-accent-error">{error}</p> : null}

      {loading && !rows.length ? (
        <p className="text-sm text-text-muted">Loading videos…</p>
      ) : !rows.length ? (
        <p className="py-8 text-center text-sm text-text-muted">No videos found.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {rows.map((row) => (
            <div
              key={row.id}
              className="flex flex-col gap-3 rounded-xl border border-border-light bg-surface-panel p-3 sm:flex-row sm:items-center"
            >
              <div className="flex h-16 w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-surface-sheet">
                {row.thumbnail_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={row.thumbnail_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <Film size={20} className="text-text-muted" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-text-primary">
                  {row.title || "Untitled"}
                </p>
                <p className="text-xs text-text-muted">
                  {row.is_free ? "Free" : "Paid"}
                  {row.is_promoted ? " · Promoted" : ""}
                  {row.created_at ? ` · ${new Date(row.created_at).toLocaleDateString()}` : ""}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {row.video_url ? (
                  <a
                    href={row.video_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full bg-accent-link/15 px-3 py-1.5 text-xs font-semibold text-accent-link"
                  >
                    Open
                  </a>
                ) : null}
                <button
                  type="button"
                  disabled={busyId === row.id}
                  onClick={() => togglePromote(row)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold disabled:opacity-50 ${
                    row.is_promoted
                      ? "bg-amber-500/20 text-amber-800"
                      : "bg-amber-500/10 text-amber-700"
                  }`}
                >
                  {row.is_promoted ? "Unpromote" : "Promote"}
                </button>
                <button
                  type="button"
                  disabled={busyId === row.id}
                  onClick={() => remove(row)}
                  className="flex items-center gap-1 rounded-full bg-accent-error/15 px-3 py-1.5 text-xs font-semibold text-accent-error disabled:opacity-50"
                >
                  <Trash2 size={12} />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between text-sm text-text-muted">
        <span>
          {total} video{total === 1 ? "" : "s"}
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="rounded-lg border border-border-light px-3 py-1 disabled:opacity-40"
          >
            Prev
          </button>
          <span>
            {page} / {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-lg border border-border-light px-3 py-1 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
