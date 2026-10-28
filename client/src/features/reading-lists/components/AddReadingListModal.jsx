import React, { useState, useEffect } from 'react';

export default function AddReadingListModal({
  isOpen,
  onClose,
  onSave,
  existingLists = [],
  initialData = null,
}) {
  const [code, setCode] = useState('');
  const [title, setTitle] = useState('');
  const [sourceReference, setSourceReference] = useState('');
  const [passage, setPassage] = useState('');
  const [note, setNote] = useState('');
  const [showPassageField, setShowPassageField] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Auto-generate suggested list code on open or populate with initialData
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setCode(initialData.code || initialData.shortTitle || '');
        setTitle(initialData.title || '');
        setSourceReference(initialData.sourceReference || '');
        setPassage(initialData.passage || '');
        setNote(initialData.note || '');
        setShowPassageField(Boolean(initialData.passage));
      } else {
        const nextNum = existingLists.length + 1;
        const formattedNum = nextNum < 10 ? `0${nextNum}` : `${nextNum}`;
        setCode(`LIST ${formattedNum}`);
        setTitle('');
        setSourceReference('');
        setPassage('');
        setNote('');
        setShowPassageField(false);
      }
      setErrorMessage('');
      setIsSubmitting(false);
    }
  }, [isOpen, existingLists.length, initialData]);

  // Keyboard shortcut listener (ESC to close, Cmd/Ctrl+Enter to save)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        handleSubmit(e);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, code, title, sourceReference, passage, note]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();

    if (!title.trim()) {
      setErrorMessage('Vui lòng nhập tiêu đề hoặc tên danh sách bài đọc.');
      return;
    }

    setErrorMessage('');
    setIsSubmitting(true);

    try {
      const payload = {
        code: code.trim(),
        title: title.trim(),
        sourceReference: sourceReference.trim() || null,
        passage: passage.trim() || null,
        note: note.trim() || null,
      };

      await onSave(payload, initialData?.id);
      onClose();
    } catch (err) {
      console.error('Lỗi khi lưu danh sách bài đọc:', err);
      setErrorMessage(initialData ? 'Có lỗi xảy ra khi cập nhật danh sách bài đọc. Vui lòng thử lại.' : 'Có lỗi xảy ra khi tạo danh sách bài đọc. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-[680px] bg-white rounded-2xl sm:rounded-3xl shadow-[0_25px_60px_-15px_rgba(15,23,42,0.3)] flex flex-col my-auto max-h-[92vh] overflow-hidden border border-slate-200/90 ring-1 ring-black/5 animate-in zoom-in-95 duration-150">
        
        {/* Top Gradient Hairline Accent */}
        <div className="h-1.5 w-full bg-gradient-to-r from-crimson-dark via-crimson-primary to-rose-400 shrink-0"></div>

        {/* Modal Header */}
        <div className="px-6 sm:px-8 pt-5 pb-4 flex items-center justify-between border-b border-slate-100 bg-white shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-rose-50 to-red-100/60 border border-red-200/60 flex items-center justify-center text-crimson-primary shadow-xs shrink-0">
              <span className="material-symbols-outlined text-[24px]">article</span>
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="font-headline text-lg sm:text-xl font-bold text-text-high-contrast tracking-tight">
                  {initialData ? 'Chỉnh Sửa Danh Sách Bài Đọc' : 'Tạo Danh Sách Bài Đọc Mới'}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-surface-crimson-soft text-crimson-dark text-[10px] font-extrabold uppercase tracking-wider border border-border-crimson-tint/60">
                  Reading Note
                </span>
              </div>
              <p className="text-xs text-text-muted mt-0.5">
                Quản lý và gom nhóm từ vựng theo bài đọc Cambridge, sách báo hoặc chủ đề riêng.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 text-[11px] font-semibold text-slate-400 bg-slate-100 rounded-md border border-slate-200">
              ESC
            </kbd>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              type="button"
              title="Đóng cửa sổ (ESC)"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit} className="px-6 sm:px-8 py-5 overflow-y-auto flex flex-col gap-4 bg-slate-50/70">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2 animate-in fade-in duration-150">
              <span className="material-symbols-outlined text-[18px] text-crimson-primary">error</span>
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Code and Title Row */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5">
            {/* List Code (e.g. LIST 01) */}
            <div className="sm:col-span-4 flex flex-col gap-1.5">
              <label className="text-xs font-bold text-text-high-contrast flex items-center gap-1">
                <span>Mã danh sách</span>
                <span className="text-[10px] text-text-muted font-normal">(Viết tắt)</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="VD: LIST 01"
                  className="w-full h-11 px-3.5 bg-white rounded-xl text-sm font-bold text-crimson-primary border border-slate-200 focus:border-crimson-primary focus:ring-4 focus:ring-crimson-primary/10 transition-all outline-none"
                />
              </div>
              <span className="text-[10px] text-text-muted">
                Hiển thị ngắn gọn trên thanh Sidebar
              </span>
            </div>

            {/* List Title */}
            <div className="sm:col-span-8 flex flex-col gap-1.5">
              <label className="text-xs font-bold text-text-high-contrast flex items-center justify-between">
                <span>
                  Tiêu đề danh sách / Bài đọc <span className="text-crimson-primary">*</span>
                </span>
                <span className="text-[10px] text-text-muted font-normal">Bắt buộc</span>
              </label>
              <input
                type="text"
                autoFocus
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="VD: Cambridge 18 - Test 1 - Passage 2: Urban Agriculture"
                className="w-full h-11 px-3.5 bg-white rounded-xl text-sm font-semibold text-text-high-contrast border border-slate-200 focus:border-crimson-primary focus:ring-4 focus:ring-crimson-primary/10 transition-all outline-none"
              />
              <span className="text-[10px] text-text-muted">
                Tên đầy đủ của bài đọc hoặc chủ đề từ vựng
              </span>
            </div>
          </div>

          {/* Source Reference */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-text-high-contrast flex items-center justify-between">
              <span>Nguồn tài liệu (Source Reference)</span>
              <span className="text-[10px] text-text-muted font-normal">Tùy chọn</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={sourceReference}
                onChange={(e) => setSourceReference(e.target.value)}
                placeholder="VD: Cambridge IELTS 18, The Economist, BBC News, TED Talks..."
                className="w-full h-10 px-3.5 bg-white rounded-xl text-xs text-text-high-contrast border border-slate-200 focus:border-crimson-primary focus:ring-4 focus:ring-crimson-primary/10 transition-all outline-none"
              />
            </div>
          </div>

          {/* General Notes */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-text-high-contrast flex items-center justify-between">
              <span>Ghi chú bài đọc / Mục tiêu (Notes)</span>
              <span className="text-[10px] text-text-muted font-normal">Tùy chọn</span>
            </label>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="VD: Tập trung vào từ vựng học thuật Band 7.5+, lưu ý các từ đồng nghĩa hay xuất hiện trong câu hỏi Matching Headings..."
              className="w-full p-3 bg-white rounded-xl text-xs text-text-high-contrast border border-slate-200 focus:border-crimson-primary focus:ring-4 focus:ring-crimson-primary/10 transition-all outline-none resize-none leading-relaxed"
            />
          </div>

          {/* Reading Passage Toggle Button */}
          <div className="pt-1 flex flex-col gap-2">
            <button
              type="button"
              onClick={() => setShowPassageField(!showPassageField)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-crimson-primary hover:text-crimson-dark transition-colors self-start"
            >
              <span className="material-symbols-outlined text-[18px]">
                {showPassageField ? 'expand_less' : 'add_circle'}
              </span>
              <span>
                {showPassageField ? 'Ẩn đoạn văn bài đọc' : 'Thêm nội dung đoạn văn bài đọc (Reading Passage)'}
              </span>
            </button>

            {showPassageField && (
              <div className="flex flex-col gap-1.5 animate-in fade-in duration-200">
                <textarea
                  rows={5}
                  value={passage}
                  onChange={(e) => setPassage(e.target.value)}
                  placeholder="Dán toàn bộ hoặc trích đoạn nội dung bài đọc tiếng Anh vào đây để đối chiếu ngữ cảnh lúc học từ vựng..."
                  className="w-full p-3 bg-white rounded-xl text-xs text-text-high-contrast border border-slate-200 focus:border-crimson-primary focus:ring-4 focus:ring-crimson-primary/10 transition-all outline-none resize-y font-normal leading-relaxed"
                />
                <span className="text-[10px] text-text-muted">
                  Đoạn văn này sẽ được hiển thị trong thẻ xem chi tiết bài đọc.
                </span>
              </div>
            )}
          </div>
        </form>

        {/* Modal Footer */}
        <div className="px-6 sm:px-8 py-3.5 border-t border-slate-100 bg-white flex items-center justify-between shrink-0">
          <div className="text-[11px] text-text-muted hidden sm:block">
            Mẹo: Nhấn <kbd className="px-1.5 py-0.5 bg-slate-100 rounded text-[10px] font-bold border border-slate-200">Ctrl+Enter</kbd> để tạo nhanh
          </div>

          <div className="flex items-center gap-2.5 ml-auto">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-text-muted hover:text-text-high-contrast hover:bg-slate-100 transition-colors disabled:opacity-50"
            >
              Hủy bỏ
            </button>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || !title.trim()}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-crimson-primary hover:bg-crimson-dark text-white text-xs font-bold transition-all shadow-sm shadow-red-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>{initialData ? 'Đang lưu...' : 'Đang tạo...'}</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[16px]">{initialData ? 'save' : 'add'}</span>
                  <span>{initialData ? 'Lưu Thay Đổi' : 'Tạo Danh Sách Mới'}</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
