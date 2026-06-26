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
  if (!models || models.length === 0) return null;

  const normSlug = (slug || "").toLowerCase();
  const normName = (name || "").toLowerCase();

  // 1. Попытка точного совпадения по ID
  if (models.some(m => m.id.toLowerCase() === normSlug)) return normSlug;

  // Функция для поиска модели в массиве по ключевым словам
  const findByKeywords = (keywords: string[]) => {
    return models.find(m => {
      const mId = m.id.toLowerCase();
      const mName = m.name.toLowerCase();
      return keywords.every(k => mId.includes(k) || mName.includes(k));
    });
  };

  // 2. Умный поиск по семействам моделей (возвращаем только если реально есть в списке OpenRouter)
  let match = null;

  if (normSlug.includes('deepseek')) {
    if (normSlug.includes('r1') || normSlug.includes('reasoner')) match = findByKeywords(['deepseek', 'r1']);
    if (!match) match = findByKeywords(['deepseek', 'chat']);
    if (!match) match = findByKeywords(['deepseek']);
  }
  else if (normSlug.includes('claude')) {
    if (normSlug.includes('opus')) {
      match = findByKeywords(['claude', 'opus', '3.5']) || findByKeywords(['claude', 'opus']);
    } else if (normSlug.includes('sonnet')) {
      if (normSlug.includes('4.6')) match = findByKeywords(['claude', 'sonnet', '4.6']);
      if (!match && normSlug.includes('4.5')) match = findByKeywords(['claude', 'sonnet', '4.5']);
      if (!match && normSlug.includes('4')) match = findByKeywords(['claude', 'sonnet', '4']);
      if (!match) match = findByKeywords(['claude', 'sonnet', '3.5']);
      if (!match) match = findByKeywords(['claude', 'sonnet', 'latest']);
      if (!match) match = findByKeywords(['claude', 'sonnet']);
    } else if (normSlug.includes('haiku')) {
      match = findByKeywords(['claude', 'haiku', '3.5']) || findByKeywords(['claude', 'haiku']);
    }
    if (!match) match = findByKeywords(['claude', 'latest']);
  }
  else if (normSlug.includes('gpt') || normSlug.includes('chatgpt') || normSlug.includes('o1') || normSlug.includes('o3')) {
    if (normSlug.includes('o3')) match = findByKeywords(['o3', 'mini']);
    if (!match && normSlug.includes('o1')) match = findByKeywords(['o1']);
    if (!match && normSlug.includes('4o-mini')) match = findByKeywords(['gpt', '4o', 'mini']);
    if (!match && normSlug.includes('4o')) match = findByKeywords(['gpt', '4o']);
    if (!match) match = findByKeywords(['gpt', '3.5', 'turbo']);
  }
  else if (normSlug.includes('gemini')) {
    if (normSlug.includes('flash') || normSlug.includes('2.0') || normSlug.includes('1.5')) {
      match = findByKeywords(['gemini', '2.5', 'flash']) || findByKeywords(['gemini', '2.0', 'flash']) || findByKeywords(['gemini', '1.5', 'flash']);
    }
    if (!match && normSlug.includes('pro')) match = findByKeywords(['gemini', 'pro']);
    if (!match) match = findByKeywords(['gemini']);
  }
  else if (normSlug.includes('llama')) {
    if (normSlug.includes('3.3')) match = findByKeywords(['llama', '3.3']);
    if (!match && normSlug.includes('3.1')) match = findByKeywords(['llama', '3.1']);
    if (!match) match = findByKeywords(['llama', '3']);
  }
  else if (normSlug.includes('qwen')) {
    match = findByKeywords(['qwen', '2.5', '72b']) || findByKeywords(['qwen']);
  }
  else if (normSlug.includes('mistral') || normSlug.includes('mixtral')) {
    match = findByKeywords(['mistral', 'large']) || findByKeywords(['mixtral']) || findByKeywords(['mistral']);
  }
  else if (normSlug.includes('cohere') || normSlug.includes('command')) {
    match = findByKeywords(['command', 'r', 'plus']) || findByKeywords(['cohere']);
  }

  if (match) return match.id;

  // 3. Общий fuzzy search по ключевым словам из имени
  const terms = normName.split(/[\s-]+/).filter(t => t.length > 2);
  if (terms.length > 0) {
    for (const m of models) {
      const mName = m.name.toLowerCase();
      const mId = m.id.toLowerCase();
      if (terms.every(t => mName.includes(t) || mId.includes(t))) {
         return m.id;
      }
    }
  }

  return null;
}
