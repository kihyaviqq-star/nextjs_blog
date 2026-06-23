"use client";

import Link from "next/link";
import { ArrowLeft, ExternalLink, Calendar, Network, Eye, Key, Target, Clock, Bot, DownloadCloud, BrainCircuit, CheckCircle2, Cpu, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ExpandableText } from "@/components/expandable-text";
import { CommentSection } from "@/components/comments/comment-section";
import { 
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  ResponsiveContainer,
  Tooltip as RechartsTooltip
} from "recharts";
import { RelatedModels } from "./related-models";

interface AiSpecs {
  contextWindow?: string | number;
  parameters?: string;
  architecture?: string;
  releaseDate?: string;
  knowledgeCutoff?: string;
  avgScore?: string | number;
  visionSupport?: string | boolean;
  features?: string[];
  pricing?: {
    input?: string | number;
    output?: string | number;
    maxInput?: string | number;
    maxOutput?: string | number;
  };
  benchmarks?: any; // Can be flat { MMLU: 80 } or grouped { "Code": { HumanEval: 90 } }
  throughput?: string | number;
}

export function AiModelLayout({ tool }: { tool: any }) {
  let specs: AiSpecs = {};
  try {
    if (tool.aiSpecs) {
      specs = JSON.parse(tool.aiSpecs);
    }
  } catch (e) {
    // skip
  }

  // Detect if benchmarks are flat or grouped
  const isGroupedBenchmarks = specs.benchmarks && typeof Object.values(specs.benchmarks)[0] === 'object';
  
  let radarData: any[] = [];
  if (specs.benchmarks && !isGroupedBenchmarks) {
    radarData = Object.entries(specs.benchmarks).map(([subject, A]) => ({
      subject,
      A: Number(A) || 0,
      fullMark: 100,
    }));
  }

  return (
    <div className="min-h-screen bg-background font-sans">
      
      {/* Header Banner */}
      <div className="bg-primary/5 py-8 border-b border-border/40">
        <div className="container mx-auto max-w-7xl px-4 md:px-6">
          <Link href="/software" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Все модели
          </Link>
          
          <div className="flex flex-col md:flex-row items-start gap-6">
            <div className="w-24 h-24 rounded-3xl bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20 shadow-inner">
              {tool.logoUrl ? (
                <img src={tool.logoUrl} alt={tool.name} className="w-16 h-16 object-contain" />
              ) : (
                <Bot className="w-12 h-12 text-primary" />
              )}
            </div>
            
            <div className="flex-1">
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-3">
                {tool.name}
              </h1>
              
              <div className="flex flex-wrap items-center gap-3 mb-4">
                {specs.visionSupport && (
                  <span className="bg-secondary px-3 py-1 rounded-full text-xs font-semibold text-secondary-foreground flex items-center gap-1 border border-border/50">
                    <Eye className="w-3 h-3" /> Мультимодальная
                  </span>
                )}
                {tool.developer && (
                  <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold border border-primary/20">
                    {tool.developer}
                  </span>
                )}
                <span className="bg-muted px-3 py-1 rounded-full text-xs font-medium text-muted-foreground border border-border/50">
                  {tool.licenseType || "Proprietary"}
                </span>
              </div>
              
              <p className="text-lg text-muted-foreground max-w-3xl leading-relaxed">
                {tool.shortDesc}
              </p>
              
              {tool.websiteUrl && (
                <div className="mt-6">
                  <Button asChild size="lg" className="rounded-full shadow-md font-medium px-8 hover:scale-105 transition-transform duration-300">
                    <a href={tool.websiteUrl} target="_blank" rel="noopener noreferrer">
                      API / Официальный сайт <ExternalLink className="w-4 h-4 ml-2" />
                    </a>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <main className="container mx-auto max-w-7xl py-12 px-4 md:px-6">
        
        {/* Bento Grid Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-16">
          
          {/* Main Specs */}
          <div className="lg:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-4">
            
            {/* Context & Params */}
            <div className="col-span-2 bg-gradient-to-br from-card to-card/50 rounded-3xl p-6 border border-border/60 shadow-sm flex flex-col justify-between group hover:border-primary/30 transition-colors">
              <div>
                <div className="text-muted-foreground mb-3"><Cpu className="w-6 h-6" /></div>
                <div className="text-sm text-muted-foreground font-medium mb-1">Размер контекста</div>
              </div>
              <div className="text-4xl font-black text-foreground tracking-tight group-hover:text-primary transition-colors">
                {specs.contextWindow || "-"}
              </div>
            </div>

            <div className="col-span-2 bg-card rounded-3xl p-6 border border-border/60 shadow-sm flex flex-col justify-between">
              <div>
                <div className="text-muted-foreground mb-3"><Key className="w-5 h-5" /></div>
                <div className="text-sm text-muted-foreground font-medium mb-1">Параметры</div>
              </div>
              <div className="text-3xl font-bold">{specs.parameters || "-"}</div>
            </div>

            {/* Architecture, Release Date, Avg Score */}
            <div className="col-span-2 md:col-span-1 bg-card rounded-3xl p-5 border border-border/60 shadow-sm flex flex-col justify-between">
              <div className="text-xs text-muted-foreground font-medium mb-2">Дата выпуска</div>
              <div className="text-lg font-bold flex items-center gap-2"><Calendar className="w-4 h-4 text-primary" /> {specs.releaseDate || "-"}</div>
            </div>
            
            <div className="col-span-2 md:col-span-1 bg-card rounded-3xl p-5 border border-border/60 shadow-sm flex flex-col justify-between">
              <div className="text-xs text-muted-foreground font-medium mb-2">Средний балл</div>
              <div className="text-lg font-bold flex items-center gap-2"><Target className="w-4 h-4 text-green-500" /> {specs.avgScore ? `${specs.avgScore}%` : "-"}</div>
            </div>

            <div className="col-span-2 md:col-span-2 bg-card rounded-3xl p-5 border border-border/60 shadow-sm flex flex-col justify-between">
               <div className="text-xs text-muted-foreground font-medium mb-2">Архитектура</div>
               <div className="text-lg font-bold flex items-center gap-2"><Network className="w-4 h-4 text-blue-500" /> {specs.architecture || "-"}</div>
            </div>

            {/* Pricing Section */}
            {specs.pricing && (
              <div className="col-span-2 md:col-span-4 bg-gradient-to-r from-secondary/50 to-transparent rounded-3xl p-6 border border-border/60 shadow-sm">
                <h3 className="text-sm font-semibold mb-4 text-muted-foreground flex items-center gap-2">
                  <DollarSign className="w-4 h-4" /> Ценообразование (API)
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Вход (за 1М токенов)</div>
                    <div className="text-xl font-bold text-foreground">{specs.pricing.input ? `$${specs.pricing.input}` : "-"}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Выход (за 1М токенов)</div>
                    <div className="text-xl font-bold text-foreground">{specs.pricing.output ? `$${specs.pricing.output}` : "-"}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Макс. входящих токенов</div>
                    <div className="text-md font-semibold text-foreground mt-1">{specs.pricing.maxInput || specs.contextWindow || "-"}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Макс. исходящих токенов</div>
                    <div className="text-md font-semibold text-foreground mt-1">{specs.pricing.maxOutput || "-"}</div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Features/Capabilities Badges */}
            {specs.features && specs.features.length > 0 && (
              <div className="col-span-2 md:col-span-4 pt-2">
                <h3 className="text-sm font-semibold mb-3 text-muted-foreground">Поддерживаемые возможности</h3>
                <div className="flex flex-wrap gap-2">
                  {specs.features.map(f => (
                    <span key={f} className="px-3 py-1.5 bg-green-500/10 text-green-600 border border-green-500/20 rounded-lg text-sm font-medium flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" /> {f}
                    </span>
                  ))}
                  {specs.visionSupport === true && (
                    <span className="px-3 py-1.5 bg-green-500/10 text-green-600 border border-green-500/20 rounded-lg text-sm font-medium flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Зрение (Vision)
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Compact Benchmarks Layout */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <BrainCircuit className="w-6 h-6 text-primary" />
            Результаты бенчмарков
          </h2>
          
          {isGroupedBenchmarks ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(specs.benchmarks).map(([category, items]: [string, any]) => (
                <div key={category} className="bg-card rounded-2xl border border-border/40 p-5 shadow-sm">
                  <h3 className="font-semibold text-muted-foreground mb-4 border-b border-border/50 pb-2">{category}</h3>
                  <div className="space-y-3">
                    {Object.entries(items).map(([test, score]) => (
                      <div key={test} className="flex justify-between items-center">
                        <span className="font-medium">{test}</span>
                        <span className="font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-md text-sm">{String(score)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : radarData.length > 0 ? (
            <div className="bg-card rounded-2xl border border-border/40 p-6 shadow-sm flex flex-col md:flex-row gap-8">
              <div className="h-[250px] w-full md:w-1/2 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                    <PolarGrid stroke="currentColor" className="text-border/40" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: "currentColor", fontSize: 11 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar name="Оценка" dataKey="A" stroke="var(--primary)" fill="var(--primary)" fillOpacity={0.4} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-3">
                {radarData.map(item => (
                   <div key={item.subject} className="bg-secondary/30 rounded-xl p-3 flex items-center justify-between">
                     <span className="text-sm font-medium">{item.subject}</span>
                     <span className="text-sm font-bold bg-primary/10 text-primary px-2 py-1 rounded-md">{item.A}%</span>
                   </div>
                 ))}
              </div>
            </div>
          ) : (
            <div className="text-muted-foreground bg-secondary/20 p-6 rounded-2xl border border-border/40 text-center">
              Данные бенчмарков отсутствуют
            </div>
          )}
        </div>

        {/* Detailed Description */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold mb-6">Обзор модели</h2>
          <div className="prose prose-lg dark:prose-invert max-w-none bg-card rounded-3xl border border-border/40 p-8 md:p-10 shadow-sm leading-loose">
            <ExpandableText maxHeight={600}>
              <div className="text-foreground">
                <ReactMarkdown 
                  remarkPlugins={[remarkGfm]}
                  components={{
                    h1: ({node, ...props}) => <h2 className="text-2xl font-bold mt-8 mb-4 border-b pb-2" {...props} />,
                    h2: ({node, ...props}) => <h3 className="text-xl font-semibold mt-6 mb-3" {...props} />,
                    ul: ({node, ...props}) => <ul className="space-y-2 my-4 list-disc list-inside marker:text-primary" {...props} />,
                    li: ({node, ...props}) => <li className="pl-2" {...props} />
                  }}
                >
                  {tool.description}
                </ReactMarkdown>
              </div>
            </ExpandableText>
          </div>
        </div>

        <RelatedModels categoryId={tool.categoryId} currentSoftwareId={tool.id} />

        <CommentSection softwareId={tool.id} />
      </main>
    </div>
  );
}
