import React from "react";
import { Plus, Trash2, Settings2 } from "lucide-react";
import type { LookupType } from "../../types/modules";
import { cn } from "../../lib/utils";

interface TypeListPanelProps {
  title: string;
  items: LookupType[];
  newValue: string;
  onNewValueChange: (v: string) => void;
  onAdd: (e: React.FormEvent) => void;
  onDelete: (id: number) => void;
}

export const TypeListPanel: React.FC<TypeListPanelProps> = ({
  title,
  items,
  newValue,
  onNewValueChange,
  onAdd,
  onDelete,
}) => (
  <div className="space-y-3">
    <h3 className="font-semibold flex items-center gap-2">
      <Settings2 size={18} className="text-primary" />
      {title}
    </h3>
    <form onSubmit={onAdd} className="flex gap-2">
      <input
        value={newValue}
        onChange={(e) => onNewValueChange(e.target.value)}
        placeholder="Yeni ekle..."
        className="flex-1 px-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-transparent"
      />
      <button type="submit" className="px-3 py-2.5 rounded-xl bg-primary text-white">
        <Plus size={18} />
      </button>
    </form>
    <ul className="space-y-2">
      {items.map((item) => (
        <li
          key={item.id}
          className={cn(
            "flex items-center justify-between p-3 rounded-xl border",
            item.isActive
              ? "border-slate-200 dark:border-white/10"
              : "opacity-50 border-dashed"
          )}
        >
          <span>{item.name}</span>
          <button
            type="button"
            onClick={() => onDelete(item.id)}
            className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg"
          >
            <Trash2 size={16} />
          </button>
        </li>
      ))}
    </ul>
  </div>
);
