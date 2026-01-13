"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { HeaderClientWrapper } from "@/components/header";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  getNewsAction, 
  generateArticleAction, 
  generateImageAction,
  publishArticleAction 
} from "./actions";
import { NewsItem as NewsItemType } from "@/lib/news-fetcher";
import { GeneratedArticle } from "@/lib/ai-client";
import { Sparkles, Loader2, CheckCircle2, XCircle, ExternalLink } from "lucide-react";
import { toast } from "sonner";

interface NewsItem extends NewsItemType {
  id: string;
}

export default function GeneratorPage() {
  const router = useRouter();
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<string | null>(null);
  const [generatedArticle, setGeneratedArticle] = useState<GeneratedArticle | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);

  useEffect(() => {
    loadNews();
  }, []);

  const loadNews = async () => {
    setLoading(true);
    const result = await getNewsAction();
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

  const handleGenerate = async (newsItem: NewsItem) => {
    setGenerating(newsItem.id);
    setSelectedNews(newsItem);
    setGeneratedArticle(null);

    try {
      // Генерируем статью
      const context = newsItem.snippet || newsItem.title || '';
      const articleResult = await generateArticleAction(newsItem.title, context);
      
      if (!articleResult.success || !articleResult.data) {
        throw new Error(articleResult.error || "Ошибка генерации");
      }

      const article = articleResult.data;
      setGeneratedArticle(article);

      // Генерируем обложку
      const summary = article.blocks
        .find(b => b.type === "paragraph")?.data?.text
        ?.substring(0, 200) || article.title;

      const imageResult = await generateImageAction(article.title, summary);
      
      if (imageResult.success && imageResult.imageUrl) {
        article.coverImage = imageResult.imageUrl;
        setGeneratedArticle({ ...article });
      }

      toast.success("Статья успешно сгенерирована!");
    } catch (error: any) {
      toast.error("Ошибка генерации", {
        description: error.message || "Попробуйте позже"
      });
    } finally {
      setGenerating(null);
    }
  };

  const handlePublish = async () => {
    if (!generatedArticle) return;

    setPublishing(true);
    try {
      const result = await publishArticleAction(generatedArticle);
      
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
                    Выберите новость и нажмите "Сгенерировать статью"
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
                        }}
                      >
                        Очистить
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {generatedArticle.coverImage && (
                    <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-border">
                      <img
                        src={generatedArticle.coverImage}
                        alt={generatedArticle.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  <div>
                    <h3 className="font-semibold mb-2">Теги:</h3>
                    <div className="flex flex-wrap gap-2">
                      {generatedArticle.tags.map((tag, i) => (
                        <span
                          key={i}
                          className="px-2 py-1 bg-secondary rounded text-xs"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">Содержимое:</h3>
                    <div className="text-sm text-muted-foreground space-y-2 max-h-[300px] overflow-y-auto p-4 bg-secondary/30 rounded-lg">
                      {generatedArticle.blocks.map((block, i) => {
                        if (block.type === "paragraph") {
                          return (
                            <p key={i} className="mb-2">
                              {block.data?.text?.replace(/<[^>]*>/g, "") || ""}
                            </p>
                          );
                        } else if (block.type === "header") {
                          const level = block.data?.level || 2;
                          const Tag = `h${level}` as keyof JSX.IntrinsicElements;
                          return (
                            <Tag key={i} className="font-semibold mt-4 mb-2">
                              {block.data?.text || ""}
                            </Tag>
                          );
                        }
                        return null;
                      })}
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
