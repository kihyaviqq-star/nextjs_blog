"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { HeaderClientWrapper } from "@/components/header";
import { FooterClient } from "@/components/footer";
import { FileUpload } from "@/components/file-upload";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Save, Eye, X } from "lucide-react";
import type { OutputData } from "@editorjs/editorjs";
import { BlogPost } from "@/lib/types";
import { toast } from "sonner";
import { generateSlug } from "@/lib/slug";

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

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default function EditPostPage({ params }: PageProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [currentSlug, setCurrentSlug] = useState<string>(""); // Текущий slug из URL
  const [post, setPost] = useState<BlogPost | null>(null);
  const [editorData, setEditorData] = useState<OutputData | undefined>();
  const [editorKey, setEditorKey] = useState<number>(0);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState(""); // Slug для редактирования
  const [excerpt, setExcerpt] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [sources, setSources] = useState<string[]>([]);
  const [newSource, setNewSource] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [editorReady, setEditorReady] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
      return;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]); // router стабилен и не должен быть в зависимостях

  useEffect(() => {
    if (status === "authenticated" && !hasLoaded) {
      const fetchPost = async () => {
        try {
          const { slug: postSlug } = await params;
          setCurrentSlug(postSlug);
          
          const response = await fetch(`/api/posts/${postSlug}`);
          if (response.ok) {
            const foundPost = await response.json();
            console.log("[Edit] Loaded post coverImage:", foundPost.coverImage, "type:", typeof foundPost.coverImage);
            setPost(foundPost);
            setTitle(foundPost.title);
            setSlug(foundPost.slug || postSlug); // Загружаем текущий slug
            setExcerpt(foundPost.excerpt);
            // Нормализуем coverImage: null или undefined -> пустая строка для состояния
            const normalizedCover = foundPost.coverImage ? String(foundPost.coverImage).trim() : "";
            setCoverImage(normalizedCover);
            // Ограничиваем количество тегов до 3 максимум при загрузке
            const loadedTags = foundPost.tags || [];
            setTags(loadedTags.length > 3 ? loadedTags.slice(0, 3) : loadedTags);
            setSources(foundPost.sources || []);
            
            // Задержка для загрузки данных в редактор
            setTimeout(() => {
              setEditorData(foundPost.content);
              setEditorKey(Date.now());
              setEditorReady(true);
            }, 100);
            setHasLoaded(true);
          } else {
            alert("Статья не найдена");
            router.push("/dashboard/articles");
          }
        } catch (error) {
          console.error("Error loading post:", error);
          alert("Ошибка при загрузке статьи");
          router.push("/admin");
        } finally {
          setIsLoading(false);
        }
      };
      
      fetchPost();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]); // Загружаем только при изменении статуса, params обрабатывается внутри

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
      // Нормализуем coverImage
      let normalizedCoverImage: string | null = null;
      if (coverImage && typeof coverImage === 'string') {
        const trimmed = coverImage.trim();
        normalizedCoverImage = trimmed.length > 0 ? trimmed : null;
      } else if (coverImage === null || coverImage === undefined || coverImage === "") {
        normalizedCoverImage = null;
      } else {
        // Если это не строка и не null/undefined, пробуем преобразовать в строку
        normalizedCoverImage = String(coverImage).trim() || null;
      }
      
      console.log("[Edit] Original coverImage:", coverImage, "type:", typeof coverImage);
      console.log("[Edit] Normalized coverImage:", normalizedCoverImage);
      
      const requestBody: any = {
        title,
        slug: slug.trim(),
        excerpt,
        coverImage: normalizedCoverImage, // Всегда отправляем, даже если null
        tags,
        sources,
        content: editorData,
      };
      
      console.log("[Edit] Sending request body:", {
        ...requestBody,
        coverImage: normalizedCoverImage,
        content: "[EditorJS data]"
      });

      const response = await fetch(`/api/posts/${currentSlug}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success("Изменения сохранены", {
          description: "Статья успешно обновлена"
        });
        
        // Если slug изменился, перенаправляем на новый URL
        if (data.slug && data.slug !== currentSlug) {
          setTimeout(() => {
            router.push(`/dashboard/articles/edit/${data.slug}`);
          }, 500);
        }
        
        // Не вызываем router.refresh() чтобы избежать перезагрузки страницы
      } else {
        // Пытаемся получить текст ошибки
        let errorMessage = response.statusText || "Неизвестная ошибка";
        try {
          const errorText = await response.text();
          if (errorText) {
            try {
              const errorData = JSON.parse(errorText);
              errorMessage = errorData.error || errorData.message || errorMessage;
              // Если есть детали валидации, добавляем их
              if (errorData.details?.errors) {
                const validationErrors = errorData.details.errors
                  .map((err: any) => `${err.field}: ${err.message}`)
                  .join(', ');
                if (validationErrors) {
                  errorMessage = `${errorMessage}. ${validationErrors}`;
                }
              }
            } catch {
              // Если не JSON, используем текст как есть
              errorMessage = errorText || errorMessage;
            }
          }
        } catch (e) {
          console.error("Error parsing error response:", e);
        }
        
        console.error("Server error:", {
          status: response.status,
          statusText: response.statusText,
          message: errorMessage
        });
        
        toast.error("Не удалось сохранить статью", {
          description: errorMessage
        });
      }
    } catch (error) {
      console.error("Error saving post:", error);
      toast.error("Не удалось сохранить статью", {
        description: error instanceof Error ? error.message : "Проверьте подключение к интернету"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePreview = () => {
    router.push(`/${slug}`);
  };

  const addTag = () => {
    if (tags.length >= 3) {
      toast.error("Максимум 3 тега");
      return;
    }
    
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

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-muted-foreground">Загрузка статьи...</p>
        </div>
      </div>
    );
  }

  if (!session?.user || !post) {
    return null;
  }

  const userRole = (session.user as any).role;
  const canAccess = userRole === "ADMIN" || userRole === "EDITOR";

  if (!canAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-xl text-muted-foreground">У вас нет доступа к этой странице</p>
          <Button onClick={() => router.push("/")}>
            На главную
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <HeaderClientWrapper />
      <main className="flex-grow container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6">
          <Link href="/dashboard/articles">
            <Button variant="ghost" size="sm" className="mb-4 -ml-3">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Назад к списку
            </Button>
          </Link>

          <div className="mb-6">
            <div className="mb-4 md:mb-0">
              <h1 className="text-4xl font-bold mb-2">Редактирование статьи</h1>
              <p className="text-muted-foreground">
                Обновите информацию о статье и её содержимое
              </p>
            </div>
            <div className="flex md:hidden mt-4 gap-2">
              <Button
                variant="outline"
                onClick={handlePreview}
                className="gap-2 flex-1"
              >
                <Eye className="w-4 h-4" />
                Просмотр
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="gap-2 flex-1"
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Сохранение...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Сохранить
                  </>
                )}
              </Button>
            </div>
            <div className="hidden md:flex items-center justify-end gap-2">
              <Button
                variant="outline"
                onClick={handlePreview}
                className="gap-2"
              >
                <Eye className="w-4 h-4" />
                Просмотр
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving}
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
                    Сохранить
                  </>
                )}
              </Button>
            </div>
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

          {/* Slug */}
          <Card>
            <CardHeader>
              <CardTitle>Ссылка (Slug)</CardTitle>
              <CardDescription>
                URL-адрес статьи. Изменение slug создаст новую ссылку на статью.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">domain.com/</span>
                  <Input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(generateSlug(e.target.value))}
                    placeholder="article-slug"
                    className="flex-1 font-mono text-sm"
                    pattern="[a-z0-9-]+"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Разрешены только строчные латинские буквы, цифры и дефисы
                </p>
              </div>
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
            <CardContent>
              <FileUpload
                currentUrl={coverImage || undefined}
                onUploadComplete={(url) => {
                  // Принимаем как абсолютные, так и относительные URL
                  if (url && typeof url === 'string' && url.trim().length > 0) {
                    const trimmedUrl = url.trim();
                    // Проверяем, что это валидный формат (абсолютный или относительный путь)
                    try {
                      // Если это абсолютный URL, проверяем через URL конструктор
                      if (trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://')) {
                        new URL(trimmedUrl);
                      }
                      // Относительные пути (начинающиеся с /) тоже валидны
                      setCoverImage(trimmedUrl);
                    } catch (e) {
                      console.error("[Edit] Invalid URL from FileUpload:", url);
                      toast.error("Некорректный URL изображения");
                    }
                  } else {
                    setCoverImage("");
                  }
                }}
                type="cover"
                label="Загрузить обложку"
              />
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
                  placeholder={tags.length === 3 ? "Максимум 3 тега" : "Введите тег и нажмите Enter (макс. 3)"}
                  className="flex-1 px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={tags.length >= 3}
                />
                <Button onClick={addTag} type="button" disabled={tags.length >= 3 || !newTag.trim()}>
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
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold mb-2">Содержимое статьи</h2>
              <p className="text-muted-foreground">
                Используйте редактор для создания богатого контента
              </p>
            </div>
            <div>
              {editorReady ? (
                <EditorWrapper
                  key={editorKey}
                  data={editorData}
                  onChange={setEditorData}
                  holder={`editorjs-edit-${editorKey}`}
                />
              ) : (
                <div className="min-h-[400px] flex items-center justify-center">
                  <div className="text-center space-y-4">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="text-sm text-muted-foreground">Загрузка содержимого...</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="mt-8 flex justify-end gap-4 pb-8 min-h-[100px]">
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
                Сохранение...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Сохранить изменения
              </>
            )}
          </Button>
        </div>
      </main>

      <FooterClient />
    </div>
  );
}
