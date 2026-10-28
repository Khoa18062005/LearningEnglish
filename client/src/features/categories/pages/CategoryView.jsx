import React, { useState, useEffect, useMemo } from 'react';
import VocabCard from '../../vocabulary/components/VocabCard';

export default function CategoryView({
  category,
  vocabList = [],
  onOpenAddModal,
  onPronounce,
  onEditVocab,
  onDeleteVocab,
  onEditCategory,
  onDeleteCategory,
  searchTerm = '',
  setSearchTerm,
  selectedPos = 'all',
  setSelectedPos,
}) {
  const posOptions = [
    { id: 'all', label: 'Tất cả', colorClass: 'text-text-body' },
    { id: 'n', label: 'Danh từ (N)', colorClass: 'text-pos-noun-text hover:bg-pos-noun-bg' },
    { id: 'v', label: 'Động từ (V)', colorClass: 'text-pos-verb-text hover:bg-pos-verb-bg' },
    { id: 'adj', label: 'Tính từ (Adj)', colorClass: 'text-pos-adj-text hover:bg-pos-adj-bg' },
    { id: 'adv', label: 'Trạng từ (Adv)', colorClass: 'text-pos-adv-text hover:bg-pos-adv-bg' },
    { id: 'phrasal_verb', label: 'Cụm ĐT (Phrasal Verb)', colorClass: 'text-teal-700 hover:bg-teal-50' },
    { id: 'idiom', label: 'Cụm từ (Idioms)', colorClass: 'text-amber-800 hover:bg-amber-50' },
  ];

  if (!category) return null;

  // Filter words that belong to this category (de-duplicated)
  const categoryWords = useMemo(() => {
    const seenKeys = new Set();
    return vocabList.filter((item) => {
      const key = item.id ? `id-${item.id}` : `word-${item.word?.toLowerCase()}`;
      if (seenKeys.has(key)) return false;
      seenKeys.add(key);

      const inCategory =
        Array.isArray(item.categories) &&
        item.categories.some((c) => {
          if (typeof c === 'string') {
            return c.toLowerCase() === category.name.toLowerCase();
          }
          if (c && c.name) {
            return c.name.toLowerCase() === category.name.toLowerCase();
          }
          return false;
        });

      if (!inCategory) return false;

      // Filter by POS if selected
      if (selectedPos && selectedPos !== 'all') {
        const hasPos = item.pos === selectedPos || item.forms?.some((f) => f.pos === selectedPos);
        if (!hasPos) return false;
      }

      // Filter by search query if present
      if (searchTerm && searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchWord = item.word?.toLowerCase().includes(q);
        const matchMeaning = item.meaning?.toLowerCase().includes(q);
        const matchFamily = item.wordFamily?.some((wf) => wf.toLowerCase().includes(q));
        const matchForms = item.forms?.some(
          (f) =>
            f.meaning?.toLowerCase().includes(q) ||
            f.pattern?.toLowerCase().includes(q) ||
            f.collocation?.toLowerCase().includes(q) ||
            f.example?.toLowerCase().includes(q)
        );
        if (!matchWord && !matchMeaning && !matchFamily && !matchForms) return false;
      }

      return true;
    });
  }, [vocabList, category.name, selectedPos, searchTerm]);

  // Derived metrics
  const totalCollocationsCount = useMemo(() => {
    return categoryWords.reduce(
      (acc, w) => acc + (w.forms?.filter((f) => f.type === 'collocation' || (f.collocation && !f.pattern)).length || 0),
      0
    );
  }, [categoryWords]);

  const highBandWordsCount = useMemo(() => {
    return categoryWords.filter(
      (w) =>
        w.categories?.includes('IELTS Acad') ||
        w.pos === 'adj' ||
        w.pos === 'adv' ||
        w.forms?.some((f) => f.pattern || f.collocation)
    ).length;
  }, [categoryWords]);

  const masteryLevel = categoryWords.length > 0 ? Math.min(100, Math.round((highBandWordsCount / categoryWords.length) * 100)) : 0;


  return (
    <div className="flex flex-col w-full pb-16">
      <div className="p-6 lg:p-8 max-w-[1600px] mx-auto w-full flex flex-col gap-6">
        
        {/* ======================================================== */}
        {/* TOP HERO BANNER CARD (GIỐNG THẺ LIST ĐỎ GRADIENT EDTECH) */}
        {/* ======================================================== */}
        <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#b91c1c] via-[#e31e24] to-[#ea384d] shadow-lg border border-red-500/20 p-6 lg:p-7 transition-all text-white">
          {/* Hiệu ứng hào quang tròn mềm mại phía sau */}
          <div className="absolute -right-16 -bottom-16 w-80 h-80 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute left-1/4 -top-16 w-64 h-64 bg-white/10 rounded-full blur-xl pointer-events-none" />

          <div className="flex flex-col lg:flex-row lg:items-stretch lg:justify-between gap-6 relative z-10">
            {/* Cột trái: Tiêu đề + Mô tả + 4 Thẻ thống kê */}
            <div className="flex flex-col justify-between flex-1 min-w-0 pr-0 lg:pr-4">
              {/* Title & Description */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3 flex-wrap">
                  {/* Badge CATEGORY vàng nổi bật chuẩn thẻ List */}
                  <span className="px-2.5 py-1 rounded-md bg-yellow-400/35 text-yellow-100 text-xs font-black uppercase tracking-wider border border-yellow-300/70 backdrop-blur-xs shrink-0 select-none shadow-[0_0_14px_rgba(250,204,21,0.35)]">
                    CATEGORY
                  </span>

                  <h1 className="font-headline text-xl lg:text-2xl font-black text-white tracking-tight leading-none drop-shadow-xs">
                    {category.name}
                  </h1>

                  <div className="ml-auto flex items-center gap-2">
                    {onDeleteCategory && (
                      <button
                        type="button"
                        onClick={() => onDeleteCategory(category)}
                        title="Xóa danh mục này"
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-white/80 hover:text-white hover:bg-white/20 transition-colors cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    )}

                    {onEditCategory && (
                      <button
                        type="button"
                        onClick={() => onEditCategory(category)}
                        title="Chỉnh sửa danh mục này"
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-white/80 hover:text-white hover:bg-white/20 transition-colors cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[18px]">edit</span>
                      </button>
                    )}
                  </div>
                </div>

                <p className="text-xs text-white/90 leading-relaxed font-normal mt-0.5">
                  {category.description || 'Bộ từ vựng thuộc danh mục phân loại theo phương pháp LinearThinking, phân tích ngữ cảnh, mẫu câu và collocations tương ứng.'}
                </p>
              </div>

              {/* Lưới 4 Thẻ thống kê trong suốt kiểu kính mờ (Frosted Glass) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4">
                {/* Thẻ 1: Total Words */}
                <div className="bg-white/15 hover:bg-white/20 transition-colors rounded-xl p-3 flex items-center gap-3 border border-white/25 backdrop-blur-xs shadow-xs">
                  <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center text-white shrink-0 border border-white/20">
                    <span className="material-symbols-outlined text-[20px]">format_list_bulleted</span>
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-white/80 truncate">TOTAL WORDS</span>
                    <span className="font-headline text-lg font-black text-white leading-none mt-0.5">
                      {categoryWords.length}
                    </span>
                  </div>
                </div>

                {/* Thẻ 2: High Band Words */}
                <div className="bg-white/15 hover:bg-white/20 transition-colors rounded-xl p-3 flex items-center gap-3 border border-white/25 backdrop-blur-xs shadow-xs">
                  <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center text-white shrink-0 border border-white/20">
                    <span className="material-symbols-outlined text-[20px]">workspace_premium</span>
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-white/80 truncate">HIGH BAND WORDS</span>
                    <span className="font-headline text-lg font-black text-white leading-none mt-0.5">
                      {highBandWordsCount}
                    </span>
                  </div>
                </div>

                {/* Thẻ 3: Collocations */}
                <div className="bg-white/15 hover:bg-white/20 transition-colors rounded-xl p-3 flex items-center gap-3 border border-white/25 backdrop-blur-xs shadow-xs">
                  <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center text-white shrink-0 border border-white/20">
                    <span className="material-symbols-outlined text-[20px]">hub</span>
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-white/80 truncate">COLLOCATIONS</span>
                    <span className="font-headline text-lg font-black text-white leading-none mt-0.5">
                      {totalCollocationsCount}
                    </span>
                  </div>
                </div>

                {/* Thẻ 4: Mastery Level */}
                <div className="bg-white/15 hover:bg-white/20 transition-colors rounded-xl p-3 flex items-center justify-between border border-white/25 backdrop-blur-xs shadow-xs">
                  <div className="flex flex-col min-w-0">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-white/80 truncate">MASTERY LEVEL</span>
                    <span className="font-headline text-lg font-black text-white leading-none mt-0.5">
                      {masteryLevel}%
                    </span>
                  </div>
                  {/* SVG Dial */}
                  <div className="relative w-8 h-8 flex items-center justify-center shrink-0">
                    <svg className="w-8 h-8 -rotate-90" viewBox="0 0 36 36">
                      <path
                        className="text-white/20"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                      />
                      <path
                        className="text-white"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="currentColor"
                        strokeDasharray={`${masteryLevel}, 100`}
                        strokeLinecap="round"
                        strokeWidth="3"
                      />
                    </svg>
                    <span className="absolute text-[9px] font-bold text-white">%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Cột phải: 3 Nút hành động */}
            <div className="flex flex-col justify-between gap-2.5 shrink-0 w-full sm:w-auto lg:w-[210px]">
              <button
                type="button"
                onClick={() => alert(`Khởi động chế độ Luyện Flashcard cho danh mục "${category.name}"!`)}
                className="group relative overflow-hidden inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold border border-white/60 hover:border-white shadow-xs hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] cursor-pointer"
              >
                <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-slate-300/40 to-transparent transition-transform duration-700 ease-in-out pointer-events-none" />
                <span className="material-symbols-outlined text-[18px] text-crimson-primary transition-transform duration-300 group-hover:scale-110 relative z-10">style</span>
                <span className="relative z-10">Luyện Flashcard ({categoryWords.length} từ)</span>
              </button>

              <button
                type="button"
                onClick={() => alert(`Khởi động bài kiểm tra Quiz cho danh mục "${category.name}"!`)}
                className="group relative overflow-hidden inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold border border-white/60 hover:border-white shadow-xs hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] cursor-pointer"
              >
                <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-slate-300/40 to-transparent transition-transform duration-700 ease-in-out pointer-events-none" />
                <span className="material-symbols-outlined text-[18px] text-crimson-primary transition-transform duration-300 group-hover:scale-110 relative z-10">quiz</span>
                <span className="relative z-10">Làm bài Quiz kiểm tra</span>
              </button>

              <button
                type="button"
                onClick={onOpenAddModal}
                className="group relative overflow-hidden inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-crimson-primary text-xs font-black border border-white/60 hover:border-white shadow-xs hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] cursor-pointer"
              >
                <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-slate-300/40 to-transparent transition-transform duration-700 ease-in-out pointer-events-none" />
                <span className="material-symbols-outlined text-[19px] text-crimson-primary transition-transform duration-300 group-hover:scale-110 relative z-10">add_circle</span>
                <span className="relative z-10">Thêm từ vựng mới</span>
              </button>
            </div>
          </div>
        </section>

        {/* ======================================================== */}
        {/* SEARCH & POS FILTERS TOOLBAR                             */}
        {/* ======================================================== */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          {/* Search Input (Bên trái) */}
          <div className="relative flex-1 min-w-[240px] max-w-sm">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-[19px]">
              search
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm && setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm từ vựng, pattern, collocation, nghĩa..."
              className="w-full h-10 pl-9 pr-8 bg-white rounded-xl text-xs text-text-high-contrast placeholder:text-text-disabled focus:outline-none focus:ring-2 focus:ring-crimson-primary/20 border border-slate-200/90 focus:border-crimson-primary shadow-xs transition-all"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm && setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-high-contrast text-xs cursor-pointer"
                title="Xóa tìm kiếm"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            )}
          </div>

          {/* POS Filter Pills (Sát mép phải) */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200/80 shadow-xs flex-wrap sm:ml-auto">
            {posOptions.map((opt) => {
              const isActive = selectedPos === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setSelectedPos && setSelectedPos(opt.id)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-white text-crimson-primary shadow-xs font-bold'
                      : `${opt.colorClass} text-text-muted hover:text-text-high-contrast`
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ======================================================== */}
        {/* VOCABULARY CARDS LIST                                    */}
        {/* ======================================================== */}
        <div className="flex flex-col gap-4">
          {categoryWords.map((item) => (
            <VocabCard
              key={item.id}
              vocab={item}
              onPronounce={onPronounce}
              onEdit={onEditVocab}
              onDelete={onDeleteVocab}
              showReadingList={true}
            />
          ))}

          {categoryWords.length === 0 && (
            <div className="p-14 text-center bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col items-center justify-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-surface-crimson-subtle flex items-center justify-center text-crimson-primary">
                <span className="material-symbols-outlined text-[28px]">article</span>
              </div>
              <div>
                <p className="font-bold text-sm text-text-high-contrast">
                  Chưa có từ vựng nào trong danh mục này
                </p>
                <p className="text-xs text-text-muted mt-1 leading-relaxed">
                  Bấm nút &ldquo;Thêm từ vựng mới&rdquo; phía trên để lưu từ vựng kèm ngữ cảnh câu đọc.
                </p>
              </div>
              <button
                type="button"
                onClick={onOpenAddModal}
                className="mt-1 flex items-center gap-1.5 px-4 py-2 rounded-lg bg-crimson-primary text-white text-xs font-bold hover:bg-crimson-dark shadow-xs cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">add</span>
                <span>Thêm từ vựng mới</span>
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
