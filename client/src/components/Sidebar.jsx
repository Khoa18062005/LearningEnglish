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
  onReorderNoteFolders,
  onMoveReadingListToFolder,
  showNotification,
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

  // ==================== DRAG & DROP STATE ====================
  // dragType: 'folder' | 'reading-list' | null
  const [dragType, setDragType] = useState(null);

  // Kéo thả Thư mục (Folders)
  const [draggedFolderId, setDraggedFolderId] = useState(null);
  const [dragOverFolderId, setDragOverFolderId] = useState(null);
  const [folderDropPosition, setFolderDropPosition] = useState(null); // 'before' | 'after'

  // Kéo thả Danh sách từ vựng (Reading Lists)
  const [draggedListId, setDraggedListId] = useState(null);
  const [dragOverListId, setDragOverListId] = useState(null);
  const [listDropPosition, setListDropPosition] = useState(null); // 'before' | 'after'
  // Thư mục đích đang hover (hoặc 'standalone' nếu hover mục danh sách riêng lẻ)
  const [dragOverFolderTargetId, setDragOverFolderTargetId] = useState(null);

  // Cờ chống click nhầm khi kết thúc kéo thả & Lưu trữ dữ liệu kéo thả tức thì (tránh trễ state)
  const dragJustEndedRef = useRef(false);
  const activeDragRef = useRef(null);

  const cleanupDragState = () => {
    activeDragRef.current = null;
    setDragType(null);
    setDraggedFolderId(null);
    setDragOverFolderId(null);
    setFolderDropPosition(null);
    setDraggedListId(null);
    setDragOverListId(null);
    setListDropPosition(null);
    setDragOverFolderTargetId(null);
    setTimeout(() => {
      dragJustEndedRef.current = false;
    }, 200);
  };

  // Hủy tiến trình kéo thả trong thanh menu bên trái khi nhấn phím ESC
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        const isDragging = Boolean(dragType || draggedFolderId || draggedListId || activeDragRef.current);
        if (isDragging) {
          e.preventDefault();
          e.stopPropagation();
          dragJustEndedRef.current = true;
          cleanupDragState();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [dragType, draggedFolderId, draggedListId]);

  // ==================== FOLDER DRAG HANDLERS ====================
  const handleFolderDragStart = (e, folderId) => {
    dragJustEndedRef.current = false;
    activeDragRef.current = { type: 'folder', id: folderId };
    setDragType('folder');
    setDraggedFolderId(folderId);
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
      try {
        e.dataTransfer.setData('text/plain', String(folderId));
      } catch (err) {}
    }
  };

  const handleFolderDragOver = (e, targetFolderId) => {
    const activeType = activeDragRef.current?.type || dragType;
    if (activeType !== 'folder') return;
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';

    const activeFolderId = activeDragRef.current?.id || draggedFolderId;
    if (String(activeFolderId) === String(targetFolderId)) {
      if (dragOverFolderId !== null) {
        setDragOverFolderId(null);
        setFolderDropPosition(null);
      }
      return;
    }

    const targetIdx = noteFolders.findIndex((f) => String(f.id) === String(targetFolderId));
    const isLastItem = targetIdx === noteFolders.length - 1;
    let position = 'before';

    if (isLastItem) {
      const rect = e.currentTarget.getBoundingClientRect();
      if (e.clientY > rect.top + rect.height * 0.6) {
        position = 'after';
      }
    }

    if (dragOverFolderId !== targetFolderId || folderDropPosition !== position) {
      setDragOverFolderId(targetFolderId);
      setFolderDropPosition(position);
    }
  };

  const handleFolderDragLeave = (e, targetFolderId) => {
    const activeType = activeDragRef.current?.type || dragType;
    if (activeType !== 'folder') return;
    if (e && e.preventDefault) e.preventDefault();
    if (e && e.relatedTarget && !e.currentTarget.contains(e.relatedTarget)) {
      if (dragOverFolderId === targetFolderId) {
        setDragOverFolderId(null);
        setFolderDropPosition(null);
      }
    }
  };

  const handleFolderDrop = (e, targetFolderId) => {
    const activeType = activeDragRef.current?.type || dragType;
    if (activeType !== 'folder') return;
    e.preventDefault();
    e.stopPropagation();

    const activeFolderId = activeDragRef.current?.id || draggedFolderId;
    if (!activeFolderId || String(activeFolderId) === String(targetFolderId)) {
      cleanupDragState();
      return;
    }

    const currentFolders = [...noteFolders];
    const draggedIdx = currentFolders.findIndex((f) => String(f.id) === String(activeFolderId));
    const targetIdx = currentFolders.findIndex((f) => String(f.id) === String(targetFolderId));

    if (draggedIdx !== -1 && targetIdx !== -1) {
      const [moved] = currentFolders.splice(draggedIdx, 1);
      const newTargetIdx = currentFolders.findIndex((f) => String(f.id) === String(targetFolderId));
      let insertIdx = folderDropPosition === 'after' ? newTargetIdx + 1 : newTargetIdx;
      insertIdx = Math.max(0, Math.min(insertIdx, currentFolders.length));
      currentFolders.splice(insertIdx, 0, moved);

      if (onReorderNoteFolders) {
        onReorderNoteFolders(currentFolders);
      }
    }

    cleanupDragState();
  };

  const handleFolderDragEnd = () => {
    dragJustEndedRef.current = true;
    cleanupDragState();
  };

  // ==================== READING LIST DRAG HANDLERS ====================
  const handleListDragStart = (e, list) => {
    dragJustEndedRef.current = false;
    activeDragRef.current = { type: 'reading-list', id: list.id, list };
    setDragType('reading-list');
    setDraggedListId(list.id);
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
      try {
        e.dataTransfer.setData('text/plain', String(list.id));
      } catch (err) {}
    }
  };

  // Khi kéo list qua một list khác
  const handleListDragOver = (e, targetList) => {
    const activeType = activeDragRef.current?.type || dragType;
    if (activeType !== 'reading-list') return;
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';

    const activeListId = activeDragRef.current?.id || draggedListId;
    if (String(activeListId) === String(targetList.id)) {
      if (dragOverListId !== null) {
        setDragOverListId(null);
        setListDropPosition(null);
      }
      return;
    }

    const isMatch = (a, b) => (!a && !b) || String(a) === String(b);
    const siblings = readingLists.filter((l) => isMatch(l.folderId, targetList.folderId));
    const targetIdx = siblings.findIndex((l) => String(l.id) === String(targetList.id));
    const isLastItem = targetIdx === siblings.length - 1;
    let position = 'before';

    if (isLastItem) {
      const rect = e.currentTarget.getBoundingClientRect();
      if (e.clientY > rect.top + rect.height * 0.6) {
        position = 'after';
      }
    }

    if (dragOverListId !== targetList.id || listDropPosition !== position) {
      setDragOverListId(targetList.id);
      setListDropPosition(position);
    }

    // Nếu targetList thuộc folder khác, highlight folder đó
    const draggedItem = activeDragRef.current?.list || readingLists.find((l) => String(l.id) === String(activeListId));
    if (draggedItem && String(draggedItem.folderId || '') !== String(targetList.folderId || '')) {
      setDragOverFolderTargetId(targetList.folderId ? String(targetList.folderId) : 'standalone');
    } else {
      setDragOverFolderTargetId(null);
    }
  };

  const handleListDragLeave = (e, targetListId) => {
    const activeType = activeDragRef.current?.type || dragType;
    if (activeType !== 'reading-list') return;
    if (e && e.preventDefault) e.preventDefault();
    if (e && e.relatedTarget && !e.currentTarget.contains(e.relatedTarget)) {
      if (dragOverListId === targetListId) {
        setDragOverListId(null);
        setListDropPosition(null);
      }
    }
  };

  // Khi kéo list qua tiêu đề của một Folder
  const handleFolderHeaderDragOverForList = (e, folderId) => {
    const activeType = activeDragRef.current?.type || dragType;
    if (activeType !== 'reading-list') return;
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';

    const activeListId = activeDragRef.current?.id || draggedListId;
    const draggedItem = activeDragRef.current?.list || readingLists.find((l) => String(l.id) === String(activeListId));
    if (draggedItem && String(draggedItem.folderId || '') !== String(folderId)) {
      if (dragOverFolderTargetId !== String(folderId)) {
        setDragOverFolderTargetId(String(folderId));
        setDragOverListId(null);
      }
    }
  };

  const handleFolderHeaderDragLeaveForList = (e, folderId) => {
    const activeType = activeDragRef.current?.type || dragType;
    if (activeType !== 'reading-list') return;
    if (e && e.preventDefault) e.preventDefault();
    if (e && e.relatedTarget && !e.currentTarget.contains(e.relatedTarget)) {
      if (dragOverFolderTargetId === String(folderId)) {
        setDragOverFolderTargetId(null);
      }
    }
  };

  // Khi kéo list qua vùng Danh sách riêng lẻ
  const handleStandaloneDragOverForList = (e) => {
    const activeType = activeDragRef.current?.type || dragType;
    if (activeType !== 'reading-list') return;
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';

    const activeListId = activeDragRef.current?.id || draggedListId;
    const draggedItem = activeDragRef.current?.list || readingLists.find((l) => String(l.id) === String(activeListId));
    if (draggedItem && draggedItem.folderId) {
      if (dragOverFolderTargetId !== 'standalone') {
        setDragOverFolderTargetId('standalone');
        setDragOverListId(null);
      }
    }
  };

  const handleStandaloneDragLeaveForList = (e) => {
    const activeType = activeDragRef.current?.type || dragType;
    if (activeType !== 'reading-list') return;
    if (e && e.preventDefault) e.preventDefault();
    if (e && e.relatedTarget && !e.currentTarget.contains(e.relatedTarget)) {
      if (dragOverFolderTargetId === 'standalone') {
        setDragOverFolderTargetId(null);
      }
    }
  };

  // Hộp thoại xác nhận chuyển thư mục cho danh sách từ vựng
  const requestMoveFolderConfirmation = ({
    draggedList,
    targetFolderId,
    targetListId = null,
    dropPos = 'after',
  }) => {
    const sourceFolder = noteFolders.find((f) => String(f.id) === String(draggedList.folderId));
    const targetFolder = targetFolderId
      ? noteFolders.find((f) => String(f.id) === String(targetFolderId))
      : null;

    const listName = draggedList.title || draggedList.code || 'Danh sách từ vựng';
    const sourceName = sourceFolder ? sourceFolder.name : 'Danh sách riêng lẻ';
    const targetName = targetFolder ? targetFolder.name : 'Danh sách riêng lẻ';

    if (showNotification) {
      showNotification({
        title: 'Xác nhận chuyển thư mục',
        message: (
          <div className="space-y-3 text-slate-600 text-left">
            <p className="text-xs leading-relaxed text-slate-600">
              Bạn có chắc chắn muốn chuyển danh sách <strong className="text-slate-900 font-bold">"{listName}"</strong> sang thư mục mới không?
            </p>
            <div className="p-3 bg-slate-50/90 rounded-xl border border-slate-200/80 flex items-center justify-between text-xs gap-2">
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">Thư mục nguồn</span>
                <span className="font-semibold text-slate-700 truncate" title={sourceName}>
                  {sourceName}
                </span>
              </div>
              <div className="w-6 h-6 rounded-full bg-slate-200/70 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[15px] text-slate-600">arrow_forward</span>
              </div>
              <div className="flex flex-col min-w-0 flex-1 text-right">
                <span className="text-[10.5px] uppercase font-bold text-slate-400">Thư mục đích</span>
                <span className="font-semibold text-crimson-primary truncate" title={targetName}>
                  {targetName}
                </span>
              </div>
            </div>
          </div>
        ),
        type: 'info',
        confirmText: 'Chuyển thư mục',
        cancelText: 'Hủy bỏ',
        onConfirm: async () => {
          if (onMoveReadingListToFolder) {
            await onMoveReadingListToFolder({
              listId: draggedList.id,
              targetFolderId: targetFolder ? targetFolder.id : null,
              targetListId,
              dropPosition: dropPos,
            });
          }
          if (targetFolder) {
            setExpandedFolderIds((prev) => new Set(prev).add(String(targetFolder.id)));
          }
        },
      });
    }
  };

  // Khi thả list lên một list khác
  const handleListDropOnList = (e, targetList) => {
    const activeType = activeDragRef.current?.type || dragType;
    if (activeType !== 'reading-list') return;
    e.preventDefault();
    e.stopPropagation();

    const activeListId = activeDragRef.current?.id || draggedListId;
    if (!activeListId || String(activeListId) === String(targetList.id)) {
      cleanupDragState();
      return;
    }

    const draggedItem =
      activeDragRef.current?.list || readingLists.find((l) => String(l.id) === String(activeListId));
    if (!draggedItem) {
      cleanupDragState();
      return;
    }

    const isMatch = (a, b) => (!a && !b) || String(a) === String(b);
    const isSameFolder = isMatch(draggedItem.folderId, targetList.folderId);

    if (isSameFolder) {
      // Sắp xếp lại thứ tự trong CÙNG một thư mục hoặc CÙNG riêng lẻ
      const targetFolderId = draggedItem.folderId;
      const folderLists = readingLists.filter((l) => isMatch(l.folderId, targetFolderId));

      const draggedIdx = folderLists.findIndex((l) => String(l.id) === String(activeListId));
      const targetIdx = folderLists.findIndex((l) => String(l.id) === String(targetList.id));
      const effectiveDropPos = listDropPosition || (draggedIdx < targetIdx ? 'after' : 'before');

      if (draggedIdx !== -1 && targetIdx !== -1) {
        const [moved] = folderLists.splice(draggedIdx, 1);
        const newTargetIdx = folderLists.findIndex((l) => String(l.id) === String(targetList.id));
        let insertIdx = effectiveDropPos === 'after' ? newTargetIdx + 1 : newTargetIdx;
        insertIdx = Math.max(0, Math.min(insertIdx, folderLists.length));
        folderLists.splice(insertIdx, 0, moved);

        const folderListIds = new Set(folderLists.map((l) => String(l.id)));
        const queue = [...folderLists];
        const updatedAllLists = readingLists.map((l) => {
          if (folderListIds.has(String(l.id))) {
            return queue.shift() || l;
          }
          return l;
        });

        if (onReorderReadingLists) {
          onReorderReadingLists(updatedAllLists);
        }
      }
    } else {
      // KHÁC thư mục -> Mở hộp thoại xác nhận thay đổi thư mục!
      requestMoveFolderConfirmation({
        draggedList: draggedItem,
        targetFolderId: targetList.folderId || null,
        targetListId: targetList.id,
        dropPos: listDropPosition || 'before',
      });
    }

    cleanupDragState();
  };

  // Khi thả list trực tiếp lên Header của Folder
  const handleListDropOnFolderHeader = (e, targetFolderId) => {
    if (dragType !== 'reading-list') return;
    e.preventDefault();
    e.stopPropagation();

    const draggedItem = readingLists.find((l) => String(l.id) === String(draggedListId));
    if (!draggedItem) {
      cleanupDragState();
      return;
    }

    if (String(draggedItem.folderId || '') !== String(targetFolderId)) {
      requestMoveFolderConfirmation({
        draggedList: draggedItem,
        targetFolderId,
        targetListId: null,
      });
    }

    cleanupDragState();
  };

  // Khi thả list lên vùng Standalone
  const handleListDropOnStandalone = (e) => {
    if (dragType !== 'reading-list') return;
    e.preventDefault();
    e.stopPropagation();

    const draggedItem = readingLists.find((l) => String(l.id) === String(draggedListId));
    if (!draggedItem) {
      cleanupDragState();
      return;
    }

    if (draggedItem.folderId) {
      requestMoveFolderConfirmation({
        draggedList: draggedItem,
        targetFolderId: null,
        targetListId: null,
      });
    }

    cleanupDragState();
  };

  const handleListDragEnd = () => {
    dragJustEndedRef.current = true;
    cleanupDragState();
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

                      const isFolderBeingDragged =
                        dragType === 'folder' && String(draggedFolderId) === String(folder.id);
                      const isFolderDropBefore =
                        dragType === 'folder' &&
                        String(dragOverFolderId) === String(folder.id) &&
                        folderDropPosition === 'before';
                      const isFolderDropAfter =
                        dragType === 'folder' &&
                        String(dragOverFolderId) === String(folder.id) &&
                        folderDropPosition === 'after';
                      const isFolderDropTargetForList =
                        dragType === 'reading-list' &&
                        String(dragOverFolderTargetId) === String(folder.id);

                      return (
                        <div key={folder.id} className="flex flex-col gap-0.5">
                          {/* Hàng Thư Mục */}
                          <div
                            draggable={true}
                            onDragStart={(e) => {
                              e.stopPropagation();
                              handleFolderDragStart(e, folder.id);
                            }}
                            onDragOver={(e) => {
                              e.stopPropagation();
                              if (dragType === 'folder') {
                                handleFolderDragOver(e, folder.id);
                              } else if (dragType === 'reading-list') {
                                handleFolderHeaderDragOverForList(e, folder.id);
                              }
                            }}
                            onDragLeave={(e) => {
                              e.stopPropagation();
                              if (dragType === 'folder') {
                                handleFolderDragLeave(e, folder.id);
                              } else if (dragType === 'reading-list') {
                                handleFolderHeaderDragLeaveForList(e, folder.id);
                              }
                            }}
                            onDrop={(e) => {
                              e.stopPropagation();
                              if (dragType === 'folder') {
                                handleFolderDrop(e, folder.id);
                              } else if (dragType === 'reading-list') {
                                handleListDropOnFolderHeader(e, folder.id);
                              }
                            }}
                            onDragEnd={handleFolderDragEnd}
                            onClick={() => {
                              if (dragJustEndedRef.current) return;
                              toggleFolder(folder.id);
                            }}
                            className={`group/folder relative flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-slate-100/90 transition-all text-xs cursor-grab active:cursor-grabbing select-none ${
                              isFolderBeingDragged ? 'opacity-35' : ''
                            } ${
                              isFolderDropTargetForList
                                ? 'ring-2 ring-[#E31E24] bg-red-50/80 shadow-xs'
                                : ''
                            }`}
                          >
                            {/* Đường kẻ ngang màu đỏ phía bên trên khi kéo thả vị trí mới */}
                            {isFolderDropBefore && (
                              <div className="absolute -top-[3px] left-0 right-0 flex items-center z-50 pointer-events-none">
                                <div className="w-2.5 h-2.5 rounded-full bg-[#E31E24] -ml-1 ring-2 ring-white shadow-md shrink-0" />
                                <div className="flex-1 h-[3px] bg-[#E31E24] rounded-full shadow-[0_0_8px_rgba(227,30,36,0.6)]" />
                              </div>
                            )}
                            {isFolderDropAfter && (
                              <div className="absolute -bottom-[3px] left-0 right-0 flex items-center z-50 pointer-events-none">
                                <div className="w-2.5 h-2.5 rounded-full bg-[#E31E24] -ml-1 ring-2 ring-white shadow-md shrink-0" />
                                <div className="flex-1 h-[3px] bg-[#E31E24] rounded-full shadow-[0_0_8px_rgba(227,30,36,0.6)]" />
                              </div>
                            )}
                            <div className={`flex items-center gap-1.5 flex-1 min-w-0 pr-1 text-left ${dragType ? 'pointer-events-none' : ''}`}>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleFolder(folder.id);
                                }}
                                className="w-4 h-4 rounded flex items-center justify-center text-text-muted hover:text-crimson-primary cursor-pointer shrink-0"
                              >
                                <span
                                  className={`material-symbols-outlined text-[15px] transition-transform duration-200 ${
                                    isFolderExpanded ? 'rotate-90' : ''
                                  }`}
                                >
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

                            <div className={`flex items-center gap-1 shrink-0 ${dragType ? 'pointer-events-none' : ''}`}>
                              {isFolderDropTargetForList ? (
                                <span className="text-[9.5px] font-bold text-crimson-primary bg-white px-1.5 py-0.5 rounded shadow-2xs border border-red-200 animate-pulse">
                                  Thả để chuyển vào
                                </span>
                              ) : (
                                <>
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
                                </>
                              )}
                            </div>
                          </div>

                          {/* Sub-items: Danh sách bài đọc con trong Thư mục (Cấp 3) */}
                          {isFolderExpanded && (
                            <div className="ml-5 pl-2 border-l border-slate-200/90 flex flex-col gap-0.5 my-0.5">
                              {listsInFolder.length === 0 ? (
                                <div
                                  onDragOver={(e) => handleFolderHeaderDragOverForList(e, folder.id)}
                                  onDragLeave={(e) => handleFolderHeaderDragLeaveForList(e, folder.id)}
                                  onDrop={(e) => handleListDropOnFolderHeader(e, folder.id)}
                                  className={`px-2 py-1.5 rounded-lg border border-dashed transition-all ${
                                    isFolderDropTargetForList
                                      ? 'border-crimson-primary bg-red-50/50 text-crimson-primary font-semibold'
                                      : 'border-slate-200 text-text-muted hover:border-slate-300'
                                  }`}
                                >
                                  <button
                                    type="button"
                                    onClick={() =>
                                      onOpenAddReadingListModal &&
                                      onOpenAddReadingListModal({ defaultFolderId: folder.id })
                                    }
                                    className="text-[11px] flex items-center gap-1.5 text-left w-full cursor-pointer"
                                  >
                                    <span className="material-symbols-outlined text-[13px]">add_circle</span>
                                    <span className="italic text-[10.5px]">
                                      {isFolderDropTargetForList
                                        ? 'Thả vào đây để chuyển bài đọc vào'
                                        : 'Chưa có bài đọc (Bấm để thêm)'}
                                    </span>
                                  </button>
                                </div>
                              ) : (
                                listsInFolder.map((list) => {
                                  const isActive =
                                    currentView === 'reading-list' &&
                                    (selectedReadingListId === list.id ||
                                      String(selectedReadingListId) === String(list.id));
                                  const displayCode = list.code || list.shortTitle || 'LIST';
                                  const displayTitle = list.title || '';

                                  const isListBeingDragged =
                                    dragType === 'reading-list' && String(draggedListId) === String(list.id);
                                  const isListDropBefore =
                                    dragType === 'reading-list' &&
                                    String(dragOverListId) === String(list.id) &&
                                    listDropPosition === 'before';
                                  const isListDropAfter =
                                    dragType === 'reading-list' &&
                                    String(dragOverListId) === String(list.id) &&
                                    listDropPosition === 'after';

                                  return (
                                    <div
                                      key={list.id}
                                      draggable={true}
                                      onDragStart={(e) => {
                                        e.stopPropagation();
                                        handleListDragStart(e, list);
                                      }}
                                      onDragOver={(e) => {
                                        e.stopPropagation();
                                        handleListDragOver(e, list);
                                      }}
                                      onDragLeave={(e) => {
                                        e.stopPropagation();
                                        handleListDragLeave(e, list.id);
                                      }}
                                      onDrop={(e) => {
                                        e.stopPropagation();
                                        handleListDropOnList(e, list);
                                      }}
                                      onDragEnd={handleListDragEnd}
                                      onClick={() => {
                                        if (dragJustEndedRef.current) return;
                                        setSelectedReadingListId(list.id);
                                        setSelectedCategory(null);
                                        setCurrentView('reading-list');
                                      }}
                                      className={`group relative flex items-center justify-between px-2 py-1.5 rounded-lg transition-all text-left text-xs cursor-grab active:cursor-grabbing select-none ${
                                        isListBeingDragged ? 'opacity-35' : ''
                                      } ${
                                        isActive
                                          ? 'bg-surface-crimson-subtle text-crimson-primary font-semibold ring-1 ring-crimson-primary/20'
                                          : 'text-text-body hover:bg-surface-crimson-subtle hover:text-crimson-primary'
                                      }`}
                                    >
                                      {/* Đường kẻ ngang màu đỏ phía bên trên khi kéo thả vị trí mới */}
                                      {isListDropBefore && (
                                        <div className="absolute -top-[3px] left-0 right-0 flex items-center z-50 pointer-events-none">
                                          <div className="w-2.5 h-2.5 rounded-full bg-[#E31E24] -ml-1 ring-2 ring-white shadow-md shrink-0" />
                                          <div className="flex-1 h-[3px] bg-[#E31E24] rounded-full shadow-[0_0_8px_rgba(227,30,36,0.6)]" />
                                        </div>
                                      )}
                                      {isListDropAfter && (
                                        <div className="absolute -bottom-[3px] left-0 right-0 flex items-center z-50 pointer-events-none">
                                          <div className="w-2.5 h-2.5 rounded-full bg-[#E31E24] -ml-1 ring-2 ring-white shadow-md shrink-0" />
                                          <div className="flex-1 h-[3px] bg-[#E31E24] rounded-full shadow-[0_0_8px_rgba(227,30,36,0.6)]" />
                                        </div>
                                      )}
                                      <div className={`flex items-center gap-1.5 truncate flex-1 min-w-0 pr-1 text-left ${dragType ? 'pointer-events-none' : ''}`}>
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

                                      <div className={`flex items-center gap-1 shrink-0 ${dragType ? 'pointer-events-none' : ''}`}>
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
                      const isDraggingListFromFolder =
                        dragType === 'reading-list' &&
                        (() => {
                          const dragged = readingLists.find((l) => String(l.id) === String(draggedListId));
                          return dragged && dragged.folderId != null;
                        })();

                      if (standaloneLists.length === 0 && !isDraggingListFromFolder) return null;

                      return (
                        <div
                          onDragOver={handleStandaloneDragOverForList}
                          onDragLeave={handleStandaloneDragLeaveForList}
                          onDrop={handleListDropOnStandalone}
                          className={`flex flex-col gap-0.5 pt-1 rounded-lg transition-all ${
                            dragOverFolderTargetId === 'standalone'
                              ? 'ring-2 ring-crimson-primary bg-red-50/60 p-1 shadow-xs'
                              : ''
                          }`}
                        >
                          <div className="flex items-center justify-between px-2 py-0.5">
                            {noteFolders.length > 0 && (
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                Danh sách riêng lẻ
                              </span>
                            )}
                            {dragOverFolderTargetId === 'standalone' && (
                              <span className="text-[9.5px] font-bold text-crimson-primary bg-white px-1.5 py-0.5 rounded shadow-2xs border border-red-200 animate-pulse">
                                Thả để đưa ra ngoài
                              </span>
                            )}
                          </div>

                          {standaloneLists.length === 0 && isDraggingListFromFolder && (
                            <div className="px-2 py-2 border-2 border-dashed border-red-300 bg-red-50/40 rounded-lg text-center text-[10.5px] text-crimson-primary font-semibold">
                              Thả vào đây để chuyển thành danh sách riêng lẻ
                            </div>
                          )}

                          {standaloneLists.map((list) => {
                            const isActive =
                              currentView === 'reading-list' &&
                              (selectedReadingListId === list.id ||
                                String(selectedReadingListId) === String(list.id));
                            const displayCode = list.code || list.shortTitle || 'LIST';
                            const displayTitle = list.title || '';

                            const isListBeingDragged =
                              dragType === 'reading-list' && String(draggedListId) === String(list.id);
                            const isListDropBefore =
                              dragType === 'reading-list' &&
                              String(dragOverListId) === String(list.id) &&
                              listDropPosition === 'before';
                            const isListDropAfter =
                              dragType === 'reading-list' &&
                              String(dragOverListId) === String(list.id) &&
                              listDropPosition === 'after';

                            return (
                              <div
                                key={list.id}
                                draggable={true}
                                onDragStart={(e) => {
                                  e.stopPropagation();
                                  handleListDragStart(e, list);
                                }}
                                onDragOver={(e) => {
                                  e.stopPropagation();
                                  handleListDragOver(e, list);
                                }}
                                onDragLeave={(e) => {
                                  e.stopPropagation();
                                  handleListDragLeave(e, list.id);
                                }}
                                onDrop={(e) => {
                                  e.stopPropagation();
                                  handleListDropOnList(e, list);
                                }}
                                onDragEnd={handleListDragEnd}
                                onClick={() => {
                                  if (dragJustEndedRef.current) return;
                                  setSelectedReadingListId(list.id);
                                  setSelectedCategory(null);
                                  setCurrentView('reading-list');
                                }}
                                className={`group relative flex items-center justify-between px-2 py-1.5 rounded-lg transition-all text-left text-xs cursor-grab active:cursor-grabbing select-none ${
                                  isListBeingDragged ? 'opacity-35' : ''
                                } ${
                                  isActive
                                    ? 'bg-surface-crimson-subtle text-crimson-primary font-semibold ring-1 ring-crimson-primary/20'
                                    : 'text-text-body hover:bg-surface-crimson-subtle hover:text-crimson-primary'
                                }`}
                              >
                                {/* Đường kẻ ngang màu đỏ phía bên trên khi kéo thả vị trí mới */}
                                {isListDropBefore && (
                                  <div className="absolute -top-[3px] left-0 right-0 flex items-center z-50 pointer-events-none">
                                    <div className="w-2.5 h-2.5 rounded-full bg-[#E31E24] -ml-1 ring-2 ring-white shadow-md shrink-0" />
                                    <div className="flex-1 h-[3px] bg-[#E31E24] rounded-full shadow-[0_0_8px_rgba(227,30,36,0.6)]" />
                                  </div>
                                )}
                                {isListDropAfter && (
                                  <div className="absolute -bottom-[3px] left-0 right-0 flex items-center z-50 pointer-events-none">
                                    <div className="w-2.5 h-2.5 rounded-full bg-[#E31E24] -ml-1 ring-2 ring-white shadow-md shrink-0" />
                                    <div className="flex-1 h-[3px] bg-[#E31E24] rounded-full shadow-[0_0_8px_rgba(227,30,36,0.6)]" />
                                  </div>
                                )}
                                <div className={`flex items-center gap-2 truncate flex-1 min-w-0 pr-1 text-left ${dragType ? 'pointer-events-none' : ''}`}>
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

                                <div className={`flex items-center gap-1 shrink-0 ${dragType ? 'pointer-events-none' : ''}`}>
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
