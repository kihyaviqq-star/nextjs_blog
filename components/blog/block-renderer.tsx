import React from "react";
import Image from "next/image";
import { EditorBlock } from "@/lib/types";
import { cn } from "@/lib/utils";
import { AlertTriangle, Check } from "lucide-react";
import DOMPurify from "isomorphic-dompurify";

interface BlockRendererProps {
  blocks: EditorBlock[];
  className?: string;
}

export default function BlockRenderer({ blocks, className }: BlockRendererProps) {
  // Safety check: ensure blocks is a valid array
  if (!blocks || !Array.isArray(blocks) || blocks.length === 0) {
    return null;
  }

  return (
    <article className={cn("prose prose-invert dark:prose-invert max-w-none", className)}>
      {blocks.map((block, index) => {
        // Safety check: ensure block is valid
        if (!block || typeof block !== 'object' || !block.type) {
          return null;
        }
        return <Block key={block.id || index} block={block} />;
      })}
    </article>
  );
}

function Block({ block }: { block: EditorBlock }) {
  switch (block.type) {
    case "header":
      return <HeaderBlock data={block.data} />;
    case "paragraph":
      return <ParagraphBlock data={block.data} />;
    case "list":
      return <ListBlock data={block.data} />;
    case "checklist":
      return <ChecklistBlock data={block.data} />;
    case "code":
      return <CodeBlock data={block.data} />;
    case "quote":
      return <QuoteBlock data={block.data} />;
    case "warning":
      return <WarningBlock data={block.data} />;
    case "delimiter":
      return <DelimiterBlock />;
    case "table":
      return <TableBlock data={block.data} />;
    case "image":
      return <ImageBlock data={block.data} />;
    case "embed":
      return <EmbedBlock data={block.data} />;
    case "linkTool":
      return <LinkToolBlock data={block.data} />;
    case "raw":
      return <RawBlock data={block.data} />;
    default:
      return null;
  }
}

function RawBlock({ data }: { data: any }) {
  if (!data || !data.html) return null;
  
  // Sanitize HTML to prevent XSS
  const cleanHtml = DOMPurify.sanitize(data.html);

  return (
    <div 
      className="my-6"
      dangerouslySetInnerHTML={{ __html: cleanHtml }}
    />
  );
}

function HeaderBlock({ data }: { data: any }) {
  if (!data || !data.text) return null;
  
  const { text, level = 2 } = data;
  const Tag = `h${level}` as keyof React.JSX.IntrinsicElements;
  
  const styles = {
    1: "text-4xl font-bold tracking-tight mt-8 mb-4",
    2: "text-3xl font-semibold tracking-tight mt-8 mb-4",
    3: "text-2xl font-semibold tracking-tight mt-6 mb-3",
    4: "text-xl font-semibold tracking-tight mt-6 mb-3",
  };

  return (
    <Tag className={styles[level as keyof typeof styles] || styles[2]}>
      {text}
    </Tag>
  );
}

function ParagraphBlock({ data }: { data: any }) {
  if (!data || !data.text) return null;
  
  return (
    <p className="text-base leading-7 text-foreground mb-4">
      {data.text}
    </p>
  );
}

function ListBlock({ data }: { data: any }) {
  if (!data || !data.items || !Array.isArray(data.items)) return null;
  
  const { style, items } = data;
  
  if (style === "ordered") {
    return (
      <ol className="list-decimal list-inside space-y-2 mb-4 text-foreground">
        {items.map((item: string, index: number) => (
          <li key={index} className="leading-7">
            {item}
          </li>
        ))}
      </ol>
    );
  }
  
  return (
    <ul className="list-disc list-inside space-y-2 mb-4 text-foreground">
      {items.map((item: string, index: number) => (
        <li key={index} className="leading-7">
          {item}
        </li>
      ))}
    </ul>
  );
}

function CodeBlock({ data }: { data: any }) {
  if (!data || !data.code) return null;
  
  return (
    <pre className="bg-secondary border border-border rounded-lg p-4 overflow-x-auto mb-4">
      <code className="text-sm font-mono text-foreground">
        {data.code}
      </code>
    </pre>
  );
}

function QuoteBlock({ data }: { data: any }) {
  if (!data || !data.text) return null;
  
  const { text, caption } = data;
  
  return (
    <blockquote className="border-l-4 border-primary pl-4 py-2 my-6 italic">
      <p className="text-lg text-foreground mb-2">
        «{text}»
      </p>
      {caption && (
        <footer className="text-sm text-muted-foreground">
          — {caption}
        </footer>
      )}
    </blockquote>
  );
}

