import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import EditForm from "./edit-form";

export default async function EditSoftwarePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const software = await prisma.software.findUnique({
    where: { id: resolvedParams.id }
  });

  if (!software) notFound();

  return (
    <div>
      <Link href="/admin" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4 mr-2" /> Назад к списку
      </Link>
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Редактирование ссылок</h1>
        <p className="text-muted-foreground">Программа: <span className="font-semibold text-foreground">{software.name}</span></p>
      </div>

      <div className="max-w-2xl bg-secondary/20 p-6 rounded-2xl border border-border/40">
        <EditForm 
          id={software.id} 
          initialWebsiteUrl={software.websiteUrl || ""} 
          initialLocalDownloadUrl={software.localDownloadUrl || ""} 
        />
      </div>
    </div>
  );
}
