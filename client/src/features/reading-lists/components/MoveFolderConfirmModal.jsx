import React, { useEffect, useState } from 'react';

/**
 * @typedef {Object} MoveFolderConfirmModalProps
 * @property {boolean} isOpen - Trạng thái hiển thị modal
 * @property {() => void} onClose - Callback khi đóng hoặc hủy modal
 * @property {() => Promise<void> | void} onConfirm - Callback thực thi khi người dùng bấm xác nhận chuyển
 * @property {string} [title='Chuyển danh sách từ vựng'] - Tiêu đề của modal
 * @property {string} listName - Tên danh sách bài đọc / từ vựng cần di chuyển
 * @property {string} [sourceFolderName='Danh sách riêng lẻ'] - Tên thư mục xuất phát
 * @property {string} [targetFolderName='Danh sách riêng lẻ'] - Tên thư mục đích
 * @property {string} [confirmText='Xác nhận chuyển'] - Nhãn nút xác nhận
 * @property {string} [cancelText='Hủy'] - Nhãn nút hủy
 * @property {boolean} [isLoading=false] - Trạng thái đang thực hiện gọi API
 * @property {string} [zIndex='z-[75]'] - Tuỳ chỉnh z-index hiển thị
 */

/**
 * Icon FolderTransfer / FolderMove theo phong cách stroke thanh thoát, thoáng đãng
 * (Biểu tượng thư mục với mũi tên di chuyển tách biệt ở bên trong)
 */
function FolderTransferIcon({ className = 'w-[26px] h-[26px] text-crimson-primary' }) {
  return (
    <svg
      className={className}
      width="26"
      height="26"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.1"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {/* Khung thư mục bo góc hiện đại */}
      <path d="M3 7.5A2.5 2.5 0 0 1 5.5 5h3.172a2 2 0 0 1 1.414.586l1.828 1.828A2 2 0 0 0 13.328 8H18.5A2.5 2.5 0 0 1 21 10.5v8a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 18.5v-11Z" />
      {/* Mũi tên chuyển vị trí đặt tách biệt thoáng mắt trong lòng thư mục */}
      <path d="M8.5 14h7" />
      <path d="m12.5 11 3 3-3 3" />
    </svg>
  );
}

/**
 * Icon tài liệu / danh sách bài đọc (Document/List)
 */
function DocumentListIcon({ className = 'w-4 h-4 text-crimson-primary' }) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2Z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" x2="8" y1="13" y2="13" />
      <line x1="16" x2="8" y1="17" y2="17" />
      <line x1="10" x2="8" y1="9" y2="9" />
    </svg>
  );
}

/**
 * Icon thư mục (Folder) tối giản
 */
function FolderIcon({ className = 'w-4 h-4' }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 7.5A2.5 2.5 0 0 1 5.5 5h3.172a2 2 0 0 1 1.414.586l1.828 1.828A2 2 0 0 0 13.328 8H18.5A2.5 2.5 0 0 1 21 10.5v7a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 17.5v-10Z" />
    </svg>
  );
}

/**
 * Icon mũi tên chuyển dịch ArrowRight
 */
function ArrowRightIcon({ className = 'w-4 h-4 text-slate-400' }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}

/**
 * Icon nút Close (X)
 */
