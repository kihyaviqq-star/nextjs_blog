export function getFallbackLogoUrl(name: string, developer: string): string | null {
  const searchStr = `${name} ${developer}`.toLowerCase();

  const domainMap: Record<string, string[]> = {
    'openai.com': ['openai', 'gpt-', 'chatgpt', 'o1'],
    'anthropic.com': ['anthropic', 'claude'],
    'google.com': ['google', 'gemini', 'gemma', 'palm'],
    'meta.com': ['meta', 'llama', 'facebook'],
    'mistral.ai': ['mistral', 'mixtral', 'pixtral'],
    'cohere.com': ['cohere', 'command'],
    'deepseek.com': ['deepseek'],
    'alibabacloud.com': ['alibaba', 'qwen'],
    'baidu.com': ['baidu', 'ernie'],
    'x.ai': ['xai', 'grok', 'x.ai'],
    'perplexity.ai': ['perplexity'],
    '01.ai': ['01.ai', 'yi-'],
    'ai21.com': ['ai21', 'jamba', 'jurassic'],
    'yandex.ru': ['yandex', 'alice', 'yandexgpt'],
    'sberdevices.ru': ['sber', 'gigachat'],
    'huggingface.co': ['huggingface', 'zephyr'],
    'microsoft.com': ['microsoft', 'phi-'],
    'databricks.com': ['databricks', 'dbrx'],
    'stability.ai': ['stability', 'stable diffusion', 'stable lm', 'sdxl'],
    'inflection.ai': ['inflection', 'pi'],
    'nvidia.com': ['nvidia', 'nemotron'],
    'apple.com': ['apple', 'mm1'],
    'amazon.com': ['amazon', 'titan', 'nova'],
  };

  for (const [domain, keywords] of Object.entries(domainMap)) {
    if (keywords.some(k => searchStr.includes(k))) {
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
    }
  }

  return null;
}
