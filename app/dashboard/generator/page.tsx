'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Loader2, RefreshCw, Wand2, Send, ExternalLink, ImageIcon, Trash2 } from "lucide-react";
import { getNewsAction, generateArticleAction, publishArticleAction, generateImageAction } from './actions';
import { toast } from "sonner";
import { NewsItem } from '@/lib/news-fetcher';
import { GeneratedArticle } from '@/lib/ai-client';
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import dynamic from 'next/dynamic';
import { HeaderClientWrapper } from "@/components/header";
import { FooterClient } from "@/components/footer";

const Editor = dynamic(() => import('@/components/editor'), { 
  ssr: false,
  loading: () => <div className="h-[300px] w-full bg-muted/20 animate-pulse rounded-md"></div>
});

export default function GeneratorPage() {
  const router = useRouter();
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loadingNews, setLoadingNews] = useState(false);
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  
  const [generatedArticle, setGeneratedArticle] = useState<GeneratedArticle | null>(null);
  const [editorKey, setEditorKey] = useState(0); // Key to force editor remount on new generation
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  const fetchNews = async () => {
    setLoadingNews(true);
    try {
      const result = await getNewsAction();
      if (result.success && result.data) {
        setNews(result.data);
        toast.success("Новости обновлены");
      } else {
        toast.error("Не удалось загрузить новости");
      }
    } catch (e) {
      toast.error("Ошибка при загрузке новостей");
    } finally {
      setLoadingNews(false);
    }
  };

  const generateAI = async () => {
    if (!selectedNews) return;
    
    setIsGenerating(true);
    try {
      const context = `Заголовок: ${selectedNews.title}\nТекст: ${selectedNews.snippet}\nСсылка: ${selectedNews.link}`;
      const result = await generateArticleAction(selectedNews.title, context);
      
      if (result.success && result.data) {
        setGeneratedArticle(result.data);
        setEditorKey(prev => prev + 1); // Force editor remount
        toast.success("Статья сгенерирована!");
      } else {
        toast.error(result.error || "Ошибка генерации");
      }
    } catch (e) {
      toast.error("Ошибка при генерации");
    } finally {
      setIsGenerating(false);
    }
  };

  const generateCoverImage = async () => {
    if (!generatedArticle) return;
    
    setIsGeneratingImage(true);
    try {
      // Используем заголовок и начало контента как саммари
      // Extract text from blocks safely
      const firstParagraph = generatedArticle.blocks.find(b => b.type === 'paragraph')?.data?.text || '';
      const summary = firstParagraph.substring(0, 300).replace(/<[^>]*>/g, '');
      
      const result = await generateImageAction(generatedArticle.title, summary);
      
      if (result.success && result.imageUrl) {
        setGeneratedArticle({ ...generatedArticle, coverImage: result.imageUrl });
        toast.success("Обложка сгенерирована!");
      } else {
        toast.error(result.error || "Ошибка генерации обложки");
      }
    } catch (e) {
      toast.error("Ошибка при генерации обложки");
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const publishArticle = async () => {
    if (!generatedArticle) return;
    
    setIsPublishing(true);
    try {
      const result = await publishArticleAction(generatedArticle);
      if (result.success) {
        toast.success("Статья опубликована!");
        setGeneratedArticle(null);
        setSelectedNews(null);
      } else {
        toast.error(result.error || "Ошибка публикации");
      }
    } catch (e) {
      toast.error("Ошибка при публикации");
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <HeaderClientWrapper />
      
      <main className="flex-grow container mx-auto px-4 py-4">
        {/* Back Button */}
        <div className="mb-4">
          <Button variant="ghost" onClick={() => router.back()} className="gap-2 pl-0 hover:pl-2 transition-all">
            <ArrowLeft className="w-4 h-4" />
            Назад
          </Button>
        </div>

        <div className="flex flex-col md:flex-row gap-6 h-full">
        
        {/* Левая колонка: Новости */}
        <div className="w-full md:w-1/3 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Инфоповоды</h2>
            <Button 
              variant="outline" 
              size="icon" 
              onClick={fetchNews} 
              disabled={loadingNews}
            >
              {loadingNews ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            </Button>
          </div>
          
          <ScrollArea className="flex-1 rounded-md border p-4">
            {news.length === 0 ? (
              <div className="text-center text-muted-foreground py-10">
                Нажмите кнопку обновления, чтобы загрузить свежие новости Microsoft
              </div>
            ) : (
              <div className="space-y-4">
                {news.map((item, idx) => (
                  <Card 
                    key={idx} 
                    className={`cursor-pointer transition-colors hover:bg-accent ${selectedNews === item ? 'border-primary bg-accent' : ''}`}
                    onClick={() => setSelectedNews(item)}
                  >
                    <CardHeader className="p-4">
                      <div className="flex justify-between items-start gap-2">
                        <Badge variant="secondary" className="mb-2 text-xs">{item.source}</Badge>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(item.pubDate).toLocaleDateString()}
                        </span>
                      </div>
                      <CardTitle className="text-sm font-medium leading-tight mb-2">
                        {item.title}
                      </CardTitle>
                      <CardDescription className="line-clamp-3 text-xs">
                        {item.snippet}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Правая колонка: Редактор */}
        <div className="w-full md:w-2/3 flex flex-col gap-4">
          <h2 className="text-2xl font-bold">Генератор контента</h2>
          
          <Card className="flex-1 flex flex-col">
            <CardContent className="p-6 flex-1 flex flex-col gap-4">
              {!selectedNews ? (
                <div className="flex-1 flex items-center justify-center text-muted-foreground">
                  Выберите новость слева, чтобы начать работу
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between border-b pb-4">
                    <div>
                      <h3 className="font-semibold text-lg">{selectedNews.title}</h3>
                      <a href={selectedNews.link} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline flex items-center gap-1 mt-1">
                        Читать оригинал <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                    <Button onClick={generateAI} disabled={isGenerating}>
                      {isGenerating ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Думаю...
                        </>
                      ) : (
                        <>
                          <Wand2 className="mr-2 h-4 w-4" />
                          Сгенерировать статью
                        </>
                      )}
                    </Button>
                  </div>

                  {generatedArticle ? (
                    <div className="flex-1 flex flex-col gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Заголовок</label>
                        <input 
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          value={generatedArticle.title}
                          onChange={(e) => setGeneratedArticle({...generatedArticle, title: e.target.value})}
                        />
                      </div>
                      
                      <div className="space-y-2">
                         <div className="flex items-center justify-between">
                            <label className="text-sm font-medium">Обложка</label>
                            {!generatedArticle.coverImage && (
                              <Button variant="outline" size="sm" onClick={generateCoverImage} disabled={isGeneratingImage}>
                                {isGeneratingImage ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : <ImageIcon className="w-3 h-3 mr-2" />}
                                Сгенерировать обложку
                              </Button>
                            )}
                         </div>
                         
                         {generatedArticle.coverImage && (
                           <div className="relative aspect-video w-full overflow-hidden rounded-lg border bg-muted">
                             <img 
                               src={generatedArticle.coverImage} 
                               alt="Cover" 
                               className="object-cover w-full h-full"
                             />
                             <Button 
                               variant="destructive" 
                               size="icon" 
                               className="absolute top-2 right-2 h-8 w-8"
                               onClick={() => setGeneratedArticle({...generatedArticle, coverImage: undefined})}
                             >
                               <Trash2 className="w-4 h-4" />
                             </Button>
                           </div>
                         )}
                      </div>

                      <div className="space-y-2 flex-1 flex flex-col">
                        <label className="text-sm font-medium">Контент (EditorJS)</label>
                        <div className="flex-1 min-h-[400px]">
                          <Editor 
                            key={editorKey} // Remount editor when key changes
                            holder="generator-editor"
                            data={{ 
                              time: Date.now(), 
                              blocks: generatedArticle.blocks || [], 
                              version: '2.29.1' 
                            }}
                            onChange={(data) => {
                              // We need to keep blocks in sync
                              setGeneratedArticle({
                                ...generatedArticle,
                                blocks: data.blocks
                              });
                            }}
                          />
                        </div>
                      </div>

                      <div className="flex justify-between items-center pt-2">
                        <div className="flex gap-2">
                          {generatedArticle.tags.map(tag => (
                            <Badge key={tag} variant="outline">#{tag}</Badge>
                          ))}
                        </div>
                        <Button onClick={publishArticle} disabled={isPublishing} variant="default">
                          {isPublishing ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Публикация...
                            </>
                          ) : (
                            <>
                              <Send className="mr-2 h-4 w-4" />
                              Опубликовать
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center justify-center text-muted-foreground bg-muted/20 rounded-lg border-2 border-dashed">
                      Нажмите «Сгенерировать статью», чтобы получить черновик от AI
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
        </div>
      </main>

      <FooterClient />
    </div>
  );
}
