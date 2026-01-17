
'use client';

import { useEffect, useRef } from 'react';
import EditorJS, { OutputData } from '@editorjs/editorjs';
// @ts-ignore
import Header from '@editorjs/header';
// @ts-ignore
import List from '@editorjs/list';
// @ts-ignore
import Quote from '@editorjs/quote';
// @ts-ignore
import Code from '@editorjs/code';
// @ts-ignore
import Delimiter from '@editorjs/delimiter';
// @ts-ignore
import Warning from '@editorjs/warning';
// @ts-ignore
import Paragraph from '@editorjs/paragraph';

interface EditorProps {
  data?: OutputData;
  onChange: (data: OutputData) => void;
  holder: string;
}

export default function Editor({ data, onChange, holder }: EditorProps) {
  const ref = useRef<EditorJS | null>(null);

  useEffect(() => {
    if (!ref.current) {
      const editor = new EditorJS({
        holder: holder,
        tools: {
          header: {
            class: Header as any,
            inlineToolbar: true,
            config: {
              placeholder: 'Enter a header',
              levels: [2, 3],
              defaultLevel: 2
            }
          },
          list: {
            class: List as any,
            inlineToolbar: true
          },
          quote: {
            class: Quote as any,
            inlineToolbar: true,
            config: {
              quotePlaceholder: 'Enter a quote',
              captionPlaceholder: 'Quote\'s author',
            },
          },
          code: Code as any,
          delimiter: Delimiter as any,
          warning: Warning as any,
          paragraph: {
            class: Paragraph as any,
            inlineToolbar: true,
          }
        },
        data: data || { blocks: [] },
        async onChange(api, event) {
          const data = await api.saver.save();
          onChange(data);
        },
        placeholder: 'Начните писать или нажмите Tab для выбора инструмента',
      });
      ref.current = editor;
    }

    return () => {
      if (ref.current && ref.current.destroy) {
        ref.current.destroy();
        ref.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount - Editor.js should only initialize once

  return <div id={holder} className="prose prose-sm dark:prose-invert max-w-none min-h-[300px] bg-background rounded-md border p-4" />;
}
