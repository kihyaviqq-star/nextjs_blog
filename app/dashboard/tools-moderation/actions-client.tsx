"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function ToolModerationActions({ toolId }: { toolId: string }) {
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const router = useRouter();

  const handleAction = async (action: "APPROVE" | "REJECT" | "DELETE") => {
    setLoadingAction(action);
    try {
      const res = await fetch("/api/admin/tools/moderate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toolId, action }),
      });

      if (res.ok) {
        if (action === "APPROVE") toast.success("Инструмент одобрен и опубликован в каталоге!");
        if (action === "REJECT") toast.info("Заявка отклонена");
        if (action === "DELETE") toast.success("Инструмент удален");
        router.refresh();
      } else {
        const data = await res.json();
        toast.error(data.error || "Ошибка при выполнении действия");
      }
    } catch {
      toast.error("Ошибка сети");
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="flex sm:flex-col items-center gap-2 shrink-0 border-t sm:border-t-0 sm:border-l border-border/60 pt-4 sm:pt-0 sm:pl-6">
      <Button
        size="sm"
        onClick={() => handleAction("APPROVE")}
        disabled={loadingAction !== null}
        className="w-full gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
      >
        {loadingAction === "APPROVE" ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <CheckCircle2 className="w-3.5 h-3.5" />
        )}
        <span>Одобрить</span>
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={() => handleAction("REJECT")}
        disabled={loadingAction !== null}
        className="w-full gap-1.5 text-amber-500 hover:text-amber-600 border-amber-500/30 hover:bg-amber-500/10"
      >
        {loadingAction === "REJECT" ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <XCircle className="w-3.5 h-3.5" />
        )}
        <span>Отклонить</span>
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleAction("DELETE")}
        disabled={loadingAction !== null}
        className="w-full gap-1.5 text-destructive hover:bg-destructive/10"
      >
        {loadingAction === "DELETE" ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Trash2 className="w-3.5 h-3.5" />
        )}
        <span>Удалить</span>
      </Button>
    </div>
  );
}
