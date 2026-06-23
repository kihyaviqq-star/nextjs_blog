"use client";

import { Bot, Cpu, DollarSign, BrainCircuit, Info, Calendar, Network, Eye, Key } from "lucide-react";
import { 
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  ResponsiveContainer,
  Tooltip as RechartsTooltip
} from "recharts";

interface AiSpecs {
  contextWindow?: string | number;
  parameters?: string;
  architecture?: string;
  releaseDate?: string;
  visionSupport?: string | boolean;
  pricing?: {
    input?: string | number;
    output?: string | number;
  };
  benchmarks?: Record<string, number>;
  throughput?: string | number;
}

export function AiSpecsSection({ aiSpecsStr }: { aiSpecsStr: string }) {
  if (!aiSpecsStr) return null;
  
  let specs: AiSpecs;
  try {
    specs = JSON.parse(aiSpecsStr);
  } catch(e) {
    return null;
  }

  const hasData = 
    specs.contextWindow || 
    specs.parameters || 
    specs.architecture || 
    specs.releaseDate || 
    (specs.pricing && (specs.pricing.input || specs.pricing.output)) || 
    (specs.benchmarks && Object.keys(specs.benchmarks).length > 0);

  if (!hasData) {
    return null;
  }

  // Format benchmark data for Radar Chart
  const radarData = specs.benchmarks ? Object.entries(specs.benchmarks).map(([subject, A]) => ({
    subject,
    A: Number(A) || 0,
    fullMark: 100,
  })) : [];

  return (
    <div className="mb-16">
      <h2 className="text-3xl font-bold mb-8 flex items-center gap-3">
        <Bot className="w-8 h-8 text-primary" />
        Аналитика ИИ-модели
      </h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Bento Grid Info - Takes up 2 columns on large screens */}
        <div className="lg:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-4">
          
          <div className="col-span-2 md:col-span-2 bg-gradient-to-br from-primary/10 to-primary/5 rounded-3xl p-6 border border-primary/20 flex flex-col justify-between">
            <div>
              <div className="text-primary mb-2"><Network className="w-6 h-6" /></div>
              <div className="text-sm text-muted-foreground font-medium mb-1">Архитектура</div>
            </div>
            <div className="text-2xl font-bold">{specs.architecture || "Неизвестно"}</div>
          </div>

          <div className="bg-card rounded-3xl p-6 border border-border/40 shadow-sm flex flex-col justify-between">
            <div>
              <div className="text-muted-foreground mb-2"><Key className="w-5 h-5" /></div>
              <div className="text-xs text-muted-foreground font-medium mb-1">Параметры</div>
            </div>
            <div className="text-xl font-bold">{specs.parameters || "N/A"}</div>
          </div>

          <div className="bg-card rounded-3xl p-6 border border-border/40 shadow-sm flex flex-col justify-between">
            <div>
              <div className="text-muted-foreground mb-2"><Calendar className="w-5 h-5" /></div>
              <div className="text-xs text-muted-foreground font-medium mb-1">Релиз</div>
            </div>
            <div className="text-xl font-bold">{specs.releaseDate || "N/A"}</div>
          </div>

          <div className="col-span-2 bg-card rounded-3xl p-6 border border-border/40 shadow-sm flex flex-col justify-between">
            <div>
              <div className="text-muted-foreground mb-2"><Cpu className="w-5 h-5" /></div>
              <div className="text-sm text-muted-foreground font-medium mb-1">Контекстное окно</div>
            </div>
            <div className="text-3xl font-black text-foreground">{specs.contextWindow || "N/A"}</div>
          </div>

          <div className="bg-card rounded-3xl p-6 border border-border/40 shadow-sm flex flex-col justify-between">
            <div>
              <div className="text-muted-foreground mb-2"><Eye className="w-5 h-5" /></div>
              <div className="text-xs text-muted-foreground font-medium mb-1">Vision (Зрение)</div>
            </div>
            <div className="text-xl font-bold">
              {specs.visionSupport === true || specs.visionSupport === "true" ? "Да" : "Нет"}
            </div>
          </div>

          <div className="bg-card rounded-3xl p-6 border border-border/40 shadow-sm flex flex-col justify-between">
            <div>
              <div className="text-muted-foreground mb-2"><DollarSign className="w-5 h-5" /></div>
              <div className="text-xs text-muted-foreground font-medium mb-1">Input Цена / 1M</div>
            </div>
            <div className="text-xl font-bold text-green-500">${specs.pricing?.input || "0.00"}</div>
          </div>

        </div>

        {/* Radar Chart - Takes 1 column */}
        <div className="bg-card rounded-3xl border border-border/40 p-6 shadow-sm flex flex-col min-h-[400px]">
          <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <BrainCircuit className="w-5 h-5 text-muted-foreground" />
            Радар Бенчмарков
          </h3>
          
          {radarData.length >= 3 ? (
            <div className="flex-1 w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                  <PolarGrid stroke="currentColor" className="text-border/50" />
                  <PolarAngleAxis 
                    dataKey="subject" 
                    tick={{ fill: "currentColor", fontSize: 12, className: "text-muted-foreground font-medium" }} 
                  />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                  />
                  <Radar 
                    name="Оценка" 
                    dataKey="A" 
                    stroke="var(--primary)" 
                    fill="var(--primary)" 
                    fillOpacity={0.3} 
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          ) : specs.benchmarks && Object.keys(specs.benchmarks).length > 0 ? (
            <div className="space-y-4 flex-1 flex flex-col justify-center">
               {radarData.map(item => (
                 <div key={item.subject}>
                   <div className="flex justify-between mb-1">
                     <span className="text-sm font-medium">{item.subject}</span>
                     <span className="text-sm font-bold">{item.A}</span>
                   </div>
                   <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                     <div className="h-full bg-primary" style={{ width: `${Math.min(item.A, 100)}%` }} />
                   </div>
                 </div>
               ))}
               <p className="text-xs text-muted-foreground text-center mt-4 opacity-60">Недостаточно данных для построения радара</p>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
              Данные бенчмарков отсутствуют
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
