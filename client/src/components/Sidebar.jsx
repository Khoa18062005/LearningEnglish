import React, { useState, useEffect, useRef } from 'react';

export default function Sidebar({
  currentView,
  setCurrentView,
  selectedReadingListId,
  setSelectedReadingListId,
  selectedCategory,
  setSelectedCategory,
  readingLists,
  categories,
  vocabList = [],
  onOpenAddModal,
  onOpenAddReadingListModal,
  onOpenAddCategoryModal,
  onEditCategory,
  onDeleteCategory,
  onEditReadingList,
  onDeleteReadingList,
  onNavigateHome,
}) {
  const activeReadingListRef = useRef(null);
  const activeCategoryRef = useRef(null);
  const [isReadingListOpen, setIsReadingListOpen] = useState(true);

  const getReadingListWordCount = (list) => {
    if (Array.isArray(vocabList)) {
      const targetId = String(list.id);
      return vocabList.filter((v) => {
        if (!v) return false;
        if (v.readingListId != null && v.readingListId !== '') {
          return String(v.readingListId) === targetId;
        }
        if (v.noteListId != null && v.noteListId !== '') {
          return String(v.noteListId) === targetId;
        }
        if (Array.isArray(v.noteLists) && v.noteLists.length > 0) {
          return v.noteLists.some((nl) => nl && String(nl.id) === targetId);
        }
        if (Array.isArray(v.noteListIds) && v.noteListIds.length > 0) {
          return v.noteListIds.some((id) => id != null && String(id) === targetId);
        }
        if (v.readingListName && list.code) {
          return v.readingListName === list.code;
        }
        return false;
      }).length;
    }
    return list.count || 0;
  };

  useEffect(() => {
    if (currentView === 'reading-list' || currentView === 'list-vocabulary') {
      setIsReadingListOpen(true);
    }
  }, [currentView]);

  useEffect(() => {
    if (activeReadingListRef.current && currentView === 'reading-list') {
      activeReadingListRef.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [selectedReadingListId, currentView]);

  useEffect(() => {
    if (activeCategoryRef.current && currentView === 'category') {
      activeCategoryRef.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [selectedCategory, currentView]);

  return (
    <aside className="fixed left-0 top-0 h-full w-[260px] bg-card-white shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-50 flex flex-col justify-between overflow-hidden border-r border-slate-line">
      <div className="flex flex-col flex-1 overflow-y-auto">
        {/* Brand Header */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-slate-line/60">
          <div 
            className="flex items-center gap-2.5 cursor-pointer" 
            onClick={() => { setCurrentView('master'); setSelectedReadingListId(null); }}
          >
            <div className="w-9 h-9 rounded-xl bg-crimson-primary flex items-center justify-center text-white shadow-sm shadow-red-200">
              <span className="material-symbols-outlined text-[20px]">menu_book</span>
            </div>
            <div className="flex flex-col">
              <span className="font-headline font-bold text-base text-text-high-contrast leading-none tracking-tight">
                LinearVocab
              </span>
              <span className="text-[10px] font-semibold text-text-muted mt-0.5 tracking-wider uppercase">
                VOCABULARY LEARNING LMS
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Sections */}
        <div className="px-3.5 py-4 flex flex-col gap-5">
          {/* Section: VIEWS */}
          <div className="flex flex-col gap-1">
            <div className="px-2 py-1">
              <span className="text-[11px] font-bold tracking-wider text-text-muted uppercase">VIEWS</span>
            </div>
            <nav className="flex flex-col gap-1">
              <button
                type="button"
                onClick={() => {
                  setCurrentView('profile');
                  setSelectedReadingListId(null);
                  setSelectedCategory(null);
                }}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors text-left text-sm font-medium ${
                  currentView === 'profile'
                    ? 'bg-surface-crimson-subtle text-crimson-primary font-semibold'
                    : 'text-text-body hover:bg-surface-crimson-subtle hover:text-crimson-primary'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">account_circle</span>
                <span>Profile</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setCurrentView('master');
                  setSelectedReadingListId(null);
                  setSelectedCategory(null);
                }}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors text-left text-sm font-medium ${
                  currentView === 'master' && !selectedReadingListId && !selectedCategory
                    ? 'bg-surface-crimson-subtle text-crimson-primary font-semibold'
                    : 'text-text-body hover:bg-surface-crimson-subtle hover:text-crimson-primary'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">library_books</span>
                <span>All Vocabulary</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setCurrentView('word-families');
                  setSelectedReadingListId(null);
                  setSelectedCategory(null);
                }}
                className={`flex items-center justify-between px-3 py-2 rounded-lg transition-colors text-left text-sm font-medium ${
                  currentView === 'word-families'
                    ? 'bg-surface-crimson-subtle text-crimson-primary font-semibold'
                    : 'text-text-body hover:bg-surface-crimson-subtle hover:text-crimson-primary'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-[18px]">account_tree</span>
                  <span>Word Families</span>
                </div>
              </button>

              <div className="flex flex-col">
                <div
                  className={`group flex items-center justify-between px-3 py-2 rounded-lg transition-colors text-left text-sm font-medium ${
                    currentView === 'list-vocabulary' && !selectedReadingListId
                      ? 'bg-surface-crimson-subtle text-crimson-primary font-semibold'
                      : 'text-text-body hover:bg-surface-crimson-subtle hover:text-crimson-primary'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentView('list-vocabulary');
                      setSelectedReadingListId(null);
                      setSelectedCategory(null);
                    }}
                    className="flex items-center gap-2.5 flex-1 min-w-0 text-left cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">auto_stories</span>
                    <span className="truncate">List Vocabulary</span>
                  </button>

                  <div className="flex items-center gap-1 shrink-0">
                    {/* Nút + tạo bài đọc mới */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onOpenAddReadingListModal) onOpenAddReadingListModal();
                        else if (onOpenAddModal) onOpenAddModal();
                      }}
                      title="Thêm danh sách bài đọc mới"
                      className="w-5 h-5 rounded flex items-center justify-center text-text-muted hover:text-crimson-primary hover:bg-white transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[15px]">add</span>
                    </button>

                    {/* Nút toggle thu gọn / mở rộng */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsReadingListOpen((prev) => !prev);
                      }}
                      className="w-5 h-5 rounded flex items-center justify-center text-text-muted hover:text-crimson-primary hover:bg-white transition-colors cursor-pointer"
                      title={isReadingListOpen ? "Thu gọn danh sách" : "Mở rộng danh sách"}
                    >
                      <span className={`material-symbols-outlined text-[16px] transition-transform duration-200 ${isReadingListOpen ? 'rotate-90' : ''}`}>
                        chevron_right
                      </span>
                    </button>
                  </div>
                </div>

                {/* Sub-items: Danh sách các bài đọc con */}
                {isReadingListOpen && (
                  <div className="ml-4 pl-2.5 my-1 border-l-2 border-slate-100 flex flex-col gap-0.5 max-h-[220px] overflow-y-auto pr-1 custom-scrollbar">
                    {readingLists.length === 0 ? (
                      <button
                        type="button"
                        onClick={onOpenAddReadingListModal || onOpenAddModal}
                        className="px-2 py-1.5 text-xs text-text-muted hover:text-crimson-primary hover:bg-surface-crimson-subtle rounded-md flex items-center gap-1.5 transition-colors group text-left w-full"
                      >
                        <span className="material-symbols-outlined text-[14px] text-text-muted group-hover:text-crimson-primary">add_circle</span>
                        <span className="italic text-[11px]">Chưa có danh sách (Bấm để thêm)</span>
                      </button>
                    ) : (
                      readingLists.map((list) => {
                        const isActive =
                          currentView === 'reading-list' &&
                          (selectedReadingListId === list.id || String(selectedReadingListId) === String(list.id));
                        const displayCode = list.code || list.shortTitle || 'LIST';
                        const displayTitle = list.title || '';
                        return (
                          <div
                            ref={isActive ? activeReadingListRef : null}
                            key={list.id}
                            className={`group relative flex items-center justify-between px-2 py-1.5 rounded-md transition-colors text-left text-xs ${
                              isActive
                                ? 'bg-surface-crimson-subtle text-crimson-primary font-semibold'
                                : 'text-text-body hover:bg-surface-crimson-subtle hover:text-crimson-primary'
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedReadingListId(list.id);
                                setSelectedCategory(null);
                                setCurrentView('reading-list');
                              }}
                              className="flex items-center gap-2 truncate flex-1 min-w-0 pr-1 text-left cursor-pointer"
                            >
                              <span
                                className={`material-symbols-outlined text-[16px] shrink-0 ${
                                  isActive ? 'text-crimson-primary' : 'text-text-muted'
                                }`}
                              >
                                article
                              </span>
                              <div className="flex flex-col truncate">
                                <span className="text-[12px] font-semibold truncate leading-tight">
                                  {displayCode}
                                </span>
                                {displayTitle && displayTitle !== displayCode && (
                                  <span className="text-[10px] text-text-muted truncate leading-tight mt-0.5">
                                    {displayTitle}
                                  </span>
                                )}
                              </div>
                            </button>

                            <div className="flex items-center gap-1 shrink-0">
                              {/* Hover action buttons */}
                              <div className="hidden group-hover:flex items-center gap-0.5">
                                {onEditReadingList && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onEditReadingList(list);
                                    }}
                                    title="Chỉnh sửa danh sách bài đọc"
                                    className="w-4 h-4 rounded flex items-center justify-center text-slate-400 hover:text-crimson-primary hover:bg-white transition-colors cursor-pointer"
                                  >
                                    <span className="material-symbols-outlined text-[13px]">edit</span>
                                  </button>
                                )}
                                {onDeleteReadingList && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onDeleteReadingList(list.id);
                                    }}
                                    title="Xóa danh sách bài đọc"
                                    className="w-4 h-4 rounded flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-white transition-colors cursor-pointer"
                                  >
                                    <span className="material-symbols-outlined text-[13px]">delete</span>
                                  </button>
                                )}
                              </div>
                              <span
                                className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                                  isActive
                                    ? 'bg-surface-crimson-soft text-crimson-dark font-bold'
                                    : 'bg-slate-100 text-text-muted'
                                }`}
                              >
                                {getReadingListWordCount(list)}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            </nav>
          </div>

          {/* Section: CATEGORIES */}
          <div className="flex flex-col gap-1">
            <div className="px-2 py-1 flex items-center justify-between">
              <span className="text-[11px] font-bold tracking-wider text-text-muted uppercase">CATEGORIES</span>
              <button
                type="button"
                onClick={onOpenAddCategoryModal || onOpenAddModal}
                title="Thêm danh mục mới"
                className="w-5 h-5 rounded flex items-center justify-center text-text-muted hover:text-crimson-primary hover:bg-surface-crimson-subtle transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">add</span>
              </button>
            </div>
            <nav className="flex flex-col gap-1 max-h-[160px] overflow-y-auto pr-1 custom-scrollbar">
              {categories.length === 0 ? (
                <button
                  type="button"
                  onClick={onOpenAddCategoryModal || onOpenAddModal}
                  className="px-3 py-2 text-xs text-text-muted hover:text-crimson-primary hover:bg-surface-crimson-subtle rounded-lg flex items-center gap-1.5 transition-colors group text-left w-full"
                >
                  <span className="material-symbols-outlined text-[15px] text-text-muted group-hover:text-crimson-primary">add_circle</span>
                  <span className="italic">Chưa có danh mục (Bấm để thêm)</span>
                </button>
              ) : (
                categories.map((cat) => {
                  const isSelected = currentView === 'category' && selectedCategory === cat.name;
                  return (
                    <div
                      key={cat.id}
                      ref={isSelected ? activeCategoryRef : null}
                      className={`group relative flex items-center justify-between px-2.5 py-1.5 rounded-lg transition-colors text-left text-sm ${
                        isSelected
                          ? 'bg-surface-crimson-subtle text-crimson-primary font-semibold'
                          : 'text-text-body hover:bg-surface-crimson-subtle hover:text-crimson-primary'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCategory(cat.name);
                          setSelectedReadingListId(null);
                          setCurrentView('category');
                        }}
                        className="flex items-center gap-2 truncate flex-1 min-w-0 pr-1 text-left cursor-pointer"
                      >
                        <span
                          className={`material-symbols-outlined text-[18px] shrink-0 ${
                            isSelected ? 'text-crimson-primary' : 'text-text-muted'
                          }`}
                          style={!isSelected && cat.colorCode ? { color: cat.colorCode } : {}}
                        >
                          label
                        </span>
                        <span className="text-[13px] truncate">{cat.name}</span>
                      </button>

                      <div className="flex items-center gap-1 shrink-0">
                        {/* Hover action buttons */}
                        <div className="hidden group-hover:flex items-center gap-0.5">
                          {onEditCategory && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onEditCategory(cat);
                              }}
                              title="Chỉnh sửa danh mục"
                              className="w-5 h-5 rounded flex items-center justify-center text-slate-400 hover:text-crimson-primary hover:bg-white transition-colors"
                            >
                              <span className="material-symbols-outlined text-[14px]">edit</span>
                            </button>
                          )}
                          {onDeleteCategory && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteCategory(cat);
                              }}
                              title="Xóa danh mục"
                              className="w-5 h-5 rounded flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-white transition-colors"
                            >
                              <span className="material-symbols-outlined text-[14px]">delete</span>
                            </button>
                          )}
                        </div>
                        <span
                          className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                            isSelected
                              ? 'bg-surface-crimson-soft text-crimson-dark font-bold'
                              : 'bg-slate-100 text-text-muted'
                          }`}
                        >
                          {cat.count || 0}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </nav>
          </div>
        </div>
      </div>

      {/* Footer Cloud Sync Widget */}
      <div className="p-3.5 border-t border-slate-line/80 bg-card-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-surface-crimson-subtle text-crimson-primary">
              <span className="material-symbols-outlined text-[18px]">cloud_done</span>
              <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-pos-adj-text animate-pulse"></span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-text-high-contrast">Cloud Sync</span>
              <span className="text-[10px] text-text-muted">Đồng bộ 2 phút trước</span>
            </div>
          </div>
          <button
            type="button"
            title="Đồng bộ thủ công"
            className="w-7 h-7 rounded flex items-center justify-center text-text-muted hover:text-crimson-primary hover:bg-surface-crimson-subtle transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">sync</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
