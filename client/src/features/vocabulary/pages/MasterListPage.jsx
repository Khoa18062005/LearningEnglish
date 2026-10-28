import React, { useState } from 'react';
import VocabCard from '../components/VocabCard';

export default function MasterListPage({
  vocabList,
  onOpenAddModal,
  onEditVocab,
  onDeleteVocab,
  onPronounce,
  searchTerm,
  selectedPos,
  selectedCategory,
}) {
  const [viewDensity, setViewDensity] = useState('cards'); // 'detailed' | 'compact'
  const [activeTab, setActiveTab] = useState('all');

  // Filter vocabulary (de-duplicated)
  const seenMasterKeys = new Set();
  const filteredList = vocabList.filter((item) => {
    const key = item.id ? `id-${item.id}` : `word-${item.word.toLowerCase()}`;
    if (seenMasterKeys.has(key)) return false;
    seenMasterKeys.add(key);

    // POS filter
    if (selectedPos && selectedPos !== 'all') {
      const hasPos = item.pos === selectedPos || item.forms.some((f) => f.pos === selectedPos);
      if (!hasPos) return false;
    }

    // Category filter
    if (selectedCategory) {
      if (!item.categories.includes(selectedCategory)) return false;
    }

    // Search query
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchWord = item.word.toLowerCase().includes(q);
      const matchMeaning = item.meaning?.toLowerCase().includes(q);
      const matchFamily = item.wordFamily?.some((wf) => wf.toLowerCase().includes(q));
      const matchForms = item.forms.some(
        (f) =>
          f.meaning?.toLowerCase().includes(q) ||
          f.pattern?.toLowerCase().includes(q) ||
          f.collocation?.toLowerCase().includes(q) ||
          f.phrase?.toLowerCase().includes(q) ||
          f.example?.toLowerCase().includes(q)
      );
      if (!matchWord && !matchMeaning && !matchFamily && !matchForms) return false;
    }

    return true;
  });

  // Dynamic metrics calculated from actual vocabulary data
  const totalPatternsCount = vocabList.reduce(
    (acc, w) => acc + (w.forms?.filter((f) => f.type === 'pattern' || (f.pattern && !f.collocation)).length || 0),
    0
  );
  const totalCollocationsCount = vocabList.reduce(
    (acc, w) => acc + (w.forms?.filter((f) => f.type === 'collocation' || (f.collocation && !f.pattern)).length || 0),
    0
  );
  const academicCount = vocabList.filter(
    (w) => w.categories?.includes('IELTS Acad') || w.pos === 'adj' || w.pos === 'adv'
  ).length;
  const academicPercentage = vocabList.length > 0 ? Math.round((academicCount / vocabList.length) * 100) : 0;

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
      case 'idiom':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 font-bold text-xs border border-amber-300">
            (idiom)
          </span>
        );
      case 'adv':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-pos-adv-bg text-pos-adv-text font-bold text-xs">
            (adv)
          </span>
        );
      case 'phrasal_verb':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-teal-50 text-teal-800 font-bold text-xs border border-teal-200">
            (phr v)
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

  return (
    <div className="flex flex-col w-full pb-16">
      {/* TOP STATS & MASTHEAD SECTION */}
      <section className="p-6 lg:p-8 flex flex-col gap-6 bg-white border-b border-slate-line/80">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Title & Breadcrumb */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5 text-xs text-text-muted">
              <span>LinearVocab</span>
              <span className="material-symbols-outlined text-[14px] text-text-disabled">chevron_right</span>
              <span className="text-crimson-primary font-semibold">Kho từ vựng trung tâm</span>
            </div>

            <div className="flex items-baseline gap-3 flex-wrap">
              <h1 className="font-headline text-2xl lg:text-3xl font-extrabold text-text-high-contrast tracking-tight">
                Tất cả từ vựng
              </h1>
              <span className="font-headline text-lg text-text-muted font-normal">
                (Master Vocabulary List)
              </span>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-crimson-subtle border border-border-crimson-tint/50">
                <span className="w-2 h-2 rounded-full bg-crimson-primary animate-pulse"></span>
                <span className="text-xs font-bold text-crimson-dark">
                  {filteredList.length} / {vocabList.length} từ vựng hoạt động
                </span>
              </div>
            </div>

            <p className="text-xs text-text-muted max-w-2xl leading-relaxed">
              Hệ thống cấu trúc từ vựng ma trận theo phương pháp Linearthinking. Phân bổ đa tầng nghĩa, ngữ cảnh collocation và mẫu câu ứng dụng chuẩn hóa.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="flex items-center p-1 bg-canvas-slate rounded-lg border border-slate-line/80">
              <button
                type="button"
                onClick={() => alert('Đang xuất danh sách từ vựng ra file Excel...')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-text-body hover:bg-white hover:shadow-xs transition-all"
              >
                <span className="material-symbols-outlined text-[16px] text-text-muted">ios_share</span>
                <span>Xuất Excel</span>
              </button>
              <button
                type="button"
                onClick={() => alert('Vui lòng chọn file CSV hoặc Excel để nhập từ vựng')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-text-body hover:bg-white hover:shadow-xs transition-all"
              >
                <span className="material-symbols-outlined text-[16px] text-text-muted">file_upload</span>
                <span>Nhập file</span>
              </button>
            </div>

            <button
              type="button"
              onClick={onOpenAddModal}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-crimson-primary text-white hover:bg-crimson-dark shadow-sm shadow-red-200 text-xs font-bold transition-all transform active:scale-[0.98]"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              <span>Thêm Từ Mới (Add Vocab)</span>
            </button>
          </div>
        </div>

        {/* METRICS & LEARNING ANALYTICS BANNER */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          {/* Card 1 */}
          <div className="p-4 rounded-xl bg-canvas-slate border border-slate-line/80 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold tracking-wider text-text-muted uppercase">TỔNG MẪU PATTERN</span>
              <span className="font-headline text-2xl font-extrabold text-text-high-contrast leading-none mt-1.5">
                {totalPatternsCount}
              </span>
              <span className="text-[11px] font-semibold text-pos-adj-text mt-1.5 flex items-center gap-0.5">
                <span className="material-symbols-outlined text-[14px]">pattern</span> Cấu trúc câu thực tế
              </span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-pos-noun-bg flex items-center justify-center text-pos-noun-text">
              <span className="material-symbols-outlined text-[22px]">account_tree</span>
            </div>
          </div>

          {/* Card 2 */}
          <div className="p-4 rounded-xl bg-canvas-slate border border-slate-line/80 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold tracking-wider text-text-muted uppercase">COLLOCATIONS CHUẨN</span>
              <span className="font-headline text-2xl font-extrabold text-text-high-contrast leading-none mt-1.5">
                {totalCollocationsCount}
              </span>
              <span className="text-[11px] text-text-muted mt-1.5">Cụm từ cố định</span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-surface-container flex items-center justify-center text-collocation-indigo">
              <span className="material-symbols-outlined text-[22px]">hub</span>
            </div>
          </div>

          {/* Card 3 */}
          <div className="p-4 rounded-xl bg-canvas-slate border border-slate-line/80 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold tracking-wider text-text-muted uppercase">TỪ VỰNG HỌC THUẬT</span>
              <span className="font-headline text-2xl font-extrabold text-text-high-contrast leading-none mt-1.5">
                {academicPercentage}%
              </span>
              <span className="text-[11px] font-semibold text-crimson-dark mt-1.5">IELTS &amp; Academic</span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-surface-crimson-soft flex items-center justify-center text-crimson-primary">
              <span className="material-symbols-outlined text-[22px]">grade</span>
            </div>
          </div>

          {/* Card 4 */}
          <div className="p-4 rounded-xl bg-canvas-slate border border-slate-line/80 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold tracking-wider text-text-muted uppercase">HỆ THỐNG PHÁT ÂM</span>
              <span className="font-headline text-2xl font-extrabold text-text-high-contrast leading-none mt-1.5">
                {vocabList.length > 0 ? '100%' : '0%'}
              </span>
              <span className="text-[11px] font-semibold text-pos-adj-text mt-1.5 flex items-center gap-0.5">
                <span className="material-symbols-outlined text-[14px]">volume_up</span> Tích hợp Web Speech IPA
              </span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-pos-adj-bg flex items-center justify-center text-pos-adj-text">
              <span className="material-symbols-outlined text-[22px]">verified</span>
            </div>
          </div>
        </div>
      </section>

      {/* SEARCH, FILTERS & TABLE CONTROLS */}
      <section className="px-6 lg:px-8 py-5 flex flex-col gap-4">
        {/* Toolbar */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-line/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-text-high-contrast">
              Hiển thị: <span className="text-crimson-primary">{filteredList.length}</span> từ vựng
            </span>
            {selectedCategory && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-surface-crimson-subtle text-crimson-primary font-semibold flex items-center gap-1">
                Danh mục: {selectedCategory}
              </span>
            )}
            {selectedPos && selectedPos !== 'all' && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold uppercase">
                Từ loại: {selectedPos}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="inline-flex rounded-lg bg-canvas-slate p-0.5 border border-slate-line">
              <button
                type="button"
                onClick={() => setViewDensity('cards')}
                className={`px-3 py-1 rounded text-xs font-semibold flex items-center gap-1 ${
                  viewDensity === 'cards' ? 'bg-white shadow-xs text-crimson-primary' : 'text-text-muted'
                }`}
              >
                <span className="material-symbols-outlined text-[15px]">view_agenda</span>
                <span>Dạng thẻ</span>
              </button>
              <button
                type="button"
                onClick={() => setViewDensity('detailed')}
                className={`px-3 py-1 rounded text-xs font-semibold flex items-center gap-1 ${
                  viewDensity === 'detailed' ? 'bg-white shadow-xs text-crimson-primary' : 'text-text-muted'
                }`}
              >
                <span className="material-symbols-outlined text-[15px]">table_rows</span>
                <span>Ma trận chi tiết</span>
              </button>
              <button
                type="button"
                onClick={() => setViewDensity('compact')}
                className={`px-3 py-1 rounded text-xs font-semibold flex items-center gap-1 ${
                  viewDensity === 'compact' ? 'bg-white shadow-xs text-crimson-primary' : 'text-text-muted'
                }`}
              >
                <span className="material-symbols-outlined text-[15px]">view_headline</span>
                <span>Thu gọn</span>
              </button>
            </div>
          </div>
        </div>

        {viewDensity === 'cards' ? (
          <div className="flex flex-col gap-4">
            {filteredList.map((item) => (
              <VocabCard
                key={item.id}
                vocab={item}
                onPronounce={onPronounce}
                onEdit={onEditVocab}
                onDelete={onDeleteVocab}
                showReadingList={true}
              />
            ))}
            {filteredList.length === 0 && (
              <div className="p-14 text-center bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col items-center justify-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-surface-crimson-subtle flex items-center justify-center text-crimson-primary">
                  <span className="material-symbols-outlined text-[28px]">menu_book</span>
                </div>
                <p className="font-bold text-sm text-text-high-contrast">Chưa có từ vựng nào phù hợp</p>
              </div>
            )}
          </div>
        ) : (
        /* MULTI-LAYERED SPREADSHEET TABLE */
        <div className="bg-white rounded-xl border border-slate-line/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              {/* Header */}
              <thead>
                <tr className="bg-slate-50 border-b border-slate-line text-[11px] font-bold text-text-muted uppercase tracking-wider">
                  <th className="py-3.5 px-4 w-[18%]">Từ vựng &amp; Phân loại</th>
                  <th className="py-3.5 px-3 w-[10%]">Từ loại</th>
                  <th className="py-3.5 px-3 w-[26%]">Mẫu Cấu Trúc / Collocation</th>
                  <th className="py-3.5 px-3 w-[14%]">Từ đồng nghĩa</th>
                  <th className="py-3.5 px-4 w-[28%]">Nghĩa Tiếng Việt &amp; Ngữ cảnh</th>
                  <th className="py-3.5 px-2 w-[4%] text-right"></th>
                </tr>
              </thead>

              {/* Body with Row Spanning */}
              <tbody className="divide-y divide-slate-line">
                {filteredList.map((item) => {
                  const totalRows = item.forms.reduce(
                    (acc, f) =>
                      acc + (viewDensity === 'detailed' && (f.note || f.example) ? 2 : 1),
                    0
                  );
                  let isFirstRowOfWord = true;

                  return item.forms.map((form, index) => {
                    const renderWordCell = isFirstRowOfWord;
                    isFirstRowOfWord = false;
                    const hasSubRow =
                      viewDensity === 'detailed' && Boolean(form.note || form.example);

                    const isPhrasal =
                      form.type === 'phrasal_verb' ||
                      form.pos === 'phrasal_verb' ||
                      item.pos === 'phrasal_verb' ||
                      Boolean(form.phrase);
                    const isColloc =
                      !isPhrasal &&
                      (form.type === 'collocation' ||
                      (!form.pattern && Boolean(form.collocation)));
                    const isPatt =
                      !isPhrasal &&
                      (form.type === 'pattern' ||
                      (Boolean(form.pattern) && !form.collocation));

                    return (
                      <React.Fragment key={`${item.id}-${index}`}>
                        <tr
                          className={`hover:bg-red-50/15 transition-colors ${
                            renderWordCell ? 'border-t-2 border-slate-100' : ''
                          } ${!hasSubRow ? 'border-b border-slate-line/80' : ''}`}
                        >
                          {/* Word Column (Span across sub-rows) */}
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

                                {item.readingListName && (
                                  <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold bg-surface-crimson-subtle text-crimson-primary w-fit">
                                    {item.readingListName}
                                  </span>
                                )}

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

                          {/* Part of Speech */}
                          <td className="py-3 px-3 align-middle">
                            {getPosBadge(form.pos, form.countability)}
                          </td>

                          {/* Pattern / Collocation / Phrasal Verb */}
                          <td className="py-3 px-3 align-middle">
                            {isPhrasal && (
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-teal-50 text-teal-700 border border-teal-200/80">
                                  <span className="material-symbols-outlined text-[12px]">extension</span>
                                  Phrasal Verb
                                </span>
                                <span className="font-mono text-[11px] font-bold text-teal-900 bg-teal-50/70 px-2 py-0.5 rounded border border-teal-100">
                                  {form.phrase || form.collocation || form.pattern || item.word}
                                </span>
                              </div>
                            )}

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
                            {!isPhrasal && !isColloc && !isPatt && form.pattern && form.collocation && (
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

                            {!isPhrasal && !isColloc && !isPatt && !form.pattern && !form.collocation && (
                              form.type === 'idiom' ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200">
                                  <span className="material-symbols-outlined text-[12px]">auto_stories</span>
                                  Idiom / Cụm từ
                                </span>
                              ) : (
                                <span className="text-text-disabled italic">—</span>
                              )
                            )}
                          </td>

                          {/* Synonym */}
                          <td className="py-3 px-3 align-middle text-text-muted text-[11px]">
                            {form.synonym || <span className="text-text-disabled italic">—</span>}
                          </td>

                          {/* Meaning */}
                          <td className="py-3 px-4 align-middle">
                            <span className="font-semibold text-text-high-contrast text-xs leading-snug">
                              {form.meaning || item.meaning}
                            </span>
                          </td>

                          {/* Action buttons (only on first row) */}
                          <td className="py-3 px-3 text-right align-middle">
                            {renderWordCell && (
                              <div className="flex items-center justify-end gap-1 text-text-muted">
                                <button
                                  type="button"
                                  onClick={() => onDeleteVocab(item.id)}
                                  title="Xóa từ vựng"
                                  className="w-7 h-7 rounded flex items-center justify-center hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                                >
                                  <span className="material-symbols-outlined text-[16px]">delete</span>
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>

                        {/* Note & Example Row: 40% Ghi chú (trái) - 60% Ví dụ (phải) */}
                        {hasSubRow && (
                          <tr
                            key={`${item.id}-${index}-subrow`}
                            className="hover:bg-red-50/15 transition-colors border-b border-slate-line/80"
                          >
                            <td colSpan={5} className="py-2.5 px-4 bg-slate-50/50">
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

                {filteredList.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-16 text-center text-text-muted">
                      <div className="flex flex-col items-center justify-center gap-3 max-w-sm mx-auto">
                        <div className="w-12 h-12 rounded-2xl bg-surface-crimson-subtle flex items-center justify-center text-crimson-primary">
                          <span className="material-symbols-outlined text-[28px]">
                            {vocabList.length === 0 ? 'menu_book' : 'search_off'}
                          </span>
                        </div>
                        <div>
                          <p className="font-bold text-sm text-text-high-contrast">
                            {vocabList.length === 0 ? 'Chưa có từ vựng nào' : 'Không tìm thấy từ vựng nào phù hợp'}
                          </p>
                          <p className="text-xs text-text-muted mt-1 leading-relaxed">
                            {vocabList.length === 0
                              ? 'Hệ thống đã sẵn sàng. Hãy bấm nút "+ Thêm Từ Mới" để bắt đầu xây dựng kho từ vựng Linearthinking của bạn.'
                              : 'Thử thay đổi từ khóa tìm kiếm hoặc bỏ chọn các bộ lọc.'}
                          </p>
                        </div>
                        {vocabList.length === 0 && (
                          <button
                            type="button"
                            onClick={onOpenAddModal}
                            className="mt-1 flex items-center gap-1.5 px-4 py-2 rounded-lg bg-crimson-primary text-white text-xs font-bold hover:bg-crimson-dark shadow-xs"
                          >
                            <span className="material-symbols-outlined text-[16px]">add</span>
                            <span>Thêm Từ Đầu Tiên</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        )}
      </section>
    </div>
  );
}
