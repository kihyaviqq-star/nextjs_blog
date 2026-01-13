"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { HeaderClientWrapper } from "@/components/header";
import { FooterClient } from "@/components/footer";
import { FileUpload } from "@/components/file-upload";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Mail, FileText, Link as LinkIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function SettingsPage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Form states
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [email, setEmail] = useState("");
  const [avatar, setAvatar] = useState("");
  const [telegram, setTelegram] = useState("");
  const [vk, setVk] = useState("");
  const [twitter, setTwitter] = useState("");
  const [github, setGithub] = useState("");
  
  // Validation errors
  const [usernameError, setUsernameError] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    } else if (status === "authenticated" && session?.user) {
      // Load user data
      loadUserProfile();
    }
  }, [status, session, router]);

  const loadUserProfile = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/profile");
      if (response.ok) {
        const data = await response.json();
        setName(data.name || "");
        setUsername(data.username || "");
        setBio(data.bio || "");
        setEmail(data.email || "");
        setAvatar(data.avatarUrl || "");
        setTelegram(data.telegram || "");
        setVk(data.vk || "");
        setTwitter(data.twitter || "");
        setGithub(data.github || "");
      }
    } catch (error) {
      console.error("Error loading profile:", error);
      toast.error("Ошибка загрузки профиля", {
        description: "Попробуйте обновить страницу"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    // Сброс ошибок валидации
    setUsernameError("");
    
    // Клиентская валидация username (если изменен)
    if (username && username !== (session?.user as any)?.username) {
      // Min/Max length
      if (username.trim().length < 3) {
        setUsernameError("Имя пользователя должно содержать минимум 3 символа");
        toast.error("Некорректное имя пользователя", {
          description: "Имя пользователя должно содержать минимум 3 символа"
        });
        return;
      }
      
      if (username.trim().length > 30) {
        setUsernameError("Имя пользователя не может быть длиннее 30 символов");
        toast.error("Некорректное имя пользователя", {
          description: "Имя пользователя не может быть длиннее 30 символов"
        });
        return;
      }
      
      // Regex validation
      const validPattern = /^[a-zA-Z0-9_-]+$/;
      if (!validPattern.test(username.trim())) {
        setUsernameError("Имя пользователя может содержать только буквы, цифры, дефис и подчеркивание");
        toast.error("Некорректное имя пользователя", {
          description: "Можно использовать только буквы, цифры, дефис и подчеркивание"
        });
        return;
      }
      
      // Must start with letter or number
      const startsWithLetterOrNumber = /^[a-zA-Z0-9]/;
      if (!startsWithLetterOrNumber.test(username.trim())) {
        setUsernameError("Имя пользователя должно начинаться с буквы или цифры");
        toast.error("Некорректное имя пользователя", {
          description: "Имя пользователя должно начинаться с буквы или цифры"
        });
        return;
      }
    }
    
    setIsSaving(true);
    try {
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          username,
          bio,
          email: email || null,
          avatarUrl: avatar,
          telegram,
          vk,
          twitter,
          github,
        }),
      });

      if (response.ok) {
        const updatedUser = await response.json();
        console.log("[Settings] Profile saved successfully, updating session...");
        
        // Обновляем сессию NextAuth с новыми данными для немедленного обновления UI
        await update({
          user: {
            name: updatedUser.name,
            username: updatedUser.username,
            email: updatedUser.email,
            avatarUrl: updatedUser.avatarUrl,
          },
        });
        
        console.log("[Settings] Session updated, refreshing router...");
        
        // Обновляем серверные компоненты (Header и т.д.)
        router.refresh();
        
        toast.success("Профиль успешно обновлен!", {
          description: "Все изменения сохранены"
        });
      } else {
        const errorData = await response.json();
        console.error("Error response:", errorData);
        
        // Если ошибка связана с username, показываем в поле
        if (errorData.error && errorData.error.includes("никнейм") || errorData.error.includes("имя пользователя")) {
          setUsernameError(errorData.error);
          toast.error("Не удалось сохранить профиль", {
            description: errorData.error
          });
        } else {
          toast.error("Ошибка при сохранении профиля", {
            description: errorData.error || "Попробуйте еще раз"
          });
        }
      }
    } catch (error) {
      console.error("Error saving profile:", error);
      toast.error("Ошибка при сохранении профиля", {
        description: error instanceof Error ? error.message : "Неизвестная ошибка"
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <HeaderClientWrapper />
        <main className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        </main>
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Настройки профиля</h1>
          <p className="text-muted-foreground">
            Управление вашей учетной записью и профилем
          </p>
        </div>

        <div className="space-y-6">
          {/* Аватар */}
          <Card>
            <CardHeader>
              <CardTitle>Аватар</CardTitle>
              <CardDescription>
                Загрузите фото для вашего профиля
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FileUpload
                currentUrl={avatar}
                onUploadComplete={(url) => setAvatar(url)}
                type="avatar"
                label="Загрузить аватар"
              />
            </CardContent>
          </Card>

          {/* Основная информация */}
          <Card>
            <CardHeader>
              <CardTitle>Основная информация</CardTitle>
              <CardDescription>
                Ваше имя и краткая информация о вас
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium mb-2">
                  <User className="w-4 h-4" />
                  Имя
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ваше имя"
                  className="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              
              <div>
                <label className="flex items-center gap-2 text-sm font-medium mb-2">
                  <User className="w-4 h-4" />
                  Имя пользователя (Username)
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setUsernameError(""); // Сбросить ошибку при изменении
                  }}
                  placeholder="username"
                  className={`w-full px-3 py-2 bg-background border rounded-md focus:outline-none focus:ring-2 transition-all ${
                    usernameError 
                      ? "border-red-500 focus:ring-red-500" 
                      : "border-border focus:ring-primary"
                  }`}
                  maxLength={30}
                  minLength={3}
                  pattern="[a-zA-Z0-9_-]+"
                  title="Только буквы, цифры, дефис и подчеркивание"
                />
                {usernameError && (
                  <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                    <span className="font-medium">⚠️</span>
                    {usernameError}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  Это ваш публичный URL профиля:{" "}
                  <code className="bg-secondary px-1 rounded">
                    /{username || "username"}
                  </code>
                  <br />
                  <span className="text-xs opacity-75">
                    3-30 символов. Только буквы, цифры, дефис и подчеркивание.
                  </span>
                </p>
              </div>
              
              <div>
                <label className="flex items-center gap-2 text-sm font-medium mb-2">
                  <FileText className="w-4 h-4" />
                  О себе
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Расскажите о себе..."
                  rows={4}
                  className="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                />
              </div>
            </CardContent>
          </Card>

          {/* Контактная информация */}
          <Card>
            <CardHeader>
              <CardTitle>Контактная информация</CardTitle>
              <CardDescription>
                Ваша электронная почта (отображается только если указана)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <label className="flex items-center gap-2 text-sm font-medium mb-2">
                <Mail className="w-4 h-4" />
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </CardContent>
          </Card>

          {/* Социальные сети */}
          <Card>
            <CardHeader>
              <CardTitle>Социальные сети</CardTitle>
              <CardDescription>
                Ссылки на ваши профили (отображаются только если указаны)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium mb-2">
                  <LinkIcon className="w-4 h-4" />
                  Telegram
                </label>
                <input
                  type="url"
                  value={telegram}
                  onChange={(e) => setTelegram(e.target.value)}
                  placeholder="https://t.me/username"
                  className="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="flex items-center gap-2 text-sm font-medium mb-2">
                  <LinkIcon className="w-4 h-4" />
                  Вконтакте
                </label>
                <input
                  type="url"
                  value={vk}
                  onChange={(e) => setVk(e.target.value)}
                  placeholder="https://vk.com/username"
                  className="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="flex items-center gap-2 text-sm font-medium mb-2">
                  <LinkIcon className="w-4 h-4" />
                  Twitter
                </label>
                <input
                  type="url"
                  value={twitter}
                  onChange={(e) => setTwitter(e.target.value)}
                  placeholder="https://twitter.com/username"
                  className="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="flex items-center gap-2 text-sm font-medium mb-2">
                  <LinkIcon className="w-4 h-4" />
                  GitHub
                </label>
                <input
                  type="url"
                  value={github}
                  onChange={(e) => setGithub(e.target.value)}
                  placeholder="https://github.com/username"
                  className="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button
              onClick={handleSave}
              disabled={isSaving}
              size="lg"
              className="min-w-[150px]"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Сохранение...
                </>
              ) : (
                "Сохранить изменения"
              )}
            </Button>
          </div>
        </div>
      </main>

      <FooterClient />
    </div>
  );
}
