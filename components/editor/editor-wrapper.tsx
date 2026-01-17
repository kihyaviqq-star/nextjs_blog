"use client";

import { useEffect, useRef, useCallback, useMemo, useState } from "react";
import { useTheme } from "next-themes";
import EditorJS, { OutputData } from "@editorjs/editorjs";
// @ts-ignore
import Header from "@editorjs/header";
// @ts-ignore
import List from "@editorjs/list";
// @ts-ignore
import Code from "@editorjs/code";
// @ts-ignore
import Quote from "@editorjs/quote";
// @ts-ignore
import Image from "@editorjs/image";
// @ts-ignore
import Checklist from "@editorjs/checklist";
// @ts-ignore
import Delimiter from "@editorjs/delimiter";
// @ts-ignore
import Table from "@editorjs/table";
// @ts-ignore
import Warning from "@editorjs/warning";
// @ts-ignore
import LinkTool from "@editorjs/link";
// @ts-ignore
import Embed from "@editorjs/embed";
// @ts-ignore
import Marker from "@editorjs/marker";
// @ts-ignore
import InlineCode from "@editorjs/inline-code";
// @ts-ignore
import Underline from "@editorjs/underline";
// @ts-ignore
import Paragraph from "@editorjs/paragraph";
// @ts-ignore
import DragDrop from "editorjs-drag-drop";
// @ts-ignore
import Undo from "editorjs-undo";
import "@/app/editor-dark-theme.css";

interface EditorWrapperProps {
  data?: OutputData;
  onChange?: (data: OutputData) => void;
  holder?: string;
}

// Helper function to normalize and validate editor data
function normalizeEditorData(data?: OutputData): OutputData {
  if (!data || !data.blocks || !Array.isArray(data.blocks)) {
    return { blocks: [] };
  }
  
  // Filter out invalid blocks that might cause "invalid data" errors
  const validBlocks = data.blocks.filter((block) => {
    // Basic structure validation
    if (!block || typeof block !== "object" || !block.type || typeof block.type !== "string" || !block.data || typeof block.data !== "object") {
      return false;
    }

    // Type-specific validation
    switch (block.type) {
      case "paragraph":
        // Paragraph must have text property (can be empty string)
        return typeof block.data.text === "string";
      case "header":
        // Header must have text property and level
        return typeof block.data.text === "string" && typeof block.data.level === "number";
      case "list":
        // List must have style and items array
        return typeof block.data.style === "string" && Array.isArray(block.data.items);
      case "quote":
        // Quote must have text
        return typeof block.data.text === "string";
      case "code":
        // Code must have code property
        return typeof block.data.code === "string";
      case "checklist":
        // Checklist must have items array
        return Array.isArray(block.data.items);
      case "table":
        // Table must have content array
        return Array.isArray(block.data.content);
      case "linkTool":
        // LinkTool must have link and meta
        return typeof block.data.link === "string" && block.data.meta;
      case "image":
        // Image must have file.url or url
        return (block.data.file && typeof block.data.file.url === "string") || typeof block.data.url === "string";
      case "warning":
        // Warning must have title and message
        return typeof block.data.title === "string" && typeof block.data.message === "string";
      case "embed":
        // Embed must have service, source, embed, width, height, caption
        return typeof block.data.service === "string" && typeof block.data.source === "string";
      default:
        // For unknown block types, just check basic structure
        return true;
    }
  }).map((block) => {
    // Normalize block data - ensure required fields exist with correct types
    const normalizedBlock = { ...block };
    
    if (block.type === "paragraph") {
      // Ensure paragraph has text property as string
      if (typeof normalizedBlock.data.text === "undefined" || normalizedBlock.data.text === null) {
        normalizedBlock.data = {
          ...normalizedBlock.data,
          text: "",
        };
      } else if (typeof normalizedBlock.data.text !== "string") {
        // Convert non-string text to string
        normalizedBlock.data = {
          ...normalizedBlock.data,
          text: String(normalizedBlock.data.text),
        };
      }
    } else if (block.type === "header") {
      // Ensure header has text and level
      if (typeof normalizedBlock.data.text !== "string") {
        normalizedBlock.data = {
          ...normalizedBlock.data,
          text: normalizedBlock.data.text ? String(normalizedBlock.data.text) : "",
        };
      }
      if (typeof normalizedBlock.data.level !== "number") {
        normalizedBlock.data = {
          ...normalizedBlock.data,
          level: normalizedBlock.data.level || 1,
        };
      }
    }
    
    return normalizedBlock;
  });

  return {
    blocks: validBlocks,
    ...(data.time ? { time: data.time } : {}),
    ...(data.version ? { version: data.version } : {}),
  };
}

