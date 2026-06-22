"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { LogIn } from "lucide-react";
import { toast } from "sonner";

export function SignInModal({ children, onLoginSuccess }: { children: React.ReactNode, onLoginSuccess?: () => void }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        toast.error("Ошибка входа", {
          description: "Проверьте правильность email и пароля"
        });
        setIsLoading(false);
        return;
      }

      toast.success("Вы успешно вошли в систему");
      setOpen(false);
      
      if (onLoginSuccess) {
        onLoginSuccess();
      }
      
      router.refresh();
    } catch (error) {
      toast.error("Произошла ошибка при входе");
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
            Вход в систему
          </DialogTitle>
          <DialogDescription>
            Войдите для создания статей и комментирования.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <label htmlFor="modal-email" className="text-sm font-medium">Email</label>
            <input
              id="modal-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring transition-all text-sm"
              placeholder="example@email.com"
              required
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="modal-password" className="text-sm font-medium">Пароль</label>
            <input
              id="modal-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring transition-all text-sm"
              placeholder="••••••••"
              required
              disabled={isLoading}
            />
          </div>

          {error && (
            <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm border border-destructive/20">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Вход..." : <><LogIn className="w-4 h-4 mr-2" /> Войти</>}
          </Button>

          <div className="mt-4 text-center text-sm text-muted-foreground">
            Нет аккаунта?{" "}
            <Link 
              href="/auth/register" 
              onClick={() => setOpen(false)}
              className="text-primary hover:underline font-medium transition-colors"
            >
              Зарегистрироваться
            </Link>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
