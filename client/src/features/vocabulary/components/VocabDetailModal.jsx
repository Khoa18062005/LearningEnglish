import React, { useEffect, useRef } from 'react';
import VocabCard from './VocabCard';

/**
 * VocabDetailModal: Modal hiển thị nhanh thẻ từ vựng đầy đủ của một từ liên quan (như lease khi click từ thẻ hire)
 * Giữ nguyên đầy đủ tính năng: phát âm, pattern, collocation, ví dụ, chỉnh sửa...
 */
export default function VocabDetailModal({
  isOpen,
  vocab,
  vocabList = [],
  sourceWord = null,
  onClose,
  onPronounce,
  onEdit,
  onDelete,
  onSelectRelatedWord,
  onOpenRelatedGroup,
  onScrollToCard,
}) {
  const modalRef = useRef(null);

  // Close on ESC (Chỉ đóng nếu không có modal lớp trên như AddVocabModal z-[60] đang mở)
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        const higherModal = document.querySelector('.z-\\[60\\], .z-\\[70\\], .z-\\[80\\]');
        if (higherModal) return;
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !vocab) return null;

  // Lấy dữ liệu mới nhất từ vocabList nếu từ vừa được chỉnh sửa
  const activeVocab =
    (vocabList || []).find(
      (v) =>
        (v.id && vocab?.id && String(v.id) === String(vocab.id)) ||
        ((v.word || '').trim().toLowerCase() === (vocab?.word || '').trim().toLowerCase())
    ) || vocab;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={modalRef}
        className="w-full max-w-[1240px] max-h-[92vh] flex flex-col bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200/90 overflow-hidden animate-in zoom-in-95 duration-200"
      >
        {/* Header Modal */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-linear-to-r from-red-50/60 via-slate-50 to-white">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-crimson-primary/10 text-crimson-primary flex items-center justify-center shrink-0 shadow-2xs">
              <span className="material-symbols-outlined text-[20px]">menu_book</span>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Thẻ từ vựng liên quan
                </span>
                {sourceWord && (
                  <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                    từ <span className="text-crimson-primary font-bold">"{sourceWord}"</span>
                  </span>
                )}
              </div>
              <h2 className="text-lg font-extrabold text-slate-900 truncate mt-0.5">
                {activeVocab.word}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onScrollToCard && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onScrollToCard(activeVocab);
                }}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 hover:text-crimson-primary bg-slate-100/80 hover:bg-red-50 border border-slate-200/80 hover:border-red-200 transition-all cursor-pointer shadow-2xs"
                title="Đóng modal và cuộn tới thẻ từ này trên trang"
              >
                <span className="material-symbols-outlined text-[16px]">travel_explore</span>
                <span>Xem trên trang</span>
              </button>
            )}

            {onEdit && (
              <button
                type="button"
                onClick={() => {
                  if (onEdit) onEdit(activeVocab);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-crimson-primary bg-red-50 hover:bg-red-100/80 border border-red-200 transition-all cursor-pointer shadow-2xs"
                title="Chỉnh sửa từ vựng này"
              >
                <span className="material-symbols-outlined text-[16px]">edit</span>
                <span>Chỉnh sửa</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
              title="Đóng (ESC)"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
        </div>

        {/* Body Modal: Chứa VocabCard hoàn chỉnh với kích thước nguyên vẹn */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-7 bg-slate-50/60 custom-scrollbar">
          <div className="w-full mx-auto">
            <VocabCard
              vocab={activeVocab}
              vocabList={vocabList}
              onPronounce={onPronounce}
              onEdit={(v) => {
                if (onEdit) onEdit(v);
              }}
              onDelete={(id) => {
                onClose();
                if (onDelete) onDelete(id);
              }}
              onSelectRelatedWord={onSelectRelatedWord}
              onOpenRelatedGroup={onOpenRelatedGroup}
              showReadingList={true}
            />
          </div>
        </div>

        {/* Footer Modal */}
        <div className="px-5 py-3 border-t border-slate-100 bg-white flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5 text-slate-400">
            <span className="material-symbols-outlined text-[16px]">touch_app</span>
            <span>Bạn có thể bấm vào các từ đồng nghĩa bên trong để tiếp tục mở thẻ tương ứng</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
