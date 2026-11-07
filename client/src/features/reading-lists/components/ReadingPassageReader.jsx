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

/**
 * Tự động cắt tỉa khoảng trắng thừa ở đầu và cuối selection
 * để tránh việc highlight bị dính khoảng trắng giữa các từ.
 */
export function trimSelectionRange(doc, from, to) {
  let start = from;
  let end = to;

  while (start < end) {
    const char = doc.textBetween(start, start + 1, '');
    if (char && /^\s$/.test(char)) {
      start++;
    } else {
      break;
    }
  }

  while (end > start) {
    const char = doc.textBetween(end - 1, end, '');
    if (char && /^\s$/.test(char)) {
      end--;
    } else {
      break;
    }
  }

  return { from: start, to: end, isValid: start < end };
}

/**
 * Tìm phạm vi [from, to] của khối highlight tại một vị trí doc pos.
 * Phục vụ tính năng double click để xóa nhanh toàn bộ khối highlight.
 */
export function getHighlightRangeAtPos(doc, pos) {
  if (!doc || pos < 0 || pos > doc.content.size) return null;

  let $pos = doc.resolve(pos);
  let mark = $pos.marks().find((m) => m.type.name === 'highlight');

  // Nếu vị trí rơi vào boundary ở cuối mark, thử lùi lại 1 vị trí
  if (!mark && pos > 0) {
    const $prev = doc.resolve(pos - 1);
    mark = $prev.marks().find((m) => m.type.name === 'highlight');
    if (mark) {
      $pos = $prev;
    }
  }

  if (!mark) return null;

  const parent = $pos.parent;
  const start = $pos.start();
  let from = null;
  let to = null;

  let currentPos = start;
  for (let i = 0; i < parent.childCount; i++) {
    const child = parent.child(i);
    const childStart = currentPos;
    const childEnd = currentPos + child.nodeSize;

    const hasMark = child.marks.some((m) => m.type.name === 'highlight');
    if (hasMark) {
      if (childStart <= $pos.pos && $pos.pos <= childEnd) {
        if (from === null) from = childStart;
        to = childEnd;
      } else if (from !== null && childStart === to) {
        to = childEnd;
      }
    } else {
      if (from !== null) break;
    }
    currentPos = childEnd;
  }

  // Mở rộng về phía trước nếu khối highlight trải dài qua nhiều node con liền kề
  if (from !== null) {
    let checkPos = start;
    let expandedFrom = from;
    for (let i = 0; i < parent.childCount; i++) {
      const child = parent.child(i);
      const childStart = checkPos;
      const childEnd = checkPos + child.nodeSize;
      if (child.marks.some((m) => m.type.name === 'highlight')) {
        if (childEnd === expandedFrom) {
          expandedFrom = childStart;
        }
      }
      checkPos = childEnd;
    }
    from = expandedFrom;
  }

  return from !== null && to !== null ? { from, to } : null;
}

