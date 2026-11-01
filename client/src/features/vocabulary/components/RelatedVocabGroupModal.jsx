import React, { useEffect, useRef, useMemo } from 'react';
import VocabCard from './VocabCard';
import { buildRelationGraph, getConnectedCluster } from '../../../utils/vocabRelations';

/**
 * RelatedVocabGroupModal: Hộp thoại cuộn hiển thị toàn bộ các thẻ từ vựng liên quan
 * (Mở khi người dùng bấm vào nút "Nét nghĩa tương đương:" hoặc "Đồng nghĩa:")
 */
export default function RelatedVocabGroupModal({
  isOpen,
  data,
  vocabList = [],
  onClose,
  onPronounce,
  onEdit,
  onDelete,
  onSelectRelatedWord,
  onOpenRelatedGroup,
  onScrollToCard,
  onCreateVocab,
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

  if (!isOpen || !data) return null;

  const { words = [], sourceWord = '', type = 'close' } = data;
  const isClose = type === 'close';

  // Tự động mở rộng cụm từ bắc cầu hoàn chỉnh (Transitive Closure)
  const displayWords = useMemo(() => {
    if (!data) return [];
    const { graph, displayMap } = buildRelationGraph(vocabList, type);
    const cluster = getConnectedCluster(sourceWord || words[0] || '', graph, displayMap, false);
    const cleanSource = (sourceWord || '').trim().toLowerCase();
    const combined = Array.from(new Set([...words, ...cluster]))
      .filter((w) => (w || '').trim().toLowerCase() !== cleanSource);
    return combined.length > 0 ? combined : words;
  }, [data, vocabList, sourceWord, words, type]);

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
        {/* Header Modal - Tinh gọn theo yêu cầu */}
        <div
          className={`flex items-center justify-between px-5 py-3.5 border-b ${
            isClose
              ? 'border-amber-200/70 bg-linear-to-r from-amber-50/80 via-slate-50 to-white'
              : 'border-teal-200/70 bg-linear-to-r from-teal-50/80 via-slate-50 to-white'
          }`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-2xs ${
                isClose ? 'bg-amber-500/15 text-amber-700' : 'bg-teal-500/15 text-teal-700'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">
                {isClose ? 'compare_arrows' : 'sync_alt'}
              </span>
            </div>
            <h2 className="text-lg font-extrabold text-slate-900 truncate">
              {isClose ? 'Nhóm từ có nét nghĩa tương đương' : 'Nhóm từ đồng nghĩa'}
            </h2>
          </div>

          <div className="flex items-center gap-2 shrink-0">
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

        {/* Body: Thanh cuộn chứa các thẻ từ vựng này */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-7 bg-slate-50/70 custom-scrollbar flex flex-col gap-5">
          {displayWords.map((wordStr, idx) => {
            const cleanWord = (wordStr || '').trim().toLowerCase();
            const matchedVocab = (vocabList || []).find(
              (v) => (v.word || '').trim().toLowerCase() === cleanWord
            );

            if (matchedVocab) {
              return (
                <div key={matchedVocab.id || idx} className="w-full">
                  <VocabCard
                    vocab={matchedVocab}
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
              );
            }

            // Nếu từ chưa có thẻ riêng trong vocabList
            return (
              <div
                key={idx}
                className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-base border border-amber-200">
                    {idx + 1}
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-slate-900">{wordStr}</h4>
                    <p className="text-xs text-slate-500">
                      Từ vựng này chưa có thẻ chi tiết riêng trong danh sách của bạn.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    if (onCreateVocab) {
                      onCreateVocab(wordStr);
                    }
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-crimson-primary hover:bg-crimson-dark shadow-xs cursor-pointer transition-all active:scale-95"
                >
                  <span className="material-symbols-outlined text-[16px]">add</span>
                  <span>Tạo thẻ từ "{wordStr}"</span>
                </button>
              </div>
            );
          })}
        </div>

        {/* Footer Modal */}
        <div className="px-5 py-3 border-t border-slate-100 bg-white flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5 text-slate-400">
            <span className="material-symbols-outlined text-[16px]">swap_vert</span>
            <span>Cuộn chuột trong thanh cuộn để xem và so sánh toàn bộ các thẻ từ trong nhóm</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
