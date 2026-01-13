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

    const editor = new EditorJS({
      holder: holder,
      placeholder: "Начните писать свой контент...",
      data: data,
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
          class: Paragraph,
          inlineToolbar: true,
          config: {
            placeholder: "Введите текст",
          },
        },
        header: {
          class: Header,
          inlineToolbar: true,
          config: {
            placeholder: "Введите заголовок",
            levels: [1, 2, 3, 4, 5, 6],
            defaultLevel: 2,
          },
          shortcut: "CMD+SHIFT+H",
        },
        list: {
          class: List,
          inlineToolbar: true,
          config: {
            defaultStyle: "unordered",
          },
          shortcut: "CMD+SHIFT+L",
        },
        checklist: {
          class: Checklist,
          inlineToolbar: true,
        },
        quote: {
          class: Quote,
          inlineToolbar: true,
          config: {
            quotePlaceholder: "Введите цитату",
            captionPlaceholder: "Автор цитаты",
          },
          shortcut: "CMD+SHIFT+Q",
        },
        warning: {
          class: Warning,
          inlineToolbar: true,
          config: {
            titlePlaceholder: "Заголовок",
            messagePlaceholder: "Сообщение",
          },
        },
        marker: {
          class: Marker,
          shortcut: "CMD+SHIFT+M",
        },
        code: {
          class: Code,
          config: {
            placeholder: "Введите код",
          },
          shortcut: "CMD+SHIFT+C",
        },
        delimiter: Delimiter,
        inlineCode: {
          class: InlineCode,
          shortcut: "CMD+SHIFT+K",
        },
        linkTool: {
          class: LinkTool,
          config: {
            endpoint: "/api/fetchUrl", // Mock endpoint
          },
        },
        image: {
          class: Image,
          config: {
            uploader: {
              uploadByFile(file: File) {
                return new Promise((resolve) => {
                  const reader = new FileReader();
                  reader.onloadend = () => {
                    resolve({
                      success: 1,
                      file: {
                        url: reader.result as string,
                      },
                    });
                  };
                  reader.readAsDataURL(file);
                });
              },
              uploadByUrl(url: string) {
                return Promise.resolve({
                  success: 1,
                  file: {
                    url: url,
                  },
                });
              },
            },
          },
        },
        embed: {
          class: Embed,
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
          class: Table,
          inlineToolbar: true,
          config: {
            rows: 2,
            cols: 3,
          },
        },
        underline: Underline,
      },
      onChange: async () => {
        if (onChange && editorRef.current) {
          const content = await editorRef.current.save();
          onChange(content);
        }
      },
      onReady: () => {
        if (editorRef.current) {
          new Undo({ editor: editorRef.current });
          new DragDrop(editorRef.current);
        }
      },
      minHeight: 300,
    });

    editorRef.current = editor;
    isInitialized.current = true;
  }, [data, holder, onChange]);

  useEffect(() => {
    if (typeof window !== "undefined" && !isInitialized.current) {
      initializeEditor();
    }

    return () => {
      if (editorRef.current && editorRef.current.destroy) {
        editorRef.current.destroy();
        isInitialized.current = false;
      }
    };
  }, [initializeEditor]);

  return (
    <div 
      className="prose prose-invert dark:prose-invert max-w-none"
      data-theme={theme}
    >
      <div id={holder} className="min-h-[300px]" />
    </div>
  );
}
