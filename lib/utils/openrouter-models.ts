export async function fetchOpenRouterModels() {
  try {
    const res = await fetch("https://openrouter.ai/api/v1/models", { 
      next: { revalidate: 3600 } 
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.data || [];
  } catch (error) {
    console.error("Failed to fetch OpenRouter models:", error);
    return [];
  }
}

export function findBestModelMatch(models: any[], slug: string, name: string): string | null {
  const normSlug = (slug || "").toLowerCase();
  const normName = (name || "").toLowerCase();

  // Try exact ID match first if it somehow happens
  if (models.some(m => m.id.toLowerCase() === normSlug)) return normSlug;
  
  // Fuzzy rules by family (prioritize most popular/reliable models)
  if (normSlug.includes('deepseek')) {
    if (normSlug.includes('r1') || normSlug.includes('reasoner')) return 'deepseek/deepseek-r1';
    if (normSlug.includes('v3') || normSlug.includes('chat')) return 'deepseek/deepseek-chat';
    return 'deepseek/deepseek-chat';
  }

  if (normSlug.includes('claude')) {
    if (normSlug.includes('opus')) return 'anthropic/claude-3-opus';
    if (normSlug.includes('sonnet')) {
       if (normSlug.includes('3.7')) return 'anthropic/claude-3.7-sonnet';
       return 'anthropic/claude-3.5-sonnet';
    }
    if (normSlug.includes('haiku')) return 'anthropic/claude-3-haiku';
    return 'anthropic/claude-3.5-sonnet';
  }

  if (normSlug.includes('gpt') || normSlug.includes('chatgpt') || normSlug.includes('o1') || normSlug.includes('o3')) {
    if (normSlug.includes('o1')) return 'openai/o1';
    if (normSlug.includes('o3')) return 'openai/o3-mini';
    if (normSlug.includes('4o-mini')) return 'openai/gpt-4o-mini';
    if (normSlug.includes('4o')) return 'openai/gpt-4o';
    return 'openai/gpt-3.5-turbo';
  }

  if (normSlug.includes('gemini')) {
    if (normSlug.includes('flash') || normSlug.includes('2.0') || normSlug.includes('1.5')) return 'google/gemini-2.5-flash';
    if (normSlug.includes('pro')) return 'google/gemini-pro-1.5';
    return 'google/gemini-2.5-flash';
  }

  if (normSlug.includes('llama')) {
    if (normSlug.includes('3.3')) return 'meta-llama/llama-3.3-70b-instruct';
    if (normSlug.includes('3.1')) return 'meta-llama/llama-3.1-8b-instruct';
    return 'meta-llama/llama-3-8b-instruct';
  }
  
  if (normSlug.includes('qwen')) {
    return 'qwen/qwen-2.5-72b-instruct';
  }
  
  if (normSlug.includes('mistral') || normSlug.includes('mixtral')) {
    return 'mistralai/mistral-large-2411';
  }

  if (normSlug.includes('cohere') || normSlug.includes('command')) {
    return 'cohere/command-r-plus-08-2024';
  }

  // General fuzzy search on OpenRouter models as last resort
  const terms = normName.split(/[\s-]+/).filter(t => t.length > 2);
  if (terms.length > 0 && models.length > 0) {
    for (const m of models) {
      const mName = m.name.toLowerCase();
      const mId = m.id.toLowerCase();
      // If it contains all the main words of the model
      if (terms.every(t => mName.includes(t) || mId.includes(t))) {
         return m.id;
      }
    }
  }

  return null;
}
