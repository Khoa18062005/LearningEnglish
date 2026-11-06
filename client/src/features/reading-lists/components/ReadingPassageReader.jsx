import React, { useEffect, useState, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Highlight from '@tiptap/extension-highlight';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle, Color } from '@tiptap/extension-text-style';

const HIGHLIGHT_SWATCHES = [
  { label: 'Vàng (Từ mới)', value: '#fef08a' },
  { label: 'Xanh lá (Bằng chứng)', value: '#bbf7d0' },
  { label: 'Xanh lam (Ngữ pháp)', value: '#bae6fd' },
  { label: 'Cam (Lưu ý)', value: '#fed7aa' },
  { label: 'Hồng (Cạm bẫy)', value: '#fecdd3' },
  { label: 'Tím (Collocation)', value: '#e9d5ff' },
];

export default function ReadingPassageReader({
  content = '',
  quickHighlightColor = '#fef08a',
  isQuickHighlightActive = false,
  onSaveHighlight,
}) {
  const containerRef = useRef(null);
  const [bubblePos, setBubblePos] = useState(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Highlight.configure({
        multicolor: true,
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
        alignments: ['left', 'center', 'right', 'justify'],
      }),
      TextStyle,
      Color,
    ],
    content: content || '',
    editable: false,
  });

  // Đồng bộ nội dung khi content thay đổi từ bên ngoài
  useEffect(() => {
    if (editor && content !== undefined) {
      const currentHtml = editor.getHTML();
      if (content !== currentHtml && (content || currentHtml !== '<p></p>')) {
        editor.commands.setContent(content || '', false);
      }
    }
  }, [content, editor]);

  // Đóng bubble menu khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setBubblePos(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const applyHighlight = async (color, fromPos, toPos) => {
    if (!editor) return;
    const from = fromPos !== undefined ? fromPos : bubblePos?.from;
    const to = toPos !== undefined ? toPos : bubblePos?.to;
    if (from === undefined || to === undefined) return;

    setBubblePos(null);
    editor.setEditable(true);
    if (color) {
      editor.chain().setTextSelection({ from, to }).setHighlight({ color }).run();
    } else {
      editor.chain().setTextSelection({ from, to }).unsetHighlight().run();
    }
    const updatedHtml = editor.getHTML();
    const updatedWordCount = editor.getText().trim().split(/\s+/).filter(Boolean).length;
    editor.setEditable(false);

    window.getSelection()?.removeAllRanges();

    if (onSaveHighlight) {
      await onSaveHighlight(updatedHtml, updatedWordCount);
    }
  };

  const handleMouseUp = () => {
    if (!editor) return;
    const { from, to, empty } = editor.state.selection;
    if (empty || from === to) {
      setBubblePos(null);
      return;
    }

    // Nếu chế độ Quick Highlight đang BẬT: áp dụng ngay màu bút dạ quang đã chọn!
    if (isQuickHighlightActive && quickHighlightColor) {
      applyHighlight(quickHighlightColor, from, to);
      return;
    }

    // Ngược lại: Hiển thị Floating Bubble Menu ngay trên đoạn text vừa bôi đen
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && !sel.isCollapsed) {
      const range = sel.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      const containerRect = containerRef.current?.getBoundingClientRect();
      if (containerRect) {
        const top = Math.max(0, rect.top - containerRect.top - 46);
        const left = Math.max(10, Math.min(containerRect.width - 240, rect.left - containerRect.left + rect.width / 2 - 110));
        setBubblePos({ top, left, from, to });
      }
    }
  };

  if (!editor) {
    return (
      <div className="text-xs sm:text-sm text-text-body leading-relaxed whitespace-pre-wrap font-normal">
        {content}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onMouseUp={handleMouseUp}
      className={`relative tiptap-content text-xs sm:text-sm text-text-body leading-relaxed max-w-none font-normal select-text ${
        isQuickHighlightActive ? 'cursor-text' : ''
      }`}
    >
      {/* Floating Highlight Bubble Menu khi bôi đen text */}
      {bubblePos && (
        <div
          style={{ top: `${bubblePos.top}px`, left: `${bubblePos.left}px` }}
          className="absolute z-50 p-1 bg-white/95 backdrop-blur-md rounded-xl shadow-xl border border-slate-200/90 flex items-center gap-1 animate-in fade-in zoom-in-95 duration-150 select-none ring-1 ring-black/5"
        >
          <span className="material-symbols-outlined text-[15px] text-slate-400 pl-1">
            ink_highlighter
          </span>

          {HIGHLIGHT_SWATCHES.map((h) => (
            <button
              key={h.value}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault(); // Giữ selection
                applyHighlight(h.value);
              }}
              title={h.label}
              className="w-5 h-5 rounded-md border border-black/10 hover:scale-125 transition-transform cursor-pointer shadow-2xs shrink-0"
              style={{ backgroundColor: h.value }}
            />
          ))}

          <span className="w-px h-3.5 bg-slate-200 mx-0.5" />

          {/* Nút Xóa Highlight */}
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              applyHighlight(null);
            }}
            title="Xóa Highlight đoạn này"
            className="w-5 h-5 rounded-md border border-dashed border-slate-300 hover:border-rose-400 hover:bg-rose-50 text-slate-400 hover:text-rose-600 flex items-center justify-center transition-colors cursor-pointer shrink-0"
          >
            <span className="material-symbols-outlined text-[13px]">format_color_reset</span>
          </button>
        </div>
      )}

      {/* Nội dung bài đọc (Render qua ProseMirror TipTap view) */}
      <EditorContent editor={editor} className="outline-none focus:outline-none" />
    </div>
  );
}
