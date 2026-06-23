"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Save, Loader2 } from "lucide-react";
import { updateSoftwareLinks } from "../../actions";

export default function EditForm({ 
  id, 
  initialWebsiteUrl, 
  initialLocalDownloadUrl 
}: { 
  id: string;
  initialWebsiteUrl: string;
  initialLocalDownloadUrl: string;
}) {
  const router = useRouter();
  const [websiteUrl, setWebsiteUrl] = useState(initialWebsiteUrl);
  const [localDownloadUrl, setLocalDownloadUrl] = useState(initialLocalDownloadUrl);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    const result = await updateSoftwareLinks(id, websiteUrl, localDownloadUrl);
    
    setSaving(false);
    if (result.success) {
      router.push("/admin");
    } else {
      alert("Ошибка при сохранении: " + result.error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <label className="text-sm font-medium">Официальный сайт разработчика (websiteUrl)</label>
        <input 
          type="url" 
          value={websiteUrl}
          onChange={(e) => setWebsiteUrl(e.target.value)}
          placeholder="https://example.com"
          className="w-full p-3 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-shadow"
        />
        <p className="text-xs text-muted-foreground">Ссылка на официальную страницу программы.</p>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-green-600 dark:text-green-500">Локальная загрузка с сервера (localDownloadUrl)</label>
        <input 
          type="url" 
          value={localDownloadUrl}
          onChange={(e) => setLocalDownloadUrl(e.target.value)}
          placeholder="https://myserver.com/files/app.exe"
          className="w-full p-3 rounded-xl border border-green-500/30 bg-green-500/5 focus:ring-2 focus:ring-green-500/20 outline-none transition-shadow"
        />
        <p className="text-xs text-muted-foreground">Прямая ссылка на скачивание файла (например, с вашего облака или сервера).</p>
      </div>

      <div className="pt-4 border-t border-border/40">
        <Button type="submit" disabled={saving} className="w-full sm:w-auto px-8 rounded-full">
          {saving ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Сохранение...</>
          ) : (
            <><Save className="w-4 h-4 mr-2" /> Сохранить изменения</>
          )}
        </Button>
      </div>
    </form>
  );
}
