import React, { useState, useMemo } from 'react';
import astronautImg from '../../../assets/Chibi_PhiHanhGia.png';

export default function TopicVocabularyPage({
  categories = [],
  vocabList = [],
  onSelectCategory,
  onOpenAddCategoryModal,
  onOpenAddModal,
  onEditCategory,
  onDeleteCategory,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('oldest'); // 'oldest' (mặc định) | 'newest' | 'most-vocabs' | 'name-az'

  // Tính số lượng từ vựng và lấy mẫu từ cho từng chủ đề (Topic Vocabulary)
  const topicsWithStats = useMemo(() => {
    return categories.map((cat) => {
      const catName = (cat.name || '').toLowerCase();
      const matchedVocabs = vocabList.filter((v) => {
        if (!v) return false;
        if (Array.isArray(v.categories)) {
          return v.categories.some((c) => {
            if (typeof c === 'string') return c.toLowerCase() === catName;
            if (c && c.name) return c.name.toLowerCase() === catName;
            return false;
          });
        }
        return false;
      });

      const vocabCount = matchedVocabs.length;
      const sampleWords = matchedVocabs
        .slice(0, 3)
        .map((v) => v.word)
        .filter(Boolean);

      return {
        ...cat,
        vocabCount,
        sampleWords,
      };
    });
  }, [categories, vocabList]);

  // Tổng số từ vựng duy nhất thuộc các chủ đề
  const totalVocabsInTopics = useMemo(() => {
    const uniqueVocabIds = new Set();
    vocabList.forEach((v) => {
      if (Array.isArray(v.categories) && v.categories.length > 0) {
        uniqueVocabIds.add(v.id || v.word);
      }
    });
    return uniqueVocabIds.size;
  }, [vocabList]);

  // Lọc và sắp xếp danh sách chủ đề
  const filteredAndSortedTopics = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    let result = topicsWithStats;

    if (term) {
      result = result.filter(
        (cat) =>
          (cat.name && cat.name.toLowerCase().includes(term)) ||
          (cat.description && cat.description.toLowerCase().includes(term))
      );
    }

    const sorted = [...result];
    switch (sortBy) {
      case 'newest':
        sorted.sort(
          (a, b) =>
            (new Date(b.createdAt || 0) - new Date(a.createdAt || 0)) ||
            (Number(b.id || 0) - Number(a.id || 0))
        );
        break;
      case 'most-vocabs':
        sorted.sort((a, b) => b.vocabCount - a.vocabCount);
        break;
      case 'name-az':
        sorted.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        break;
      case 'oldest':
      default:
        sorted.sort(
          (a, b) =>
            (new Date(a.createdAt || 0) - new Date(b.createdAt || 0)) ||
            (Number(a.id || 0) - Number(b.id || 0))
        );
        break;
    }

    return sorted;
  }, [topicsWithStats, searchTerm, sortBy]);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const d = new Date(dateString);
      if (isNaN(d.getTime())) return '';
      return d.toLocaleDateString('vi-VN');
    } catch {
      return '';
    }
  };

  return (
    <div className="w-full flex flex-col gap-6 animate-in fade-in duration-150">
      {/* 1. Hero Banner: Topic Vocabulary (Học từ vựng theo chủ đề) */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#c41b26] via-[#d3212c] to-[#c61e27] shadow-lg border border-red-500/25 p-6 sm:p-7 lg:p-8 text-white transition-all">
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

        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-6">
          <div className="max-w-2xl flex flex-col gap-2.5">
            {/* Badges */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white text-[11px] font-black uppercase tracking-wider shadow-xs">
                <span className="material-symbols-outlined text-[14px]">category</span>
                <span>Topic Vocabulary</span>
              </span>
              <span className="text-xs text-white/90 font-medium tracking-wide">
                Học từ vựng theo chủ đề
              </span>
            </div>

            {/* Title & Description */}
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight drop-shadow-sm font-sans leading-tight">
              Quản lý chủ đề từ vựng
            </h1>
            <p className="text-xs sm:text-sm text-white/90 leading-relaxed font-normal max-w-xl">
              Hệ thống hóa từ vựng theo từng chủ đề chuyên sâu, phân loại theo lĩnh vực đời sống, công việc,
              học thuật (IELTS/TOEIC). Giúp ghi nhớ sâu và xây dựng mạng lưới từ vựng liên kết mạch lạc.
            </p>

            {/* Action Buttons & Statistics */}
            <div className="flex items-center gap-3 pt-2 flex-wrap">
              <button
                type="button"
                onClick={onOpenAddCategoryModal}
                className="h-10 px-4 rounded-xl bg-white hover:bg-slate-50 text-crimson-primary font-bold text-xs shadow-md shadow-red-950/20 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
                <span>Tạo Chủ Đề Mới</span>
              </button>

              {onOpenAddModal && (
                <button
                  type="button"
                  onClick={onOpenAddModal}
                  className="h-10 px-4 rounded-xl bg-white/15 hover:bg-white/25 backdrop-blur-md border border-white/30 text-white font-semibold text-xs active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">post_add</span>
                  <span>Thêm Từ Vựng</span>
                </button>
              )}

              {/* Stats badges */}
              <div className="flex items-center gap-2 pl-1">
                <div className="h-10 px-3.5 rounded-xl bg-black/15 backdrop-blur-md border border-white/20 text-white flex items-center gap-2 text-xs font-semibold">
                  <span className="material-symbols-outlined text-[16px] text-amber-300">category</span>
                  <span>{categories.length} chủ đề</span>
                </div>
                <div className="h-10 px-3.5 rounded-xl bg-black/15 backdrop-blur-md border border-white/20 text-white flex items-center gap-2 text-xs font-semibold">
                  <span className="material-symbols-outlined text-[16px] text-emerald-300">style</span>
                  <span>{totalVocabsInTopics} từ trong chủ đề</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Mascot */}
          <div className="shrink-0 hidden lg:flex items-center justify-center group/mascot">
            <div className="relative">
              <div className="absolute inset-0 bg-white/20 rounded-full blur-xl scale-75 animate-pulse group-hover/mascot:scale-110 transition-transform duration-300 pointer-events-none" />
              <img
                src={astronautImg}
                alt="Topic Vocabulary Mascot"
                className="relative z-10 w-32 sm:w-36 lg:w-40 max-h-36 sm:max-h-40 object-contain drop-shadow-xl transition-all duration-300 ease-out hover:scale-110 hover:-translate-y-1 hover:rotate-2 select-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 2. Toolbar: Search, Sort & Count */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[19px]">
            search
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo tên chủ đề (Con người, Môi trường...), mô tả..."
            className="w-full h-10 pl-9 pr-8 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 focus:bg-white text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-crimson-primary focus:ring-2 focus:ring-crimson-primary/15 transition-all"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          )}
        </div>

        {/* Right Sort Controls */}
        <div className="flex items-center gap-2.5 justify-between sm:justify-end">
          <div className="flex items-center gap-1.5 text-xs text-text-muted">
            <span className="material-symbols-outlined text-[16px] text-slate-400">sort</span>
            <span className="hidden md:inline font-medium">Sắp xếp:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:outline-none focus:border-crimson-primary cursor-pointer hover:border-slate-300 transition-colors"
            >
              <option value="oldest">Cũ nhất trước (Mặc định)</option>
              <option value="newest">Mới nhất trước</option>
              <option value="most-vocabs">Nhiều từ vựng nhất</option>
              <option value="name-az">Tên chủ đề (A - Z)</option>
            </select>
          </div>

          <div className="text-xs font-semibold text-slate-500 pl-2 border-l border-slate-200">
            <span>{filteredAndSortedTopics.length}</span> chủ đề
          </div>
        </div>
      </div>

      {/* 3. Topic Cards Grid */}
      {filteredAndSortedTopics.length === 0 ? (
        /* Empty State */
        <div className="bg-white rounded-3xl border border-slate-200/90 p-10 sm:p-14 text-center max-w-xl mx-auto shadow-xs my-4">
          <div className="w-16 h-16 rounded-2xl bg-surface-crimson-subtle border border-border-crimson-tint text-crimson-primary flex items-center justify-center mx-auto mb-4 shadow-xs">
            <span className="material-symbols-outlined text-[34px]">category</span>
          </div>
          <h3 className="text-lg font-extrabold text-slate-900 mb-2 font-sans">
            {searchTerm ? 'Không tìm thấy chủ đề từ vựng phù hợp' : 'Chưa có chủ đề từ vựng nào'}
          </h3>
          <p className="text-xs sm:text-sm text-text-muted leading-relaxed max-w-md mx-auto mb-6">
            {searchTerm
              ? `Không tìm thấy chủ đề nào khớp với từ khóa "${searchTerm}". Vui lòng thử tìm với từ khóa khác.`
              : 'Tạo các chủ đề từ vựng (Topic Vocabulary) để gom nhóm từ theo ngữ cảnh, lĩnh vực hoặc mục tiêu học tập.'}
          </p>
          {searchTerm ? (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
            >
              Xóa bộ lọc tìm kiếm
            </button>
          ) : (
            <button
              type="button"
              onClick={onOpenAddCategoryModal}
              className="px-5 py-2.5 rounded-xl bg-crimson-primary hover:bg-crimson-dark text-white text-xs font-bold shadow-md shadow-red-200 transition-all cursor-pointer inline-flex items-center gap-1.5 active:scale-95"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              <span>Tạo Chủ Đề Đầu Tiên</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredAndSortedTopics.map((topic) => {
            const topicColor = topic.colorCode || '#E31E24';

            return (
              <div
                key={topic.id || topic.name}
                onClick={() => onSelectCategory && onSelectCategory(topic.name)}
                className="group relative bg-white rounded-2xl border border-slate-200/90 hover:border-crimson-primary/40 hover:shadow-lg hover:shadow-red-950/5 transition-all duration-200 p-5 flex flex-col justify-between cursor-pointer"
              >
                {/* Card Top: Topic tag & Actions */}
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-black tracking-wide border shadow-2xs"
                      style={{
                        backgroundColor: `${topicColor}15`,
                        borderColor: `${topicColor}35`,
                        color: topicColor,
                      }}
                    >
                      <span className="material-symbols-outlined text-[14px]">label</span>
                      <span>TOPIC</span>
                    </span>

                    <div className="flex items-center gap-1">
                      {topic.createdAt && (
                        <span className="text-[11px] text-slate-400 font-medium mr-1 hidden sm:inline">
                          {formatDate(topic.createdAt)}
                        </span>
                      )}

                      {/* Edit Button */}
                      {onEditCategory && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditCategory(topic);
                          }}
                          title="Chỉnh sửa chủ đề"
                          className="w-7 h-7 rounded-lg text-slate-400 hover:text-crimson-primary hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[16px]">edit</span>
                        </button>
                      )}

                      {/* Delete Button */}
                      {onDeleteCategory && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteCategory(topic);
                          }}
                          title="Xóa chủ đề này"
                          className="w-7 h-7 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-colors cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[16px]">delete</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Title */}
                  <div className="min-h-[44px] flex items-start">
                    <h3 className="text-base font-extrabold text-slate-900 group-hover:text-crimson-primary transition-colors line-clamp-2 leading-snug">
                      {topic.name}
                    </h3>
                  </div>

                  {/* Description Slot (Fixed height h-6 to prevent layout jumping) */}
                  <div className="h-6 flex items-center text-xs text-text-muted mt-1.5 overflow-hidden">
                    {topic.description ? (
                      <div
                        className="inline-flex items-center gap-1.5 text-slate-600 truncate"
                        title={`Mô tả: ${topic.description}`}
                      >
                        <span className="material-symbols-outlined text-[15px] text-slate-400 shrink-0">
                          notes
                        </span>
                        <span className="truncate font-medium">{topic.description}</span>
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-1.5 text-slate-300 text-[11px] italic select-none">
                        <span className="material-symbols-outlined text-[14px] text-slate-300 shrink-0">
                          bookmark_border
                        </span>
                        <span>Chưa có mô tả cho chủ đề này</span>
                      </div>
                    )}
                  </div>

                  {/* Yêu cầu 1: Chỗ từ vựng tiêu biểu thay bằng button Vào học ngay */}
                  <div className="mt-3">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onSelectCategory) onSelectCategory(topic.name);
                      }}
                      className="w-full h-11 rounded-xl bg-crimson-primary hover:bg-crimson-dark active:scale-[0.99] text-white text-xs font-bold shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer group/btn"
                    >
                      <span>Vào học ngay</span>
                      <span className="material-symbols-outlined text-[16px] group-hover/btn:translate-x-1 transition-transform">
                        arrow_forward
                      </span>
                    </button>
                  </div>
                </div>

                {/* Yêu cầu 2: Chỗ vào học ngay hiện tại thay bằng số lượng từ vựng như hình 3 */}
                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium">
                    {topic.createdAt ? (
                      <>
                        <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                        <span>{formatDate(topic.createdAt)}</span>
                      </>
                    ) : (
                      <span>Chủ đề từ vựng</span>
                    )}
                  </div>

                  {/* Số lượng từ vựng như hình 3 đặt ở vị trí góc dưới bên phải */}
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-100 text-blue-700 text-xs font-bold">
                    <span className="material-symbols-outlined text-[15px]">style</span>
                    <span>{topic.vocabCount} từ vựng</span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
