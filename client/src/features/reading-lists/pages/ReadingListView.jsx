import React from 'react';

export default function ReadingListView({
  readingList,
  vocabList,
  onOpenAddModal,
  onPronounce,
  onDeleteVocab,
  onDeleteReadingList,
  searchTerm = '',
  selectedPos = 'all',
}) {
  const [showPassage, setShowPassage] = React.useState(Boolean(readingList?.passage));

  if (!readingList) return null;

  // Filter words that belong to this reading list
  const listWords = vocabList.filter((item) => {
    const isThisList =
      item.readingListId === readingList.id ||
      item.readingListName === readingList.shortTitle ||
      item.readingListName === readingList.code ||
      item.readingListName === readingList.title ||
      item.readingListName === readingList.fullTitle ||
      (item.noteLists && item.noteLists.some((nl) => nl.id === readingList.id));
    if (!isThisList) return false;

    // Filter by POS if selected
    if (selectedPos && selectedPos !== 'all') {
      const hasPos = item.pos === selectedPos || item.forms.some((f) => f.pos === selectedPos);
      if (!hasPos) return false;
    }

    // Filter by search query if present
    if (searchTerm && searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchWord = item.word.toLowerCase().includes(q);
      const matchFamily = item.wordFamily?.some((wf) => wf.toLowerCase().includes(q));
      const matchForms = item.forms.some(
        (f) =>
          f.meaning.toLowerCase().includes(q) ||
          f.pattern?.toLowerCase().includes(q) ||
          f.collocation?.toLowerCase().includes(q) ||
          f.example?.toLowerCase().includes(q)
      );
      if (!matchWord && !matchFamily && !matchForms) return false;
    }

    return true;
  });

  const getPosBadge = (pos, countability) => {
    switch (pos) {
      case 'n':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-pos-noun-bg text-pos-noun-text font-bold text-xs">
            <span>(n)</span>
            {countability && <span className="text-[10px] opacity-80">{countability}</span>}
          </span>
        );
      case 'v':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-pos-verb-bg text-pos-verb-text font-bold text-xs">
            (v)
          </span>
        );
      case 'adj':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-pos-adj-bg text-pos-adj-text font-bold text-xs">
            (adj)
          </span>
        );
      case 'adv':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-pos-adv-bg text-pos-adv-text font-bold text-xs">
            (adv)
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold text-xs">
            {pos}
          </span>
        );
    }
  };

  const totalCollocationsCount = listWords.reduce(
    (acc, w) => acc + w.forms.filter((f) => f.type === 'collocation' || (f.collocation && !f.pattern)).length,
    0
  );

  const displayTitle = readingList.title || readingList.fullTitle || 'Danh sách bài đọc';
  const displayCode = readingList.code || readingList.shortTitle || 'LIST';

  return (
    <div className="flex flex-col w-full pb-16">
      <div className="p-6 lg:p-8 max-w-[1600px] mx-auto w-full flex flex-col gap-6">
        {/* TOP BANNER / READING HEADER CARD */}
        <section className="bg-card-white rounded-2xl border border-slate-line/80 shadow-xs p-6 relative overflow-hidden transition-all">
          <div className="flex flex-col lg:flex-row lg:items-stretch lg:justify-between gap-6">
            {/* Left Column: Title + Description + 4 Cards */}
            <div className="flex flex-col justify-between flex-1 min-w-0 pr-2">
              {/* Title & Description */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="px-2.5 py-1 rounded-md bg-surface-crimson-soft text-crimson-dark text-xs font-extrabold uppercase tracking-wider border border-border-crimson-tint/60 shrink-0 select-none">
                    {displayCode}
                  </span>

                  <h1 className="font-headline text-xl lg:text-2xl font-extrabold text-text-high-contrast tracking-tight leading-none">
                    {displayTitle}
                  </h1>

                  {readingList.sourceReference && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold">
                      <span className="material-symbols-outlined text-[14px]">menu_book</span>
                      <span>{readingList.sourceReference}</span>
                    </span>
                  )}

                  {onDeleteReadingList && (
                    <button
                      type="button"
                      onClick={() => onDeleteReadingList(readingList.id)}
                      title="Xóa danh sách bài đọc này"
                      className="ml-auto w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-crimson-primary hover:bg-red-50 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  )}
                </div>

                <p className="text-xs text-text-muted leading-relaxed mt-0.5">
                  {readingList.note || 'Bộ từ vựng học thuật trích xuất từ bài đọc, phân tích ngữ cảnh, mẫu câu và collocations tương ứng.'}
                </p>
              </div>

              {/* 4 Cards Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3">
                {/* Card 1 */}
                <div className="bg-canvas-slate rounded-lg p-2.5 flex items-center gap-3 border border-slate-line/60">
                  <div className="w-9 h-9 rounded-lg bg-pos-noun-bg flex items-center justify-center text-pos-noun-text">
                    <span className="material-symbols-outlined text-[20px]">format_list_bulleted</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Total Words</span>
                    <span className="font-headline text-base font-extrabold text-text-high-contrast leading-none mt-0.5">
                      {listWords.length}
                    </span>
                  </div>
                </div>

                {/* Card 2 */}
                <div className="bg-canvas-slate rounded-lg p-2.5 flex items-center gap-3 border border-slate-line/60">
                  <div className="w-9 h-9 rounded-lg bg-surface-crimson-soft flex items-center justify-center text-crimson-primary">
                    <span className="material-symbols-outlined text-[20px]">workspace_premium</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">High Band Words</span>
                    <span className="font-headline text-base font-extrabold text-crimson-primary leading-none mt-0.5">
                      {readingList.highBandWords || 0}
                    </span>
                  </div>
                </div>

                {/* Card 3 */}
                <div className="bg-canvas-slate rounded-lg p-2.5 flex items-center gap-3 border border-slate-line/60">
                  <div className="w-9 h-9 rounded-lg bg-pos-adv-bg flex items-center justify-center text-pos-adv-text">
                    <span className="material-symbols-outlined text-[20px]">hub</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Collocations</span>
                    <span className="font-headline text-base font-extrabold text-collocation-indigo leading-none mt-0.5">
                      {totalCollocationsCount || readingList.collocations || 0}
                    </span>
                  </div>
                </div>

                {/* Card 4 */}
                <div className="bg-canvas-slate rounded-lg p-2.5 flex items-center justify-between border border-slate-line/60">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Mastery Level</span>
                    <span className="font-headline text-base font-extrabold text-text-high-contrast leading-none mt-0.5">
                      {readingList.masteryLevel || 0}%
                    </span>
                  </div>
                  {/* SVG Dial */}
                  <div className="relative w-8 h-8 flex items-center justify-center">
                    <svg className="w-8 h-8 -rotate-90" viewBox="0 0 36 36">
                      <path
                        className="text-slate-line"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                      />
                      <path
                        className="text-crimson-primary"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="currentColor"
                        strokeDasharray={`${readingList.masteryLevel || 0}, 100`}
                        strokeLinecap="round"
                        strokeWidth="3"
                      />
                    </svg>
                    <span className="absolute text-[9px] font-bold text-text-high-contrast">%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: 3 Action Buttons Stacked */}
            <div className="flex flex-col justify-between gap-2.5 shrink-0 w-full sm:w-auto lg:w-[210px]">
              <button
                type="button"
                onClick={() => alert('Khởi động chế độ Luyện Flashcard cho danh sách này!')}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-surface-crimson-subtle text-crimson-primary hover:bg-surface-crimson-soft text-xs font-bold transition-all shadow-xs"
              >
                <span className="material-symbols-outlined text-[18px]">style</span>
                <span>Luyện Flashcard ({listWords.length} từ)</span>
              </button>

              <button
                type="button"
                onClick={() => alert('Khởi động bài kiểm tra trắc nghiệm Quiz!')}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-canvas-slate text-text-high-contrast hover:bg-slate-200 text-xs font-semibold transition-all border border-slate-line"
              >
                <span className="material-symbols-outlined text-[18px]">quiz</span>
                <span>Làm bài Quiz kiểm tra</span>
              </button>

              <button
                type="button"
                onClick={onOpenAddModal}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-crimson-primary text-white hover:bg-crimson-dark text-xs font-bold transition-all shadow-xs shadow-red-200"
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
                <span>Thêm từ vào List này</span>
              </button>
            </div>
          </div>
        </section>

        {/* READING PASSAGE COLLAPSIBLE SECTION */}
        {readingList.passage && (
          <section className="bg-card-white rounded-xl border border-slate-line/80 shadow-xs overflow-hidden transition-all">
            <button
              type="button"
              onClick={() => setShowPassage(!showPassage)}
              className="w-full px-5 py-3.5 bg-slate-50/70 hover:bg-slate-100/70 flex items-center justify-between border-b border-slate-line/60 transition-colors text-left"
            >
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[20px] text-crimson-primary">menu_book</span>
                <span className="font-headline font-bold text-sm text-text-high-contrast">
                  Nội dung đoạn văn bài đọc (Reading Passage)
                </span>
                <span className="text-[11px] text-text-muted">
                  ({readingList.passage.split(/\s+/).filter(Boolean).length} từ)
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-text-muted">
                <span>{showPassage ? 'Thu gọn' : 'Xem nội dung'}</span>
                <span className="material-symbols-outlined text-[18px]">
                  {showPassage ? 'expand_less' : 'expand_more'}
                </span>
              </div>
            </button>
            {showPassage && (
              <div className="p-5 text-xs text-text-body leading-relaxed whitespace-pre-wrap bg-white border-t border-slate-50 font-normal">
                {readingList.passage}
              </div>
            )}
          </section>
        )}

        {/* VOCABULARY MATRIX TABLE */}
        <div className="bg-white rounded-xl border border-slate-line/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-line text-[11px] font-bold text-text-muted uppercase tracking-wider">
                  <th className="py-3.5 px-4 w-[18%]">TỪ VỰNG</th>
                  <th className="py-3.5 px-3 w-[10%]">TỪ LOẠI</th>
                  <th className="py-3.5 px-3 w-[28%]">MẪU CẤU TRÚC / COLLOCATION</th>
                  <th className="py-3.5 px-3 w-[14%]">TỪ ĐỒNG NGHĨA</th>
                  <th className="py-3.5 px-4 w-[30%]">NGHĨA TIẾNG VIỆT</th>
                </tr>
              </thead>
              <tbody>
                {listWords.map((item) => {
                  // Calculate total rows: each form takes 1 row for main data, plus 1 row for note/example if present
                  const totalRows = item.forms.reduce(
                    (acc, f) => acc + (f.note || f.example ? 2 : 1),
                    0
                  );

                  let isFirstRowOfWord = true;

                  return item.forms.map((form, fIdx) => {
                    const renderWordCell = isFirstRowOfWord;
                    isFirstRowOfWord = false;
                    const hasSubRow = Boolean(form.note || form.example);

                    const isColloc =
                      form.type === 'collocation' ||
                      (!form.pattern && Boolean(form.collocation));
                    const isPatt =
                      form.type === 'pattern' ||
                      (Boolean(form.pattern) && !form.collocation);

                    return (
                      <React.Fragment key={`${item.id}-form-${fIdx}`}>
                        {/* Main Sense Row */}
                        <tr
                          className={`hover:bg-red-50/15 transition-colors ${
                            renderWordCell ? 'border-t-2 border-slate-100' : ''
                          } ${!hasSubRow ? 'border-b border-slate-line/80' : ''}`}
                        >
                          {/* Vocab Word Cell (Rendered on first row, spans totalRows) */}
                          {renderWordCell && (
                            <td
                              rowSpan={totalRows}
                              className="py-4 px-4 align-top border-r border-slate-line/60 bg-white"
                            >
                              <div className="flex flex-col gap-1.5 sticky top-4">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-headline font-extrabold text-base text-text-high-contrast tracking-tight">
                                    {item.word}
                                  </span>
                                  {onDeleteVocab && (
                                    <button
                                      type="button"
                                      onClick={() => onDeleteVocab(item.id)}
                                      title="Xóa từ vựng này khỏi hệ thống"
                                      className="w-6 h-6 rounded-full bg-slate-100 hover:bg-red-50 hover:text-red-600 text-slate-400 flex items-center justify-center transition-all cursor-pointer"
                                    >
                                      <span className="material-symbols-outlined text-[14px]">delete</span>
                                    </button>
                                  )}
                                </div>

                                {item.categories && item.categories.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-0.5">
                                    {item.categories.map((cat, cIdx) => (
                                      <span
                                        key={cIdx}
                                        className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600"
                                      >
                                        {cat}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </td>
                          )}

                          {/* Từ loại */}
                          <td className="py-3 px-3 align-middle">
                            {getPosBadge(form.pos, form.countability)}
                          </td>

                          {/* Mẫu cấu trúc / Collocation */}
                          <td className="py-3 px-3 align-middle">
                            {isColloc && (
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200/80">
                                  <span className="material-symbols-outlined text-[12px]">hub</span>
                                  Collocation
                                </span>
                                <span className="text-[12px] font-bold text-collocation-indigo bg-indigo-50/70 px-2 py-0.5 rounded border border-indigo-100">
                                  {form.collocation}
                                </span>
                              </div>
                            )}

                            {isPatt && (
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200/80">
                                  <span className="material-symbols-outlined text-[12px]">account_tree</span>
                                  Pattern
                                </span>
                                <span className="font-mono text-[11px] font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                  {form.pattern}
                                </span>
                              </div>
                            )}

                            {/* Legacy fallback if both exist */}
                            {!isColloc && !isPatt && form.pattern && form.collocation && (
                              <div className="flex flex-col gap-1.5">
                                <div className="flex items-center gap-1.5">
                                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-50 text-amber-800 border border-amber-200">Pattern</span>
                                  <span className="font-mono text-[11px] font-semibold text-slate-800">{form.pattern}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">Colloc</span>
                                  <span className="text-[11px] font-semibold text-collocation-indigo">{form.collocation}</span>
                                </div>
                              </div>
                            )}

                            {!isColloc && !isPatt && !form.pattern && !form.collocation && (
                              <span className="text-text-disabled italic">—</span>
                            )}
                          </td>

                          {/* Từ đồng nghĩa */}
                          <td className="py-3 px-3 align-middle text-text-muted text-[11px]">
                            {form.synonym || <span className="text-text-disabled italic">—</span>}
                          </td>

                          {/* Nghĩa Tiếng Việt */}
                          <td className="py-3 px-4 align-middle">
                            <span className="font-semibold text-text-high-contrast text-xs leading-snug">
                              {form.meaning}
                            </span>
                          </td>
                        </tr>

                        {/* Note & Example Row: 40% Ghi chú (trái) - 60% Ví dụ (phải) */}
                        {hasSubRow && (
                          <tr
                            key={`${item.id}-form-${fIdx}-subrow`}
                            className="hover:bg-red-50/15 transition-colors border-b border-slate-line/80"
                          >
                            <td colSpan={4} className="py-2.5 px-4 bg-slate-50/50">
                              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 text-[11px]">
                                {/* Left: Ghi chú ngữ cảnh (~40% = 5 cols) */}
                                <div className="md:col-span-5 flex items-start gap-1.5 border-l-2 border-crimson-primary/70 pl-2.5">
                                  <span className="font-semibold text-crimson-primary shrink-0 flex items-center gap-1">
                                    <span className="material-symbols-outlined text-[13px]">lightbulb</span>
                                    Ghi chú:
                                  </span>
                                  <span className="text-text-high-contrast font-medium leading-relaxed">
                                    {form.note ? (
                                      form.note.replace(/^Ghi chú:\s*/i, '')
                                    ) : (
                                      <span className="text-text-disabled italic font-normal">Không có ghi chú ngữ cảnh</span>
                                    )}
                                  </span>
                                </div>

                                {/* Right: Ví dụ thực tế (~60% = 7 cols) */}
                                <div className="md:col-span-7 flex items-start gap-1.5 border-l-2 border-indigo-400 pl-2.5 text-slate-700 italic">
                                  <span className="not-italic text-indigo-700 font-semibold shrink-0 flex items-center gap-1">
                                    <span className="material-symbols-outlined text-[13px] not-italic">format_quote</span>
                                    Ví dụ:
                                  </span>
                                  <span className="leading-relaxed">
                                    {form.example ? (
                                      `"${form.example}"`
                                    ) : (
                                      <span className="text-text-disabled not-italic font-normal">Chưa có câu ví dụ thực tế</span>
                                    )}
                                  </span>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  });
                })}

                {listWords.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-16 text-center text-text-muted">
                      <div className="flex flex-col items-center justify-center gap-3 max-w-sm mx-auto">
                        <div className="w-12 h-12 rounded-2xl bg-surface-crimson-subtle flex items-center justify-center text-crimson-primary">
                          <span className="material-symbols-outlined text-[28px]">article</span>
                        </div>
                        <div>
                          <p className="font-bold text-sm text-text-high-contrast">
                            Chưa có từ vựng nào trong danh sách này
                          </p>
                          <p className="text-xs text-text-muted mt-1 leading-relaxed">
                            Bấm nút "+ Thêm từ vào List này" phía trên để lưu từ vựng kèm ngữ cảnh câu đọc.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={onOpenAddModal}
                          className="mt-1 flex items-center gap-1.5 px-4 py-2 rounded-lg bg-crimson-primary text-white text-xs font-bold hover:bg-crimson-dark shadow-xs"
                        >
                          <span className="material-symbols-outlined text-[16px]">add</span>
                          <span>+ Thêm từ vào List này</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
