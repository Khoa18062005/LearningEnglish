import React, { useEffect, useState, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Highlight from '@tiptap/extension-highlight';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle, Color } from '@tiptap/extension-text-style';
import { trimSelectionRange } from '../features/reading-lists/components/ReadingPassageReader';

// Danh sách các màu chữ thông dụng
const TEXT_COLORS = [
  { label: 'Mặc định (Đen)', value: '#0f172a' },
  { label: 'Đỏ Crimson', value: '#dc2626' },
  { label: 'Xanh dương', value: '#2563eb' },
  { label: 'Xanh lá', value: '#16a34a' },
  { label: 'Cam đậm', value: '#ea580c' },
  { label: 'Tím', value: '#9333ea' },
  { label: 'Hổ phách', value: '#d97706' },
  { label: 'Xám', value: '#64748b' },
];

// Danh sách màu Highlight đa dạng cho học tập
const HIGHLIGHT_COLORS = [
  { label: 'Vàng pastel (Từ mới)', value: '#fef08a', textClass: 'text-amber-800' },
  { label: 'Xanh lá pastel (Bằng chứng)', value: '#bbf7d0', textClass: 'text-emerald-800' },
  { label: 'Xanh lam pastel (Ngữ pháp)', value: '#bae6fd', textClass: 'text-sky-800' },
  { label: 'Cam pastel (Lưu ý)', value: '#fed7aa', textClass: 'text-orange-800' },
  { label: 'Hồng pastel (Cạm bẫy)', value: '#fecdd3', textClass: 'text-rose-800' },
  { label: 'Tím pastel (Collocation)', value: '#e9d5ff', textClass: 'text-purple-800' },
];

