import React from 'react';
import VocabCard from '../../vocabulary/components/VocabCard';

export default function ReadingListView({
  readingList,
  vocabList,
  onOpenAddModal,
  onPronounce,
  onEditVocab,
  onDeleteVocab,
  onDeleteReadingList,
  onUpdateReadingList,
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

  const [showPassage, setShowPassage] = React.useState(Boolean(readingList?.passage));
  const [isEditing, setIsEditing] = React.useState(false);
  const [editCode, setEditCode] = React.useState(readingList?.code || readingList?.shortTitle || '');
  const [editTitle, setEditTitle] = React.useState(readingList?.title || '');
  const [editSource, setEditSource] = React.useState(readingList?.sourceReference || '');
  const [editNote, setEditNote] = React.useState(readingList?.note || '');

  // Reset and sync state when readingList changes
  React.useEffect(() => {
    setIsEditing(false);
    setEditCode(readingList?.code || readingList?.shortTitle || '');
    setEditTitle(readingList?.title || '');
    setEditSource(readingList?.sourceReference || '');
    setEditNote(readingList?.note || '');
  }, [readingList?.id]);

  const handleStartEdit = () => {
    setEditCode(readingList?.code || readingList?.shortTitle || '');
    setEditTitle(readingList?.title || '');
    setEditSource(readingList?.sourceReference || '');
    setEditNote(readingList?.note || '');
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setEditCode(readingList?.code || readingList?.shortTitle || '');
    setEditTitle(readingList?.title || '');
    setEditSource(readingList?.sourceReference || '');
    setEditNote(readingList?.note || '');
    setIsEditing(false);
  };

  const handleSaveEdit = React.useCallback(async () => {
    const trimmedTitle = (editTitle || '').trim();
    if (!trimmedTitle) {
      alert('Vui lòng nhập tiêu đề danh mục bài đọc!');
      return;
    }

    const payload = {
      code: (editCode || '').trim(),
      title: trimmedTitle,
      sourceReference: (editSource || '').trim(),
      note: (editNote || '').trim(),
      passage: readingList?.passage || '',
    };

    if (onUpdateReadingList && readingList?.id) {
      await onUpdateReadingList(readingList.id, payload);
    }
    setIsEditing(false);
  }, [editCode, editTitle, editSource, editNote, readingList, onUpdateReadingList]);

  const handleToggleEdit = () => {
    if (isEditing) {
      handleSaveEdit();
    } else {
      handleStartEdit();
    }
  };

  // Keyboard shortcut: Ctrl + S / Cmd + S to save, Escape to cancel
  React.useEffect(() => {
    if (!isEditing) return;

    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleSaveEdit();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleCancelEdit();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEditing, handleSaveEdit]);

  if (!readingList) return null;

  // 1. Toàn bộ từ vựng thuộc về danh sách bài đọc này (chưa áp bộ lọc POS / tìm kiếm)
  const seenAllKeys = new Set();
  const allReadingListWords = vocabList.filter((item) => {
    const key = item.id ? `id-${item.id}` : `word-${item.word?.toLowerCase()}`;
    if (seenAllKeys.has(key)) return false;
    seenAllKeys.add(key);

    return (
      item.readingListId === readingList.id ||
      item.readingListName === readingList.shortTitle ||
      item.readingListName === readingList.code ||
      item.readingListName === readingList.title ||
      item.readingListName === readingList.fullTitle ||
      (item.noteLists && item.noteLists.some((nl) => nl.id === readingList.id))
    );
  });

  // 2. Danh sách từ vựng sau khi áp dụng bộ lọc loại từ (POS) và tìm kiếm
  const listWords = allReadingListWords.filter((item) => {
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


  const totalCollocationsCount = listWords.reduce(
    (acc, w) => acc + w.forms.filter((f) => f.type === 'collocation' || (f.collocation && !f.pattern)).length,
    0
  );

  const displayTitle = readingList.title || readingList.fullTitle || 'Danh sách bài đọc';
  const displayCode = readingList.code || readingList.shortTitle || 'LIST';

  return (
    <div className="flex flex-col w-full pb-16">
      <div className="p-6 lg:p-8 max-w-[1600px] mx-auto w-full flex flex-col gap-6">
        {/* TOP BANNER / READING HEADER CARD (Gradient Đỏ Nhạt Chuẩn EdTech) */}
        <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#c41b26] via-[#d3212c] to-[#c61e27] shadow-lg border border-red-500/25 p-6 lg:p-7 transition-all text-white">
          {/* Decorative glowing halos in background */}
          <div className="absolute -left-12 -top-12 w-80 h-80 bg-white/15 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -right-12 -bottom-12 w-72 h-72 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute left-1/4 -top-12 w-64 h-64 bg-white/10 rounded-full blur-xl pointer-events-none" />

          {/* Decorative concentric ripples */}
          <svg
            className="absolute -left-12 -top-12 w-96 h-96 opacity-15 pointer-events-none text-white"
            viewBox="0 0 200 200"
          >
            <circle cx="100" cy="100" r="25" fill="none" stroke="currentColor" strokeWidth="1" />
            <circle cx="100" cy="100" r="50" fill="none" stroke="currentColor" strokeWidth="1" />
            <circle cx="100" cy="100" r="75" fill="none" stroke="currentColor" strokeWidth="1" />
            <circle cx="100" cy="100" r="100" fill="none" stroke="currentColor" strokeWidth="1" />
          </svg>

          <div className="flex flex-col lg:flex-row lg:items-stretch lg:justify-between gap-6 relative z-10">
            {/* Cột trái: Tiêu đề + Mô tả + 4 Thẻ thống kê */}
            <div className="flex flex-col justify-between flex-1 min-w-0 pr-0 lg:pr-4">
              {/* Title & Description */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3 flex-wrap">
                  {isEditing ? (
                    <input
                      type="text"
                      value={editCode}
                      onChange={(e) => setEditCode(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleSaveEdit();
                        }
                      }}
                      placeholder="MÃ"
                      className="w-20 px-2 py-1 rounded-md bg-yellow-400/35 text-yellow-100 placeholder-yellow-200/50 text-xs font-black uppercase tracking-wider border border-yellow-300/80 backdrop-blur-xs text-center focus:outline-none focus:ring-1 focus:ring-yellow-200 focus:bg-yellow-400/45 shadow-[0_0_14px_rgba(250,204,21,0.35)] transition-all"
                      title="Mã danh mục (nhấn Enter hoặc cây bút để lưu)"
                    />
                  ) : (
                    <span className="px-2.5 py-1 rounded-md bg-yellow-400/35 text-yellow-100 text-xs font-black uppercase tracking-wider border border-yellow-300/70 backdrop-blur-xs shrink-0 select-none shadow-[0_0_14px_rgba(250,204,21,0.35)]">
                      {displayCode}
                    </span>
                  )}

                  {isEditing ? (
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleSaveEdit();
                        }
                      }}
                      placeholder="Nhập tiêu đề danh mục..."
                      className="font-headline text-xl lg:text-2xl font-black text-white tracking-tight leading-none bg-transparent border-b-2 border-white/50 focus:border-white focus:outline-none px-1 py-0.5 transition-all flex-1 min-w-[200px] max-w-lg drop-shadow-xs"
                      autoFocus
                    />
                  ) : (
                    <h1 className="font-headline text-xl lg:text-2xl font-black text-white tracking-tight leading-none drop-shadow-xs">
                      {displayTitle}
                    </h1>
                  )}

                  <div className="ml-auto flex items-center gap-2">
                    {isEditing ? (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-semibold backdrop-blur-xs border border-white/35 focus-within:border-white focus-within:bg-white/30 shadow-xs transition-all">
                        <span className="material-symbols-outlined text-[14px]">menu_book</span>
                        <input
                          type="text"
                          value={editSource}
                          onChange={(e) => setEditSource(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleSaveEdit();
                            }
                          }}
                          placeholder="Nguồn..."
                          className="bg-transparent text-white placeholder-white/50 text-xs font-semibold focus:outline-none w-28 sm:w-36 transition-all"
                        />
                      </div>
                    ) : (
                      readingList.sourceReference && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-semibold backdrop-blur-xs border border-white/30 shadow-xs">
                          <span className="material-symbols-outlined text-[14px]">menu_book</span>
                          <span>{readingList.sourceReference}</span>
                        </span>
                      )
                    )}

                    {isEditing ? (
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        title="Hủy chỉnh sửa (Esc)"
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-white/80 hover:text-white hover:bg-white/20 transition-all cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[18px]">close</span>
                      </button>
                    ) : (
                      onDeleteReadingList && (
                        <button
                          type="button"
                          onClick={() => onDeleteReadingList(readingList.id)}
                          title="Xóa danh sách bài đọc này"
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-white/80 hover:text-white hover:bg-white/20 transition-colors cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      )
                    )}

                    <button
                      type="button"
                      onClick={handleToggleEdit}
                      title={isEditing ? 'Lưu thay đổi (Ctrl + S hoặc click vào đây)' : 'Chỉnh sửa danh mục bài đọc'}
                      className={
                        'w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200 cursor-pointer ' +
                        (isEditing
                          ? 'bg-emerald-500 text-white shadow-md ring-2 ring-emerald-300 hover:bg-emerald-600 scale-105'
                          : 'text-white/80 hover:text-white hover:bg-white/20')
                      }
                    >
                      <span className="material-symbols-outlined text-[18px]">edit</span>
                    </button>
                  </div>
                </div>

                {isEditing ? (
                  <div className="flex items-center gap-3 w-full max-w-2xl mt-0.5">
                    <input
                      type="text"
                      value={editNote}
                      onChange={(e) => setEditNote(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleSaveEdit();
                        }
                      }}
                      placeholder="Ghi chú / mô tả danh mục bài đọc..."
                      className="text-xs text-white/95 placeholder-white/40 font-normal bg-transparent border-b border-white/30 focus:border-white focus:outline-none px-1 py-0.5 flex-1 transition-all"
                    />
                    <span className="text-[11px] text-white/60 shrink-0 font-medium select-none">
                      (Nhấn <b>Enter</b> hoặc <b>Ctrl+S</b> để lưu)
                    </span>
                  </div>
                ) : (
                  readingList.note && readingList.note.trim() ? (
                    <p className="text-xs text-white/90 leading-relaxed font-normal">
                      {readingList.note}
                    </p>
                  ) : null
                )}
              </div>

              {/* Lưới 4 Thẻ thống kê trong suốt kiểu kính mờ (Frosted Glass như badge Cambridge) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4">
                {/* Thẻ 1: Total Words */}
                <div className="bg-white/15 hover:bg-white/20 transition-colors rounded-xl p-3 flex items-center gap-3 border border-white/25 backdrop-blur-xs shadow-xs">
                  <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center text-white shrink-0 border border-white/20">
                    <span className="material-symbols-outlined text-[20px]">format_list_bulleted</span>
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-white/80 truncate">Total Words</span>
                    <span className="font-headline text-lg font-black text-white leading-none mt-0.5">
                      {allReadingListWords.length || readingList.count || 0}
                    </span>
                  </div>
                </div>

                {/* Thẻ 2: High Band Words */}
                <div className="bg-white/15 hover:bg-white/20 transition-colors rounded-xl p-3 flex items-center gap-3 border border-white/25 backdrop-blur-xs shadow-xs">
                  <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center text-white shrink-0 border border-white/20">
                    <span className="material-symbols-outlined text-[20px]">workspace_premium</span>
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-white/80 truncate">High Band Words</span>
                    <span className="font-headline text-lg font-black text-white leading-none mt-0.5">
                      {readingList.highBandWords || 0}
                    </span>
                  </div>
                </div>

                {/* Thẻ 3: Collocations */}
                <div className="bg-white/15 hover:bg-white/20 transition-colors rounded-xl p-3 flex items-center gap-3 border border-white/25 backdrop-blur-xs shadow-xs">
                  <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center text-white shrink-0 border border-white/20">
                    <span className="material-symbols-outlined text-[20px]">hub</span>
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-white/80 truncate">Collocations</span>
                    <span className="font-headline text-lg font-black text-white leading-none mt-0.5">
                      {totalCollocationsCount || readingList.collocations || 0}
                    </span>
                  </div>
                </div>

                {/* Thẻ 4: Mastery Level */}
                <div className="bg-white/15 hover:bg-white/20 transition-colors rounded-xl p-3 flex items-center justify-between border border-white/25 backdrop-blur-xs shadow-xs">
                  <div className="flex flex-col min-w-0">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-white/80 truncate">Mastery Level</span>
                    <span className="font-headline text-lg font-black text-white leading-none mt-0.5">
                      {readingList.masteryLevel || 0}%
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
                        strokeDasharray={`${readingList.masteryLevel || 0}, 100`}
                        strokeLinecap="round"
                        strokeWidth="3"
                      />
                    </svg>
                    <span className="absolute text-[9px] font-bold text-white">%</span>
                  </div>
                </div>
              </div>
            </div>
            {/* Cột phải: 3 Nút hành động (Nền trắng, hiệu ứng ánh sáng xám quét qua nút khi hover) */}
            <div className="flex flex-col justify-between gap-2.5 shrink-0 w-full sm:w-auto lg:w-[210px]">
              <button
                type="button"
                onClick={() => alert('Khởi động chế độ Luyện Flashcard cho danh sách này!')}
                className="group relative overflow-hidden inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold border border-white/60 hover:border-white shadow-xs hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99]"
              >
                {/* Vệt ánh sáng xám quét qua nút */}
                <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-slate-300/40 to-transparent transition-transform duration-700 ease-in-out pointer-events-none" />

                <span className="material-symbols-outlined text-[18px] text-crimson-primary transition-transform duration-300 group-hover:scale-110 relative z-10">style</span>
                <span className="relative z-10">Luyện Flashcard ({listWords.length} từ)</span>
              </button>

              <button
                type="button"
                onClick={() => alert('Khởi động bài kiểm tra trắc nghiệm Quiz!')}
                className="group relative overflow-hidden inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold border border-white/60 hover:border-white shadow-xs hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99]"
              >
                {/* Vệt ánh sáng xám quét qua nút */}
                <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-slate-300/40 to-transparent transition-transform duration-700 ease-in-out pointer-events-none" />

                <span className="material-symbols-outlined text-[18px] text-crimson-primary transition-transform duration-300 group-hover:scale-110 relative z-10">quiz</span>
                <span className="relative z-10">Làm bài Quiz kiểm tra</span>
              </button>

              <button
                type="button"
                onClick={onOpenAddModal}
                className="group relative overflow-hidden inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-crimson-primary text-xs font-black border border-white/60 hover:border-white shadow-xs hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99]"
              >
                {/* Vệt ánh sáng xám quét qua nút */}
                <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-slate-300/40 to-transparent transition-transform duration-700 ease-in-out pointer-events-none" />

                <span className="material-symbols-outlined text-[19px] text-crimson-primary transition-transform duration-300 group-hover:scale-110 relative z-10">add_circle</span>
                <span className="relative z-10">Thêm từ vào List này</span>
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

        {/* SEARCH & POS FILTERS TOOLBAR */}
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

        {/* VOCABULARY CARDS LIST */}
        <div className="flex flex-col gap-4">
          {listWords.map((item) => (
            <VocabCard
              key={item.id}
              vocab={item}
              onPronounce={onPronounce}
              onEdit={onEditVocab}
              onDelete={onDeleteVocab}
              showReadingList={false}
            />
          ))}

          {listWords.length === 0 && (
            <div className="p-14 text-center bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col items-center justify-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-surface-crimson-subtle flex items-center justify-center text-crimson-primary">
                <span className="material-symbols-outlined text-[28px]">
                  {allReadingListWords.length > 0 ? 'filter_alt_off' : 'article'}
                </span>
              </div>
              <div>
                <p className="font-bold text-sm text-text-high-contrast">
                  {allReadingListWords.length > 0
                    ? 'Không có từ vựng nào phù hợp với bộ lọc'
                    : 'Chưa có từ vựng nào trong danh sách này'}
                </p>
                <p className="text-xs text-text-muted mt-1 leading-relaxed">
                  {allReadingListWords.length > 0
                    ? 'Bạn đang chọn bộ lọc loại từ hoặc tìm kiếm khiến từ vựng không khớp. Bấm nút bên dưới để xem lại tất cả.'
                    : 'Bấm nút "Thêm từ vào List này" phía trên để lưu từ vựng kèm ngữ cảnh câu đọc.'}
                </p>
              </div>
              {allReadingListWords.length > 0 ? (
                <button
                  type="button"
                  onClick={() => {
                    if (setSelectedPos) setSelectedPos('all');
                    if (setSearchTerm) setSearchTerm('');
                  }}
                  className="mt-1 flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-text-body text-xs font-bold transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">clear_all</span>
                  <span>Xem tất cả ({allReadingListWords.length} từ)</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onOpenAddModal}
                  className="mt-1 flex items-center gap-1.5 px-4 py-2 rounded-lg bg-crimson-primary text-white text-xs font-bold hover:bg-crimson-dark shadow-xs cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">add</span>
                  <span>Thêm từ vào List này</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
