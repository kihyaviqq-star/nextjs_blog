import { BlogPost } from "./types";
import { authors } from "./authors";

// Динамический импорт storage только на сервере
let storage: any = null;
if (typeof window === 'undefined') {
  // Только на сервере
  try {
    storage = require('./storage');
  } catch (error) {
    console.log('[mock-data-ru] Storage module not available (client-side)');
  }
}

// Используем let для возможности мутации массива
const initialMockPosts: BlogPost[] = [
  {
    id: "1",
    slug: "future-of-ai-agents",
    title: "Будущее ИИ-агентов: Автономные системы в 2026 году",
    excerpt: "Исследуем, как ИИ-агенты революционизируют автоматизацию и принятие решений в различных отраслях.",
    author: authors["sara-chen"],
    coverImage: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1200&h=600&fit=crop&q=80",
    publishedAt: "2026-01-10",
    readTime: "8 мин чтения",
    tags: ["ИИ", "Автоматизация", "Технологии будущего"],
    content: {
      blocks: [
        {
          type: "header",
          data: {
            text: "Будущее ИИ-агентов: Автономные системы в 2026 году",
            level: 1,
          },
        },
        {
          type: "paragraph",
          data: {
            text: "Агенты искусственного интеллекта эволюционировали от простых чат-ботов до сложных автономных систем, способных принимать сложные решения. В 2026 году мы наблюдаем парадигмальный сдвиг в том, как эти агенты взаимодействуют с нашим цифровым и физическим миром.",
          },
        },
        {
          type: "header",
          data: {
            text: "Что такое ИИ-агенты?",
            level: 2,
          },
        },
        {
          type: "paragraph",
          data: {
            text: "ИИ-агенты — это автономные программные сущности, которые могут воспринимать окружающую среду, принимать решения и совершать действия для достижения конкретных целей. В отличие от традиционного программного обеспечения, они могут учиться на опыте и адаптировать свое поведение со временем.",
          },
        },
        {
          type: "list",
          data: {
            style: "unordered",
            items: [
              "Автономные возможности принятия решений",
              "Обучение на основе взаимодействий и обратной связи",
              "Мультимодальное понимание (текст, зрение, аудио)",
              "Целеориентированное поведение",
              "Адаптивные реакции на изменяющуюся среду",
            ],
          },
        },
        {
          type: "header",
          data: {
            text: "Ключевые применения",
            level: 2,
          },
        },
        {
          type: "paragraph",
          data: {
            text: "Применение ИИ-агентов охватывает множество отраслей, трансформируя то, как мы работаем и живем:",
          },
        },
        {
          type: "list",
          data: {
            style: "ordered",
            items: [
              "Здравоохранение: Диагностические ассистенты и системы мониторинга пациентов",
              "Финансы: Автоматизированная торговля и оценка рисков",
              "Обслуживание клиентов: Интеллектуальные агенты поддержки с эмоциональным интеллектом",
              "Производство: Предиктивное обслуживание и контроль качества",
              "Образование: Персонализированные учебные компаньоны",
            ],
          },
        },
        {
          type: "quote",
          data: {
            text: "Самые глубокие технологии — это те, которые исчезают. Они вплетаются в ткань повседневной жизни, пока не станут неотличимы от нее.",
            caption: "Марк Вайзер, компьютерный ученый",
          },
        },
        {
          type: "header",
          data: {
            text: "Техническая архитектура",
            level: 2,
          },
        },
        {
          type: "paragraph",
          data: {
            text: "Современные ИИ-агенты построены на сложных архитектурах, которые объединяют несколько технологий ИИ:",
          },
        },
        {
          type: "code",
          data: {
            code: `class AIAgent:
    def __init__(self, model, memory, tools):
        self.model = model
        self.memory = memory
        self.tools = tools
    
    def perceive(self, environment):
        """Сбор информации из окружения"""
        return self.model.process(environment)
    
    def decide(self, perception):
        """Принятие решений на основе восприятия"""
        context = self.memory.retrieve_relevant(perception)
        return self.model.reason(perception, context)
    
    def act(self, decision):
        """Выполнение действий с использованием доступных инструментов"""
        return self.tools.execute(decision)`,
          },
        },
        {
          type: "paragraph",
          data: {
            text: "Эта архитектура позволяет агентам работать в непрерывном цикле восприятия, принятия решений и действий, постоянно обучаясь и улучшая свою производительность.",
          },
        },
        {
          type: "warning",
          data: {
            title: "Важное замечание",
            message: "Разработка ИИ-агентов требует тщательного внимания к вопросам безопасности, этики и соответствия человеческим ценностям.",
          },
        },
        {
          type: "header",
          data: {
            text: "Вызовы и соображения",
            level: 2,
          },
        },
        {
          type: "paragraph",
          data: {
            text: "Хотя ИИ-агенты предлагают огромный потенциал, они также представляют значительные вызовы, которые мы должны решить:",
          },
        },
        {
          type: "checklist",
          data: {
            items: [
              { text: "Безопасность и согласованность: Обеспечение действий агентов в соответствии с человеческими ценностями", checked: false },
              { text: "Прозрачность: Делаем решения агентов интерпретируемыми и объяснимыми", checked: false },
              { text: "Конфиденциальность: Защита чувствительных данных во взаимодействиях агентов", checked: true },
              { text: "Подотчетность: Определение ответственности за действия агентов", checked: false },
              { text: "Смягчение предвзятости: Предотвращение дискриминационного поведения", checked: true },
            ],
          },
        },
        {
          type: "delimiter",
        },
        {
          type: "header",
          data: {
            text: "Взгляд в будущее",
            level: 2,
          },
        },
        {
          type: "paragraph",
          data: {
            text: "Будущее ИИ-агентов невероятно многообещающее. По мере того, как эти системы становятся более совершенными, мы увидим, как они берут на себя все более сложные задачи, работая вместе с людьми как настоящие сотрудники, а не просто инструменты. Ключом к успеху будет ответственная разработка этих технологий с фокусом на пользу и безопасность человека.",
          },
        },
      ],
    },
  },
  {
    id: "2",
    slug: "llm-breakthrough-2026",
    title: "Крупный прорыв в больших языковых моделях",
    excerpt: "Новое исследование выявляет значительные улучшения в способностях к рассуждению и эффективности.",
    author: authors["sara-chen"],
    coverImage: "https://images.unsplash.com/photo-1694903089438-bf28d4697d9a?q=80&w=1932&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    publishedAt: "2026-01-08",
    readTime: "6 мин чтения",
    tags: ["LLM", "Исследования", "NLP"],
    content: {
      blocks: [
        {
          type: "header",
          data: {
            text: "Крупный прорыв в больших языковых моделях",
            level: 1,
          },
        },
        {
          type: "paragraph",
          data: {
            text: "Исследователи достигли значительного прорыва в архитектуре больших языковых моделей, резко улучшив как способности к рассуждению, так и вычислительную эффективность. Это достижение может изменить ландшафт приложений ИИ.",
          },
        },
        {
          type: "header",
          data: {
            text: "Инновация",
            level: 2,
          },
        },
        {
          type: "paragraph",
          data: {
            text: "Новая архитектура, названная 'Адаптивный трансформер рассуждений' (ART), вводит динамическое распределение вычислений, которое позволяет модели выделять больше ресурсов на сложные задачи рассуждения, сохраняя при этом эффективность на более простых запросах.",
          },
        },
        {
          type: "table",
          data: {
            withHeadings: true,
            content: [
              ["Метрика", "Предыдущие модели", "ART", "Улучшение"],
              ["Сложное рассуждение", "65%", "91%", "+40%"],
              ["Простые запросы", "95%", "97%", "+2%"],
              ["Энергопотребление", "100 Вт", "40 Вт", "-60%"],
              ["Скорость обработки", "1x", "2.5x", "+150%"],
            ],
          },
        },
        {
          type: "quote",
          data: {
            text: "Это представляет собой фундаментальный сдвиг в том, как мы подходим к дизайну языковых моделей. Мы больше не связаны подходом 'один размер для всех'.",
            caption: "Доктор Эмили Уотсон, ведущий исследователь",
          },
        },
        {
          type: "header",
          data: {
            text: "Ключевые улучшения",
            level: 2,
          },
        },
        {
          type: "list",
          data: {
            style: "unordered",
            items: [
              "40% улучшение в задачах сложного рассуждения",
              "60% снижение вычислительных затрат для простых запросов",
              "Лучшая обработка многошаговых логических задач",
              "Улучшенная фактическая точность и снижение галлюцинаций",
              "Расширенное понимание контекста на более длинных последовательностях",
            ],
          },
        },
        {
          type: "paragraph",
          data: {
            text: "Эти улучшения делают передовые возможности ИИ более доступными и устойчивыми, потенциально демократизируя доступ к мощным языковым моделям.",
          },
        },
      ],
    },
  },
  {
    id: "3",
    slug: "ai-ethics-framework",
    title: "Новая этическая структура ИИ принята технологическими гигантами",
    excerpt: "Лидеры индустрии объединяются для установления всеобъемлющих руководящих принципов ответственной разработки ИИ.",
    author: authors["sara-chen"],
    coverImage: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=1200&h=600&fit=crop&q=80",
    publishedAt: "2026-01-05",
    readTime: "5 мин чтения",
    tags: ["Этика", "Политика", "Индустрия"],
    content: {
      blocks: [
        {
          type: "header",
          data: {
            text: "Новая этическая структура ИИ принята технологическими гигантами",
            level: 1,
          },
        },
        {
          type: "paragraph",
          data: {
            text: "В историческом шаге ведущие технологические компании совместно приняли всеобъемлющую этическую структуру ИИ, которая устанавливает новые стандарты для ответственной разработки и развертывания ИИ.",
          },
        },
        {
          type: "header",
          data: {
            text: "Основные принципы",
            level: 2,
          },
        },
        {
          type: "list",
          data: {
            style: "ordered",
            items: [
              "Прозрачность: Четкое раскрытие возможностей и ограничений систем ИИ",
              "Справедливость: Активные меры по предотвращению предвзятости и дискриминации",
              "Конфиденциальность: Надежные механизмы защиты данных и согласия пользователей",
              "Подотчетность: Четкие цепочки ответственности за решения ИИ",
              "Безопасность: Строгие протоколы тестирования и мониторинга",
            ],
          },
        },
        {
          type: "paragraph",
          data: {
            text: "Эта структура представляет собой значительный шаг вперед в обеспечении того, чтобы технологии ИИ приносили пользу обществу, минимизируя потенциальный вред.",
          },
        },
      ],
    },
  },
  {
    id: "4",
    slug: "quantum-computing-ai-2026",
    title: "Квантовые вычисления ускоряют обучение ИИ",
    excerpt: "Новые квантовые процессоры сокращают время обучения моделей ИИ с недель до часов.",
    author: authors["sara-chen"],
    coverImage: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=1200&h=600&fit=crop&q=80",
    publishedAt: "2026-01-12",
    readTime: "7 мин чтения",
    tags: ["Квантовые вычисления", "ИИ", "Инновации"],
    content: {
      blocks: [
        {
          type: "header",
          data: {
            text: "Квантовые вычисления революционизируют обучение ИИ",
            level: 1,
          },
        },
        {
          type: "paragraph",
          data: {
            text: "Прорыв в квантовых вычислениях открывает новую эру для машинного обучения. Исследователи успешно использовали квантовые процессоры для ускорения обучения нейронных сетей в 100 раз.",
          },
        },
        {
          type: "quote",
          data: {
            text: "Мы находимся на пороге квантовой революции в искусственном интеллекте.",
            caption: "Доктор Джон Прескилл, Калтех",
          },
        },
      ],
    },
  },
  {
    id: "5",
    slug: "ai-healthcare-diagnosis",
    title: "ИИ превосходит врачей в диагностике редких заболеваний",
    excerpt: "Система искусственного интеллекта достигает 96% точности в выявлении редких генетических заболеваний.",
    author: authors["sara-chen"],
    coverImage: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1200&h=600&fit=crop&q=80",
    publishedAt: "2026-01-11",
    readTime: "6 мин чтения",
    tags: ["Здравоохранение", "Диагностика", "Медицина"],
    content: {
      blocks: [
        {
          type: "header",
          data: {
            text: "ИИ в медицине: новая эра диагностики",
            level: 1,
          },
        },
        {
          type: "paragraph",
          data: {
            text: "Новая система ИИ, разработанная командой исследователей из ведущих медицинских университетов, демонстрирует беспрецедентную точность в диагностике редких генетических заболеваний.",
          },
        },
        {
          type: "list",
          data: {
            style: "unordered",
            items: [
              "96% точность диагностики",
              "Анализ за 5 минут вместо 2-3 недель",
              "Выявление 8000+ редких заболеваний",
              "Интеграция с электронными медицинскими картами",
            ],
          },
        },
      ],
    },
  },
  {
    id: "6",
    slug: "neural-interfaces-2026",
    title: "Нейроинтерфейсы нового поколения: мысли управляют устройствами",
    excerpt: "Компания Neuralink представила революционный интерфейс мозг-компьютер с пропускной способностью 10 Гбит/с.",
    author: authors["sara-chen"],
    coverImage: "https://images.unsplash.com/photo-1617791160505-6f00504e3519?w=1200&h=600&fit=crop&q=80",
    publishedAt: "2026-01-09",
    readTime: "9 мин чтения",
    tags: ["Нейротехнологии", "BCI", "Будущее"],
    content: {
      blocks: [
        {
          type: "header",
          data: {
            text: "Эра нейроинтерфейсов уже здесь",
            level: 1,
          },
        },
        {
          type: "paragraph",
          data: {
            text: "Революционная технология интерфейса мозг-компьютер позволяет людям управлять цифровыми устройствами силой мысли с невероятной точностью и скоростью.",
          },
        },
        {
          type: "warning",
          data: {
            title: "Этические вопросы",
            message: "Развитие нейроинтерфейсов поднимает важные вопросы о приватности мыслей и когнитивной свободе.",
          },
        },
      ],
    },
  },
  {
    id: "7",
    slug: "ai-climate-modeling",
    title: "ИИ-модели предсказывают климатические изменения с точностью 95%",
    excerpt: "Новые алгоритмы машинного обучения революционизируют климатическое моделирование и прогнозирование.",
    author: authors["sara-chen"],
    coverImage: "https://images.unsplash.com/photo-1611273426858-450d8e3c9fce?w=1200&h=600&fit=crop&q=80",
    publishedAt: "2026-01-07",
    readTime: "8 мин чтения",
    tags: ["Климат", "Экология", "Прогнозирование"],
    content: {
      blocks: [
        {
          type: "header",
          data: {
            text: "ИИ на службе планеты",
            level: 1,
          },
        },
        {
          type: "paragraph",
          data: {
            text: "Искусственный интеллект становится незаменимым инструментом в борьбе с изменением климата, предоставляя точные прогнозы и помогая разрабатывать эффективные стратегии адаптации.",
          },
        },
        {
          type: "table",
          data: {
            withHeadings: true,
            content: [
              ["Параметр", "Традиционные модели", "ИИ-модели"],
              ["Точность прогноза", "75%", "95%"],
              ["Время расчета", "48 часов", "2 часа"],
              ["Детализация", "100 км", "1 км"],
            ],
          },
        },
      ],
    },
  },
  {
    id: "8",
    slug: "autonomous-vehicles-breakthrough",
    title: "Автономные автомобили достигли уровня безопасности выше человеческого",
    excerpt: "Статистика показывает, что самоуправляемые автомобили на 40% безопаснее водителей-людей.",
    author: authors["sara-chen"],
    coverImage: "https://images.unsplash.com/photo-1617886903355-9354bb57751f?w=1200&h=600&fit=crop&q=80",
    publishedAt: "2026-01-06",
    readTime: "7 мин чтения",
    tags: ["Автономные авто", "Безопасность", "Транспорт"],
    content: {
      blocks: [
        {
          type: "header",
          data: {
            text: "Новая эра безопасного транспорта",
            level: 1,
          },
        },
        {
          type: "paragraph",
          data: {
            text: "Последние данные подтверждают: автономные транспортные средства не только достигли, но и превзошли безопасность вождения человеком, открывая путь к массовому внедрению технологии.",
          },
        },
        {
          type: "list",
          data: {
            style: "ordered",
            items: [
              "40% снижение аварийности",
              "Нулевая смертность в тестовых зонах",
              "Оптимизация трафика на 30%",
              "Снижение выбросов CO2 на 25%",
            ],
          },
        },
      ],
    },
  },
  {
    id: "9",
    slug: "ai-education-personalization",
    title: "Персонализированное обучение с ИИ: революция в образовании",
    excerpt: "ИИ-репетиторы адаптируются к стилю обучения каждого студента, повышая успеваемость на 60%.",
    author: authors["sara-chen"],
    coverImage: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=1200&h=600&fit=crop&q=80",
    publishedAt: "2026-01-04",
    readTime: "6 мин чтения",
    tags: ["Образование", "EdTech", "Персонализация"],
    content: {
      blocks: [
        {
          type: "header",
          data: {
            text: "ИИ трансформирует образование",
            level: 1,
          },
        },
        {
          type: "paragraph",
          data: {
            text: "Искусственный интеллект меняет подход к обучению, создавая персонализированные образовательные траектории для каждого студента и значительно повышая эффективность усвоения материала.",
          },
        },
        {
          type: "quote",
          data: {
            text: "Каждый ребенок учится по-своему. ИИ наконец позволяет нам это учитывать.",
            caption: "Профессор Мария Гарсия, Стэнфорд",
          },
        },
      ],
    },
  },
  {
    id: "10",
    slug: "ai-drug-discovery",
    title: "ИИ ускоряет разработку лекарств: от 10 лет до 6 месяцев",
    excerpt: "Алгоритмы машинного обучения сокращают время разработки новых препаратов в 20 раз.",
    author: authors["sara-chen"],
    coverImage: "https://images.unsplash.com/photo-1583911860205-72f8ac8ddcbe?w=1200&h=600&fit=crop&q=80",
    publishedAt: "2026-01-03",
    readTime: "8 мин чтения",
    tags: ["Фармацевтика", "Биотехнологии", "Исследования"],
    content: {
      blocks: [
        {
          type: "header",
          data: {
            text: "ИИ революционизирует фармацевтику",
            level: 1,
          },
        },
        {
          type: "paragraph",
          data: {
            text: "Применение искусственного интеллекта в разработке лекарств сокращает время от открытия молекулы до клинических испытаний с десятилетий до месяцев, открывая новые возможности для лечения ранее неизлечимых заболеваний.",
          },
        },
        {
          type: "checklist",
          data: {
            items: [
              { text: "Анализ миллионов молекулярных структур", checked: true },
              { text: "Предсказание эффективности препаратов", checked: true },
              { text: "Моделирование побочных эффектов", checked: true },
              { text: "Оптимизация клинических испытаний", checked: false },
            ],
          },
        },
      ],
    },
  },
  {
    id: "11",
    slug: "ai-cybersecurity-2026",
    title: "ИИ-защита: новое поколение кибербезопасности",
    excerpt: "Системы на основе ИИ обнаруживают и нейтрализуют киберугрозы в режиме реального времени.",
    author: authors["sara-chen"],
    coverImage: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1200&h=600&fit=crop&q=80",
    publishedAt: "2026-01-02",
    readTime: "7 мин чтения",
    tags: ["Кибербезопасность", "Защита данных", "Технологии"],
    content: {
      blocks: [
        {
          type: "header",
          data: {
            text: "ИИ против киберпреступности",
            level: 1,
          },
        },
        {
          type: "paragraph",
          data: {
            text: "Новое поколение систем кибербезопасности на основе искусственного интеллекта способно предсказывать, обнаруживать и нейтрализовать угрозы быстрее, чем любой человек-аналитик.",
          },
        },
        {
          type: "list",
          data: {
            style: "unordered",
            items: [
              "Обнаружение аномалий в реальном времени",
              "Автоматическое реагирование на инциденты",
              "Предсказание новых типов атак",
              "99.7% точность выявления угроз",
            ],
          },
        },
      ],
    },
  },
  {
    id: "12",
    slug: "ai-creative-arts",
    title: "ИИ в искусстве: сотрудничество человека и машины",
    excerpt: "Художники и музыканты используют ИИ как творческого партнера, создавая новые формы искусства.",
    author: authors["sara-chen"],
    coverImage: "https://images.unsplash.com/photo-1547826039-bfc35e0f1ea8?w=1200&h=600&fit=crop&q=80",
    publishedAt: "2026-01-01",
    readTime: "6 мин чтения",
    tags: ["Искусство", "Творчество", "Культура"],
    content: {
      blocks: [
        {
          type: "header",
          data: {
            text: "Новая эра творчества",
            level: 1,
          },
        },
        {
          type: "paragraph",
          data: {
            text: "Искусственный интеллект перестал быть просто инструментом и становится полноценным творческим партнером для художников, музыкантов и дизайнеров по всему миру.",
          },
        },
        {
          type: "quote",
          data: {
            text: "ИИ не заменяет художника, он расширяет границы возможного в искусстве.",
            caption: "Рефик Анадол, медиа-художник",
          },
        },
        {
          type: "delimiter",
        },
        {
          type: "paragraph",
          data: {
            text: "От генеративного искусства до ИИ-композиторов, технология открывает новые горизонты для творческого самовыражения.",
          },
        },
      ],
    },
  },
];

