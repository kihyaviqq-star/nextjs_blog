"use client";

import { useState } from "react";
import Link from "next/link";
import { ExternalLink, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteBulkSoftware } from "../actions";

export function AdminSoftwareTable({ software }: { software: any[] }) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(new Set(software.map(s => s.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelect = (id: string, checked: boolean) => {
    const next = new Set(selectedIds);
    if (checked) {
      next.add(id);
    } else {
      next.delete(id);
    }
    setSelectedIds(next);
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Вы действительно хотите удалить ${selectedIds.size} записей?`)) return;

    setIsDeleting(true);
    await deleteBulkSoftware(Array.from(selectedIds));
    setSelectedIds(new Set());
    setIsDeleting(false);
  };

  return (
    <div className="flex flex-col gap-4">
      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between bg-primary/10 border border-primary/20 rounded-xl p-3">
          <span className="text-sm font-medium text-primary">
            Выбрано записей: {selectedIds.size}
          </span>
          <Button 
            variant="destructive" 
            size="sm" 
            onClick={handleDeleteSelected}
            disabled={isDeleting}
            className="flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" /> 
            {isDeleting ? "Удаление..." : "Удалить выбранные"}
          </Button>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-border/40 text-muted-foreground">
              <th className="py-3 px-4 font-medium w-12 text-center">
                <input 
                  type="checkbox" 
                  className="rounded border-border/50 text-primary focus:ring-primary w-4 h-4"
                  onChange={handleSelectAll}
                  checked={software.length > 0 && selectedIds.size === software.length}
                />
              </th>
              <th className="py-3 px-4 font-medium">Название</th>
              <th className="py-3 px-4 font-medium">Категория</th>
              <th className="py-3 px-4 font-medium">Ссылки</th>
              <th className="py-3 px-4 font-medium text-right">Действия</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/20">
            {software.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-muted-foreground">
                  Нет записей
                </td>
              </tr>
            ) : software.map((item) => (
              <tr key={item.id} className="hover:bg-muted/50 transition-colors">
                <td className="py-3 px-4 text-center">
                  <input 
                    type="checkbox" 
                    className="rounded border-border/50 text-primary focus:ring-primary w-4 h-4"
                    checked={selectedIds.has(item.id)}
                    onChange={(e) => handleSelect(item.id, e.target.checked)}
                  />
                </td>
                <td className="py-3 px-4">
                  <div className="font-semibold">{item.name}</div>
                  <div className="text-xs text-muted-foreground">{item.isAi ? "Нейросеть" : "ПО"}</div>
                </td>
                <td className="py-3 px-4 text-muted-foreground">
                  {item.category?.name || "Без категории"}
                </td>
                <td className="py-3 px-4">
                  <div className="flex flex-col gap-1">
                    {item.websiteUrl ? (
                      <a href={item.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center text-xs">
                        Оф. сайт <ExternalLink className="w-3 h-3 ml-1" />
                      </a>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">Нет сайта</span>
                    )}
                    {item.localDownloadUrl ? (
                      <span className="text-green-500 font-medium text-xs">Есть локальный файл</span>
                    ) : (
                      <span className="text-destructive font-medium text-xs">Нет локального файла</span>
                    )}
                  </div>
                </td>
                <td className="py-3 px-4 text-right">
                  <Button asChild size="sm" variant="outline" className="rounded-full shadow-sm">
                    <Link href={`/admin/edit/${item.id}`}>
                      <Edit className="w-4 h-4 mr-1" /> Изменить
                    </Link>
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
