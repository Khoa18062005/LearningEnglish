export default function Sidebar({
  currentView,
  setCurrentView,
  selectedReadingListId,
  setSelectedReadingListId,
  selectedCategory,
  setSelectedCategory,
  readingLists,
  categories,
  onOpenAddModal,
  onOpenAddReadingListModal,
  onOpenAddCategoryModal,
  onEditCategory,
  onDeleteCategory,
  onEditReadingList,
  onDeleteReadingList,
  onNavigateHome,
}) {
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
                  if (onNavigateHome) onNavigateHome();
                  else setCurrentView('home');
                }}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-text-muted hover:bg-slate-100 hover:text-crimson-primary transition-colors text-left text-sm font-medium"
              >
                <span className="material-symbols-outlined text-[18px]">home</span>
                <span>Trang chủ DOL</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setCurrentView('master');
                  setSelectedReadingListId(null);
                  setSelectedCategory(null);
                }}
                className={`flex items-center justify-between px-3 py-2 rounded-lg transition-colors text-left text-sm font-medium ${
                  currentView === 'master' && !selectedReadingListId && !selectedCategory
                    ? 'bg-surface-crimson-subtle text-crimson-primary font-semibold'
                    : 'text-text-body hover:bg-surface-crimson-subtle hover:text-crimson-primary'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-[18px]">library_books</span>
                  <span>All Vocabulary</span>
                </div>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-surface-crimson-soft text-crimson-dark">
                  Master
                </span>
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
            </nav>
          </div>

          {/* Section: READING LISTS */}
          <div className="flex flex-col gap-1">
            <div className="px-2 py-1 flex items-center justify-between">
              <span className="text-[11px] font-bold tracking-wider text-text-muted uppercase">READING LISTS</span>
              <button
                type="button"
                onClick={onOpenAddReadingListModal || onOpenAddModal}
                title="Tạo thẻ List bài đọc mới"
                className="w-5 h-5 rounded flex items-center justify-center text-text-muted hover:text-crimson-primary hover:bg-surface-crimson-subtle transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">add</span>
              </button>
            </div>
            <nav className="flex flex-col gap-1">
              {readingLists.length === 0 ? (
                <button
                  type="button"
                  onClick={onOpenAddReadingListModal || onOpenAddModal}
                  className="px-3 py-2 text-xs text-text-muted hover:text-crimson-primary hover:bg-surface-crimson-subtle rounded-lg flex items-center gap-1.5 transition-colors group text-left w-full"
                >
                  <span className="material-symbols-outlined text-[15px] text-text-muted group-hover:text-crimson-primary">add_circle</span>
                  <span className="italic">Chưa có danh sách (Bấm để thêm)</span>
                </button>
              ) : (
                readingLists.map((list) => {
                  const isActive = currentView === 'reading-list' && selectedReadingListId === list.id;
                  const displayCode = list.code || list.shortTitle || 'LIST';
                  const displayTitle = list.title || '';
                  return (
                    <div
                      key={list.id}
                      className={`group relative flex items-center justify-between px-3 py-2 rounded-lg transition-colors text-left text-sm ${
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
                        className="flex items-center gap-2.5 truncate flex-1 min-w-0 pr-1 text-left cursor-pointer"
                      >
                        <span className={`material-symbols-outlined text-[18px] shrink-0 ${isActive ? 'text-crimson-primary' : 'text-text-muted'}`}>
                          article
                        </span>
                        <div className="flex flex-col truncate">
                          <span className="text-[13px] font-semibold truncate leading-tight">
                            {displayCode}
                          </span>
                          {displayTitle && displayTitle !== displayCode && (
                            <span className="text-[11px] text-text-muted truncate leading-tight mt-0.5">
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
                              className="w-5 h-5 rounded flex items-center justify-center text-slate-400 hover:text-crimson-primary hover:bg-white transition-colors cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-[14px]">edit</span>
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
                              className="w-5 h-5 rounded flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-white transition-colors cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-[14px]">delete</span>
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
                          {list.count || 0}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
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
            <nav className="flex flex-col gap-1">
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
