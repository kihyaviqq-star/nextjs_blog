import { Footer } from "@/components/footer";

// Увеличиваем максимальное время выполнения для длительных AI операций
// Необходимо для корректной работы AI-парсинга и генерации статей
// Это нужно на уровне layout, так как страница - Client Component
export const maxDuration = 300; // 5 минут
export const dynamic = 'force-dynamic'; // Отключаем статическую генерацию для динамических данных

export default function GeneratorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      {children}
      <Footer />
    </div>
  );
}
