"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { HeaderClientWrapper } from "@/components/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, X, Image as ImageIcon, Plus } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  getNewsAction, 
  generateArticleAction,
  generateArticleFromUrlAction,
  generateImageAction,
  publishArticleAction 
} from "./actions";
import { NewsItem as NewsItemType, RSS_SOURCES } from "@/lib/news-fetcher";
import { GeneratedArticle } from "@/lib/ai-client";
import { Sparkles, Loader2, CheckCircle2, ExternalLink, Settings, Globe } from "lucide-react";
import { toast } from "sonner";
import dynamic from "next/dynamic";
import type { OutputData } from "@editorjs/editorjs";

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
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface NewsItem extends NewsItemType {
  id: string;
}

const STORAGE_KEY_SOURCES = 'generator-enabled-sources';

export default function GeneratorPage() {
  const router = useRouter();
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<string | null>(null);
  const [generatedArticle, setGeneratedArticle] = useState<GeneratedArticle | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const [generatingImage, setGeneratingImage] = useState(false);
  const [newTag, setNewTag] = useState("");
  const [enabledSources, setEnabledSources] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY_SOURCES);
      return saved ? JSON.parse(saved) : RSS_SOURCES.map(s => s.id);
    }
    return RSS_SOURCES.map(s => s.id);
  });
  const [parsingUrl, setParsingUrl] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const editorDataRef = useRef<OutputData | null>(null);
  const editorHolderId = useRef(`editor-${Date.now()}`);
  
  // Infinite scroll
  const [visibleNewsCount, setVisibleNewsCount] = useState(20);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoadingMore && visibleNewsCount < news.length) {
          setIsLoadingMore(true);
          // Artificial delay to show loader
          setTimeout(() => {
            setVisibleNewsCount((prev) => Math.min(prev + 20, news.length));
            setIsLoadingMore(false);
          }, 800);
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => {
      if (loadMoreRef.current) {
        observer.unobserve(loadMoreRef.current);
      }
    };
  }, [news.length, loading, visibleNewsCount, isLoadingMore]); // Added dependencies

  useEffect(() => {
    loadNews();
  }, [enabledSources]);

  useEffect(() => {
    // Save enabled sources to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_SOURCES, JSON.stringify(enabledSources));
    }
  }, [enabledSources]);

  const loadNews = async () => {
    setLoading(true);
    setVisibleNewsCount(20); // Reset visible count
    console.log('Loading news with sources:', enabledSources);
    const result = await getNewsAction(enabledSources);
    if (result.success && result.data) {
      // Добавляем id к каждой новости
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

  const toggleSource = (sourceId: string) => {
    setEnabledSources(prev => {
      if (prev.includes(sourceId)) {
        return prev.filter(id => id !== sourceId);
      } else {
        return [...prev, sourceId];
      }
    });
  };

  const handleParseUrl = async () => {
    if (!urlInput.trim()) {
      toast.error("Введите URL");
      return;
    }

    setParsingUrl(true);
    setGeneratedArticle(null);
    editorDataRef.current = null;
    editorHolderId.current = `editor-${Date.now()}`;

    try {
      const result = await generateArticleFromUrlAction(urlInput.trim());
      
      if (!result.success || !result.data) {
        throw new Error(result.error || "Ошибка генерации");
      }

      const article = result.data;
      
      // Ограничиваем количество тегов до 3 максимум
      if (article.tags && article.tags.length > 3) {
        article.tags = article.tags.slice(0, 3);
      }
      
      // Convert blocks to Editor.js format
      const editorData: OutputData = {
        blocks: article.blocks,
        time: Date.now(),
        version: "2.29.1"
      };
      editorDataRef.current = editorData;
      
      setGeneratedArticle(article);
      setUrlInput("");

      toast.success("Статья успешно сгенерирована из URL!");
    } catch (error: any) {
      toast.error("Ошибка парсинга URL", {
        description: error.message || "Попробуйте позже"
      });
    } finally {
      setParsingUrl(false);
    }
  };

  const handleGenerate = async (newsItem: NewsItem) => {
    setGenerating(newsItem.id);
    setSelectedNews(newsItem);
    setGeneratedArticle(null);
    editorDataRef.current = null;
    editorHolderId.current = `editor-${Date.now()}`;

    try {
      // Генерируем статью
      const context = newsItem.snippet || newsItem.title || '';
      const articleResult = await generateArticleAction(newsItem.title, context);
      
      if (!articleResult.success || !articleResult.data) {
        throw new Error(articleResult.error || "Ошибка генерации");
      }

      const article = articleResult.data;
      
      // Ограничиваем количество тегов до 3 максимум
      if (article.tags && article.tags.length > 3) {
        article.tags = article.tags.slice(0, 3);
      }
      
      // Convert blocks to Editor.js format
      const editorData: OutputData = {
        blocks: article.blocks,
        time: Date.now(),
        version: "2.29.1"
      };
      editorDataRef.current = editorData;
      
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

  const handleGenerateImage = async () => {
    if (!generatedArticle) return;

    setGeneratingImage(true);
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
      setGeneratingImage(false);
    }
  };

  const handleDeleteTag = (index: number) => {
    if (!generatedArticle) return;
    const newTags = generatedArticle.tags.filter((_, i) => i !== index);
    setGeneratedArticle({ ...generatedArticle, tags: newTags });
  };

  const handleAddTag = () => {
    if (!generatedArticle || !newTag.trim()) return;
    
    // Проверка на максимум 3 тега
    if (generatedArticle.tags.length >= 3) {
      toast.error("Максимум 3 тега");
      return;
    }
    
    const trimmedTag = newTag.trim();
    if (generatedArticle.tags.includes(trimmedTag)) {
      toast.error("Тег уже существует");
      return;
    }
    setGeneratedArticle({
      ...generatedArticle,
      tags: [...generatedArticle.tags, trimmedTag]
    });
    setNewTag("");
  };

  const handleEditorChange = (data: OutputData) => {
    editorDataRef.current = data;
    if (generatedArticle) {
      setGeneratedArticle({
        ...generatedArticle,
        blocks: data.blocks
      });
    }
  };

  const handlePublish = async () => {
    if (!generatedArticle) return;

    setPublishing(true);
    try {
      // Use current editor data if available
      const articleToPublish = editorDataRef.current
        ? {
            ...generatedArticle,
            blocks: editorDataRef.current.blocks
          }
        : generatedArticle;

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
              <div className="flex gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Settings className="w-4 h-4" />
                      Источники
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>Управление источниками</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {RSS_SOURCES.map((source) => (
                      <div
                        key={source.id}
                        className="flex items-center justify-between px-2 py-1.5 hover:bg-accent rounded-sm"
                      >
                        <label
                          htmlFor={`source-${source.id}`}
                          className="text-sm font-medium cursor-pointer flex-1"
                        >
                          {source.name}
                        </label>
                        <Switch
                          id={`source-${source.id}`}
                          checked={enabledSources.includes(source.id)}
                          onCheckedChange={() => toggleSource(source.id)}
                        />
                      </div>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
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
            </div>

            {/* URL Parser Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  Парсинг по URL
                </CardTitle>
                <CardDescription>
                  Вставьте ссылку на статью для автоматической генерации
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    placeholder="Вставьте ссылку на статью..."
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !parsingUrl) {
                        handleParseUrl();
                      }
                    }}
                    disabled={parsingUrl}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleParseUrl}
                    disabled={parsingUrl || !urlInput.trim()}
                    className="gap-2"
                  >
                    {parsingUrl ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Парсинг...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        Парсить
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

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
                {news.slice(0, visibleNewsCount).map((item) => (
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
                            Источник: {(() => {
                              try {
                                if (!item.link) return '';
                                const url = new URL(item.link);
                                return url.hostname.replace(/^www\./, '');
                              } catch (e) {
                                return '';
                              }
                            })()} <ExternalLink className="w-3 h-3" />
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
                
                {visibleNewsCount < news.length && (
                  <div ref={loadMoreRef} className="py-8 text-center text-muted-foreground flex flex-col items-center justify-center gap-3">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    <span className="text-sm font-medium">Загрузка следующих новостей...</span>
                  </div>
                )}
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
                          editorDataRef.current = null;
                          editorHolderId.current = `editor-${Date.now()}`;
                        }}
                      >
                        Очистить
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Cover Image Section */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold">Обложка:</h3>
                      <Button
                        onClick={handleGenerateImage}
                        disabled={generatingImage}
                        variant="outline"
                        size="sm"
                        className="gap-2"
                      >
                        {generatingImage ? (
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
                      <div className="w-full aspect-video rounded-lg border border-dashed border-border flex items-center justify-center bg-secondary/30">
                        <p className="text-sm text-muted-foreground">
                          Обложка не сгенерирована
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Tags Section */}
                  <div>
                    <h3 className="font-semibold mb-2">Теги:</h3>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {generatedArticle.tags.map((tag, i) => (
                        <Badge
                          key={i}
                          variant="secondary"
                          className="gap-1 pr-1"
                        >
                          {tag}
                          <button
                            onClick={() => handleDeleteTag(i)}
                            className="ml-1 hover:bg-destructive/20 rounded-full p-0.5 transition-colors"
                            type="button"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        placeholder={generatedArticle?.tags.length === 3 ? "Максимум 3 тега" : "Добавить тег (макс. 3)"}
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddTag();
                          }
                        }}
                        className="flex-1"
                        disabled={(generatedArticle?.tags.length || 0) >= 3}
                      />
                      <Button
                        onClick={handleAddTag}
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        disabled={!newTag.trim() || (generatedArticle?.tags.length || 0) >= 3}
                      >
                        <Plus className="w-4 h-4" />
                        Добавить
                      </Button>
                    </div>
                  </div>

                  {/* Editor.js Content Section */}
                  <div>
                    <h3 className="font-semibold mb-2">Содержимое:</h3>
                    <div className="border border-border rounded-lg p-4 bg-background min-h-[400px]">
                      <EditorWrapper
                        data={editorDataRef.current || {
                          blocks: generatedArticle.blocks,
                          time: Date.now(),
                          version: "2.29.1"
                        }}
                        onChange={handleEditorChange}
                        holder={editorHolderId.current}
                      />
                    </div>
                  </div>

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