// Функция для получения постов (с автоинициализацией)
function getPosts(): BlogPost[] {
  // На клиенте или если storage недоступен - используем начальные данные
  if (!storage) {
    return initialMockPosts;
  }
  
  try {
    // Пытаемся читать из хранилища
    const storedPosts = storage.readPosts();
    
    // Если хранилище пустое, инициализируем его
    if (storedPosts.length === 0) {
      console.log('[mock-data-ru] Инициализация хранилища');
      storage.initializeStorage(initialMockPosts);
      return initialMockPosts;
    }
    
    return storedPosts;
  } catch (error) {
    // Если ошибка - возвращаем начальные данные
    console.log('[mock-data-ru] Ошибка чтения, используем начальные данные');
    return initialMockPosts;
  }
}

export function getAllPosts(): BlogPost[] {
  return getPosts();
}

export function getPostBySlug(slug: string): BlogPost | undefined {
  if (!storage) {
    return getPosts().find((post) => post.slug === slug);
  }
  
  try {
    // Пробуем получить из хранилища
    const post = storage.getStoredPost(slug);
    if (post) return post;
    
    // Fallback на память
    return getPosts().find((post) => post.slug === slug);
  } catch (error) {
    // Fallback на начальные данные
    return getPosts().find((post) => post.slug === slug);
  }
}

