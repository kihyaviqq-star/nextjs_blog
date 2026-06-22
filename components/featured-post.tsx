import Link from "next/link";
import Image from "next/image";
import { Calendar, Clock, Tag, ImageIcon, ArrowRight } from "lucide-react";

export function FeaturedPost({ post }: { post: any }) {
  if (!post) return null;

  return (
    <div className="relative group overflow-hidden rounded-[2.5rem] border border-border/20 bg-background/50 shadow-xl hover:shadow-2xl hover:border-primary/20 transition-all duration-500 backdrop-blur-xl">
      <Link href={`/${post.slug}`} className="absolute inset-0 z-10">
        <span className="sr-only">Читать главную статью</span>
      </Link>
      <div className="grid md:grid-cols-[1.2fr_1fr] gap-0 h-full">
        <div className="h-72 md:h-auto min-h-[450px] w-full relative overflow-hidden bg-secondary/30 order-first">
          {post.coverImage ? (
            <Image
              src={post.coverImage}
              alt={post.title}
              fill
              sizes="(max-width: 768px) 100vw, 60vw"
              className="object-cover transition-transform duration-1000 group-hover:scale-105"
              priority
              unoptimized={post.coverImage?.startsWith('/') || post.coverImage?.startsWith('http')}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground/30">
              <ImageIcon className="w-24 h-24 mb-2" />
            </div>
          )}
          {/* Subtle gradient overlay to match Apple aesthetics */}
          <div className="absolute inset-0 bg-gradient-to-t from-background/40 via-transparent to-transparent opacity-60" />
        </div>
        
        <div className="p-8 md:p-12 lg:p-16 flex flex-col justify-center order-last z-20 bg-gradient-to-r from-background via-background/95 to-background/80 md:-ml-12 md:rounded-l-[3rem]">
          <div className="flex flex-wrap gap-2 mb-6">
            {post.tags.slice(0, 3).map((tag: string) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-secondary text-secondary-foreground text-xs font-semibold tracking-wide"
              >
                {tag}
              </span>
            ))}
          </div>
          <h3 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 line-clamp-3 group-hover:text-primary transition-colors leading-[1.1] tracking-tight">
            {post.title}
          </h3>
          <p className="text-muted-foreground text-lg md:text-xl mb-10 line-clamp-3 leading-relaxed font-light">
            {post.excerpt}
          </p>
          
          <div className="flex items-center justify-between mt-auto">
            <div className="flex items-center gap-4 relative z-20 pointer-events-auto">
              <Link 
                href={`/${post.author.username || post.author.id}`}
                className="flex items-center gap-3 hover:opacity-80 transition-opacity group/author"
              >
                {post.author.avatarUrl ? (
                  <Image
                    src={post.author.avatarUrl}
                    alt={post.author.name || "User"}
                    width={44}
                    height={44}
                    className="w-11 h-11 rounded-full object-cover ring-4 ring-background group-hover/author:ring-primary/20 transition-all shadow-sm"
                    unoptimized={post.author.avatarUrl.startsWith('http') || post.author.avatarUrl.startsWith('/uploads/')}
                  />
                ) : (
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center ring-4 ring-background shadow-sm">
                    <span className="text-white font-bold text-sm">
                      {(post.author.name || "U").charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-foreground">
                    {post.author.name}
                  </span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                    <Calendar className="w-3 h-3" />
                    {new Date(post.publishedAt).toLocaleDateString("ru-RU", {
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                </div>
              </Link>
            </div>
            
            <div className="hidden sm:flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
              <ArrowRight className="w-5 h-5 -rotate-45 group-hover:rotate-0 transition-transform duration-300" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
