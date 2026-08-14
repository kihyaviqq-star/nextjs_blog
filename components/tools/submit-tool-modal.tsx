"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PlusCircle, Sparkles, Loader2, CheckCircle2, Globe } from "lucide-react";
import { toast } from "sonner";

interface CategoryOption {
  id: string;
  name: string;
}

interface SubmitToolModalProps {
  categories?: CategoryOption[];
  defaultIsAi?: boolean;
  triggerButton?: React.ReactNode;
}

export function SubmitToolModal({
  categories = [],
  defaultIsAi = true,
  triggerButton,
}: SubmitToolModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [categoryList, setCategoryList] = useState<CategoryOption[]>(categories);

  const [formData, setFormData] = useState({
    name: "",
    websiteUrl: "",
    shortDesc: "",
    description: "",
    categoryId: categories[0]?.id || "",
    pricing: "Free" as const,
    isAi: defaultIsAi,
    platforms: ["Web"],
  });

  // Load categories if not provided
  useEffect(() => {
    if (categoryList.length === 0 && open) {
      fetch("/api/categories")
        .then((r) => r.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setCategoryList(data);
            if (data.length > 0 && !formData.categoryId) {
              setFormData((prev) => ({ ...prev, categoryId: data[0].id }));
            }
          }
        })
        .catch(() => {});
    }
  }, [open, categoryList.length, formData.categoryId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.websiteUrl || !formData.shortDesc || !formData.categoryId) {
      toast.error("Пожалуйста, заполните все обязательные поля");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/tools/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "Инструмент отправлен на модерацию!");
        setOpen(false);
        setFormData({
          name: "",
          websiteUrl: "",
          shortDesc: "",
          description: "",
          categoryId: categoryList[0]?.id || "",
          pricing: "Free",
          isAi: defaultIsAi,
          platforms: ["Web"],
        });
      } else {
        toast.error(data.error || "Не удалось отправить заявку");
      }
    } catch {
      toast.error("Ошибка при отправке");
    } finally {
      setLoading(false);
    }
  };

  const handlePlatformToggle = (platform: string) => {
    setFormData((prev) => ({
      ...prev,
      platforms: prev.platforms.includes(platform)
        ? prev.platforms.filter((p) => p !== platform)
        : [...prev.platforms, platform],
    }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {triggerButton || (
          <Button variant="outline" size="sm" className="gap-2 rounded-xl shadow-sm">
            <PlusCircle className="w-4 h-4 text-primary" />
            <span>Предложить инструмент</span>
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl p-6">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Добавить нейросеть или программу
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Заполните данные о сервисе. После проверки модератором инструмент появится в каталоге.
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Name & Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Название <span className="text-destructive">*</span>
              </label>
              <Input
                placeholder="Например: Midjourney, Cursor..."
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Тип каталога
              </label>
              <div className="flex rounded-lg border border-border p-1 bg-secondary/40">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, isAi: true })}
                  className={`flex-1 py-1 text-xs font-medium rounded-md transition-all ${
                    formData.isAi
                      ? "bg-primary text-primary-foreground shadow"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Нейросеть (ИИ)
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, isAi: false })}
                  className={`flex-1 py-1 text-xs font-medium rounded-md transition-all ${
                    !formData.isAi
                      ? "bg-primary text-primary-foreground shadow"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  ПО / Софт
                </button>
              </div>
            </div>
          </div>

          {/* Website URL */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Ссылка на официальный сайт <span className="text-destructive">*</span>
            </label>
            <div className="relative">
              <Globe className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                type="url"
                placeholder="https://example.com"
                value={formData.websiteUrl}
                onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
                className="pl-9"
                required
              />
            </div>
          </div>

          {/* Category & Pricing */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Категория <span className="text-destructive">*</span>
              </label>
              <select
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                required
              >
                {categoryList.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Ценовая модель
              </label>
              <select
                value={formData.pricing}
                onChange={(e) =>
                  setFormData({ ...formData, pricing: e.target.value as any })
                }
                className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                <option value="Free">Бесплатно (Free)</option>
                <option value="Freemium">Freemium (Есть бесплатный план)</option>
                <option value="Free Trial">Бесплатный пробный период (Trial)</option>
                <option value="Paid">Платно (Paid)</option>
                <option value="Open Source">Open Source</option>
              </select>
            </div>
          </div>

          {/* Short description */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Краткое описание (1-2 предложения) <span className="text-destructive">*</span>
            </label>
            <Input
              placeholder="Генератор изображений нового поколения..."
              value={formData.shortDesc}
              onChange={(e) => setFormData({ ...formData, shortDesc: e.target.value })}
              maxLength={300}
              required
            />
          </div>

          {/* Full description */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Подробное описание возможностей <span className="text-destructive">*</span>
            </label>
            <Textarea
              placeholder="Опишите ключевой функционал, сценарии использования, особенности и преимущества..."
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
            />
          </div>

          {/* Platforms */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">
              Поддерживаемые платформы
            </label>
            <div className="flex flex-wrap gap-2 pt-1">
              {["Web", "Windows", "macOS", "Linux", "iOS", "Android"].map((p) => {
                const isSelected = formData.platforms.includes(p);
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => handlePlatformToggle(p)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                      isSelected
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "bg-secondary text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-3 border-t border-border flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Отмена
            </Button>
            <Button type="submit" disabled={loading} className="gap-2">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>Отправить на проверку</span>
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