export default function ReadingPassageReader({
  content = '',
  quickHighlightColor = '#fef08a',
  isQuickHighlightActive = false,
  onSaveHighlight,
}) {
  const containerRef = useRef(null);
  const [bubblePos, setBubblePos] = useState(null);
  const onSaveHighlightRef = useRef(onSaveHighlight);

  useEffect(() => {
    onSaveHighlightRef.current = onSaveHighlight;
  }, [onSaveHighlight]);

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
    editorProps: {
      handleDoubleClick: (view, pos, event) => {
        const highlightRange = getHighlightRangeAtPos(view.state.doc, pos);
        if (highlightRange) {
          event.preventDefault();
          event.stopPropagation();
          handleRemoveHighlightAt(event, pos);
          return true;
        }
        return false;
      },
    },
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
    let from = fromPos !== undefined ? fromPos : bubblePos?.from;
    let to = toPos !== undefined ? toPos : bubblePos?.to;
    if (from === undefined || to === undefined) return;

    // Tự động cắt tỉa khoảng trắng ở đầu và cuối selection
    if (color) {
      const trimmed = trimSelectionRange(editor.state.doc, from, to);
      if (!trimmed.isValid) {
        setBubblePos(null);
        window.getSelection()?.removeAllRanges();
        return;
      }
      from = trimmed.from;
      to = trimmed.to;
    }

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

    if (onSaveHighlightRef.current) {
      await onSaveHighlightRef.current(updatedHtml, updatedWordCount);
    }
  };

  /**
   * Xóa highlight nhanh khi double-click vào đoạn văn bản đã highlight
   */
  const handleRemoveHighlightAt = async (e, customPos) => {
    if (!editor) return;

    let targetPos = customPos;
    if (targetPos === null || targetPos === undefined) {
      const targetElement = e?.target ? (e.target.nodeType === 3 ? e.target.parentElement : e.target) : null;
      const markEl = targetElement?.closest ? targetElement.closest('mark') : null;

      if (markEl && editor.view) {
        try {
          targetPos = editor.view.posAtDOM(markEl, 0);
        } catch {
          // ignore
        }
      }

      if ((targetPos === null || targetPos === undefined) && editor.view && e?.clientX !== undefined && e?.clientY !== undefined) {
        const coords = editor.view.posAtCoords({ left: e.clientX, top: e.clientY });
        targetPos = coords?.pos;
      }

      if (targetPos === null || targetPos === undefined) {
        targetPos = editor.state.selection.from;
      }
    }

    const highlightRange = getHighlightRangeAtPos(editor.state.doc, targetPos);
    if (!highlightRange) return;

    if (e?.preventDefault) e.preventDefault();
    if (e?.stopPropagation) e.stopPropagation();

    setBubblePos(null);
    window.getSelection()?.removeAllRanges();

    editor.setEditable(true);
    editor.chain().setTextSelection({ from: highlightRange.from, to: highlightRange.to }).unsetHighlight().run();
    const updatedHtml = editor.getHTML();
    const updatedWordCount = editor.getText().trim().split(/\s+/).filter(Boolean).length;
    editor.setEditable(false);

    window.getSelection()?.removeAllRanges();

    if (onSaveHighlightRef.current) {
      await onSaveHighlightRef.current(updatedHtml, updatedWordCount);
    }
  };

  const handleDoubleClick = (e) => {
    handleRemoveHighlightAt(e);
  };

  const handleMouseUp = (e) => {
    if (!editor) return;

    // Nếu là click thứ 2 trở lên của double click và đang click vào 1 thẻ highlight:
    // Bỏ qua mouseUp để handleDoubleClick xử lý xóa highlight (tránh hiện bubble menu hay re-highlight)
    if (e?.detail >= 2) {
      const targetElement = e.target.nodeType === 3 ? e.target.parentElement : e.target;
      if (targetElement?.closest && targetElement.closest('mark')) {
        setBubblePos(null);
        return;
      }
    }

    const { from, to, empty } = editor.state.selection;
    if (empty || from === to) {
      setBubblePos(null);
      return;
    }

    // Tự động cắt tỉa khoảng trắng ở đầu và cuối selection
    const trimmed = trimSelectionRange(editor.state.doc, from, to);
    if (!trimmed.isValid) {
      setBubblePos(null);
      return;
    }

    const validFrom = trimmed.from;
    const validTo = trimmed.to;

    // Nếu chế độ Quick Highlight đang BẬT: áp dụng ngay màu bút dạ quang đã chọn!
    if (isQuickHighlightActive && quickHighlightColor) {
      applyHighlight(quickHighlightColor, validFrom, validTo);
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
        setBubblePos({ top, left, from: validFrom, to: validTo });
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
      onDoubleClick={handleDoubleClick}
      className={`relative tiptap-content tiptap-reader text-xs sm:text-sm text-text-body leading-relaxed max-w-none font-normal select-text ${
        isQuickHighlightActive ? 'cursor-text' : ''
      }`}
    >
      <style>{`
        .tiptap-reader mark {
          border-radius: 3px;
          padding: 1px 2px;
          cursor: pointer;
          transition: filter 0.15s ease;
        }
        .tiptap-reader mark:hover {
          filter: brightness(0.92);
        }
      `}</style>

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