function CloseIcon({ className = 'w-4 h-4' }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

/**
 * MoveFolderConfirmModal: Hộp thoại xác nhận chuyển thư mục / danh sách từ vựng.
 * Thiết kế đồng bộ theo LexiconVocab LMS Design System (Primary #991b1b, rounded-xl container, rounded-lg buttons).
 *
 * @param {MoveFolderConfirmModalProps} props
 */
export default function MoveFolderConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Chuyển danh sách từ vựng',
  listName = '',
  listCode = '',
  sourceFolderName = 'Danh sách riêng lẻ',
  targetFolderName = 'Danh sách riêng lẻ',
  confirmText = 'Xác nhận chuyển',
  cancelText = 'Hủy',
  isLoading = false,
  zIndex = 'z-[75]',
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Lắng nghe phím ESC và ENTER
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        if (!isLoading && !isSubmitting) {
          onClose?.();
        }
      } else if (e.key === 'Enter') {
        e.stopPropagation();
        if (!isLoading && !isSubmitting) {
          handleExecuteConfirm();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLoading, isSubmitting]);

  if (!isOpen) return null;

  const handleExecuteConfirm = async () => {
    if (isLoading || isSubmitting) return;
    try {
      setIsSubmitting(true);
      if (onConfirm) {
        await onConfirm();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const busy = isLoading || isSubmitting;

  return (
    <div
      className={`fixed inset-0 ${zIndex} flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200`}
      onClick={busy ? undefined : onClose}
    >
      {/* Modal Container */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="move-folder-modal-title"
        className="relative w-full max-w-[540px] bg-white rounded-xl shadow-xl border border-slate-200/80 overflow-hidden animate-in zoom-in-95 duration-150 font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 1. Header (Left-aligned) */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3 min-w-0">
            <FolderTransferIcon className="w-7 h-7 text-crimson-primary shrink-0" />
            <h3
              id="move-folder-modal-title"
              className="text-base sm:text-lg font-bold text-slate-800 tracking-tight truncate"
            >
              {title}
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            aria-label="Đóng"
            className="w-8 h-8 rounded-md flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <CloseIcon className="w-4 h-4" />
          </button>
        </div>

        {/* 2. Nội dung (Body) */}
        <div className="px-6 pt-4 pb-6 space-y-3.5">
          {/* Subtext & Tên danh sách (Hiển thị Mã code - Tên danh sách căn giữa) */}
          <div className="space-y-2.5 text-center">
            <p className="text-[15px] sm:text-base font-normal text-slate-600 text-center leading-normal">
              Bạn có chắc muốn di chuyển danh sách từ vựng này không?
            </p>

            {(() => {
              const hasCode = Boolean(listCode && listCode.trim());
              const hasTitle = Boolean(listName && listName.trim());
              const isDuplicate = hasCode && hasTitle && listName.trim().toLowerCase().startsWith(listCode.trim().toLowerCase());
              const displayCombined = hasCode && hasTitle && !isDuplicate
                ? `${listCode.trim()} - ${listName.trim()}`
                : (hasTitle ? listName.trim() : (hasCode ? listCode.trim() : 'Danh sách từ vựng'));

              return (
                <div className="flex items-center justify-center gap-2 px-3.5 py-2.5 bg-slate-50 border border-slate-200/90 rounded-lg shadow-xs text-center w-full min-w-0">
                  <DocumentListIcon className="w-4.5 h-4.5 text-crimson-primary shrink-0" />
                  <span
                    className="text-xs sm:text-sm font-bold text-slate-800 truncate"
                    title={displayCombined}
                  >
                    {hasCode && hasTitle && !isDuplicate ? (
                      <>
                        <span className="text-crimson-primary font-bold">{listCode.trim()}</span>
                        <span className="mx-1.5 text-slate-400 font-normal">-</span>
                        <span>{listName.trim()}</span>
                      </>
                    ) : (
                      <span>{displayCombined}</span>
                    )}
                  </span>
                </div>
              );
            })()}
          </div>

          {/* Transfer Flow Card: Box lộ trình di chuyển trực quan */}
          <div className="grid grid-cols-[1fr,auto,1fr] items-center gap-2.5 p-3.5 bg-slate-50/60 rounded-lg border border-slate-200/80">
            {/* Thư mục nguồn (From) */}
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg min-w-0 flex flex-col gap-1.5 shadow-xs">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-center block w-full">
                Từ thư mục
              </span>
              <div className="flex items-center justify-center gap-1.5 min-w-0 w-full text-center">
                <FolderIcon className="w-4 h-4 text-slate-400 shrink-0" />
                <span
                  className="text-xs font-semibold text-slate-700 truncate"
                  title={sourceFolderName}
                >
                  {sourceFolderName}
                </span>
              </div>
            </div>

            {/* Icon mũi tên chuyển dịch thanh thoát */}
            <div className="flex items-center justify-center text-slate-400 px-0.5">
              <div className="w-7 h-7 rounded-full bg-white border border-slate-200/80 flex items-center justify-center shadow-xs">
                <ArrowRightIcon className="w-3.5 h-3.5 text-slate-400" />
              </div>
            </div>

            {/* Thư mục đích (To) */}
            <div className="p-2.5 bg-rose-50/70 border border-rose-200 rounded-lg min-w-0 flex flex-col gap-1.5 shadow-xs">
              <span className="text-[11px] font-semibold text-crimson-primary uppercase tracking-wider text-center block w-full">
                Đến thư mục
              </span>
              <div className="flex items-center justify-center gap-1.5 min-w-0 w-full text-center">
                <FolderIcon className="w-4 h-4 text-crimson-primary shrink-0" />
                <span
                  className="text-xs font-semibold text-crimson-dark truncate"
                  title={targetFolderName}
                >
                  {targetFolderName}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Footer (Action Buttons: Căn phải justify-end) */}
        <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-end gap-2.5">
          {/* Nút Hủy: variant ghost/outline */}
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="px-5 py-2.5 rounded-lg text-sm font-medium border border-slate-300 text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {cancelText}
          </button>

          {/* Nút Xác nhận chuyển: tăng kích thước chiều ngang với min-w-[160px] px-8 py-2.5 */}
          <button
            type="button"
            onClick={handleExecuteConfirm}
            disabled={busy}
            className="inline-flex items-center justify-center gap-2 min-w-[160px] px-8 py-2.5 rounded-lg text-sm font-semibold bg-crimson-primary hover:bg-[#c81419] active:bg-[#b01418] text-white shadow-sm shadow-red-500/25 transition-all disabled:opacity-50 cursor-pointer focus:outline-none focus:ring-2 focus:ring-crimson-primary/30"
          >
            {busy ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Đang chuyển...</span>
              </>
            ) : (
              <span>{confirmText}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