function ImageBlock({ data }: { data: any }) {
  if (!data) return null;
  
  const file = data.file || data;
  const url = file?.url || data?.url;
  
  if (!url) return null;
  
  const caption = file?.caption || data?.caption;
  
  return (
    <figure className="my-6">
      <div className="relative w-full rounded-lg border border-border overflow-hidden" style={{ aspectRatio: '16/9', minHeight: '200px' }}>
        <Image
          src={url}
          alt={caption || ""}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-contain rounded-lg"
          unoptimized={true}
        />
      </div>
      {caption && (
        <figcaption className="text-sm text-muted-foreground text-center mt-2">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}

function ChecklistBlock({ data }: { data: any }) {
  if (!data || !data.items || !Array.isArray(data.items)) return null;
  
  const { items } = data;
  
  return (
    <ul className="space-y-2 mb-4 list-none pl-0">
      {items.map((item: any, index: number) => {
        if (!item || typeof item !== 'object') return null;
        
        return (
          <li key={index} className="flex items-start gap-2">
            <span className={cn(
              "mt-1 flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center",
              item.checked 
                ? "bg-primary border-primary text-primary-foreground" 
                : "border-muted-foreground"
            )}>
              {item.checked && <Check className="w-3 h-3" />}
            </span>
            <span className={cn(
              "leading-7",
              item.checked && "line-through text-muted-foreground"
            )}>
              {item.text || ""}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

function WarningBlock({ data }: { data: any }) {
  if (!data || (!data.title && !data.message)) return null;
  
  const { title, message } = data;
  
  return (
    <div className="my-6 p-4 border-l-4 border-yellow-500 bg-yellow-500/10 rounded-r-lg">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          {title && (
            <div className="font-semibold text-foreground mb-1">
              {title}
            </div>
          )}
          {message && (
            <div className="text-sm text-foreground/90">
              {message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DelimiterBlock() {
  return (
    <div className="my-8 flex items-center justify-center">
      <div className="flex gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground"></span>
        <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground"></span>
        <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground"></span>
      </div>
    </div>
  );
}

function TableBlock({ data }: { data: any }) {
  const { content, withHeadings } = data;
  
  if (!content || content.length === 0) return null;
  
  return (
    <div className="my-6 overflow-x-auto">
      <table className="min-w-full border border-border rounded-lg">
        {withHeadings && (
          <thead className="bg-secondary">
            <tr>
              {content[0].map((cell: string, index: number) => (
                <th
                  key={index}
                  className="px-4 py-2 text-left text-sm font-semibold border-b border-border"
                >
                  {cell}
                </th>
              ))}
            </tr>
          </thead>
        )}
        <tbody>
          {content.slice(withHeadings ? 1 : 0).map((row: string[], rowIndex: number) => (
            <tr key={rowIndex} className="border-b border-border last:border-0">
              {row.map((cell: string, cellIndex: number) => (
                <td
                  key={cellIndex}
                  className="px-4 py-2 text-sm"
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EmbedBlock({ data }: { data: any }) {
  if (!data || !data.embed) return null;
  
  const { service, source, embed, width, height, caption } = data;
  
  // Sanitize embed code but allow iframes
  const cleanEmbed = DOMPurify.sanitize(embed, {
    ADD_TAGS: ["iframe"],
    ADD_ATTR: ["allow", "allowfullscreen", "frameborder", "scrolling"],
  });

  return (
    <figure className="my-6">
      <div className="relative rounded-lg overflow-hidden border border-border bg-secondary">
        <div 
          className="aspect-video"
          dangerouslySetInnerHTML={{ __html: cleanEmbed }}
        />
      </div>
      {caption && (
        <figcaption className="text-sm text-muted-foreground text-center mt-2">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}

function LinkToolBlock({ data }: { data: any }) {
  if (!data || !data.link || !data.meta) return null;
  
  const { link, meta } = data;
  
  let hostname = "";
  try {
    hostname = new URL(link).hostname;
  } catch {
    hostname = link;
  }
  
  return (
    <a
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      className="block my-6 p-4 border border-border rounded-lg hover:border-primary transition-colors bg-card"
    >
      <div className="flex gap-4">
        {meta.image?.url && (
          <Image
            src={meta.image.url}
            alt={meta.title || "Link preview"}
            width={96}
            height={96}
            className="w-24 h-24 object-cover rounded flex-shrink-0"
            unoptimized={meta.image.url.startsWith('http')}
          />
        )}
        <div className="flex-1 min-w-0">
          {meta.title && (
            <div className="font-semibold text-foreground mb-1 truncate">
              {meta.title}
            </div>
          )}
          {meta.description && (
            <div className="text-sm text-muted-foreground line-clamp-2">
              {meta.description}
            </div>
          )}
          <div className="text-xs text-muted-foreground mt-2">
            {hostname}
          </div>
        </div>
      </div>
    </a>
  );
}
