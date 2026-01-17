"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, UserPlus, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function RegisterForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error("Ошибка регистрации", {
          description: data.error || "Попробуйте еще раз"
        });
        setIsLoading(false);
        return;
      }

      toast.success("Регистрация успешна!", {
        description: `Добро пожаловать, ${data.user.name || data.user.email}!`
      });

      const signInResult = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (signInResult?.error) {
        toast.info("Войдите в систему", {
          description: "Используйте свои учетные данные"
        });
        
        setTimeout(() => {
          router.push("/auth/signin");
        }, 1000);
      } else {
        setTimeout(() => {
          router.push(`/${data.user.username}`);
          // router.refresh() не нужен - router.push() уже обновит страницу
        }, 500);
      }
    } catch (error) {
      console.error("Registration error:", error);
      toast.error("Произошла ошибка", {
        description: error instanceof Error ? error.message : "Попробуйте позже"
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-grow flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          На главную
        </Link>

        <Card className="p-8 border-border/50 shadow-xl">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
              Регистрация
            </h1>
            <p className="text-muted-foreground">
              Создайте аккаунт для участия в платформе
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium mb-2"
              >
                Имя <span className="text-muted-foreground">(необязательно)</span>
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                placeholder="Ваше имя"
                disabled={isLoading}
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium mb-2"
              >
                Email <span className="text-red-500">*</span>
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                placeholder="your@email.com"
                required
                disabled={isLoading}
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium mb-2"
              >
                Пароль <span className="text-red-500">*</span>
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                placeholder="Минимум 6 символов"
                required
                minLength={6}
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Минимум 6 символов
              </p>
            </div>

            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Регистрация...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Зарегистрироваться
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Уже есть аккаунт?{" "}
              <Link
                href="/auth/signin"
                className="text-blue-500 hover:text-blue-600 font-medium transition-colors"
              >
                Войти
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
