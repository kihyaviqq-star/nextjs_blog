import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { prisma } from "@/lib/prisma";
import { isUsernameReserved } from "@/lib/constants";
import { Mail, Send, Twitter, Github, Calendar, Clock, Tag, ArrowRight } from "lucide-react";

interface PageProps {
  params: Promise<{
    username: string;
  }>;
}

async function getUserByUsername(username: string) {
  try {
    // First check if username is reserved (system route)
    if (isUsernameReserved(username)) {
      return null;
    }

    const user = await prisma.user.findFirst({
      where: {
        // Search by username (SQLite: store as lowercase)
        username: username.toLowerCase()
      },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        avatarUrl: true,
        bio: true,
        role: true,
        telegram: true,
        vk: true,
        twitter: true,
        github: true,
        createdAt: true,
      }
    });

    return user;
  } catch (error) {
    console.error('[Profile] Error fetching user:', error);
    return null;
  }
}

export default async function UserProfilePage({ params }: PageProps) {
  const { username } = await params;

  // Check if username is reserved
  if (isUsernameReserved(username)) {
    notFound();
  }

  const user = await getUserByUsername(username);

  if (!user) {
    notFound();
  }

  // Use actual username from database
  const displayUsername = user.username || username;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-12 max-w-4xl">
        {/* User Profile */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.name || username}
                className="w-32 h-32 rounded-full border-4 border-border object-cover"
              />
            ) : (
              <div className="w-32 h-32 rounded-full border-4 border-border bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <span className="text-5xl font-bold text-white">
                  {(user.name || username).charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>

          <h1 className="text-4xl font-bold mb-2">{user.name || username}</h1>
          
          {user.role && (
            <p className="text-lg text-muted-foreground mb-6">
              {user.role === "ADMIN" ? "Редактор" : "Пользователь"}
            </p>
          )}

          {/* Social Links */}
          {(user.telegram || user.vk || user.twitter || user.github) && (
            <div className="flex items-center justify-center gap-4 mb-8">
              {user.telegram && (
                <a
                  href={user.telegram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-secondary hover:bg-accent flex items-center justify-center transition-colors"
                  title="Telegram"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
                  </svg>
                </a>
              )}
              {user.vk && (
                <a
                  href={user.vk}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-secondary hover:bg-accent flex items-center justify-center transition-colors"
                  title="Вконтакте"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12.785 16.241s.288-.032.436-.194c.136-.149.132-.427.132-.427s-.019-1.302.574-1.495c.584-.19 1.33 1.259 2.124 1.816.6.422 1.056.329 1.056.329l2.123-.03s1.11-.07.584-.96c-.043-.073-.308-.662-1.588-1.87-1.34-1.264-1.16-1.059.453-3.246.983-1.332 1.376-2.145 1.253-2.493-.117-.332-.84-.244-.84-.244l-2.388.015s-.177-.025-.308.055c-.128.078-.21.261-.21.261s-.377.982-.88 1.816c-1.059 1.758-1.484 1.851-1.657 1.743-.403-.252-.302-1.012-.302-1.553 0-1.688.251-2.391-.489-2.574-.246-.061-.427-.101-1.056-.108-.807-.008-1.491.003-1.878.196-.257.128-.456.414-.335.431.15.02.489.093.669.342.233.322.225 1.045.225 1.045s.134 1.989-.313 2.234c-.308.168-.729-.175-1.634-1.741-.463-.809-.813-1.703-.813-1.703s-.067-.168-.188-.258c-.146-.109-.35-.144-.35-.144l-2.268.015s-.341.01-.466.161c-.111.134-.009.411-.009.411s1.766 4.207 3.765 6.328c1.833 1.946 3.916 1.817 3.916 1.817h.944z"/>
                  </svg>
                </a>
              )}
              {user.twitter && (
                <a
                  href={user.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-secondary hover:bg-accent flex items-center justify-center transition-colors"
                  title="Twitter"
                >
                  <Twitter className="w-5 h-5" />
                </a>
              )}
              {user.github && (
                <a
                  href={user.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-secondary hover:bg-accent flex items-center justify-center transition-colors"
                  title="GitHub"
                >
                  <Github className="w-5 h-5" />
                </a>
              )}
            </div>
          )}

          {user.email && (
            <a
              href={`mailto:${user.email}`}
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
            >
              <Mail className="w-4 h-4" />
              {user.email}
            </a>
          )}
        </div>

        {/* About Section */}
        {user.bio && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">Обо мне</h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              {user.bio}
            </p>
          </section>
        )}

        {/* Member Since */}
        <section className="mb-12">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <Calendar className="w-5 h-5" />
                <span>
                  Участник с{" "}
                  {new Date(user.createdAt).toLocaleDateString("ru-RU", {
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Back to Home */}
        <div className="mt-8 text-center">
          <Link href="/">
            <Button variant="outline">Вернуться на главную</Button>
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}

// Metadata for SEO
export async function generateMetadata({ params }: PageProps) {
  const { username } = await params;
  
  if (isUsernameReserved(username)) {
    return {
      title: "Страница не найдена",
    };
  }

  const user = await getUserByUsername(username);

  if (!user) {
    return {
      title: "Пользователь не найден",
    };
  }

  return {
    title: `${user.name || username} | AI-Stat`,
    description: user.bio || `Профиль пользователя ${user.name || username}`,
  };
}
