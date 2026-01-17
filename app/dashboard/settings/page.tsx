"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { HeaderClientWrapper } from "@/components/header";
import { FooterClient } from "@/components/footer";
import { FileUpload } from "@/components/file-upload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";

interface SiteSettings {
  id: string;
  siteName: string;
  logoUrl: string | null;
  faviconUrl: string | null;
  metaDescription: string | null;
  footerText: string | null;
  homeSubtitle: string | null;
}

export default function SiteSettingsPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(true);
  const [settings, setSettings] = useState<SiteSettings>({
    id: "default",
    siteName: "",
    logoUrl: null,
    faviconUrl: null,
    metaDescription: null,
    footerText: null,
    homeSubtitle: null,
  });

  // Fetch settings on mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch("/api/settings");
        if (response.ok) {
          const data = await response.json();
          setSettings(data);
        }
      } catch (error) {
        console.error("Failed to fetch settings:", error);
        toast.error("Не удалось загрузить настройки");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    startTransition(async () => {
      try {
        const response = await fetch("/api/settings", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(settings),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to save settings");
        }

        toast.success("Настройки успешно сохранены");
        router.refresh();
      } catch (error: any) {
        console.error("Save error:", error);
        toast.error(error.message || "Не удалось сохранить настройки");
      }
    });
  };

  const handleChange = (field: keyof SiteSettings, value: string) => {
    setSettings((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <HeaderClientWrapper siteName={settings.siteName} logoUrl={settings.logoUrl} />
        <main className="container mx-auto px-4 py-12 max-w-4xl">
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <HeaderClientWrapper siteName={settings.siteName} logoUrl={settings.logoUrl} />

      <main className="flex-1 container mx-auto px-4 py-8 md:py-12 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Настройки сайта</h1>
          <p className="text-muted-foreground">
            Управление брендингом, SEO и глобальными параметрами сайта
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Branding Section */}
          <Card>
            <CardHeader>
              <CardTitle>Брендинг</CardTitle>
              <CardDescription>
                Настройте визуальную идентичность вашего сайта
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="siteName" className="text-sm font-medium">
                  Название сайта
                </label>
                <Input
                  id="siteName"
                  type="text"
                  value={settings.siteName}
                  onChange={(e) => handleChange("siteName", e.target.value)}
                  placeholder="Название вашего сайта"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Отображается в шапке и вкладке браузера
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Логотип сайта (необязательно)
                </label>
                <FileUpload
                  currentUrl={settings.logoUrl}
                  onUploadComplete={(url) => handleChange("logoUrl", url)}
                  type="logo"
                  label="Загрузить логотип"
                />
                <p className="text-xs text-muted-foreground">
                  Если не загружен, будет использоваться стандартный логотип
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Favicon (необязательно)
                </label>
                <FileUpload
                  currentUrl={settings.faviconUrl}
                  onUploadComplete={(url) => handleChange("faviconUrl", url)}
                  type="favicon"
                  label="Загрузить favicon"
                />
                <p className="text-xs text-muted-foreground">
                  Иконка, отображаемая во вкладке браузера
                </p>
              </div>
            </CardContent>
          </Card>

          {/* SEO Section */}
          <Card>
            <CardHeader>
              <CardTitle>SEO и описание</CardTitle>
              <CardDescription>
                Оптимизация для поисковых систем
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="metaDescription" className="text-sm font-medium">
                  Meta описание
                </label>
                <textarea
                  id="metaDescription"
                  value={settings.metaDescription || ""}
                  onChange={(e) => handleChange("metaDescription", e.target.value)}
                  placeholder="Информационный портал о последних новостях и разработках в области искусственного интеллекта"
                  className="w-full min-h-[100px] px-3 py-2 text-sm rounded-md border border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  maxLength={160}
                />
                <p className="text-xs text-muted-foreground">
                  Рекомендуется 120-160 символов
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Homepage Section */}
          <Card>
            <CardHeader>
              <CardTitle>Главная страница</CardTitle>
              <CardDescription>
                Настройка контента для главной страницы
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="homeSubtitle" className="text-sm font-medium">
                  Подзаголовок главной страницы
                </label>
                <Textarea
                  id="homeSubtitle"
                  value={settings.homeSubtitle || ""}
                  onChange={(e) => handleChange("homeSubtitle", e.target.value)}
                  placeholder="Будьте в курсе последних новостей, аналитики и разработок в области искусственного интеллекта."
                  className="min-h-[100px]"
                />
                <p className="text-xs text-muted-foreground">
                  Текст, отображаемый под заголовком &quot;Последние статьи&quot; на главной странице
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Footer Section */}
          <Card>
            <CardHeader>
              <CardTitle>Подвал сайта</CardTitle>
              <CardDescription>
                Текст в нижней части страницы
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="footerText" className="text-sm font-medium">
                  Текст подвала
                </label>
                <Input
                  id="footerText"
                  type="text"
                  value={settings.footerText || ""}
                  onChange={(e) => handleChange("footerText", e.target.value)}
                  placeholder="Сделано с ❤ для всех, кто интересуется ИИ"
                />
                <p className="text-xs text-muted-foreground">
                  Отображается справа в футере сайта
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/dashboard")}
              disabled={isPending}
            >
              Отмена
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Сохранение...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Сохранить изменения
                </>
              )}
            </Button>
          </div>
        </form>
      </main>

      <FooterClient footerText={settings.footerText} />
    </div>
  );
}
