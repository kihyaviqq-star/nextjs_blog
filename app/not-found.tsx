import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AlertCircle, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-6 px-4">
        <div className="flex justify-center">
          <AlertCircle className="w-24 h-24 text-muted-foreground" />
        </div>
        <h1 className="text-6xl font-bold">404</h1>
        <h2 className="text-2xl font-semibold">Страница не найдена</h2>
        <p className="text-lg text-muted-foreground max-w-md">
          Страница, которую вы ищете, не существует или была перемещена.
        </p>
        <Link href="/">
          <Button size="lg">
            <Home className="w-4 h-4 mr-2" />
            На главную
          </Button>
        </Link>
      </div>
    </div>
  );
}