export function getRecentPosts(limit: number = 3): BlogPost[] {
  return getPosts().slice(0, limit);
}

export function getRelatedPosts(currentSlug: string, limit: number = 3): BlogPost[] {
  return getPosts().filter((post) => post.slug !== currentSlug).slice(0, limit);
}

export function getPostsByAuthor(authorSlug: string): BlogPost[] {
  return getPosts().filter((post) => post.author.slug === authorSlug);
}

// CRUD operations for admin
export function createPost(data: {
  title: string;
  excerpt: string;
  coverImage?: string;
  tags: string[];
  content: any;
  author: any;
}): BlogPost {
  // Generate slug from title
  const slug = data.title
    .toLowerCase()
    .replace(/[^а-яa-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  // Используем переданного автора или первого как fallback
  let author = authors["sara-chen"]; // fallback
  
  // Пытаемся найти автора по email или id
  if (data.author) {
    // Если передан полный объект автора с slug
    if (data.author.slug && authors[data.author.slug]) {
      author = authors[data.author.slug];
    }
    // Или создаем автора на лету из данных пользователя
    else if (data.author.id && data.author.name) {
      author = {
        slug: data.author.id,
        name: data.author.name,
        title: data.author.role === "ADMIN" ? "Администратор" : "Редактор",
        avatar: data.author.avatarUrl || "https://api.dicebear.com/7.x/avataaars/svg?seed=" + data.author.id,
        bio: "Автор статей на AI-Stat.ru",
        social: {
          linkedin: "",
          twitter: "",
          github: "",
          website: "",
        },
        email: data.author.email || "",
        expertise: [],
      };
    }
  }

  // Получаем текущие посты для генерации ID
  const currentPosts = getPosts();

  const newPost: BlogPost = {
    id: String(currentPosts.length + 1),
    slug,
    title: data.title,
    excerpt: data.excerpt,
    author,
    coverImage: data.coverImage || "",
    publishedAt: new Date().toISOString().split("T")[0],
    readTime: "5 мин чтения",
    tags: data.tags,
    content: data.content,
  };

  if (storage) {
    try {
      storage.addStoredPost(newPost);
      console.log('[createPost] Пост успешно создан:', newPost.slug);
    } catch (error) {
      console.error('[createPost] Ошибка создания:', error);
    }
  } else {
    console.log('[createPost] Storage недоступен (клиентская сторона)');
  }
  
  return newPost;
}

export function updatePost(
  slug: string,
  data: {
    title?: string;
    excerpt?: string;
    coverImage?: string;
    tags?: string[];
    content?: any;
  }
): BlogPost | null {
  console.log('[updatePost] Начало обновления:', slug);
  console.log('[updatePost] Данные для обновления:', data);
  
  if (!storage) {
    console.log('[updatePost] Storage недоступен (клиентская сторона)');
    return null;
  }
  
  try {
    // Пытаемся обновить в хранилище
    const updatedPost = storage.updateStoredPost(slug, data);
    
    if (updatedPost) {
      console.log('[updatePost] Пост успешно обновлен в хранилище');
      return updatedPost;
    }
    
    console.log('[updatePost] Статья не найдена:', slug);
    return null;
  } catch (error) {
    console.error('[updatePost] Ошибка обновления:', error);
    return null;
  }
}

export function deletePost(slug: string): boolean {
  if (!storage) {
    console.log('[deletePost] Storage недоступен');
    return false;
  }
  
  try {
    return storage.deleteStoredPost(slug);
  } catch (error) {
    console.error('[deletePost] Ошибка удаления:', error);
    return false;
  }
}
