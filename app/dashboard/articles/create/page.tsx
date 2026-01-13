"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Save, Eye, X } from "lucide-react";
import { OutputData } from "@editorjs/editorjs";
import { toast } from "sonner";

const EditorWrapper = dynamic(() => import("@/components/editor/editor-wrapper"), {
  ssr: false,
  loading: () => (
    <div className="min-h-[400px] flex items-center justify-center border border-border rounded-lg bg-secondary/20">
      <div className="text-center space-y-4">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-sm text-muted-foreground">Загрузка редактора...</p>
      </div>
    </div>
  ),
});

export default function CreatePostPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [editorData, setEditorData] = useState<OutputData | undefined>();
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [sources, setSources] = useState<string[]>([]);
  const [newSource, setNewSource] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Загрузка...</p>
        </div>
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  const userRole = (session.user as any).role;
  const canAccess = userRole === "ADMIN" || userRole === "EDITOR";

  if (!canAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Доступ запрещен</CardTitle>
            <CardDescription>
              У вас нет прав для создания статей
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/">На главную</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error("Заполните заголовок", {
        description: "Пожалуйста, введите заголовок статьи"
      });
      return;
    }

    if (!excerpt.trim()) {
      toast.error("Заполните описание", {
        description: "Пожалуйста, введите краткое описание"
      });
      return;
    }

    if (!editorData || !editorData.blocks || editorData.blocks.length === 0) {
      toast.error("Добавьте контент", {
        description: "Пожалуйста, добавьте содержимое статьи"
      });
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch("/api/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          excerpt,
          coverImage,
          tags,
          sources,
          content: editorData,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success("Статья опубликована!", {
          description: "Теперь она доступна читателям"
        });
        
        // Небольшая задержка для отображения toast перед redirect
        setTimeout(() => {
          router.push(`/blog/${data.slug}`);
        }, 500);
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast.error("Не удалось сохранить статью", {
          description: errorData.error || "Попробуйте еще раз"
        });
      }
    } catch (error) {
      console.error("Error creating post:", error);
      toast.error("Не удалось сохранить статью", {
        description: error instanceof Error ? error.message : "Проверьте подключение к интернету"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const addSource = () => {
    if (newSource.trim() && !sources.includes(newSource.trim())) {
      setSources([...sources, newSource.trim()]);
      setNewSource("");
    }
  };

  const removeSource = (sourceToRemove: string) => {
    setSources(sources.filter((source) => source !== sourceToRemove));
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6">
          <Link href="/dashboard/articles">
            <Button variant="ghost" size="sm" className="mb-4 -ml-3">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Назад к списку
            </Button>
          </Link>

          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold mb-2">Создание новой статьи</h1>
              <p className="text-muted-foreground">
                Заполните информацию о статье и добавьте содержимое
              </p>
            </div>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              size="lg"
              className="gap-2"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Сохранение...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Опубликовать
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          {/* Title */}
          <Card>
            <CardHeader>
              <CardTitle>Заголовок статьи</CardTitle>
              <CardDescription>
                Основной заголовок, который будет отображаться в списке и на странице статьи
              </CardDescription>
            </CardHeader>
            <CardContent>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Введите заголовок статьи..."
                className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-lg"
              />
            </CardContent>
          </Card>

          {/* Excerpt */}
          <Card>
            <CardHeader>
              <CardTitle>Краткое описание</CardTitle>
              <CardDescription>
                Краткое описание статьи для превью в списке
              </CardDescription>
            </CardHeader>
            <CardContent>
              <textarea
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                placeholder="Введите краткое описание..."
                rows={3}
                className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              />
            </CardContent>
          </Card>

          {/* Cover Image */}
          <Card>
            <CardHeader>
              <CardTitle>Обложка статьи</CardTitle>
              <CardDescription>
                URL изображения для обложки статьи (рекомендуемый размер: 1200x600px)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <input
                type="url"
                value={coverImage}
                onChange={(e) => setCoverImage(e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
              {coverImage && (
                <div className="relative w-full h-64 rounded-lg overflow-hidden bg-secondary">
                  <img
                    src={coverImage}
                    alt="Предпросмотр обложки"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.parentElement!.innerHTML = '<div class="flex items-center justify-center h-full text-muted-foreground"><p>Не удалось загрузить изображение</p></div>';
                    }}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tags */}
          <Card>
            <CardHeader>
              <CardTitle>Теги</CardTitle>
              <CardDescription>
                Добавьте теги для категоризации статьи
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && addTag()}
                  placeholder="Введите тег и нажмите Enter"
                  className="flex-1 px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <Button onClick={addTag} type="button">
                  Добавить
                </Button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-2 px-3 py-1.5 bg-secondary rounded-full text-sm font-medium"
                    >
                      {tag}
                      <button
                        onClick={() => removeTag(tag)}
                        className="hover:text-destructive transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Sources */}
          <Card>
            <CardHeader>
              <CardTitle>Источники</CardTitle>
              <CardDescription>
                Добавьте ссылки на источники информации
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <input
                  type="url"
                  value={newSource}
                  onChange={(e) => setNewSource(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && addSource()}
                  placeholder="https://example.com/article"
                  className="flex-1 px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <Button onClick={addSource} type="button">
                  Добавить
                </Button>
              </div>
              {sources.length > 0 && (
                <div className="space-y-2">
                  {sources.map((source, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 p-3 bg-secondary rounded-lg group"
                    >
                      <span className="flex-1 text-sm truncate">{source}</span>
                      <button
                        onClick={() => removeSource(source)}
                        className="opacity-0 group-hover:opacity-100 hover:text-destructive transition-all"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Editor */}
          <Card>
            <CardHeader>
              <CardTitle>Содержимое статьи</CardTitle>
              <CardDescription>
                Используйте редактор для создания богатого контента
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EditorWrapper
                data={editorData}
                onChange={setEditorData}
                holder="editorjs-create"
              />
            </CardContent>
          </Card>
        </div>

        {/* Bottom Actions */}
        <div className="mt-8 flex justify-end gap-4 pb-8">
          <Link href="/dashboard/articles">
            <Button variant="outline" size="lg">
              Отмена
            </Button>
          </Link>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            size="lg"
            className="gap-2"
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Публикация...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Опубликовать статью
              </>
            )}
          </Button>
        </div>
      </main>

      <Footer />
    </div>
  );
}
