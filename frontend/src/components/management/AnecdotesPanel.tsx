import React, { useEffect, useState } from "react";
import { BookOpen, Pencil, Plus, Trash2, X } from "lucide-react";
import { anecdotesApi } from "../../services/modules";
import type { Anecdote } from "../../types/modules";
import { cn } from "../../lib/utils";

export const AnecdotesPanel: React.FC = () => {
  const [items, setItems] = useState<Anecdote[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [author, setAuthor] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await anecdotesApi.getAll();
      setItems(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const resetForm = () => {
    setText("");
    setAuthor("");
    setEditingId(null);
    setError(null);
  };

  const startEdit = (item: Anecdote) => {
    setEditingId(item.id);
    setText(item.text);
    setAuthor(item.author ?? "");
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) {
      setError("Metin boş olamaz.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload = {
        text: trimmed,
        author: author.trim() || null,
      };
      if (editingId != null) {
        await anecdotesApi.update(editingId, payload);
      } else {
        await anecdotesApi.create(payload);
      }
      resetForm();
      await load();
    } catch {
      setError("Kayıt kaydedilemedi.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Bu anektodu silmek istediğinize emin misiniz?")) return;
    try {
      await anecdotesApi.delete(id);
      if (editingId === id) resetForm();
      await load();
    } catch {
      setError("Silinemedi.");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <BookOpen size={20} className="text-primary" />
          Anektodlar
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Özlü sözlerinizi ekleyin; dashboard üstünde rastgele gösterilir.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3 p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5">
        <label className="block text-sm font-medium">
          {editingId != null ? "Anektodu düzenle" : "Yeni anektod"}
        </label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
          maxLength={2000}
          placeholder="Özlü söz veya kısa anektod..."
          className="w-full p-3 rounded-xl border border-slate-200 dark:border-white/10 bg-transparent text-base resize-y min-h-[6rem] font-quote"
        />
        <input
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          maxLength={120}
          placeholder="Kaynak / yazar (opsiyonel)"
          className="w-full p-3 rounded-xl border border-slate-200 dark:border-white/10 bg-transparent"
        />
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 py-2.5 rounded-xl bg-primary text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {editingId != null ? <Pencil size={16} /> : <Plus size={16} />}
            {saving ? "Kaydediliyor..." : editingId != null ? "Güncelle" : "Ekle"}
          </button>
          {editingId != null && (
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10"
            >
              <X size={16} />
            </button>
          )}
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
      </form>

      {loading ? (
        <p className="text-center text-slate-400 py-8">Yükleniyor...</p>
      ) : items.length === 0 ? (
        <p className="text-center text-slate-400 py-8">Henüz anektod yok.</p>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <li
              key={item.id}
              className={cn(
                "p-4 rounded-xl border",
                editingId === item.id
                  ? "border-primary/40 bg-primary/5"
                  : "border-slate-200 dark:border-white/10"
              )}
            >
              <p className="font-quote text-lg leading-relaxed whitespace-pre-wrap">
                “{item.text}”
              </p>
              {item.author && (
                <p className="mt-2 text-sm text-slate-500 italic">— {item.author}</p>
              )}
              <div className="flex gap-2 mt-3">
                <button
                  type="button"
                  onClick={() => startEdit(item)}
                  className="px-3 py-1.5 rounded-lg text-sm text-primary hover:bg-primary/10 flex items-center gap-1"
                >
                  <Pencil size={14} />
                  Düzenle
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(item.id)}
                  className="px-3 py-1.5 rounded-lg text-sm text-red-500 hover:bg-red-500/10 flex items-center gap-1"
                >
                  <Trash2 size={14} />
                  Sil
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