export default function TipTapEditor({
  content = '',
  onChange,
  onSaveShortcut,
  placeholder = 'Nhập hoặc dán nội dung bài đọc, transcript nghe tại đây...',
  editable = true,
  minHeight = '180px',
  className = '',
}) {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showHighlightPicker, setShowHighlightPicker] = useState(false);
  const colorPickerRef = useRef(null);
  const highlightPickerRef = useRef(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2, 3],
        },
      }),
      Placeholder.configure({
        placeholder,
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
    editable,
    editorProps: {
      handleKeyDown: (view, event) => {
        if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
          if (onSaveShortcut) {
            event.preventDefault();
            onSaveShortcut();
            return true;
          }
        }
        return false;
      },
    },
    onUpdate: ({ editor: ed }) => {
      const html = ed.getHTML();
      const text = ed.getText();
      const words = text.trim() ? text.trim().split(/\s+/).filter(Boolean).length : 0;
      if (onChange) {
        onChange(html, words);
      }
    },
  });

  // Tự động đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (colorPickerRef.current && !colorPickerRef.current.contains(e.target)) {
        setShowColorPicker(false);
      }
      if (highlightPickerRef.current && !highlightPickerRef.current.contains(e.target)) {
        setShowHighlightPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Đồng bộ nội dung khi prop content thay đổi từ bên ngoài
  useEffect(() => {
    if (editor && content !== undefined) {
      const currentHtml = editor.getHTML();
      if (content !== currentHtml && (content || currentHtml !== '<p></p>')) {
        editor.commands.setContent(content || '', false);
      }
    }
  }, [content, editor]);

  if (!editor) {
    return (
      <div
        className="w-full bg-white rounded-xl border border-slate-200 p-4 animate-pulse text-xs text-slate-400"
        style={{ minHeight }}
      >
        Đang khởi tạo trình soạn thảo bài đọc...
      </div>
    );
  }

  const wordCount = editor.getText().trim()
    ? editor.getText().trim().split(/\s+/).filter(Boolean).length
    : 0;

  const currentColor = editor.getAttributes('textStyle').color || '#0f172a';

  return (
    <div
      className={`w-full bg-white rounded-xl border border-slate-200 shadow-2xs overflow-visible transition-all focus-within:border-crimson-primary focus-within:ring-4 focus-within:ring-crimson-primary/10 ${className}`}
    >
      {/* Toolbar */}
      {editable && (
        <div className="px-2.5 py-1.5 bg-slate-50/95 border-b border-slate-200/80 flex flex-wrap items-center gap-1 text-slate-600 select-none relative z-20">
          {/* Bold */}
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            disabled={!editor.can().chain().focus().toggleBold().run()}
            title="In đậm (Ctrl+B)"
            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors text-xs cursor-pointer ${
              editor.isActive('bold')
                ? 'bg-crimson-primary text-white font-bold shadow-2xs'
                : 'hover:bg-slate-200/70 hover:text-slate-900'
            }`}
          >
            <span className="material-symbols-outlined text-[17px]">format_bold</span>
          </button>

          {/* Italic */}
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            disabled={!editor.can().chain().focus().toggleItalic().run()}
            title="In nghiêng (Ctrl+I)"
            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors text-xs cursor-pointer ${
              editor.isActive('italic')
                ? 'bg-crimson-primary text-white font-bold shadow-2xs'
                : 'hover:bg-slate-200/70 hover:text-slate-900'
            }`}
          >
            <span className="material-symbols-outlined text-[17px]">format_italic</span>
          </button>

          {/* Strike */}
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleStrike().run()}
            disabled={!editor.can().chain().focus().toggleStrike().run()}
            title="Gạch ngang"
            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors text-xs cursor-pointer ${
              editor.isActive('strike')
                ? 'bg-crimson-primary text-white font-bold shadow-2xs'
                : 'hover:bg-slate-200/70 hover:text-slate-900'
            }`}
          >
            <span className="material-symbols-outlined text-[17px]">strikethrough_s</span>
          </button>

          {/* Đổi màu chữ (Text Color) */}
          <div className="relative" ref={colorPickerRef}>
            <button
              type="button"
              onClick={() => {
                setShowColorPicker(!showColorPicker);
                setShowHighlightPicker(false);
              }}
              title="Đổi màu chữ"
              className={`w-7 h-7 rounded-lg flex flex-col items-center justify-center transition-colors cursor-pointer ${
                showColorPicker
                  ? 'bg-slate-200 text-slate-900'
                  : 'hover:bg-slate-200/70 hover:text-slate-900'
              }`}
            >
              <span className="material-symbols-outlined text-[16px] leading-none">format_color_text</span>
              <span
                className="w-3.5 h-1 rounded-full mt-0.5"
                style={{ backgroundColor: currentColor }}
              />
            </button>

            {/* Dropdown bảng chọn màu chữ (chỉ các khối vuông màu nhỏ gọn) */}
            {showColorPicker && (
              <div className="absolute left-0 top-full mt-1.5 p-1.5 bg-white rounded-xl shadow-xl border border-slate-200 z-50 flex items-center gap-1 animate-in fade-in zoom-in-95 duration-150">
                {TEXT_COLORS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => {
                      editor.chain().focus().setColor(c.value).run();
                      setShowColorPicker(false);
                    }}
                    title={c.label}
                    className="w-6 h-6 rounded-md border border-slate-200 hover:scale-110 transition-transform cursor-pointer shadow-2xs flex items-center justify-center shrink-0"
                    style={{ backgroundColor: c.value }}
                  >
                    {currentColor.toLowerCase() === c.value.toLowerCase() && (
                      <span className="material-symbols-outlined text-white text-[12px] font-bold">check</span>
                    )}
                  </button>
                ))}

                <span className="w-px h-4 bg-slate-200 mx-0.5" />

                {/* Nút reset màu chữ về mặc định */}
                <button
                  type="button"
                  onClick={() => {
                    editor.chain().focus().unsetColor().run();
                    setShowColorPicker(false);
                  }}
                  title="Màu mặc định"
                  className="w-6 h-6 rounded-md border border-dashed border-slate-300 hover:border-slate-500 hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                >
                  <span className="material-symbols-outlined text-[15px]">format_color_reset</span>
                </button>
              </div>
            )}
          </div>

          <span className="w-px h-4 bg-slate-200 mx-1" />

          {/* Heading 2 */}
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            title="Tiêu đề đoạn (H2)"
            className={`px-1.5 h-7 rounded-lg flex items-center justify-center transition-colors text-[11px] font-bold cursor-pointer ${
              editor.isActive('heading', { level: 2 })
                ? 'bg-crimson-primary text-white shadow-2xs'
                : 'hover:bg-slate-200/70 hover:text-slate-900'
            }`}
          >
            H2
          </button>

          {/* Heading 3 */}
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            title="Tiêu đề phụ (H3)"
            className={`px-1.5 h-7 rounded-lg flex items-center justify-center transition-colors text-[11px] font-bold cursor-pointer ${
              editor.isActive('heading', { level: 3 })
                ? 'bg-crimson-primary text-white shadow-2xs'
                : 'hover:bg-slate-200/70 hover:text-slate-900'
            }`}
          >
            H3
          </button>

          <span className="w-px h-4 bg-slate-200 mx-1" />

          {/* Căn lề: Căn trái */}
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            title="Căn lề trái"
            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors text-xs cursor-pointer ${
              editor.isActive({ textAlign: 'left' })
                ? 'bg-crimson-primary text-white font-bold shadow-2xs'
                : 'hover:bg-slate-200/70 hover:text-slate-900'
            }`}
          >
            <span className="material-symbols-outlined text-[17px]">format_align_left</span>
          </button>

          {/* Căn lề: Căn giữa */}
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            title="Căn giữa"
            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors text-xs cursor-pointer ${
              editor.isActive({ textAlign: 'center' })
                ? 'bg-crimson-primary text-white font-bold shadow-2xs'
                : 'hover:bg-slate-200/70 hover:text-slate-900'
            }`}
          >
            <span className="material-symbols-outlined text-[17px]">format_align_center</span>
          </button>

          {/* Căn lề: Căn phải */}
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            title="Căn lề phải"
            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors text-xs cursor-pointer ${
              editor.isActive({ textAlign: 'right' })
                ? 'bg-crimson-primary text-white font-bold shadow-2xs'
                : 'hover:bg-slate-200/70 hover:text-slate-900'
            }`}
          >
            <span className="material-symbols-outlined text-[17px]">format_align_right</span>
          </button>

          {/* Căn lề: Căn đều 2 bên (Justify) */}
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign('justify').run()}
            title="Căn đều 2 bên (Justify)"
            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors text-xs cursor-pointer ${
              editor.isActive({ textAlign: 'justify' })
                ? 'bg-crimson-primary text-white font-bold shadow-2xs'
                : 'hover:bg-slate-200/70 hover:text-slate-900'
            }`}
          >
            <span className="material-symbols-outlined text-[17px]">format_align_justify</span>
          </button>

          <span className="w-px h-4 bg-slate-200 mx-1" />

          {/* Bullet List */}
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            title="Danh sách gạch đầu dòng"
            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors text-xs cursor-pointer ${
              editor.isActive('bulletList')
                ? 'bg-crimson-primary text-white font-bold shadow-2xs'
                : 'hover:bg-slate-200/70 hover:text-slate-900'
            }`}
          >
            <span className="material-symbols-outlined text-[17px]">format_list_bulleted</span>
          </button>

          {/* Ordered List */}
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            title="Danh sách số thứ tự"
            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors text-xs cursor-pointer ${
              editor.isActive('orderedList')
                ? 'bg-crimson-primary text-white font-bold shadow-2xs'
                : 'hover:bg-slate-200/70 hover:text-slate-900'
            }`}
          >
            <span className="material-symbols-outlined text-[17px]">format_list_numbered</span>
          </button>

          {/* Blockquote */}
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            title="Trích dẫn đoạn văn (Quote)"
            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors text-xs cursor-pointer ${
              editor.isActive('blockquote')
                ? 'bg-crimson-primary text-white font-bold shadow-2xs'
                : 'hover:bg-slate-200/70 hover:text-slate-900'
            }`}
          >
            <span className="material-symbols-outlined text-[17px]">format_quote</span>
          </button>

          {/* Divider */}
          <button
            type="button"
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            title="Thước kẻ ngăn cách đoạn"
            className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-slate-200/70 hover:text-slate-900 transition-colors text-xs cursor-pointer"
          >
            <span className="material-symbols-outlined text-[17px]">horizontal_rule</span>
          </button>

          <span className="w-px h-4 bg-slate-200 mx-1" />

          {/* Chọn màu Highlight (Đưa xuống cuối thanh công cụ) */}
          <div className="relative" ref={highlightPickerRef}>
            <button
              type="button"
              onClick={() => {
                setShowHighlightPicker(!showHighlightPicker);
                setShowColorPicker(false);
              }}
              title="Tô sáng / Highlight nhiều màu"
              className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors text-xs cursor-pointer ${
                editor.isActive('highlight') || showHighlightPicker
                  ? 'bg-slate-200 text-slate-900 font-bold shadow-2xs'
                  : 'hover:bg-slate-200/70 hover:text-slate-900'
              }`}
            >
              <span className="material-symbols-outlined text-[17px]">ink_highlighter</span>
            </button>

            {/* Dropdown bảng màu Highlight (chỉ các khối vuông màu nhỏ gọn) */}
            {showHighlightPicker && (
              <div className="absolute left-0 sm:right-0 sm:left-auto top-full mt-1.5 p-1.5 bg-white rounded-xl shadow-xl border border-slate-200 z-50 flex items-center gap-1 animate-in fade-in zoom-in-95 duration-150">
                {HIGHLIGHT_COLORS.map((h) => (
                  <button
                    key={h.value}
                    type="button"
                    onClick={() => {
                      const { from, to, empty } = editor.state.selection;
                      if (!empty && from !== to) {
                        const trimmed = trimSelectionRange(editor.state.doc, from, to);
                        if (trimmed.isValid) {
                          editor.chain().focus().setTextSelection({ from: trimmed.from, to: trimmed.to }).setHighlight({ color: h.value }).run();
                        }
                      } else {
                        editor.chain().focus().setHighlight({ color: h.value }).run();
                      }
                      setShowHighlightPicker(false);
                    }}
                    title={h.label}
                    className="w-6 h-6 rounded-md border border-black/10 hover:scale-110 transition-transform cursor-pointer shadow-2xs shrink-0"
                    style={{ backgroundColor: h.value }}
                  />
                ))}

                <span className="w-px h-4 bg-slate-200 mx-0.5" />

                {/* Nút Xóa Highlight */}
                <button
                  type="button"
                  onClick={() => {
                    editor.chain().focus().unsetHighlight().run();
                    setShowHighlightPicker(false);
                  }}
                  title="Xóa Highlight"
                  className="w-6 h-6 rounded-md border border-dashed border-slate-300 hover:border-rose-400 hover:bg-rose-50 text-slate-400 hover:text-rose-600 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                >
                  <span className="material-symbols-outlined text-[15px]">format_color_reset</span>
                </button>
              </div>
            )}
          </div>

          <div className="ml-auto flex items-center gap-1">
            {/* Undo */}
            <button
              type="button"
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().chain().focus().undo().run()}
              title="Hoàn tác (Ctrl+Z)"
              className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-slate-200/70 hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-xs cursor-pointer"
            >
              <span className="material-symbols-outlined text-[17px]">undo</span>
            </button>

            {/* Redo */}
            <button
              type="button"
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().chain().focus().redo().run()}
              title="Làm lại (Ctrl+Y)"
              className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-slate-200/70 hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-xs cursor-pointer"
            >
              <span className="material-symbols-outlined text-[17px]">redo</span>
            </button>

            {/* Word count badge */}
            <span className="ml-1 px-2 py-0.5 rounded-md bg-slate-200/70 text-[10.5px] font-semibold text-slate-600">
              {wordCount} từ
            </span>
          </div>
        </div>
      )}

      {/* Editor Content Area */}
      <div className="p-3.5 bg-white text-xs text-text-high-contrast leading-relaxed overflow-y-auto custom-scrollbar">
        <EditorContent
          editor={editor}
          className="tiptap-content outline-none focus:outline-none"
          style={{ minHeight }}
        />
      </div>
    </div>
  );
}
