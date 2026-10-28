import React from 'react';

export default function WordFamiliesPage({ vocabList, onPronounce, onOpenAddModal }) {
  return (
    <div className="flex flex-col w-full pb-16">
      <section className="p-6 lg:p-8 bg-white border-b border-slate-line/80 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-headline text-2xl font-extrabold text-text-high-contrast tracking-tight">
              Gia đình từ (Word Families Tree)
            </h1>
            <p className="text-xs text-text-muted mt-1">
              Học từ vựng theo cụm gốc từ (Root &amp; Affixes) theo phương pháp Linearthinking giúp mở rộng vốn từ gấp 4 lần.
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenAddModal}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-crimson-primary text-white text-xs font-bold shadow-xs hover:bg-crimson-dark"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            <span>+ Thêm Từ Mới</span>
          </button>
        </div>
      </section>

      <section className="p-6 lg:p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {vocabList.length === 0 ? (
          <div className="col-span-full py-20 flex flex-col items-center justify-center text-center">
            <div className="w-14 h-14 rounded-2xl bg-surface-crimson-subtle flex items-center justify-center text-crimson-primary mb-3">
              <span className="material-symbols-outlined text-[32px]">account_tree</span>
            </div>
            <p className="font-bold text-base text-text-high-contrast">Chưa có cây gia đình từ nào</p>
            <p className="text-xs text-text-muted max-w-md mt-1 mb-4 leading-relaxed">
              Cây gia đình từ sẽ tự động xuất hiện khi bạn thêm các từ vựng mới kèm danh sách Word Family tương ứng.
            </p>
            <button
              type="button"
              onClick={onOpenAddModal}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-crimson-primary text-white text-xs font-bold hover:bg-crimson-dark shadow-xs"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              <span>+ Thêm Từ Đầu Tiên</span>
            </button>
          </div>
        ) : (
          vocabList.map((item) => (
            <div
              key={item.id}
              className="p-5 rounded-xl bg-white border border-slate-line/80 shadow-xs flex flex-col gap-3 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div>
                  <span className="font-headline font-bold text-base text-crimson-primary">
                    {item.word}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => onPronounce(item.word)}
                  className="w-7 h-7 rounded-full bg-surface-crimson-subtle text-crimson-primary flex items-center justify-center hover:bg-surface-crimson-soft"
                >
                  <span className="material-symbols-outlined text-[16px]">volume_up</span>
                </button>
              </div>

              <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
                CÁC TỪ TRONG GIA ĐÌNH:
              </span>

              <div className="flex flex-wrap gap-1.5">
                {item.wordFamily?.map((wf, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-md bg-canvas-slate border border-slate-200 text-xs font-medium text-text-body"
                  >
                    {wf}
                  </span>
                ))}
              </div>

              <div className="mt-auto pt-3 border-t border-slate-100 text-[11px] text-text-muted flex items-center justify-between">
                <span>{item.forms.length} cấu trúc &amp; collocation ({item.posLabel || item.forms[0]?.posLabel || 'Từ vựng'})</span>
                <span className="font-semibold text-text-high-contrast">{item.readingListName}</span>
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  );
}
