import { Author } from "./types";

export const authors: Record<string, Author> = {
  "sara-chen": {
    id: "1",
    name: "Сара Чен",
    slug: "sara-chen",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sara",
    bio: "Эксперт по AI-технологиям с фокусом на больших языковых моделях (LLM) и их практическом применении. Основатель AI-Stat.ru — русскоязычный ресурс для сравнения и анализа нейросетей.",
    title: "Основатель AI-Stat.ru",
    email: "sara@ai-stat.ru",
    social: {
      linkedin: "https://linkedin.com/in/sarachen",
      twitter: "https://twitter.com/sarachen",
      github: "https://github.com/sarachen",
      website: "https://ai-stat.ru",
    },
    expertise: [
      "Large Language Models",
      "AI Benchmarks",
      "Нейросети",
      "Промпт-инжиниринг",
      "AI-инструменты",
      "Machine Learning",
    ],
  },
  "mikhail-rodriguez": {
    id: "2",
    name: "Михаил Родригес",
    slug: "mikhail-rodriguez",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Mikhail",
    bio: "Исследователь в области глубокого обучения и нейронных сетей. Специализируется на архитектуре трансформеров и оптимизации больших моделей. Публикует обзоры последних исследований в области AI.",
    title: "Исследователь AI",
    email: "mikhail@ai-research.com",
    social: {
      linkedin: "https://linkedin.com/in/mikhailrodriguez",
      github: "https://github.com/mrodriguez",
      twitter: "https://twitter.com/mikhail_ai",
    },
    expertise: [
      "Deep Learning",
      "Transformer Architecture",
      "Model Optimization",
      "Research",
      "Neural Networks",
    ],
  },
  "jennifer-park": {
    id: "3",
    name: "Дженнифер Парк",
    slug: "jennifer-park",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Jennifer",
    bio: "Специалист по этике искусственного интеллекта и AI-политике. Работает над созданием ответственных AI-систем и консультирует технологические компании по вопросам этики и безопасности AI.",
    title: "Эксперт по этике AI",
    email: "jennifer@ai-ethics.org",
    social: {
      linkedin: "https://linkedin.com/in/jenniferpark",
      twitter: "https://twitter.com/jen_ai_ethics",
      website: "https://ai-ethics.org",
    },
    expertise: [
      "AI Ethics",
      "AI Policy",
      "Responsible AI",
      "AI Safety",
      "Governance",
    ],
  },
};

export function getAuthorBySlug(slug: string): Author | undefined {
  return authors[slug];
}

export function getAllAuthors(): Author[] {
  return Object.values(authors);
}
