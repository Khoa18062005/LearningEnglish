import React, { useState, useEffect, useRef } from 'react';

export default function AddReadingListModal({
  isOpen,
  onClose,
  onSave,
  existingLists = [],
  existingFolders = [],
  defaultFolderId = null,
  onOpenCreateFolder = null,
  initialData = null,
}) {
  const [code, setCode] = useState('');
  const [title, setTitle] = useState('');
  const [folderId, setFolderId] = useState(defaultFolderId || initialData?.folderId || '');
  const [isFolderDropdownOpen, setIsFolderDropdownOpen] = useState(false);
  const folderDropdownRef = useRef(null);
  const [sourceReference, setSourceReference] = useState('');
  const [passage, setPassage] = useState('');
  const [note, setNote] = useState('');
  const [showPassageField, setShowPassageField] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    if (!isFolderDropdownOpen) return;
    const handleClickOutside = (e) => {
      if (folderDropdownRef.current && !folderDropdownRef.current.contains(e.target)) {
        setIsFolderDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isFolderDropdownOpen]);

  const selectedFolder = existingFolders.find(
    (f) => String(f.id) === String(folderId)
  );

  // Auto-generate suggested list code on open or populate with initialData
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setCode(initialData.code || initialData.shortTitle || '');
        setTitle(initialData.title || '');
        setFolderId(initialData.folderId ? String(initialData.folderId) : (defaultFolderId ? String(defaultFolderId) : ''));
        setSourceReference(initialData.sourceReference || '');
        setPassage(initialData.passage || '');
        setNote(initialData.note || '');
        setShowPassageField(Boolean(initialData.passage));
      } else {
        // Tự động tìm mã LIST XX tiếp theo chưa từng được sử dụng
        const existingCodes = new Set(
          existingLists
            .map((l) => (l.code || l.shortTitle || '').trim().toUpperCase())
            .filter(Boolean)
        );
        let candidateNum = 1;
        let formatted = candidateNum < 10 ? `LIST 0${candidateNum}` : `LIST ${candidateNum}`;
        while (existingCodes.has(formatted.toUpperCase())) {
          candidateNum++;
          formatted = candidateNum < 10 ? `LIST 0${candidateNum}` : `LIST ${candidateNum}`;
        }
        setCode(formatted);
        setTitle('');
        setFolderId(defaultFolderId ? String(defaultFolderId) : '');
        setSourceReference('');
        setPassage('');
        setNote('');
        setShowPassageField(false);
      }
      setErrorMessage('');
      setIsSubmitting(false);
    }
  }, [isOpen, initialData, defaultFolderId]);

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

  // Kiểm tra trùng mã danh sách theo thời gian thực (không phân biệt hoa thường)
  const trimmedCode = (code || '').trim().toUpperCase();
  const isCodeDuplicate = Boolean(
    trimmedCode &&
      existingLists.some((list) => {
        if (initialData && String(list.id) === String(initialData.id)) {
          return false;
        }
        const otherCode = (list.code || list.shortTitle || '').trim().toUpperCase();
        return otherCode === trimmedCode;
      })
  );

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();

    if (!code.trim()) {
      setErrorMessage('Vui lòng nhập mã danh sách (ví dụ: LIST 01, CAM 18).');
      return;
    }

    if (isCodeDuplicate) {
      setErrorMessage(`Mã danh sách "${code.trim()}" đã được sử dụng. Vui lòng chọn một mã khác!`);
      return;
    }

    if (!title.trim()) {
      setErrorMessage('Vui lòng nhập tiêu đề hoặc tên danh sách từ vựng.');
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
        folderId: folderId ? Number(folderId) : null,
      };

      await onSave(payload, initialData?.id);
      onClose();
    } catch (err) {
      console.error('Lỗi khi lưu danh sách bài đọc:', err);
      setErrorMessage(initialData ? 'Có lỗi xảy ra khi cập nhật danh sách từ vựng. Vui lòng thử lại.' : 'Có lỗi xảy ra khi tạo danh sách từ vựng. Vui lòng thử lại.');
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
              <h2 className="font-headline text-lg sm:text-xl font-bold text-text-high-contrast tracking-tight">
                {initialData ? 'Chỉnh Sửa Danh Sách Từ Vựng' : 'Tạo Danh Sách Từ Vựng Mới'}
              </h2>
              <p className="text-xs text-text-muted mt-0.5">
                Quản lý và gom nhóm từ vựng theo bài đọc, bài nghe, tạp chí hoặc chủ đề riêng.
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

          {/* Thư mục / Bộ đề (Folder / Danh mục cha) */}
          <div className="flex flex-col gap-1.5" ref={folderDropdownRef}>
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-text-high-contrast flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-amber-500">folder</span>
                <span>Thư mục / Bộ đề (Danh mục cha)</span>
              </label>
              {onOpenCreateFolder && (
                <button
                  type="button"
                  onClick={onOpenCreateFolder}
                  className="text-[11px] font-bold text-crimson-primary hover:text-crimson-dark flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <span className="material-symbols-outlined text-[14px]">add_circle</span>
                  <span>Tạo thư mục mới</span>
                </button>
              )}
            </div>

            {/* Custom Styled Dropdown Selector */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsFolderDropdownOpen((prev) => !prev)}
                className={`w-full h-11 px-3.5 bg-white rounded-xl text-xs font-semibold flex items-center justify-between transition-all outline-none cursor-pointer border ${
                  isFolderDropdownOpen
                    ? 'border-crimson-primary ring-4 ring-crimson-primary/10 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0 flex-1 text-left">
                  {selectedFolder ? (
                    <>
                      <span className="material-symbols-outlined text-[18px] text-amber-500 shrink-0">
                        folder
                      </span>
                      <span className="truncate text-slate-800 font-bold text-xs">
                        {selectedFolder.name}
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[18px] text-slate-400 shrink-0">
                        folder_off
                      </span>
                      <span className="text-slate-500 font-normal truncate">
                        -- Danh sách riêng lẻ (Không thuộc thư mục) --
                      </span>
                    </>
                  )}
                </div>

                <div className="flex items-center gap-1 shrink-0 ml-2">
                  {folderId && (
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => {
                        e.stopPropagation();
                        setFolderId('');
                      }}
                      title="Bỏ chọn thư mục (Chuyển thành danh sách riêng lẻ)"
                      className="w-5 h-5 rounded flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer mr-0.5"
                    >
                      <span className="material-symbols-outlined text-[14px]">close</span>
                    </span>
                  )}
                  <span
                    className={`material-symbols-outlined text-slate-400 text-[18px] transition-transform duration-200 shrink-0 ${
                      isFolderDropdownOpen ? 'rotate-180 text-crimson-primary' : ''
                    }`}
                  >
                    expand_more
                  </span>
                </div>
              </button>

              {/* Dropdown Popover */}
              {isFolderDropdownOpen && (
                <div
                  className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-2xl shadow-2xl border border-slate-200/95 p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150 flex flex-col gap-1 max-h-60 overflow-y-auto custom-scrollbar ring-1 ring-black/5"
                >
                  <div className="px-2.5 pt-1.5 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 flex items-center justify-between">
                    <span>Chọn thư mục / danh mục cha</span>
                    {onOpenCreateFolder && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsFolderDropdownOpen(false);
                          onOpenCreateFolder();
                        }}
                        className="text-[10.5px] font-bold text-crimson-primary hover:underline cursor-pointer"
                      >
                        + Tạo mới
                      </button>
                    )}
                  </div>

                  {/* Lựa chọn 1: Danh sách riêng lẻ */}
                  <button
                    type="button"
                    onClick={() => {
                      setFolderId('');
                      setIsFolderDropdownOpen(false);
                    }}
                    className={`w-full px-3 py-2 rounded-xl flex items-center justify-between gap-2.5 text-left text-xs transition-colors cursor-pointer ${
                      !folderId
                        ? 'bg-surface-crimson-subtle/80 text-crimson-primary font-bold'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span className="material-symbols-outlined text-[18px] text-slate-400 shrink-0">
                        folder_off
                      </span>
                      <span className="truncate">
                        Danh sách riêng lẻ (Không thuộc thư mục)
                      </span>
                    </div>
                    <span
                      className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                        !folderId ? 'bg-crimson-primary text-white' : 'border border-slate-300'
                      }`}
                    >
                      {!folderId && (
                        <span className="material-symbols-outlined text-[11px] font-bold">check</span>
                      )}
                    </span>
                  </button>

                  {/* Danh sách các thư mục hiện có */}
                  {existingFolders.map((f) => {
                    const isSelected = String(f.id) === String(folderId);
                    return (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => {
                          setFolderId(String(f.id));
                          setIsFolderDropdownOpen(false);
                        }}
                        className={`w-full px-3 py-2 rounded-xl flex items-center justify-between gap-2.5 text-left text-xs transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-surface-crimson-subtle/80 text-crimson-primary font-bold'
                            : 'text-slate-700 hover:bg-amber-50/60'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <span className="material-symbols-outlined text-[18px] text-amber-500 shrink-0">
                            folder
                          </span>
                          <span className="truncate font-semibold text-slate-800">
                            {f.name}
                          </span>
                        </div>
                        <span
                          className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                            isSelected ? 'bg-crimson-primary text-white' : 'border border-slate-300'
                          }`}
                        >
                          {isSelected && (
                            <span className="material-symbols-outlined text-[11px] font-bold">check</span>
                          )}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <span className="text-[10.5px] text-text-muted">
              Gom bài đọc này vào đề thi hoặc môn học tương ứng (VD: TOEIC Test 1, Anh văn 2...).
            </span>
          </div>

          {/* Code and Title Row */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5">
            {/* List Code (e.g. LIST 01) */}
            <div className="sm:col-span-4 flex flex-col gap-1.5">
              <label className="text-xs font-bold text-text-high-contrast flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <span>Mã danh sách</span>
                  <span className="text-[10px] text-text-muted font-normal">(Viết tắt)</span>
                </div>
                {trimmedCode && (
                  isCodeDuplicate ? (
                    <span className="text-[10px] text-red-600 font-bold flex items-center gap-0.5">
                      <span className="material-symbols-outlined text-[12px]">cancel</span>
                      Trùng mã
                    </span>
                  ) : (
                    <span className="text-[10px] text-emerald-600 font-medium flex items-center gap-0.5">
                      <span className="material-symbols-outlined text-[12px]">check_circle</span>
                      Hợp lệ
                    </span>
                  )
                )}
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value);
                    if (errorMessage) setErrorMessage('');
                  }}
                  placeholder="VD: LIST 01"
                  className={`w-full h-11 px-3.5 pr-8 bg-white rounded-xl text-sm font-bold transition-all outline-none ${
                    isCodeDuplicate
                      ? 'text-red-600 border-2 border-red-500 bg-red-50/40 focus:border-red-600 focus:ring-4 focus:ring-red-500/10'
                      : 'text-crimson-primary border border-slate-200 focus:border-crimson-primary focus:ring-4 focus:ring-crimson-primary/10'
                  }`}
                />
                {isCodeDuplicate && (
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-red-500 text-[18px]">
                    error
                  </span>
                )}
              </div>
              {isCodeDuplicate ? (
                <span className="text-[10px] text-red-600 font-bold flex items-center gap-1 animate-in fade-in duration-150">
                  <span className="material-symbols-outlined text-[13px]">warning</span>
                  Mã này đã có trong danh sách. Vui lòng chọn mã khác!
                </span>
              ) : (
                <span className="text-[10px] text-text-muted">
                  Hiển thị ngắn gọn trên thanh Sidebar
                </span>
              )}
            </div>

            {/* List Title */}
            <div className="sm:col-span-8 flex flex-col gap-1.5">
              <label className="text-xs font-bold text-text-high-contrast flex items-center justify-between">
                <span>
                  Tiêu đề danh sách từ vựng <span className="text-crimson-primary">*</span>
                </span>
                <span className="text-[10px] text-text-muted font-normal">Bắt buộc</span>
              </label>
              <input
                type="text"
                autoFocus
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="VD: Cambridge 18 - Test 1, The Economist, Podcast, TED Talks..."
                className="w-full h-11 px-3.5 bg-white rounded-xl text-sm font-semibold text-text-high-contrast border border-slate-200 focus:border-crimson-primary focus:ring-4 focus:ring-crimson-primary/10 transition-all outline-none"
              />
              <span className="text-[10px] text-text-muted">
                Tên đầy đủ của bài đọc, bài nghe, tin tức hoặc chủ đề từ vựng
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
              <span>Ghi chú danh sách / Mục tiêu (Notes)</span>
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
                {showPassageField ? 'Ẩn nội dung ngữ cảnh / bài đọc' : 'Thêm nội dung bài đọc / transcript nghe / trích đoạn (Passage & Context)'}
              </span>
            </button>

            {showPassageField && (
              <div className="flex flex-col gap-1.5 animate-in fade-in duration-200">
                <textarea
                  rows={5}
                  value={passage}
                  onChange={(e) => setPassage(e.target.value)}
                  placeholder="Dán toàn bộ hoặc trích đoạn nội dung bài đọc, transcript nghe, bài báo vào đây để đối chiếu ngữ cảnh lúc học từ vựng..."
                  className="w-full p-3 bg-white rounded-xl text-xs text-text-high-contrast border border-slate-200 focus:border-crimson-primary focus:ring-4 focus:ring-crimson-primary/10 transition-all outline-none resize-y font-normal leading-relaxed"
                />
                <span className="text-[10px] text-text-muted">
                  Nội dung này sẽ được hiển thị trong thẻ xem chi tiết danh sách từ vựng để đối chiếu ngữ cảnh.
                </span>
              </div>
            )}
          </div>
        </form>

        {/* Modal Footer */}
        <div className="px-6 sm:px-8 py-3.5 border-t border-slate-100 bg-white flex items-center justify-between shrink-0">
          <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-text-muted select-none">
            <span>Mẹo: Nhấn</span>
            <kbd className="inline-flex items-center px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded border border-slate-200 text-[10px] font-mono font-bold shadow-2xs">
              Ctrl + Enter
            </kbd>
            <span>để tạo nhanh</span>
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
              disabled={isSubmitting || !title.trim() || !code.trim() || isCodeDuplicate}
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
