export function Footer() {
  return (
    <footer className="border-t border-border mt-auto">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
          <div>
            © 2026 ai-stat.ru — Все права защищены
          </div>
          <div className="text-center md:text-right">
            Сделано с <span className="text-red-500">❤</span> любовью
          </div>
        </div>
      </div>
    </footer>
  );
}
