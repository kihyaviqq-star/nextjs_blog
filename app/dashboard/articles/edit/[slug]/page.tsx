"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { FileUpload } from "@/components/file-upload";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Save, Eye, X } from "lucide-react";
import { OutputData } from "@editorjs/editorjs";
import { BlogPost } from "@/lib/types";
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

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default function EditPostPage({ params }: PageProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [slug, setSlug] = useState<string>("");
  const [post, setPost] = useState<BlogPost | null>(null);
  const [editorData, setEditorData] = useState<OutputData | undefined>();
  const [editorKey, setEditorKey] = useState<number>(0);
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [sources, setSources] = useState<string[]>([]);
  const [newSource, setNewSource] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [editorReady, setEditorReady] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      const fetchPost = async () => {
        try {
          const { slug: postSlug } = await params;
          setSlug(postSlug);
          
          const response = await fetch(`/api/posts/${postSlug}`);
          if (response.ok) {
            const foundPost = await response.json();
            setPost(foundPost);
            setTitle(foundPost.title);
            setExcerpt(foundPost.excerpt);
            setCoverImage(foundPost.coverImage || "");
            setTags(foundPost.tags);
            setSources(foundPost.sources || []);
            
            // Задержка для загрузки данных в редактор
            setTimeout(() => {
              setEditorData(foundPost.content);
              setEditorKey(Date.now());
              setEditorReady(true);
            }, 100);
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
  }, [params, status, router]);

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
      const response = await fetch(`/api/posts/${slug}`, {
        method: "PUT",
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
        toast.success("Изменения сохранены", {
          description: "Статья успешно обновлена"
        });
        
        // Refresh page to show updated content
        router.refresh();
      } else {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        console.error("Server error:", errorData);
        toast.error("Не удалось сохранить статью", {
          description: errorData.error || response.statusText
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
              <h1 className="text-4xl font-bold mb-2">Редактирование статьи</h1>
              <p className="text-muted-foreground">
                Обновите информацию о статье и её содержимое
              </p>
            </div>
            <div className="flex gap-2">
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
                currentUrl={coverImage}
                onUploadComplete={(url) => setCoverImage(url)}
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
              {editorReady ? (
                <EditorWrapper
                  key={editorKey}
                  data={editorData}
                  onChange={setEditorData}
                  holder={`editorjs-edit-${editorKey}`}
                />
              ) : (
                <div className="min-h-[400px] flex items-center justify-center border border-border rounded-lg bg-secondary/20">
                  <div className="text-center space-y-4">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="text-sm text-muted-foreground">Загрузка содержимого...</p>
                  </div>
                </div>
              )}
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

      <Footer />
    </div>
  );
}
