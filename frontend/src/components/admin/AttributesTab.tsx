"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";

interface Tag {
  id: string;
  name: string;
  categoryId: string;
  sortOrder: number;
}

interface Category {
  id: string;
  name: string;
  sortOrder: number;
  tags: Tag[];
}

export default function AttributesTab() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editCategoryName, setEditCategoryName] = useState("");
  const [newTagNames, setNewTagNames] = useState<Record<string, string>>({});
  const [editingTagId, setEditingTagId] = useState<string | null>(null);
  const [editTagName, setEditTagName] = useState("");

  const loadCategories = () => {
    api.get("/admin/categories")
      .then((res) => setCategories(res.data.categories))
      .catch((err) => alert(err.response?.data?.error || "Failed to load categories"));
  };

  useEffect(() => { loadCategories(); }, []);

  const addCategory = async () => {
    const name = newCategoryName.trim();
    if (!name) return;
    try {
      await api.post("/admin/categories", { name });
      setNewCategoryName("");
      loadCategories();
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to create category");
    }
  };

  const updateCategory = async (id: string) => {
    const name = editCategoryName.trim();
    if (!name) return;
    try {
      await api.put(`/admin/categories/${id}`, { name });
      setEditingCategoryId(null);
      loadCategories();
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to update category");
    }
  };

  const deleteCategory = async (id: string, name: string) => {
    if (!confirm(`Delete category "${name}" and all its tags?`)) return;
    try {
      await api.delete(`/admin/categories/${id}`);
      loadCategories();
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to delete category");
    }
  };

  const addTag = async (categoryId: string) => {
    const name = (newTagNames[categoryId] || "").trim();
    if (!name) return;
    try {
      await api.post(`/admin/categories/${categoryId}/tags`, { name });
      setNewTagNames((prev) => ({ ...prev, [categoryId]: "" }));
      loadCategories();
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to create tag");
    }
  };

  const updateTag = async (id: string) => {
    const name = editTagName.trim();
    if (!name) return;
    try {
      await api.put(`/admin/tags/${id}`, { name });
      setEditingTagId(null);
      loadCategories();
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to update tag");
    }
  };

  const deleteTag = async (id: string, name: string) => {
    if (!confirm(`Delete tag "${name}"?`)) return;
    try {
      await api.delete(`/admin/tags/${id}`);
      loadCategories();
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to delete tag");
    }
  };

  return (
    <div className="space-y-6">
      <p className="text-white/40 text-sm">
        Manage attribute categories (e.g., Shoes, Crushing Style) and their tags (e.g., High Heels, Converse). These can be assigned to masterpieces and used for filtering.
      </p>

      {/* Add category */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={newCategoryName}
          onChange={(e) => setNewCategoryName(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") addCategory(); }}
          placeholder="New category name..."
          className="flex-1 px-3 py-2 bg-black border border-white/10 rounded text-white text-sm placeholder:text-white/20"
        />
        <button
          onClick={addCategory}
          className="px-4 py-2 bg-primary text-black font-semibold rounded text-sm hover:brightness-110 transition"
        >
          Add Category
        </button>
      </div>

      {/* Category list */}
      {categories.map((cat) => (
        <div key={cat.id} className="bg-white/5 rounded-lg border border-white/10 overflow-hidden">
          {/* Category header */}
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            {editingCategoryId === cat.id ? (
              <div className="flex items-center gap-2 flex-1">
                <input
                  type="text"
                  value={editCategoryName}
                  onChange={(e) => setEditCategoryName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") updateCategory(cat.id);
                    if (e.key === "Escape") setEditingCategoryId(null);
                  }}
                  className="flex-1 px-2 py-1 bg-black border border-white/20 rounded text-white text-sm"
                  autoFocus
                />
                <button onClick={() => updateCategory(cat.id)} className="px-3 py-1 bg-primary text-black text-xs rounded font-medium">Save</button>
                <button onClick={() => setEditingCategoryId(null)} className="px-3 py-1 bg-white/10 text-white/70 text-xs rounded">Cancel</button>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3">
                  <h3 className="font-semibold text-white">{cat.name}</h3>
                  <span className="text-white/30 text-xs">{cat.tags.length} tags</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => { setEditingCategoryId(cat.id); setEditCategoryName(cat.name); }}
                    className="px-3 py-1 text-sm border border-white/20 rounded hover:bg-white/10 transition text-white/60"
                  >
                    Rename
                  </button>
                  <button
                    onClick={() => deleteCategory(cat.id, cat.name)}
                    className="px-3 py-1 text-sm border border-red-900 text-red-400 rounded hover:bg-red-900/30 transition"
                  >
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Tags */}
          <div className="p-4 space-y-2">
            <div className="flex flex-wrap gap-2">
              {cat.tags.map((tag) => (
                <div key={tag.id} className="group flex items-center gap-1.5 bg-white/10 rounded px-3 py-1.5">
                  {editingTagId === tag.id ? (
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={editTagName}
                        onChange={(e) => setEditTagName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") updateTag(tag.id);
                          if (e.key === "Escape") setEditingTagId(null);
                        }}
                        className="px-1.5 py-0.5 bg-black border border-white/20 rounded text-white text-xs w-24"
                        autoFocus
                      />
                      <button onClick={() => updateTag(tag.id)} className="text-primary text-xs">Save</button>
                      <button onClick={() => setEditingTagId(null)} className="text-white/40 text-xs">Cancel</button>
                    </div>
                  ) : (
                    <>
                      <span className="text-white/70 text-sm">{tag.name}</span>
                      <button
                        onClick={() => { setEditingTagId(tag.id); setEditTagName(tag.name); }}
                        className="text-white/20 hover:text-white/60 text-xs transition opacity-0 group-hover:opacity-100"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteTag(tag.id, tag.name)}
                        className="text-white/20 hover:text-red-400 text-xs transition opacity-0 group-hover:opacity-100"
                      >
                        X
                      </button>
                    </>
                  )}
                </div>
              ))}
            </div>

            {/* Add tag */}
            <div className="flex items-center gap-2 mt-2">
              <input
                type="text"
                value={newTagNames[cat.id] || ""}
                onChange={(e) => setNewTagNames((prev) => ({ ...prev, [cat.id]: e.target.value }))}
                onKeyDown={(e) => { if (e.key === "Enter") addTag(cat.id); }}
                placeholder="Add tag..."
                className="px-2 py-1.5 bg-black border border-white/10 rounded text-white text-xs placeholder:text-white/20 w-48"
              />
              <button
                onClick={() => addTag(cat.id)}
                className="px-3 py-1.5 bg-primary/80 text-black text-xs rounded font-medium hover:bg-primary transition"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      ))}

      {categories.length === 0 && (
        <p className="text-white/30 text-sm text-center py-4">
          No categories yet. Create one above to get started.
        </p>
      )}
    </div>
  );
}
