"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { HeaderClientWrapper } from "@/components/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, X, Plus } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  getNewsAction, 
  generateArticleAction, 
  generateImageAction,
  publishArticleAction 
} from "./actions";
import { NewsItem as NewsItemType } from "@/lib/news-fetcher";
import { GeneratedArticle } from "@/lib/ai-client";
import { Sparkles, Loader2, CheckCircle2, ExternalLink, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { OutputData } from "@editorjs/editorjs";

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

interface NewsItem extends NewsItemType {
  id: string;
}

export default function GeneratorPage() {
  const router = useRouter();
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<string | null>(null);
  const [generatingCover, setGeneratingCover] = useState(false);
  const [generatedArticle, setGeneratedArticle] = useState<GeneratedArticle | null>(null);
  const [editorData, setEditorData] = useState<OutputData | undefined>();
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);

  // Convert GeneratedArticle blocks to Editor.js format
  const articleToEditorData = useMemo(() => {
    if (!generatedArticle) return undefined;
    return {
      blocks: generatedArticle.blocks,
      time: Date.now(),
      version: "2.29.1"
    } as OutputData;
  }, [generatedArticle]);

  useEffect(() => {
    loadNews();
  }, []);

  useEffect(() => {
    if (articleToEditorData) {
      setEditorData(articleToEditorData);
    }
  }, [articleToEditorData]);

  useEffect(() => {
    if (generatedArticle) {
      setTags(generatedArticle.tags || []);
    }
  }, [generatedArticle]);

  const loadNews = async () => {
    setLoading(true);
    const result = await getNewsAction();
    if (result.success && result.data) {
      setNews(result.data.map((item, index) => ({
        ...item,
        id: `news-${index}-${Date.now()}`
      })));
    } else {
      toast.error("Не удалось загрузить новости", {
        description: result.error || "Проверьте подключение к интернету"
      });
    }
    setLoading(false);
  };

  const handleGenerate = async (newsItem: NewsItem) => {
    setGenerating(newsItem.id);
    setSelectedNews(newsItem);
    setGeneratedArticle(null);
    setEditorData(undefined);
    setTags([]);

    try {
      const context = newsItem.snippet || newsItem.title || '';
      const articleResult = await generateArticleAction(newsItem.title, context);
      
      if (!articleResult.success || !articleResult.data) {
        throw new Error(articleResult.error || "Ошибка генерации");
      }

      const article = articleResult.data;
      setGeneratedArticle(article);

      toast.success("Статья успешно сгенерирована!");
    } catch (error: any) {
      toast.error("Ошибка генерации", {
        description: error.message || "Попробуйте позже"
      });
    } finally {
      setGenerating(null);
    }
  };

  const handleGenerateCover = async () => {
    if (!generatedArticle) return;

    setGeneratingCover(true);
    try {
      const summary = generatedArticle.blocks
        .find(b => b.type === "paragraph")?.data?.text
        ?.substring(0, 200) || generatedArticle.title;

      const imageResult = await generateImageAction(generatedArticle.title, summary);
      
      if (imageResult.success && imageResult.imageUrl) {
        setGeneratedArticle({
          ...generatedArticle,
          coverImage: imageResult.imageUrl
        });
        toast.success("Обложка успешно сгенерирована!");
      } else {
        throw new Error(imageResult.error || "Ошибка генерации обложки");
      }
    } catch (error: any) {
      toast.error("Ошибка генерации обложки", {
        description: error.message || "Попробуйте позже"
      });
    } finally {
      setGeneratingCover(false);
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handlePublish = async () => {
    if (!generatedArticle) return;

    setPublishing(true);
    try {
      const articleToPublish: GeneratedArticle = {
        ...generatedArticle,
        tags: tags,
        blocks: editorData?.blocks || generatedArticle.blocks
      };

      const result = await publishArticleAction(articleToPublish);
      
      if (result.success) {
        toast.success("Статья успешно опубликована!");
        setTimeout(() => {
          router.push("/dashboard/articles");
        }, 1000);
      } else {
        throw new Error(result.error || "Ошибка публикации");
      }
    } catch (error: any) {
      toast.error("Ошибка публикации", {
        description: error.message || "Попробуйте позже"
      });
    } finally {
      setPublishing(false);
    }
  };

  return (
    <>
      <HeaderClientWrapper />
      
      {/* Back Button */}
      <div className="container mx-auto px-4 pt-6 pb-6 max-w-7xl">
        <Link href="/">
          <Button variant="outline" size="sm" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Все новости
          </Button>
        </Link>
      </div>
      
      <main className="flex-1 container mx-auto px-4 pb-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Генератор статей ИИ</h1>
          <p className="text-muted-foreground">
            Выберите новость и сгенерируйте статью с помощью искусственного интеллекта
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Новости */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Последние новости</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={loadNews}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Обновить"
                )}
              </Button>
            </div>

            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader>
                      <div className="h-4 bg-secondary rounded w-3/4 mb-2" />
                      <div className="h-3 bg-secondary rounded w-1/2" />
                    </CardHeader>
                    <CardContent>
                      <div className="h-20 bg-secondary rounded" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : news.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  Новости не найдены
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4 max-h-[800px] overflow-y-auto">
                {news.map((item) => (
                  <Card key={item.id} className="hover:border-primary/50 transition-colors">
                    <CardHeader>
                      <CardTitle className="text-lg line-clamp-2">{item.title}</CardTitle>
                      <CardDescription className="flex items-center gap-2">
                        <span>{new Date(item.pubDate).toLocaleDateString('ru-RU')}</span>
                        {item.link && (
                          <a
                            href={item.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs hover:text-primary"
                          >
                            Источник <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                        {item.snippet || 'Описание отсутствует'}
                      </p>
                      <Button
                        onClick={() => handleGenerate(item)}
                        disabled={generating === item.id}
                        className="w-full gap-2"
                        variant={selectedNews?.id === item.id ? "default" : "outline"}
                      >
                        {generating === item.id ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Генерация...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4" />
                            Сгенерировать статью
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Результат генерации */}
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold">Результат</h2>

            {!generatedArticle ? (
              <Card>
                <CardContent className="py-16 text-center">
                  <Sparkles className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    Выберите новость и нажмите &quot;Сгенерировать статью&quot;
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <CardTitle className="mb-2">{generatedArticle.title}</CardTitle>
                      <CardDescription>
                        Сгенерированная статья готова к публикации
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setGeneratedArticle(null);
                          setSelectedNews(null);
                          setEditorData(undefined);
                          setTags([]);
                        }}
                      >
                        Очистить
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Cover Image */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold">Обложка:</h3>
                      {!generatedArticle.coverImage && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleGenerateCover}
                          disabled={generatingCover}
                          className="gap-2"
                        >
                          {generatingCover ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Генерация...
                            </>
                          ) : (
                            <>
                              <ImageIcon className="w-4 h-4" />
                              Сгенерировать обложку
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                    {generatedArticle.coverImage ? (
                      <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-border">
                        <img
                          src={generatedArticle.coverImage}
                          alt={generatedArticle.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-full aspect-video rounded-lg border border-dashed border-border flex items-center justify-center bg-secondary/20">
                        <p className="text-sm text-muted-foreground">Обложка не установлена</p>
                      </div>
                    )}
                  </div>

                  {/* Tags */}
                  <div>
                    <h3 className="font-semibold mb-2">Теги:</h3>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {tags.map((tag, i) => (
                        <Badge
                          key={i}
                          variant="secondary"
                          className="gap-1 pr-1"
                        >
                          {tag}
                          <button
                            onClick={() => handleRemoveTag(tag)}
                            className="ml-1 hover:bg-secondary-foreground/20 rounded-full p-0.5"
                            type="button"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddTag();
                          }
                        }}
                        placeholder="Добавить тег"
                        className="flex-1"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleAddTag}
                        className="gap-2"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Editor.js Content */}
                  <div>
                    <h3 className="font-semibold mb-2">Содержимое:</h3>
                    <div className="border border-border rounded-lg overflow-hidden">
                      {editorData ? (
                        <EditorWrapper
                          data={editorData}
                          onChange={setEditorData}
                          holder="editorjs-generator"
                        />
                      ) : (
                        <div className="min-h-[400px] flex items-center justify-center bg-secondary/20">
                          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Publish Button */}
                  <Button
                    onClick={handlePublish}
                    disabled={publishing}
                    className="w-full gap-2"
                    size="lg"
                  >
                    {publishing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Публикация...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        Опубликовать статью
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
