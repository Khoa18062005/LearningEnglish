import React, { useState, useEffect, useRef } from 'react';

export default function Sidebar({
  currentView,
  setCurrentView,
  selectedReadingListId,
  setSelectedReadingListId,
  selectedCategory,
  setSelectedCategory,
  readingLists = [],
  noteFolders = [],
  categories = [],
  vocabList = [],
  onOpenAddModal,
  onOpenAddReadingListModal,
  onOpenAddFolderModal,
  onEditFolder,
  onDeleteFolder,
  onOpenAddCategoryModal,
  onEditCategory,
  onDeleteCategory,
  onEditReadingList,
  onDeleteReadingList,
  onReorderReadingLists,
  onNavigateHome,
}) {
  const activeReadingListRef = useRef(null);
  const activeCategoryRef = useRef(null);
  const addMenuRef = useRef(null);
  const [isReadingListOpen, setIsReadingListOpen] = useState(true);
  const [isTopicVocabularyOpen, setIsTopicVocabularyOpen] = useState(true);
  const [expandedFolderIds, setExpandedFolderIds] = useState(() => new Set());
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);

  // Đóng menu thêm mới khi click ra ngoài
  useEffect(() => {
    if (!isAddMenuOpen) return;
    const handleClickOutside = (e) => {
      if (addMenuRef.current && !addMenuRef.current.contains(e.target)) {
        setIsAddMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isAddMenuOpen]);

  // Tự động mở rộng các thư mục ban đầu hoặc khi có thư mục mới
  useEffect(() => {
    if (noteFolders.length > 0) {
      setExpandedFolderIds((prev) => {
        const next = new Set(prev);
        noteFolders.forEach((f) => next.add(String(f.id)));
        return next;
      });
    }
  }, [noteFolders]);

  // Tự động mở thư mục chứa reading list đang được chọn
  useEffect(() => {
    if (selectedReadingListId && readingLists.length > 0) {
      const currentList = readingLists.find((l) => String(l.id) === String(selectedReadingListId));
      if (currentList && currentList.folderId) {
        setExpandedFolderIds((prev) => {
          const next = new Set(prev);
          next.add(String(currentList.folderId));
          return next;
        });
      }
    }
  }, [selectedReadingListId, readingLists]);

  const toggleFolder = (folderId) => {
    setExpandedFolderIds((prev) => {
      const next = new Set(prev);
      const key = String(folderId);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const getFolderWordCount = (folder) => {
    const listsInFolder = (readingLists || []).filter(
      (l) => l.folderId === folder.id || String(l.folderId) === String(folder.id)
    );
    const listIds = new Set(listsInFolder.map((l) => String(l.id)));
    return (vocabList || []).filter((v) => {
      if (!v) return false;
      const vListId = v.readingListId || v.noteListId;
      if (vListId && listIds.has(String(vListId))) return true;
      if (Array.isArray(v.noteLists) && v.noteLists.some((nl) => nl && listIds.has(String(nl.id)))) return true;
      if (Array.isArray(v.noteListIds) && v.noteListIds.some((id) => id != null && listIds.has(String(id)))) return true;
      return false;
    }).length;
  };

  // Drag and drop states for readingLists (Nhấn giữ & kéo thả sắp xếp vị trí)
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [dropPosition, setDropPosition] = useState(null); // 'before' | 'after'
  const isDraggingRef = useRef(false);

  const handleDragStart = (e, index) => {
    isDraggingRef.current = true;
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';

    if (draggedIndex === null || draggedIndex === index) {
      if (dragOverIndex !== null) {
        setDragOverIndex(null);
        setDropPosition(null);
      }
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const offset = e.clientY - rect.top;
    const position = offset < rect.height / 2 ? 'before' : 'after';

    if (dragOverIndex !== index || dropPosition !== position) {
      setDragOverIndex(index);
      setDropPosition(position);
    }
  };

  const handleDragLeave = (e, index) => {
    e.preventDefault();
    if (!e.currentTarget.contains(e.relatedTarget)) {
      if (dragOverIndex === index) {
        setDragOverIndex(null);
        setDropPosition(null);
      }
    }
  };

  const handleDrop = (e, index) => {
    e.preventDefault();
    e.stopPropagation();

    if (draggedIndex === null || draggedIndex === index) {
      cleanupDragState();
      return;
    }

    const updatedLists = [...readingLists];
    const [draggedItem] = updatedLists.splice(draggedIndex, 1);

    let targetIndex = index;
    if (draggedIndex < index) {
      targetIndex = dropPosition === 'before' ? index - 1 : index;
    } else {
      targetIndex = dropPosition === 'before' ? index : index + 1;
    }

    targetIndex = Math.max(0, Math.min(targetIndex, updatedLists.length));
    updatedLists.splice(targetIndex, 0, draggedItem);

    if (onReorderReadingLists) {
      onReorderReadingLists(updatedLists);
    }

    cleanupDragState();
  };

  const cleanupDragState = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
    setDropPosition(null);
    setTimeout(() => {
      isDraggingRef.current = false;
    }, 150);
  };

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

  const getCategoryWordCount = (cat) => {
    if (Array.isArray(vocabList)) {
      const catName = (cat.name || '').toLowerCase();
      return vocabList.filter((v) => {
        if (!v) return false;
        if (Array.isArray(v.categories)) {
          return v.categories.some((c) => {
            if (typeof c === 'string') return c.toLowerCase() === catName;
            if (c && c.name) return c.name.toLowerCase() === catName;
            return false;
          });
        }
        return false;
      }).length;
    }
    return cat.count || 0;
  };

  useEffect(() => {
    if (currentView === 'reading-list' || currentView === 'list-vocabulary') {
      setIsReadingListOpen(true);
    }
  }, [currentView]);

  useEffect(() => {
    if (currentView === 'category' || currentView === 'topic-vocabulary') {
      setIsTopicVocabularyOpen(true);
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
                  ref={addMenuRef}
                  className={`group relative flex items-center justify-between px-3 py-2 rounded-lg transition-colors text-left text-sm font-medium ${
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
                    {/* Nút + duy nhất */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsAddMenuOpen((prev) => !prev);
                      }}
                      title="Thêm Thư mục hoặc Danh sách từ vựng"
                      className={`w-5 h-5 rounded flex items-center justify-center transition-colors cursor-pointer ${
                        isAddMenuOpen
                          ? 'bg-crimson-primary text-white shadow-xs'
                          : 'text-text-muted hover:text-crimson-primary hover:bg-white'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[16px]">add</span>
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

                  {/* Popover Menu hỏi Thêm Thư mục hay Danh sách từ vựng - Cân đối hoàn hảo ngay dưới thanh List Vocabulary */}
                  {isAddMenuOpen && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-2xl shadow-2xl border border-slate-200/95 p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150 flex flex-col gap-1 ring-1 ring-black/5"
                    >
                      {/* Mũi tên chỉ thẳng vào tâm nút dấu cộng */}
                      <div className="absolute right-[40px] -top-1.5 w-3 h-3 bg-white border-l border-t border-slate-200/90 rotate-45 shadow-[-2px_-2px_4px_rgba(0,0,0,0.02)]" />

                      <div className="relative px-2.5 pt-1.5 pb-1 text-[10.5px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                        <span>Thêm mới</span>
                      </div>

                      {/* Tùy chọn 1: Thêm thư mục mới */}
                      <button
                        type="button"
                        onClick={() => {
                          setIsAddMenuOpen(false);
                          if (onOpenAddFolderModal) onOpenAddFolderModal();
                        }}
                        className="relative w-full px-2.5 py-2 rounded-xl flex items-center gap-2.5 text-left text-xs font-medium text-slate-700 hover:bg-amber-50/80 hover:text-amber-900 transition-colors cursor-pointer group"
                      >
                        <div className="w-6 h-6 rounded-lg bg-amber-100/80 border border-amber-200 flex items-center justify-center text-amber-700 group-hover:scale-105 transition-transform shrink-0 shadow-2xs">
                          <span className="material-symbols-outlined text-[15px]">folder_open</span>
                        </div>
                        <span className="leading-tight text-slate-800 group-hover:text-amber-900 font-semibold">
                          Thêm thư mục mới
                        </span>
                      </button>

                      {/* Tùy chọn 2: Thêm danh sách từ vựng */}
                      <button
                        type="button"
                        onClick={() => {
                          setIsAddMenuOpen(false);
                          if (onOpenAddReadingListModal) onOpenAddReadingListModal();
                          else if (onOpenAddModal) onOpenAddModal();
                        }}
                        className="relative w-full px-2.5 py-2 rounded-xl flex items-center gap-2.5 text-left text-xs font-medium text-slate-700 hover:bg-red-50/80 hover:text-crimson-primary transition-colors cursor-pointer group"
                      >
                        <div className="w-6 h-6 rounded-lg bg-red-100/80 border border-red-200 flex items-center justify-center text-crimson-primary group-hover:scale-105 transition-transform shrink-0 shadow-2xs">
                          <span className="material-symbols-outlined text-[15px]">article</span>
                        </div>
                        <span className="leading-tight text-slate-800 group-hover:text-crimson-primary font-semibold">
                          Thêm danh sách từ vựng
                        </span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Sub-items: Phân cấp Thư mục (Cấp 2) & Bài đọc con (Cấp 3) */}
                {isReadingListOpen && (
                  <div 
                    className="ml-2.5 pl-2 my-1 border-l-2 border-slate-100 flex flex-col gap-1 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar"
                  >
                    {/* 1. Danh sách các THƯ MỤC / BỘ ĐỀ (Cấp 2) */}
                    {noteFolders.map((folder) => {
                      const isFolderExpanded = expandedFolderIds.has(String(folder.id));
                      const listsInFolder = (readingLists || []).filter(
                        (l) => l.folderId === folder.id || String(l.folderId) === String(folder.id)
                      );
                      const folderWordCount = getFolderWordCount(folder);

                      return (
                        <div key={folder.id} className="flex flex-col gap-0.5">
                          {/* Hàng Thư Mục */}
                          <div
                            onClick={() => toggleFolder(folder.id)}
                            className="group/folder flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-slate-100/90 transition-all text-xs cursor-pointer select-none"
                          >
                            <div className="flex items-center gap-1.5 flex-1 min-w-0 pr-1 text-left">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleFolder(folder.id);
                                }}
                                className="w-4 h-4 rounded flex items-center justify-center text-text-muted hover:text-crimson-primary cursor-pointer shrink-0"
                              >
                                <span className={`material-symbols-outlined text-[15px] transition-transform duration-200 ${isFolderExpanded ? 'rotate-90' : ''}`}>
                                  chevron_right
                                </span>
                              </button>

                              <span className="material-symbols-outlined text-[17px] text-amber-500 shrink-0">
                                folder_open
                              </span>

                              <span className="font-bold text-slate-700 truncate text-[12px]" title={folder.name}>
                                {folder.name}
                              </span>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              {/* Hover action buttons cho Folder */}
                              <div className="hidden group-hover/folder:flex items-center gap-0.5">
                                {onOpenAddReadingListModal && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onOpenAddReadingListModal({ defaultFolderId: folder.id });
                                    }}
                                    title="Thêm danh sách mới vào thư mục này"
                                    className="w-4 h-4 rounded flex items-center justify-center text-slate-400 hover:text-crimson-primary hover:bg-white transition-colors cursor-pointer"
                                  >
                                    <span className="material-symbols-outlined text-[13px]">add</span>
                                  </button>
                                )}
                                {onEditFolder && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onEditFolder(folder);
                                    }}
                                    title="Chỉnh sửa thư mục"
                                    className="w-4 h-4 rounded flex items-center justify-center text-slate-400 hover:text-crimson-primary hover:bg-white transition-colors cursor-pointer"
                                  >
                                    <span className="material-symbols-outlined text-[13px]">edit</span>
                                  </button>
                                )}
                                {onDeleteFolder && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onDeleteFolder(folder.id);
                                    }}
                                    title="Xóa thư mục"
                                    className="w-4 h-4 rounded flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-white transition-colors cursor-pointer"
                                  >
                                    <span className="material-symbols-outlined text-[13px]">delete</span>
                                  </button>
                                )}
                              </div>

                              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-slate-100 text-text-muted">
                                {folderWordCount}
                              </span>
                            </div>
                          </div>

                          {/* Sub-items: Danh sách bài đọc con trong Thư mục (Cấp 3) */}
                          {isFolderExpanded && (
                            <div className="ml-5 pl-2 border-l border-slate-200/90 flex flex-col gap-0.5 my-0.5">
                              {listsInFolder.length === 0 ? (
                                <button
                                  type="button"
                                  onClick={() => onOpenAddReadingListModal && onOpenAddReadingListModal({ defaultFolderId: folder.id })}
                                  className="px-2 py-1 text-[11px] text-text-muted hover:text-crimson-primary hover:bg-red-50/50 rounded flex items-center gap-1.5 transition-colors group text-left w-full cursor-pointer"
                                >
                                  <span className="material-symbols-outlined text-[13px] text-text-muted group-hover:text-crimson-primary">add_circle</span>
                                  <span className="italic text-[10.5px]">Chưa có bài đọc (Bấm để thêm)</span>
                                </button>
                              ) : (
                                listsInFolder.map((list) => {
                                  const isActive =
                                    currentView === 'reading-list' &&
                                    (selectedReadingListId === list.id || String(selectedReadingListId) === String(list.id));
                                  const displayCode = list.code || list.shortTitle || 'LIST';
                                  const displayTitle = list.title || '';

                                  return (
                                    <div
                                      key={list.id}
                                      onClick={() => {
                                        setSelectedReadingListId(list.id);
                                        setSelectedCategory(null);
                                        setCurrentView('reading-list');
                                      }}
                                      className={`group relative flex items-center justify-between px-2 py-1.5 rounded-lg transition-all text-left text-xs cursor-pointer select-none ${
                                        isActive
                                          ? 'bg-surface-crimson-subtle text-crimson-primary font-semibold ring-1 ring-crimson-primary/20'
                                          : 'text-text-body hover:bg-surface-crimson-subtle hover:text-crimson-primary'
                                      }`}
                                    >
                                      <div className="flex items-center gap-1.5 truncate flex-1 min-w-0 pr-1 text-left">
                                        <span
                                          className={`material-symbols-outlined text-[15px] shrink-0 ${
                                            isActive ? 'text-crimson-primary' : 'text-text-muted'
                                          }`}
                                        >
                                          article
                                        </span>
                                        <span className="text-[11.5px] truncate leading-tight font-medium">
                                          {displayTitle || displayCode}
                                        </span>
                                      </div>

                                      <div className="flex items-center gap-1 shrink-0">
                                        <div className="hidden group-hover:flex items-center gap-0.5">
                                          {onEditReadingList && (
                                            <button
                                              type="button"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                onEditReadingList(list);
                                              }}
                                              title="Chỉnh sửa bài đọc"
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
                                              title="Xóa bài đọc"
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
                      );
                    })}

                    {/* 2. Các danh sách riêng lẻ chưa thuộc thư mục (Standalone Lists) */}
                    {(() => {
                      const standaloneLists = (readingLists || []).filter((l) => !l.folderId);
                      if (standaloneLists.length === 0) return null;

                      return (
                        <div className="flex flex-col gap-0.5 pt-1">
                          {noteFolders.length > 0 && (
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-0.5">
                              Danh sách riêng lẻ
                            </span>
                          )}
                          {standaloneLists.map((list) => {
                            const isActive =
                              currentView === 'reading-list' &&
                              (selectedReadingListId === list.id || String(selectedReadingListId) === String(list.id));
                            const displayCode = list.code || list.shortTitle || 'LIST';
                            const displayTitle = list.title || '';

                            return (
                              <div
                                key={list.id}
                                onClick={() => {
                                  setSelectedReadingListId(list.id);
                                  setSelectedCategory(null);
                                  setCurrentView('reading-list');
                                }}
                                className={`group relative flex items-center justify-between px-2 py-1.5 rounded-lg transition-all text-left text-xs cursor-pointer select-none ${
                                  isActive
                                    ? 'bg-surface-crimson-subtle text-crimson-primary font-semibold ring-1 ring-crimson-primary/20'
                                    : 'text-text-body hover:bg-surface-crimson-subtle hover:text-crimson-primary'
                                }`}
                              >
                                <div className="flex items-center gap-2 truncate flex-1 min-w-0 pr-1 text-left">
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
                                </div>

                                <div className="flex items-center gap-1 shrink-0">
                                  <div className="hidden group-hover:flex items-center gap-0.5">
                                    {onEditReadingList && (
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          onEditReadingList(list);
                                        }}
                                        title="Chỉnh sửa bài đọc"
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
                                        title="Xóa bài đọc"
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
                          })}
                        </div>
                      );
                    })()}

                    {/* 3. Empty state */}
                    {noteFolders.length === 0 && readingLists.length === 0 && (
                      <button
                        type="button"
                        onClick={onOpenAddFolderModal || onOpenAddReadingListModal}
                        className="px-2 py-1.5 text-xs text-text-muted hover:text-crimson-primary hover:bg-surface-crimson-subtle rounded-md flex items-center gap-1.5 transition-colors group text-left w-full cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[14px] text-text-muted group-hover:text-crimson-primary">create_new_folder</span>
                        <span className="italic text-[11px]">Chưa có thư mục (Bấm để tạo)</span>
                      </button>
                    )}


                  </div>
                )}
              </div>

              <div className="flex flex-col">
                <div
                  className={`group flex items-center justify-between px-3 py-2 rounded-lg transition-colors text-left text-sm font-medium ${
                    currentView === 'topic-vocabulary' && !selectedCategory
                      ? 'bg-surface-crimson-subtle text-crimson-primary font-semibold'
                      : 'text-text-body hover:bg-surface-crimson-subtle hover:text-crimson-primary'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentView('topic-vocabulary');
                      setSelectedReadingListId(null);
                      setSelectedCategory(null);
                    }}
                    className="flex items-center gap-2.5 flex-1 min-w-0 text-left cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">category</span>
                    <span className="truncate">Topic Vocabulary</span>
                  </button>

                  <div className="flex items-center gap-1 shrink-0">
                    {/* Nút + tạo chủ đề mới */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onOpenAddCategoryModal) onOpenAddCategoryModal();
                        else if (onOpenAddModal) onOpenAddModal();
                      }}
                      title="Thêm chủ đề mới"
                      className="w-5 h-5 rounded flex items-center justify-center text-text-muted hover:text-crimson-primary hover:bg-white transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[15px]">add</span>
                    </button>

                    {/* Nút toggle thu gọn / mở rộng */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsTopicVocabularyOpen((prev) => !prev);
                      }}
                      className="w-5 h-5 rounded flex items-center justify-center text-text-muted hover:text-crimson-primary hover:bg-white transition-colors cursor-pointer"
                      title={isTopicVocabularyOpen ? "Thu gọn danh sách chủ đề" : "Mở rộng danh sách chủ đề"}
                    >
                      <span className={`material-symbols-outlined text-[16px] transition-transform duration-200 ${isTopicVocabularyOpen ? 'rotate-90' : ''}`}>
                        chevron_right
                      </span>
                    </button>
                  </div>
                </div>

                {/* Sub-items: Danh sách các chủ đề con */}
                {isTopicVocabularyOpen && (
                  <div className="ml-4 pl-2.5 my-1 border-l-2 border-slate-100 flex flex-col gap-0.5 max-h-[220px] overflow-y-auto pr-1 custom-scrollbar">
                    {categories.length === 0 ? (
                      <button
                        type="button"
                        onClick={onOpenAddCategoryModal || onOpenAddModal}
                        className="px-2 py-1.5 text-xs text-text-muted hover:text-crimson-primary hover:bg-surface-crimson-subtle rounded-md flex items-center gap-1.5 transition-colors group text-left w-full"
                      >
                        <span className="material-symbols-outlined text-[14px] text-text-muted group-hover:text-crimson-primary">add_circle</span>
                        <span className="italic text-[11px]">Chưa có chủ đề (Bấm để thêm)</span>
                      </button>
                    ) : (
                      categories.map((cat) => {
                        const isSelected = currentView === 'category' && selectedCategory === cat.name;
                        return (
                          <div
                            key={cat.id || cat.name}
                            ref={isSelected ? activeCategoryRef : null}
                            className={`group relative flex items-center justify-between px-2 py-1.5 rounded-md transition-colors text-left text-xs ${
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
                                className={`material-symbols-outlined text-[16px] shrink-0 ${
                                  isSelected ? 'text-crimson-primary' : 'text-text-muted'
                                }`}
                                style={!isSelected && cat.colorCode ? { color: cat.colorCode } : {}}
                              >
                                label
                              </span>
                              <span className="text-[12px] truncate">{cat.name}</span>
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
                                    title="Chỉnh sửa chủ đề"
                                    className="w-4 h-4 rounded flex items-center justify-center text-slate-400 hover:text-crimson-primary hover:bg-white transition-colors cursor-pointer"
                                  >
                                    <span className="material-symbols-outlined text-[13px]">edit</span>
                                  </button>
                                )}
                                {onDeleteCategory && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onDeleteCategory(cat);
                                    }}
                                    title="Xóa chủ đề"
                                    className="w-4 h-4 rounded flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-white transition-colors cursor-pointer"
                                  >
                                    <span className="material-symbols-outlined text-[13px]">delete</span>
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
                                {getCategoryWordCount(cat)}
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
