import Link from "next/link";
import { Sparkles, Github, Twitter, MessageCircle, Mail } from "lucide-react";

interface FooterLayoutProps {
  siteName: string;
  description: string;
  currentYear: number;
}

export function FooterLayout({ siteName, description, currentYear }: FooterLayoutProps) {
  return (
    <footer className="border-t border-border/20 bg-background/50 backdrop-blur-xl mt-auto relative overflow-hidden">
      {/* Decorative gradient line */}
      <div className="absolute top-0 left-1/4 w-96 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
      
      <div className="container mx-auto px-4 pt-16 pb-8 max-w-6xl relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8 mb-16">
          {/* Brand Column */}
          <div className="md:col-span-1 lg:col-span-1">
            <Link href="/" className="inline-flex items-center gap-2 mb-4 group">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Sparkles className="w-4 h-4 text-primary" />
              </div>
              <span className="font-bold text-xl tracking-tight">{siteName}</span>
            </Link>
            <p className="text-muted-foreground text-sm leading-relaxed mb-6">
              {description}
            </p>
            <div className="flex items-center gap-4">
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors" aria-label="Telegram">
                <MessageCircle className="w-5 h-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors" aria-label="Twitter">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors" aria-label="GitHub">
                <Github className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Nav Columns */}
          <div className="md:col-span-3 lg:col-span-3 grid grid-cols-2 md:grid-cols-3 gap-8">
            <div>
              <h3 className="font-semibold text-foreground mb-4">Навигация</h3>
              <ul className="space-y-3 text-sm">
                <li><Link href="/" className="text-muted-foreground hover:text-primary transition-colors">Главная</Link></li>
                <li><Link href="/?sort=popular" className="text-muted-foreground hover:text-primary transition-colors">Популярное</Link></li>
                <li><Link href="/software" className="text-muted-foreground hover:text-primary transition-colors">Программы</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-foreground mb-4">Темы</h3>
              <ul className="space-y-3 text-sm">
                <li><Link href="/?search=ИИ" className="text-muted-foreground hover:text-primary transition-colors">Искусственный интеллект</Link></li>
                <li><Link href="/?search=Нейросети" className="text-muted-foreground hover:text-primary transition-colors">Нейросети</Link></li>
                <li><Link href="/?search=Программирование" className="text-muted-foreground hover:text-primary transition-colors">Программирование</Link></li>
                <li><Link href="/?search=JavaScript" className="text-muted-foreground hover:text-primary transition-colors">JavaScript</Link></li>
              </ul>
            </div>
            
            <div className="col-span-2 md:col-span-1">
              <h3 className="font-semibold text-foreground mb-4">Связь с нами</h3>
              <ul className="space-y-3 text-sm">
                <li>
                  <a href="mailto:hello@example.com" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    hello@example.com
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="border-t border-border/20 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
          <p>© {currentYear} {siteName}. Все права защищены.</p>
          <div className="flex items-center gap-6">
            <Link href="#" className="hover:text-primary transition-colors">Конфиденциальность</Link>
            <Link href="#" className="hover:text-primary transition-colors">Условия</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