export default function EditorWrapper({
  data,
  onChange,
  holder = "editorjs-container",
}: EditorWrapperProps) {
  const { theme } = useTheme();
  const editorInstance = useRef<EditorJS | null>(null);
  const isInitialized = useRef(false);
  const onChangeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const initialDataRef = useRef<OutputData | null>(null);
  const pluginsRef = useRef<{ undo?: any; dragDrop?: any }>({});
  const dataLoadedRef = useRef(false); // Track if initial data has been loaded
  const holderRef = useRef<HTMLDivElement>(null);
  const dataRef = useRef(data); // Track data prop changes

  // Update data ref when prop changes (for key-based remounting)
  if (dataRef.current !== data) {
    dataRef.current = data;
    // Reset refs when data prop changes (new key = new component instance)
    initialDataRef.current = null;
    dataLoadedRef.current = false;
  }

  // Store initial data once and never change it
  if (initialDataRef.current === null) {
    initialDataRef.current = normalizeEditorData(data);
    dataLoadedRef.current = !!data;
  }

  // Use useCallback for onChange handler to prevent re-creation
  const handleChange = useCallback(async () => {
    if (!onChange || !editorInstance.current || !isInitialized.current) return;

    // Clear previous timeout
    if (onChangeTimeoutRef.current) {
      clearTimeout(onChangeTimeoutRef.current);
    }

    // Debounce the onChange call
    onChangeTimeoutRef.current = setTimeout(async () => {
      try {
        const editor = editorInstance.current;
        if (!editor || !isInitialized.current) return;
        
        // Check if editor has save method
        if (typeof editor.save !== 'function') return;
        
        const content = await editor.save();
        if (content && onChange) {
          onChange(content);
        }
      } catch (error) {
        console.error("Error saving editor content:", error);
      }
    }, 300); // Debounce to 300ms
  }, [onChange]);

  // Initialize editor only once
  useEffect(() => {
    // Guard clause: prevent re-initialization
    if (typeof window === "undefined") return;
    if (editorInstance.current || isInitialized.current) return;

    const holderElement = holderRef.current;
    if (!holderElement) {
      console.error("Editor holder element not found");
      return;
    }

    // Create a unique child element for this editor instance
    // This isolates the editor's DOM from previous instances that might not have cleaned up yet (race condition)
    const editorHost = document.createElement('div');
    editorHost.className = 'editor-host-instance';
    holderElement.appendChild(editorHost);

    // Use initial data only, ensure strict structure
    const normalizedData = {
      blocks: initialDataRef.current?.blocks || [],
    };

    const editor = new EditorJS({
      holder: editorHost, // Render into our isolated host element
      placeholder: "Начните писать свой контент...",
      data: normalizedData,
      autofocus: false,
      readOnly: false,
      defaultBlock: "paragraph",
      minHeight: 400,
      inlineToolbar: ['bold', 'italic', 'link', 'marker', 'underline', 'inlineCode'],
      i18n: {
        messages: {
          ui: {
            blockTunes: {
              toggler: {
                "Click to tune": "Нажмите для настройки",
                "or drag to move": "или перетащите",
              },
            },
            inlineToolbar: {
              converter: {
                "Convert to": "Конвертировать в",
              },
            },
            toolbar: {
              toolbox: {
                Add: "Добавить",
                Filter: "Фильтр",
                "Nothing found": "Ничего не найдено",
                "Or paste the link": "Или вставьте ссылку",
              },
            },
          },
          toolNames: {
            Text: "Текст",
            Heading: "Заголовок",
            List: "Список",
            Warning: "Предупреждение",
            Checklist: "Чеклист",
            Quote: "Цитата",
            Code: "Код",
            Delimiter: "Разделитель",
            Table: "Таблица",
            Link: "Ссылка",
            Marker: "Маркер",
            Bold: "Жирный",
            Italic: "Курсив",
            InlineCode: "Моноширинный",
            Image: "Изображение",
            Embed: "Встроить",
            Underline: "Подчеркнутый",
          },
          tools: {
            warning: {
              Title: "Заголовок",
              Message: "Сообщение",
              // ...
            },
            link: {
              "Add a link": "Добавить ссылку",
            },
            image: {
              Caption: "Описание",
              "Select an Image": "Выберите изображение",
              "With border": "С рамкой",
              "Stretch image": "Растянуть",
              "With background": "С фоном",
              "Embed": "Встроить",
              "Delete": "Удалить",
            },
            stub: {
              "The block can not be displayed correctly.": "Блок не может быть отображен корректно.",
            },
          },
          blockTunes: {
            delete: {
              Delete: "Удалить",
              "Click to delete": "Нажмите для удаления",
            },
            moveUp: {
              "Move up": "Переместить вверх",
            },
            moveDown: {
              "Move down": "Переместить вниз",
            },
          },
        },
      },
      tools: {
        paragraph: {
          class: Paragraph as any,
          inlineToolbar: true,
          config: {
            placeholder: "Введите текст",
          },
        },
        header: {
          class: Header as any,
          inlineToolbar: true,
          config: {
            placeholder: "Введите заголовок",
            levels: [1, 2, 3, 4, 5, 6],
            defaultLevel: 2,
          },
          shortcut: "CMD+SHIFT+H",
        },
        list: {
          class: List as any,
          inlineToolbar: true,
          config: {
            defaultStyle: "unordered",
          },
          shortcut: "CMD+SHIFT+L",
        },
        checklist: {
          class: Checklist as any,
          inlineToolbar: true,
          config: {
            placeholder: "Элемент списка",
          },
        },
        quote: {
          class: Quote as any,
          inlineToolbar: true,
          config: {
            quotePlaceholder: "Введите цитату",
            captionPlaceholder: "Автор цитаты",
          },
          shortcut: "CMD+SHIFT+Q",
        },
        warning: {
          class: Warning as any,
          inlineToolbar: true,
          config: {
            titlePlaceholder: "Заголовок",
            messagePlaceholder: "Сообщение",
          },
        },
        marker: {
          class: Marker as any,
          shortcut: "CMD+SHIFT+M",
        },
        code: {
          class: Code as any,
          config: {
            placeholder: "Введите код",
          },
          shortcut: "CMD+SHIFT+C",
        },
        delimiter: Delimiter as any,
        inlineCode: {
          class: InlineCode as any,
          shortcut: "CMD+SHIFT+K",
        },
        linkTool: {
          class: LinkTool as any,
          config: {
            endpoint: "/api/fetchUrl",
          },
        },
        image: {
          class: Image as any,
          config: {
            uploader: {
              async uploadByFile(file: File) {
                try {
                  const formData = new FormData();
                  formData.append("file", file);
                  formData.append("type", "editor-image");

                  const response = await fetch("/api/upload", {
                    method: "POST",
                    body: formData,
                  });

                  if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.error || "Ошибка загрузки изображения");
                  }

                  const data = await response.json();
                  return {
                    success: 1,
                    file: {
                      url: data.url,
                    },
                  };
                } catch (error: any) {
                  console.error("Image upload error:", error);
                  return {
                    success: 0,
                    error: {
                      message: error.message || "Не удалось загрузить изображение",
                    },
                  };
                }
              },
              async uploadByUrl(url: string) {
                try {
                  if (!url || (!url.startsWith("http://") && !url.startsWith("https://"))) {
                    throw new Error("Неверный URL изображения");
                  }
                  
                  return {
                    success: 1,
                    file: {
                      url: url,
                    },
                  };
                } catch (error: any) {
                  console.error("Image URL error:", error);
                  return {
                    success: 0,
                    error: {
                      message: error.message || "Неверный URL изображения",
                    },
                  };
                }
              },
            },
            captionPlaceholder: "Описание изображения (необязательно)",
            buttonContent: "Выберите изображение",
            withBorder: false,
            withBackground: false,
            stretched: false,
          },
        },
        embed: {
          class: Embed as any,
          config: {
            services: {
              youtube: true,
              coub: true,
              codepen: true,
              twitter: true,
              instagram: true,
              facebook: true,
              vimeo: true,
              rutube: true,
            },
          },
        },
        table: {
          class: Table as any,
          inlineToolbar: true,
          config: {
            rows: 2,
            cols: 3,
          },
        },
        underline: Underline as any,
      },
      onChange: handleChange,
    });

    editorInstance.current = editor;
    isInitialized.current = true;

    // Initialize plugins after editor is ready
    editor.isReady
      .then(() => {
        const currentEditor = editorInstance.current;
        if (!currentEditor) {
          // This happens if editor was destroyed before ready (Strict Mode race condition)
          // Since we use isolated DOM elements, we just need to ensure we don't leave memory leaks
          if (typeof editor.destroy === 'function') {
            try { editor.destroy(); } catch (e) {}
          }
          return;
        }
        
        try {
          // Initialize plugins only if editor exists
          if (currentEditor && typeof currentEditor.save === 'function') {
            pluginsRef.current.undo = new Undo({ editor: currentEditor });
            pluginsRef.current.dragDrop = new DragDrop(currentEditor);
          }
        } catch (error) {
          console.error("Error initializing editor plugins:", error);
        }
      })
      .catch((error) => {
        console.error("Editor initialization error:", error);
        isInitialized.current = false;
        editorInstance.current = null;
        // Don't set error state here - timeout will handle it
      });

    // Cleanup function - only runs on unmount
    return () => {
      // Clear onChange timeout
      if (onChangeTimeoutRef.current) {
        clearTimeout(onChangeTimeoutRef.current);
        onChangeTimeoutRef.current = null;
      }

      // Destroy editor instance only on unmount
      if (editorInstance.current) {
        try {
          // Clean up plugins first
          if (pluginsRef.current.undo && typeof pluginsRef.current.undo.destroy === 'function') {
            try {
              pluginsRef.current.undo.destroy();
            } catch (e) {
              // Ignore plugin cleanup errors
            }
          }
          if (pluginsRef.current.dragDrop && typeof pluginsRef.current.dragDrop.destroy === 'function') {
            try {
              pluginsRef.current.dragDrop.destroy();
            } catch (e) {
              // Ignore plugin cleanup errors
            }
          }
          
          // Clear plugins reference
          pluginsRef.current = {};
          
          // Destroy editor only if method exists
          const editor = editorInstance.current;
          if (editor && typeof editor.destroy === 'function') {
            editor.destroy();
          }
          
          // Remove the isolated host element
          if (editorHost && editorHost.parentNode) {
            editorHost.parentNode.removeChild(editorHost);
          }
          
          editorInstance.current = null;
          isInitialized.current = false;
        } catch (error) {
          console.error("Error destroying editor:", error);
          // Fallback cleanup - always remove host
          if (editorHost && editorHost.parentNode) {
            editorHost.parentNode.removeChild(editorHost);
          }
          editorInstance.current = null;
          isInitialized.current = false;
        }
      } else {
        // Even if editorInstance is null, remove the host element
        if (editorHost && editorHost.parentNode) {
          editorHost.parentNode.removeChild(editorHost);
        }
      }
    };
  }, [handleChange]); // Only depend on stable handleChange

  // Handle external data updates ONLY on first load (for editing existing posts)
  // This should NOT re-run on every data change - editor is uncontrolled after init
  useEffect(() => {
    // Only load data if editor is ready AND we haven't loaded initial data yet
    const currentEditor = editorInstance.current;
    if (!currentEditor || !isInitialized.current || !data || dataLoadedRef.current) {
      return;
    }

    // Load initial data only once
    currentEditor.isReady
      .then(async () => {
        try {
          const editor = editorInstance.current;
          if (!editor || typeof editor.render !== 'function') {
            console.error("Editor not available for rendering");
            dataLoadedRef.current = true;
            return;
          }
          
          const normalizedData = normalizeEditorData(data);
          // Only render if we have valid blocks
          if (normalizedData.blocks.length > 0) {
            await editor.render(normalizedData);
          }
          dataLoadedRef.current = true;
        } catch (error) {
          console.error("Error loading initial editor data:", error);
          dataLoadedRef.current = true; // Mark as loaded even on error to prevent retries
        }
      })
      .catch((error) => {
        console.error("Error in initial data load:", error);
        dataLoadedRef.current = true; // Mark as loaded to prevent retries
      });
  }, [data]); // This will only run once because dataLoadedRef prevents re-runs

  // Show error state if editor failed to initialize after timeout
  const [initError, setInitError] = useState(false);

  useEffect(() => {
    // Set error flag if editor doesn't initialize within 10 seconds
    const timeout = setTimeout(() => {
      if (!isInitialized.current && !editorInstance.current) {
        console.error('Editor failed to initialize within timeout');
        setInitError(true);
      }
    }, 10000);

    return () => clearTimeout(timeout);
  }, []);

  if (initError) {
    return (
      <div className="min-h-[400px] flex items-center justify-center border border-border rounded-lg bg-secondary/20">
        <div className="text-center space-y-4 p-8">
          <p className="text-destructive font-semibold">Ошибка загрузки редактора</p>
          <p className="text-sm text-muted-foreground">
            Попробуйте обновить страницу. Если проблема сохраняется, проверьте консоль браузера (F12).
          </p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="prose prose-invert dark:prose-invert max-w-none editor-container"
      data-theme={theme}
    >
      <div ref={holderRef} className="editor-holder" />
    </div>
  );
}
