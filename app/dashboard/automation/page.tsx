"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Play, AlertCircle, CheckCircle2, Server, Bot, Clock } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { toast } from "sonner";

export default function AutomationAdminPage() {
  const [settings, setSettings] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Run states
  const [isSoftwareRunning, setIsSoftwareRunning] = useState(false);
  const [isBlogRunning, setIsBlogRunning] = useState(false);
  
  // Override limits for manual run
  const [manualSoftwareLimit, setManualSoftwareLimit] = useState(3);
  const [manualBlogLimit, setManualBlogLimit] = useState(1);

  // Progress tracking
  const [progress, setProgress] = useState<{
    visible: boolean;
    current: number;
    total: number;
    message: string;
  }>({ visible: false, current: 0, total: 0, message: "" });

  const fetchData = async () => {
    try {
      const [setRes, logsRes] = await Promise.all([
        fetch("/api/admin/automation/settings"),
        fetch("/api/admin/automation/logs")
      ]);
      const setData = await setRes.json();
      const logsData = await logsRes.json();
      setSettings(setData);
      setLogs(logsData);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const saveSettings = async () => {
    setIsSaving(true);
    try {
      await fetch("/api/admin/automation/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings)
      });
      toast.success("Настройки успешно сохранены!");
    } catch (e) {
      toast.error("Ошибка при сохранении настроек.");
    } finally {
      setIsSaving(false);
    }
  };

  const runTask = async (type: "SOFTWARE" | "BLOG", limit: number) => {
    if (type === "SOFTWARE") setIsSoftwareRunning(true);
    if (type === "BLOG") setIsBlogRunning(true);
    
    setProgress({ visible: true, current: 0, total: limit, message: "Инициализация..." });

    try {
      const res = await fetch("/api/admin/automation/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, limit })
      });

      if (!res.body) throw new Error("No response body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let doneReading = false;

      while (!doneReading) {
        const { value, done } = await reader.read();
        if (done) {
          doneReading = true;
          break;
        }

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.replace('data: ', ''));
              
              if (data.status === 'progress') {
                setProgress({
                  visible: true,
                  current: data.current,
                  total: data.total,
                  message: data.message
                });
              } else if (data.status === 'done') {
                toast.success(`Готово! ${data.message}`);
                setProgress(prev => ({ ...prev, visible: false }));
              } else if (data.status === 'error') {
                toast.error(`Ошибка: ${data.message}`);
                setProgress(prev => ({ ...prev, visible: false }));
              }
            } catch (e) {
              console.error("Parse error:", e);
            }
          }
        }
      }

      fetchData(); // refresh logs
    } catch (e) {
      toast.error("Произошла ошибка при запуске.");
      setProgress(prev => ({ ...prev, visible: false }));
    } finally {
      if (type === "SOFTWARE") setIsSoftwareRunning(false);
      if (type === "BLOG") setIsBlogRunning(false);
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center p-12"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Автоматизация</h1>
        <p className="text-muted-foreground">
          Управляйте авто-наполнением сайта программами и статьями с помощью ИИ.
        </p>
      </div>

      <div className="flex justify-end">
        <Button onClick={saveSettings} disabled={isSaving} className="gap-2">
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
          Сохранить настройки
        </Button>
      </div>

      {progress.visible && (
        <div className="bg-primary/10 border border-primary/20 rounded-xl p-6 mb-8 relative overflow-hidden">
          <div 
            className="absolute left-0 top-0 bottom-0 bg-primary/10 transition-all duration-500 ease-in-out" 
            style={{ width: `${(progress.current / progress.total) * 100}%` }}
          />
          <div className="relative z-10 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <h3 className="font-bold text-lg">Выполнение задачи...</h3>
            <p className="text-muted-foreground text-center font-medium">
              {progress.message}
            </p>
            <div className="text-xs font-bold px-3 py-1 bg-background rounded-full">
              {progress.current} / {progress.total}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Software Scraper Card */}
        <div className="bg-card rounded-2xl border border-border/50 p-6 flex flex-col">
          <div className="flex items-center gap-3 mb-6 border-b border-border/50 pb-4">
            <div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl">
              <Server className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Сбор Программ</h2>
              <p className="text-sm text-muted-foreground">Парсинг и рерайт с SoftPortal</p>
            </div>
          </div>

          <div className="space-y-6 flex-1">
            <div className="flex items-center justify-between">
              <label className="font-medium">Ежедневный авто-запуск</label>
              <Switch 
                checked={settings?.softwareAutoEnabled || false} 
                onCheckedChange={(checked) => setSettings({...settings, softwareAutoEnabled: checked})} 
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground block">Сколько программ парсить за один раз (для авто-запуска):</label>
              <Input 
                type="number" 
                min={1} 
                max={20} 
                value={settings?.softwareItemsPerRun || ""} 
                onChange={(e) => setSettings({...settings, softwareItemsPerRun: parseInt(e.target.value) || 1})} 
              />
            </div>
            
            {settings?.softwareLastRun && (
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" /> Последний авто-запуск: {format(new Date(settings.softwareLastRun), "dd MMM yyyy, HH:mm", { locale: ru })}
              </div>
            )}
          </div>

          <div className="mt-8 pt-6 border-t border-border/50 bg-secondary/20 -mx-6 -mb-6 p-6 rounded-b-2xl">
            <h3 className="font-semibold mb-4 text-sm uppercase tracking-wider text-muted-foreground">Ручной запуск</h3>
            <div className="flex items-center gap-4">
              <Input 
                type="number" 
                min={1} 
                max={50} 
                value={manualSoftwareLimit || ""} 
                onChange={(e) => setManualSoftwareLimit(parseInt(e.target.value) || 1)} 
                className="w-24 bg-background"
              />
              <Button 
                onClick={() => runTask("SOFTWARE", manualSoftwareLimit)} 
                disabled={isSoftwareRunning || isBlogRunning}
                className="flex-1 gap-2"
              >
                {isSoftwareRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
                Собрать сейчас
              </Button>
            </div>
          </div>
        </div>

        {/* Blog Generator Card */}
        <div className="bg-card rounded-2xl border border-border/50 p-6 flex flex-col">
          <div className="flex items-center gap-3 mb-6 border-b border-border/50 pb-4">
            <div className="p-3 bg-purple-500/10 text-purple-500 rounded-xl">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Авто-Блоггер</h2>
              <p className="text-sm text-muted-foreground">Генерация статей нейросетью</p>
            </div>
          </div>

          <div className="space-y-6 flex-1">
            <div className="flex items-center justify-between">
              <label className="font-medium">Ежедневный авто-запуск</label>
              <Switch 
                checked={settings?.blogAutoEnabled || false} 
                onCheckedChange={(checked) => setSettings({...settings, blogAutoEnabled: checked})} 
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground block">Сколько статей писать за один раз:</label>
              <Input 
                type="number" 
                min={1} 
                max={10} 
                value={settings?.blogPostsPerRun || ""} 
                onChange={(e) => setSettings({...settings, blogPostsPerRun: parseInt(e.target.value) || 1})} 
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-muted-foreground block">Темы для генерации (через запятую):</label>
              <Textarea 
                value={settings?.blogTopics || ""} 
                onChange={(e) => setSettings({...settings, blogTopics: e.target.value})} 
                rows={3}
              />
              <p className="text-xs text-muted-foreground leading-relaxed">
                ИИ будет выбирать одну случайную тему из этого списка для каждой статьи, либо использовать ваши RSS ленты.
              </p>
            </div>
            
            {settings?.blogLastRun && (
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" /> Последний авто-запуск: {format(new Date(settings.blogLastRun), "dd MMM yyyy, HH:mm", { locale: ru })}
              </div>
            )}
          </div>

          <div className="mt-8 pt-6 border-t border-border/50 bg-secondary/20 -mx-6 -mb-6 p-6 rounded-b-2xl">
            <h3 className="font-semibold mb-4 text-sm uppercase tracking-wider text-muted-foreground">Ручной запуск</h3>
            <div className="flex items-center gap-4">
              <Input 
                type="number" 
                min={1} 
                max={10} 
                value={manualBlogLimit || ""} 
                onChange={(e) => setManualBlogLimit(parseInt(e.target.value) || 1)} 
                className="w-24 bg-background"
              />
              <Button 
                onClick={() => runTask("BLOG", manualBlogLimit)} 
                disabled={isBlogRunning || isSoftwareRunning}
                className="flex-1 gap-2"
                variant="default"
              >
                {isBlogRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
                Написать статью
              </Button>
            </div>
          </div>
        </div>

      </div>

      {/* Logs Table */}
      <div className="bg-card rounded-2xl border border-border/50 p-6 overflow-hidden">
        <h2 className="text-xl font-bold mb-6">История запусков</h2>
        
        {logs.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">Нет записей в логах.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-secondary/30">
                <tr>
                  <th className="px-4 py-3 rounded-tl-lg">Дата</th>
                  <th className="px-4 py-3">Тип</th>
                  <th className="px-4 py-3">Статус</th>
                  <th className="px-4 py-3">Добавлено</th>
                  <th className="px-4 py-3 rounded-tr-lg">Сообщение</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b border-border/30 last:border-0 hover:bg-secondary/10">
                    <td className="px-4 py-3 font-medium whitespace-nowrap">
                      {format(new Date(log.createdAt), "dd.MM.yyyy HH:mm", { locale: ru })}
                    </td>
                    <td className="px-4 py-3">
                      <span className="bg-secondary px-2 py-1 rounded text-xs font-semibold">
                        {log.type}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {log.status === "SUCCESS" ? (
                        <span className="text-green-500 flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> Успех</span>
                      ) : (
                        <span className="text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3"/> Ошибка</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-medium">{log.itemsAdded}</td>
                    <td className="px-4 py-3 text-muted-foreground max-w-md truncate" title={log.message}>
                      {log.message}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
    </div>
  );
}
