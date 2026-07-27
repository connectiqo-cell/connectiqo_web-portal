"use client";

import { Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

import { adminApi, type AdminCategoryRow } from "@/lib/api/adminApi";

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<AdminCategoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [creating, setCreating] = useState(false);

  const loadCategories = async () => {
    setLoading(true);
    try {
      setCategories(await adminApi.listCategories());
    } catch (err) {
      setError((err as Error)?.message || "Could not load categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void Promise.resolve().then(() => loadCategories());
  }, []);

  const handleCreate = async () => {
    if (!name.trim() || !slug.trim()) return;
    setCreating(true);
    setError("");
    try {
      await adminApi.createCategory({
        name: name.trim(),
        slug: slug.trim(),
        sortOrder: categories.length,
      });
      setName("");
      setSlug("");
      await loadCategories();
    } catch (err) {
      setError((err as Error)?.message || "Could not create category");
    } finally {
      setCreating(false);
    }
  };

  const handleToggleActive = async (category: AdminCategoryRow) => {
    try {
      await adminApi.setCategoryActive(category.id, !category.is_active);
      setCategories((prev) =>
        prev.map((c) => (c.id === category.id ? { ...c, is_active: !c.is_active } : c)),
      );
    } catch (err) {
      setError((err as Error)?.message || "Could not update category");
    }
  };

  const handleDelete = async (category: AdminCategoryRow) => {
    if (!window.confirm(`Delete category "${category.name}"?`)) return;
    try {
      await adminApi.deleteCategory(category.id);
      setCategories((prev) => prev.filter((c) => c.id !== category.id));
    } catch (err) {
      setError((err as Error)?.message || "Could not delete category");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 rounded-2xl border border-border-light bg-surface-panel p-4">
        <h2 className="text-sm font-semibold text-text-primary">Add a category</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name"
            className="rounded-xl border border-border-light bg-surface-sheet px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
          />
          <input
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="Slug"
            className="rounded-xl border border-border-light bg-surface-sheet px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
          />
          <button
            type="button"
            onClick={handleCreate}
            disabled={creating || !name.trim() || !slug.trim()}
            className="flex items-center justify-center gap-1.5 rounded-xl bg-accent-link/15 px-3 py-2 text-sm font-semibold text-accent-link disabled:opacity-50"
          >
            <Plus size={16} />
            Add
          </button>
        </div>
        {error ? <p className="text-sm text-accent-error">{error}</p> : null}
      </div>

      {loading ? (
        <p className="text-sm text-text-muted">Loading…</p>
      ) : categories.length === 0 ? (
        <p className="py-8 text-center text-sm text-text-muted">No categories yet.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {categories.map((category) => (
            <div
              key={category.id}
              className="flex items-center gap-3 rounded-xl border border-border-light bg-surface-panel px-4 py-3"
            >
              <div className="flex-1">
                <p className="text-sm font-semibold text-text-primary">{category.name}</p>
                <p className="text-xs text-text-muted">{category.slug}</p>
              </div>
              <button
                type="button"
                onClick={() => handleToggleActive(category)}
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  category.is_active
                    ? "bg-accent-success/15 text-accent-success"
                    : "bg-surface-chip text-text-muted"
                }`}
              >
                {category.is_active ? "Active" : "Inactive"}
              </button>
              <button
                type="button"
                onClick={() => handleDelete(category)}
                aria-label="Delete category"
                className="text-text-muted hover:text-accent-error"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
