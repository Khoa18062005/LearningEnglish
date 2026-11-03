import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import VocabCard from '../components/VocabCard';
import SortDropdown, { sortVocabularies } from '../../../components/SortDropdown';
import astronautImg from '../../../assets/Chibi_PhiHanhGia.png';
import { vocabApi } from '../../../api/vocabApi';

export default function MasterListPage({
  vocabList = [],
  onOpenAddModal,
  onEditVocab,
  onDeleteVocab,
  onPronounce,
  searchTerm = '',
  setSearchTerm,
  selectedPos = 'all',
  setSelectedPos,
  selectedCategory = null,
  lastMutation = null,
  onSelectRelatedWord,
  onOpenRelatedGroup,
  sortBy = 'newest',
  setSortBy,
}) {
  const [items, setItems] = useState([]);
  const [localSortBy, setLocalSortBy] = useState('newest');
  const activeSortBy = setSortBy ? sortBy : localSortBy;
  const handleSortChange = setSortBy || setLocalSortBy;
  const [nextCursor, setNextCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  // Đồng bộ tức thì (0ms) khi có thêm / sửa / xóa từ vựng từ bất kỳ modal/component nào
  useEffect(() => {
    if (!lastMutation || !lastMutation.data) return;
    const { type, data } = lastMutation;

    if (type === 'create') {
      setItems((prev) => {
        const exists = prev.some((i) => i.id === data.id || (i.word && data.word && i.word.toLowerCase() === data.word.toLowerCase()));
        if (exists) {
          return prev.map((i) => (i.id === data.id || (i.word && data.word && i.word.toLowerCase() === data.word.toLowerCase()) ? data : i));
        }
        return [data, ...prev];
      });
      setTotalCount((prev) => prev + 1);
    } else if (type === 'update') {
      setItems((prev) =>
        prev.map((i) => (i.id === data.id || (i.word && data.word && i.word.toLowerCase() === data.word.toLowerCase()) ? data : i))
      );
    } else if (type === 'delete') {
      setItems((prev) => prev.filter((i) => i.id !== data));
      setTotalCount((prev) => Math.max(0, prev - 1));
    }
  }, [lastMutation]);

  const observerRef = useRef(null);
  const sentinelRef = useRef(null);

  const posOptions = [
    {
      id: 'all',
      label: 'Tất cả',
      activeClass: 'bg-white text-crimson-primary shadow-xs border-red-200/80',
      inactiveClass: 'text-slate-600 hover:text-crimson-primary hover:bg-slate-200/60',
    },
    {
      id: 'n',
      label: 'Noun',
      activeClass: 'bg-white text-pos-noun-text shadow-xs border-blue-200/90',
      inactiveClass: 'text-slate-600 hover:text-pos-noun-text hover:bg-pos-noun-bg/60',
    },
    {
      id: 'v',
      label: 'Verb',
      activeClass: 'bg-white text-pos-verb-text shadow-xs border-red-200/90',
      inactiveClass: 'text-slate-600 hover:text-pos-verb-text hover:bg-pos-verb-bg/60',
    },
    {
      id: 'adj',
      label: 'Adjective',
      activeClass: 'bg-white text-pos-adj-text shadow-xs border-emerald-200/90',
      inactiveClass: 'text-slate-600 hover:text-pos-adj-text hover:bg-pos-adj-bg/60',
    },
    {
      id: 'adv',
      label: 'Adverb',
      activeClass: 'bg-white text-pos-adv-text shadow-xs border-purple-200/90',
      inactiveClass: 'text-slate-600 hover:text-pos-adv-text hover:bg-pos-adv-bg/60',
    },
    {
      id: 'phrasal_verb',
      label: 'Phrasal Verb',
      activeClass: 'bg-white text-teal-700 shadow-xs border-teal-200/90',
      inactiveClass: 'text-slate-600 hover:text-teal-700 hover:bg-teal-50',
    },
    {
      id: 'idiom',
      label: 'Idioms',
      activeClass: 'bg-white text-amber-800 shadow-xs border-amber-200/90',
      inactiveClass: 'text-slate-600 hover:text-amber-800 hover:bg-amber-50',
    },
    {
      id: 'collocation',
      label: 'Collocation',
      activeClass: 'bg-white text-indigo-700 shadow-xs border-indigo-200/90',
      inactiveClass: 'text-slate-600 hover:text-indigo-700 hover:bg-indigo-50',
    },
  ];

  // Fallback to local vocabList slice if offline
  const fallbackLocalData = useCallback((cursor) => {
    let filtered = vocabList.filter((item) => {
      if (!item) return false;
      if (selectedPos && selectedPos !== 'all') {
        const hasPos = item.pos === selectedPos || item.forms?.some((f) => f.pos === selectedPos);
        if (!hasPos) return false;
      }
      if (selectedCategory && !item.categories?.includes(selectedCategory)) return false;
      if (searchTerm && searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchWord = item.word?.toLowerCase().includes(q);
        const matchMeaning = item.meaning?.toLowerCase().includes(q);
        const matchFamily = item.wordFamily?.some((wf) => wf.toLowerCase().includes(q));
        if (!matchWord && !matchMeaning && !matchFamily) return false;
      }
      return true;
    });

    filtered = sortVocabularies(filtered, activeSortBy);

    if (cursor) {
      filtered = filtered.filter((v) => (v.id || 0) < cursor);
    }

    const pageSize = 12;
    const batch = filtered.slice(0, pageSize);
    const more = filtered.length > pageSize;
    const last = batch.length > 0 ? (batch[batch.length - 1].id || null) : null;

    if (cursor) {
      setItems((prev) => [...prev, ...batch]);
    } else {
      setItems(batch);
      setTotalCount(filtered.length);
    }
    setNextCursor(last);
    setHasMore(more);
  }, [vocabList, selectedPos, selectedCategory, searchTerm, activeSortBy]);

  // Lắng nghe sự kiện thay đổi star / bookmark từ bất kỳ thẻ nào để re-render lọc tức thì
  const [prefVersion, setPrefVersion] = useState(0);
  useEffect(() => {
    const handlePrefChange = () => setPrefVersion((v) => v + 1);
    window.addEventListener('vocab_preference_changed', handlePrefChange);
    return () => window.removeEventListener('vocab_preference_changed', handlePrefChange);
  }, []);

  const isSpecialFolder = activeSortBy === 'starred' || activeSortBy === 'bookmarked';

  // Sắp xếp danh sách hiển thị theo tiêu chí người dùng đã chọn
  // Khi chọn thư mục thông minh "Đã đánh dấu sao" hoặc "Đã lưu", quét toàn bộ kho từ vựng (vocabList)
  const displayItems = useMemo(() => {
    if (isSpecialFolder) {
      const sourceList = (vocabList && vocabList.length > 0) ? vocabList : items;
      let filtered = sourceList.filter((item) => {
        if (!item) return false;
        if (selectedPos && selectedPos !== 'all') {
          const hasPos = item.pos === selectedPos || item.forms?.some((f) => f.pos === selectedPos);
          if (!hasPos) return false;
        }
        if (selectedCategory && !item.categories?.includes(selectedCategory)) return false;
        if (searchTerm && searchTerm.trim()) {
          const q = searchTerm.toLowerCase();
          const matchWord = item.word?.toLowerCase().includes(q);
          const matchMeaning = item.meaning?.toLowerCase().includes(q);
          const matchFamily = item.wordFamily?.some((wf) => wf.toLowerCase().includes(q));
          if (!matchWord && !matchMeaning && !matchFamily) return false;
        }
        return true;
      });
      return sortVocabularies(filtered, activeSortBy);
    }
    return sortVocabularies(items, activeSortBy);
  }, [items, vocabList, activeSortBy, selectedPos, selectedCategory, searchTerm, isSpecialFolder, prefVersion]);

  // Fetch initial batch with Cursor-based pagination (cursor = null)
  const fetchInitialBatch = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await vocabApi.getByCursor({
        cursor: null,
        limit: 12,
        keyword: searchTerm,
        pos: selectedPos !== 'all' ? selectedPos : null,
        categoryName: selectedCategory,
      });

      if (res && Array.isArray(res.items)) {
        setItems(res.items);
        setNextCursor(res.nextCursor);
        setHasMore(res.hasMore);
        setTotalCount(res.totalCount || res.items.length);
      } else {
        fallbackLocalData(null);
      }
    } catch (err) {
      console.warn('Không thể tải cursor API, sử dụng dữ liệu cục bộ:', err.message);
      fallbackLocalData(null);
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, selectedPos, selectedCategory, fallbackLocalData]);

  // Re-fetch whenever filters or initial vocabList change
  useEffect(() => {
    fetchInitialBatch();
  }, [fetchInitialBatch]);

  // Lazy loading next batch via cursor when scrolling
  const loadNextBatch = useCallback(async () => {
    if (!hasMore || isLoadingMore || !nextCursor) return;

    setIsLoadingMore(true);
    try {
      const res = await vocabApi.getByCursor({
        cursor: nextCursor,
        limit: 12,
        keyword: searchTerm,
        pos: selectedPos !== 'all' ? selectedPos : null,
        categoryName: selectedCategory,
      });

      if (res && Array.isArray(res.items)) {
        setItems((prev) => {
          const seen = new Set(prev.map((i) => i.id || i.word));
          const uniqueNew = res.items.filter((i) => !seen.has(i.id || i.word));
          return [...prev, ...uniqueNew];
        });
        setNextCursor(res.nextCursor);
        setHasMore(res.hasMore);
      } else {
        fallbackLocalData(nextCursor);
      }
    } catch (err) {
      console.warn('Lỗi khi tải tiếp bằng cursor:', err.message);
      fallbackLocalData(nextCursor);
    } finally {
      setIsLoadingMore(false);
    }
  }, [hasMore, isLoadingMore, nextCursor, searchTerm, selectedPos, selectedCategory, fallbackLocalData]);

  // IntersectionObserver for lazy loading trigger on scroll
  useEffect(() => {
    if (!sentinelRef.current) return;

    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore && !isLoading) {
          loadNextBatch();
        }
      },
      { rootMargin: '300px' }
    );

    observerRef.current.observe(sentinelRef.current);

    return () => {
      if (observerRef.current) observerRef.current.disconnect();
    };
  }, [loadNextBatch, hasMore, isLoadingMore, isLoading]);

  const handleDeleteItem = async (id) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
    if (onDeleteVocab) {
      await onDeleteVocab(id);
    }
  };

  // Metrics for the Hero Banner
  const totalPatternsCount = vocabList.reduce(
    (acc, w) => acc + (w.forms?.filter((f) => f.type === 'pattern' || (f.pattern && !f.collocation)).length || 0),
    0
  );
  const totalCollocationsCount = vocabList.reduce(
    (acc, w) => acc + (w.forms?.filter((f) => f.type === 'collocation' || (f.collocation && !f.pattern)).length || 0),
    0
  );

  return (
    <div className="flex flex-col w-full pb-16">
      {/* ======================================================== */}
      {/* TOP RED HERO CARD (Master Vocabulary + Cute Astronaut)    */}
      {/* ======================================================== */}
      <section className="px-6 lg:px-8 pt-5 pb-1">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#c41b26] via-[#d3212c] to-[#c61e27] shadow-lg border border-red-500/25 px-6 py-4 sm:px-8 sm:py-5 text-white transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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

          {/* Left Column: Title, Subtitle, & Quick Badges */}
          <div className="flex flex-col gap-1.5 relative z-10 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-yellow-400/30 text-yellow-200 text-[10px] font-black uppercase tracking-wider border border-yellow-300/60 backdrop-blur-xs select-none shadow-[0_0_12px_rgba(250,204,21,0.25)]">
                MASTER VOCABULARY
              </span>
              <span className="text-white/80 text-xs font-semibold">
                Phương pháp Linearthinking
              </span>
            </div>

            <h1 className="font-headline text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight drop-shadow-xs leading-tight">
              Tất cả từ vựng (Master List)
            </h1>

            <p className="text-xs text-white/90 leading-relaxed font-normal">
              Hệ thống cấu trúc từ vựng ma trận theo phương pháp Linearthinking. Phân bổ đa tầng nghĩa, ngữ cảnh collocation và mẫu câu ứng dụng chuẩn hóa.
            </p>

            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <button
                type="button"
                onClick={onOpenAddModal}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-white text-crimson-primary font-bold text-xs shadow-md hover:bg-red-50 hover:shadow-lg active:scale-95 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">add</span>
                <span>Thêm Từ Mới (Add Vocab)</span>
              </button>

              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/15 text-white text-xs font-semibold backdrop-blur-xs border border-white/20">
                <span className="material-symbols-outlined text-[15px] text-yellow-300">menu_book</span>
                <span>{totalCount} từ vựng</span>
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/15 text-white text-xs font-semibold backdrop-blur-xs border border-white/20">
                <span className="material-symbols-outlined text-[15px] text-blue-200">pattern</span>
                <span>{totalPatternsCount} pattern</span>
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/15 text-white text-xs font-semibold backdrop-blur-xs border border-white/20">
                <span className="material-symbols-outlined text-[15px] text-pink-200">hub</span>
                <span>{totalCollocationsCount} collocation</span>
              </div>
            </div>
          </div>

          {/* Right Column: Cute Astronaut Mascot */}
          <div className="relative z-10 shrink-0 flex items-center justify-center self-center sm:self-auto group/mascot">
            <div className="absolute inset-0 bg-white/20 rounded-full blur-xl scale-75 animate-pulse group-hover/mascot:scale-110 transition-transform duration-300" />
            <img
              src={astronautImg}
              alt="Chibi Astronaut Mascot"
              className="relative z-10 w-36 sm:w-40 lg:w-44 max-h-40 sm:max-h-44 object-contain select-none cursor-pointer drop-shadow-xl transition-all duration-300 ease-out hover:scale-120 hover:-translate-y-1.5 hover:rotate-2 hover:drop-shadow-[0_15px_30px_rgba(0,0,0,0.4)]"
            />
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* SEARCH TOOLBAR & POS FILTER PILLS (Đồng bộ chiều cao h-11) */}
      {/* ======================================================== */}
      <section className="px-6 lg:px-8 pt-1.5 pb-3 flex flex-col gap-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search Input Bar - Đồng bộ chiều cao h-11 (44px) */}
          <div className="relative flex-1 max-w-xl h-11 flex items-center">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[19px] pointer-events-none">
              search
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm && setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm từ vựng, pattern, collocation, nghĩa tiếng Việt..."
              className="w-full h-full pl-10 pr-9 bg-white border border-slate-200/90 rounded-xl text-xs outline-none focus:border-crimson-primary focus:ring-2 focus:ring-crimson-primary/10 transition-all text-text-high-contrast placeholder:text-slate-400 shadow-xs"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm && setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                title="Xóa tìm kiếm"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            )}
          </div>

          {/* POS Filter Pills & Nút Sắp Xếp (Bên phải Idioms) - Đồng bộ chiều cao h-11 (44px) */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-1 p-1 h-11 bg-slate-100 rounded-xl border border-slate-200/80 shadow-xs overflow-x-auto">
              {posOptions.map((opt) => {
                const isActive = selectedPos === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setSelectedPos && setSelectedPos(opt.id)}
                    className={`h-full px-3.5 flex items-center justify-center rounded-lg text-xs font-semibold whitespace-nowrap border transition-colors duration-150 cursor-pointer ${isActive ? opt.activeClass : `border-transparent ${opt.inactiveClass}`}`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>

            {/* Nút bộ lọc sắp xếp bên phải Idioms */}
            <SortDropdown sortBy={activeSortBy} onSortChange={handleSortChange} />
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* DANH SÁCH TỪ VỰNG (CARD VIEW) + LAZY LOADING (Yêu cầu 3) */}
      {/* ======================================================== */}
      <section className="px-6 lg:px-8 pt-1 flex flex-col gap-4">
        {isLoading && items.length === 0 ? (
          // Skeleton Loading lúc bắt đầu
          <div className="flex flex-col gap-4">
            {[1, 2, 3].map((sk) => (
              <div
                key={sk}
                className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col gap-3 animate-pulse"
              >
                <div className="h-6 w-48 bg-slate-200 rounded-md" />
                <div className="h-4 w-72 bg-slate-100 rounded-md" />
                <div className="h-16 w-full bg-slate-50 rounded-xl" />
              </div>
            ))}
          </div>
        ) : displayItems.length > 0 ? (
          <div className="flex flex-col gap-4">
            {displayItems.map((item) => (
              <VocabCard
                key={item.id || item.word}
                vocab={item}
                vocabList={vocabList}
                onPronounce={onPronounce}
                onEdit={onEditVocab}
                onDelete={handleDeleteItem}
                onSelectRelatedWord={onSelectRelatedWord}
                onOpenRelatedGroup={onOpenRelatedGroup}
                showReadingList={true}
              />
            ))}

            {/* Bottom Sentinel Trigger cho Lazy Loading (Infinite Scroll) - Ẩn khi đang xem Thư mục Đã đánh dấu sao / Đã lưu */}
            {!isSpecialFolder && (
              <div ref={sentinelRef} className="py-4 flex items-center justify-center">
                {isLoadingMore && (
                  <div className="flex items-center gap-2 text-xs font-semibold text-crimson-primary bg-white px-4 py-2 rounded-full border border-red-100 shadow-xs animate-pulse">
                    <span className="w-4 h-4 border-2 border-crimson-primary border-t-transparent rounded-full animate-spin" />
                    <span>Đang tải thêm từ vựng...</span>
                  </div>
                )}
                {!hasMore && items.length > 0 && (
                  <span className="text-[11px] text-text-muted italic">
                    Đã tải hết toàn bộ {items.length} từ vựng
                  </span>
                )}
              </div>
            )}
          </div>
        ) : (
          // Empty State khi không có từ nào
          <div className="py-20 flex flex-col items-center justify-center text-center bg-white rounded-2xl border border-slate-200/80 shadow-xs p-8">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-3 ${
              activeSortBy === 'starred'
                ? 'bg-amber-50 text-amber-500'
                : activeSortBy === 'bookmarked'
                ? 'bg-surface-crimson-subtle text-crimson-primary'
                : 'bg-surface-crimson-subtle text-crimson-primary'
            }`}>
              <span className="material-symbols-outlined text-[32px]">
                {activeSortBy === 'starred'
                  ? 'star'
                  : activeSortBy === 'bookmarked'
                  ? 'bookmark'
                  : 'menu_book'}
              </span>
            </div>
            <p className="font-bold text-base text-text-high-contrast">
              {activeSortBy === 'starred'
                ? 'Chưa có từ vựng nào được đánh dấu sao'
                : activeSortBy === 'bookmarked'
                ? 'Chưa có từ vựng nào được lưu (Bookmark)'
                : searchTerm || (selectedPos && selectedPos !== 'all') || selectedCategory
                ? 'Không tìm thấy từ vựng nào phù hợp'
                : 'Chưa có từ vựng nào trong kho'}
            </p>
            <p className="text-xs text-text-muted max-w-md mt-1 mb-4 leading-relaxed">
              {activeSortBy === 'starred'
                ? 'Nhấn vào biểu tượng ngôi sao (☆) ở góc phải của bất kỳ thẻ từ vựng nào để đánh dấu các từ quan trọng bạn muốn ưu tiên học.'
                : activeSortBy === 'bookmarked'
                ? 'Nhấn vào biểu tượng bookmark (🔖) ở góc phải của bất kỳ thẻ từ vựng nào để lưu vào danh sách cần ôn tập.'
                : searchTerm || (selectedPos && selectedPos !== 'all') || selectedCategory
                ? 'Thử thay đổi từ khóa tìm kiếm hoặc bỏ chọn các bộ lọc từ loại/chủ đề (Topic Vocabulary).'
                : 'Kho từ vựng của bạn đang trống. Hãy thêm các từ vựng mới để bắt đầu học tập và quản trị theo phương pháp Linearthinking.'}
            </p>
            {activeSortBy === 'starred' || activeSortBy === 'bookmarked' ? (
              <button
                type="button"
                onClick={() => handleSortChange('newest')}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 shadow-xs cursor-pointer active:scale-95 transition-all"
              >
                <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                <span>Quay lại tất cả từ vựng</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onOpenAddModal}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-crimson-primary text-white text-xs font-bold hover:bg-crimson-dark shadow-xs cursor-pointer active:scale-95 transition-all"
              >
                <span className="material-symbols-outlined text-[16px]">add</span>
                <span>
                  {searchTerm || (selectedPos && selectedPos !== 'all') || selectedCategory
                    ? 'Thêm Từ Mới'
                    : 'Thêm Từ Đầu Tiên'}
                </span>
              </button>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
