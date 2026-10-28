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
  selectedPos = 'all',
}) {
  const [viewMode, setViewMode] = React.useState('cards');
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

  // Filter words that belong to this reading list (de-duplicated)
  const seenReadingWordKeys = new Set();
  const listWords = vocabList.filter((item) => {
    const key = item.id ? `id-${item.id}` : `word-${item.word.toLowerCase()}`;
    if (seenReadingWordKeys.has(key)) return false;
    seenReadingWordKeys.add(key);

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
      const matchMeaning = item.meaning?.toLowerCase().includes(q);
      const matchFamily = item.wordFamily?.some((wf) => wf.toLowerCase().includes(q));
      const matchForms = item.forms.some(
        (f) =>
          f.meaning.toLowerCase().includes(q) ||
          f.pattern?.toLowerCase().includes(q) ||
          f.collocation?.toLowerCase().includes(q) ||
          f.example?.toLowerCase().includes(q)
      );
      if (!matchWord && !matchMeaning && !matchFamily && !matchForms) return false;
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
        {/* TOP BANNER / READING HEADER CARD (Gradient Đỏ Nhạt Chuẩn EdTech) */}
        <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#b91c1c] via-[#e31e24] to-[#ea384d] shadow-lg border border-red-500/20 p-6 lg:p-7 transition-all text-white">
          {/* Hiệu ứng hào quang tròn mềm mại phía sau (Decorative Glowing Circles) */}
          <div className="absolute -right-16 -bottom-16 w-80 h-80 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute left-1/4 -top-16 w-64 h-64 bg-white/10 rounded-full blur-xl pointer-events-none" />

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
                  <p className="text-xs text-white/90 leading-relaxed font-normal">
                    {readingList.note || 'Bộ từ vựng học thuật trích xuất từ bài đọc, phân tích ngữ cảnh, mẫu câu và collocations tương ứng.'}
                  </p>
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
                      {listWords.length}
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

        {/* VIEW MODE CONTROL TOOLBAR */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <h2 className="font-headline text-base font-extrabold text-text-high-contrast tracking-tight">
              Danh sách từ vựng
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold border border-slate-200">
              {listWords.length} từ
            </span>
          </div>

          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 border border-slate-200/80">
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'cards'
                  ? 'bg-white text-crimson-primary shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Xem dạng thẻ chi tiết (Card view)"
            >
              <span className="material-symbols-outlined text-[16px]">view_agenda</span>
              <span>Dạng thẻ (Card)</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white text-crimson-primary shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Xem dạng bảng ma trận (Table view)"
            >
              <span className="material-symbols-outlined text-[16px]">table_rows</span>
              <span>Bảng ma trận</span>
            </button>
          </div>
        </div>

        {/* VIEW MODE: CARDS */}
        {viewMode === 'cards' ? (
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
                  <span className="material-symbols-outlined text-[28px]">article</span>
                </div>
                <div>
                  <p className="font-bold text-sm text-text-high-contrast">
                    Chưa có từ vựng nào trong danh sách này
                  </p>
                  <p className="text-xs text-text-muted mt-1 leading-relaxed">
                    Bấm nút &ldquo;Thêm từ vào List này&rdquo; phía trên để lưu từ vựng kèm ngữ cảnh câu đọc.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onOpenAddModal}
                  className="mt-1 flex items-center gap-1.5 px-4 py-2 rounded-lg bg-crimson-primary text-white text-xs font-bold hover:bg-crimson-dark shadow-xs cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">add</span>
                  <span>Thêm từ vào List này</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          /* VIEW MODE: TABLE */
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
                                  {onEditVocab && (
                                    <button
                                      type="button"
                                      onClick={() => onEditVocab(item)}
                                      title="Chỉnh sửa từ vựng này"
                                      className="w-6 h-6 rounded-full bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-400 flex items-center justify-center transition-all cursor-pointer"
                                    >
                                      <span className="material-symbols-outlined text-[14px]">edit</span>
                                    </button>
                                  )}
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

                          {/* Từ đồng nghĩa */}
                          <td className="py-3 px-3 align-middle text-text-muted text-[11px]">
                            {form.synonym || <span className="text-text-disabled italic">—</span>}
                          </td>

                          {/* Nghĩa Tiếng Việt */}
                          <td className="py-3 px-4 align-middle">
                            <span className="font-semibold text-text-high-contrast text-xs leading-snug">
                              {form.meaning || item.meaning}
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
                            Bấm nút "Thêm từ vào List này" phía trên để lưu từ vựng kèm ngữ cảnh câu đọc.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={onOpenAddModal}
                          className="mt-1 flex items-center gap-1.5 px-4 py-2 rounded-lg bg-crimson-primary text-white text-xs font-bold hover:bg-crimson-dark shadow-xs"
                        >
                          <span className="material-symbols-outlined text-[16px]">add</span>
                          <span>Thêm từ vào List này</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        )}
      </div>
    </div>
  );
}
