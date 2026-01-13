import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FileQuestion, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-6 px-4">
        <div className="flex justify-center">
          <FileQuestion className="w-24 h-24 text-muted-foreground" />
        </div>
        <h1 className="text-4xl font-bold">Пост не найден</h1>
        <p className="text-lg text-muted-foreground max-w-md">
          Пост, который вы ищете, не существует или был удален.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/blog">
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Назад к блогу
            </Button>
          </Link>
          <Link href="/">
            <Button variant="outline">На главную</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
