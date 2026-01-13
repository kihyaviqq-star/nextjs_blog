"use client";

import { useEffect, useRef, useCallback } from "react";
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

export default function EditorWrapper({
  data,
  onChange,
  holder = "editorjs",
}: EditorWrapperProps) {
  const { theme } = useTheme();
  const editorRef = useRef<EditorJS | null>(null);
  const isInitialized = useRef(false);

  const initializeEditor = useCallback(() => {
    if (isInitialized.current) return;
    
    // Проверяем, что элемент существует
    const holderElement = document.getElementById(holder);
    if (!holderElement) {
      console.error(`Editor holder element with id "${holder}" not found`);
      return;
    }

    // Нормализуем data - если undefined или null, используем пустую структуру
    const normalizedData = data && data.blocks && data.blocks.length > 0 
      ? data 
      : { blocks: [] };

    const editor = new EditorJS({
      holder: holder,
      placeholder: "Начните писать свой контент...",
      data: normalizedData,
      autofocus: false,
      readOnly: false,
      defaultBlock: "paragraph",
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
            endpoint: "/api/fetchUrl", // Mock endpoint
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
                  formData.append("type", "cover"); // Используем cover для изображений в контенте статьи

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
                    error: error.message || "Не удалось загрузить изображение",
                  };
                }
              },
              async uploadByUrl(url: string) {
                try {
                  // Проверяем, что URL валидный
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
                    error: error.message || "Неверный URL изображения",
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
      onChange: async () => {
        if (onChange && editorRef.current) {
          try {
            const content = await editorRef.current.save();
            onChange(content);
          } catch (error) {
            console.error("Error saving editor content:", error);
          }
        }
      },
      onReady: () => {
        // Плагины инициализируются в initializeEditor после isReady
      },
      minHeight: 400,
      inlineToolbar: ['bold', 'italic', 'link', 'marker', 'underline', 'inlineCode'],
    });

    editorRef.current = editor;
    
    // Инициализируем плагины после того, как редактор готов
    editor.isReady
      .then(() => {
        isInitialized.current = true;
        if (editorRef.current) {
          try {
            new Undo({ editor: editorRef.current });
            new DragDrop(editorRef.current);
          } catch (error) {
            console.error("Error initializing editor plugins:", error);
          }
        }
      })
      .catch((error) => {
        console.error("Editor initialization error:", error);
        isInitialized.current = false;
      });
  }, [data, holder, onChange]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    
    // Ждем, пока DOM элемент будет готов
    const timer = setTimeout(() => {
      if (!isInitialized.current) {
        const holderElement = document.getElementById(holder);
        if (holderElement) {
          initializeEditor();
        } else {
          console.warn(`Editor holder "${holder}" not found, retrying...`);
          // Повторная попытка через небольшую задержку
          setTimeout(() => {
            if (!isInitialized.current) {
              initializeEditor();
            }
          }, 100);
        }
      }
    }, 100);

    return () => {
      clearTimeout(timer);
      if (editorRef.current && editorRef.current.destroy) {
        try {
          editorRef.current.destroy();
          editorRef.current = null;
        } catch (error) {
          console.error("Error destroying editor:", error);
        }
        isInitialized.current = false;
      }
    };
  }, [initializeEditor, holder]);

  // Update editor when data prop changes (for editing existing posts)
  useEffect(() => {
    if (!editorRef.current || !data || !isInitialized.current) {
      return;
    }

    // Проверяем, что данные действительно изменились
    editorRef.current.isReady
      .then(() => {
        // Получаем текущие данные редактора
        return editorRef.current?.save();
      })
      .then((currentData) => {
        // Сравниваем только если данные действительно изменились
        const currentDataStr = JSON.stringify(currentData);
        const newDataStr = JSON.stringify(data);
        
        if (currentDataStr !== newDataStr) {
          return editorRef.current?.render(data);
        }
      })
      .catch((error: Error) => {
        console.error("Error updating editor data:", error);
      });
  }, [data]);

  return (
    <div 
      className="prose prose-invert dark:prose-invert max-w-none"
      data-theme={theme}
    >
      <div id={holder} className="min-h-[300px]" />
    </div>
  );
}
