import React, { useState, useMemo, useRef, useEffect } from 'react';
import astronautImg from '../../../assets/Chibi_PhiHanhGia.png';

export default function ListVocabularyPage({
  readingLists = [],
  noteFolders = [],
  vocabList = [],
  onSelectList,
  onOpenAddReadingListModal,
  onOpenAddFolderModal,
  onOpenAddModal,
  onEditReadingList,
  onDeleteReadingList,
  onEditFolder,
  onDeleteFolder,
  onReorderReadingLists,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFolderFilter, setSelectedFolderFilter] = useState('all'); // 'all' | folderId | 'none'
  const [sortBy, setSortBy] = useState(() => {
    try {
      return localStorage.getItem('list_vocab_sort_by') || 'custom';
    } catch {
      return 'custom';
    }
  }); // 'custom' (mặc định - lưu thứ tự kéo thả) | 'oldest' | 'newest' | 'most-vocabs' | 'title-az'
  const [isFolderFilterOpen, setIsFolderFilterOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const folderFilterRef = useRef(null);
  const sortRef = useRef(null);

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (folderFilterRef.current && !folderFilterRef.current.contains(e.target)) {
        setIsFolderFilterOpen(false);
      }
      if (sortRef.current && !sortRef.current.contains(e.target)) {
        setIsSortOpen(false);
      }
    };
    if (isFolderFilterOpen || isSortOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isFolderFilterOpen, isSortOpen]);

  // Tên hiển thị của bộ lọc Thư mục & Sắp xếp
  const selectedFolderLabel = useMemo(() => {
    if (selectedFolderFilter === 'all') return 'Tất cả thư mục';
    if (selectedFolderFilter === 'none') return 'Danh sách riêng lẻ';
    const folder = noteFolders.find((f) => String(f.id) === String(selectedFolderFilter));
    return folder ? folder.name : 'Tất cả thư mục';
  }, [selectedFolderFilter, noteFolders]);

  const selectedSortLabel = useMemo(() => {
    switch (sortBy) {
      case 'newest': return 'Mới nhất';
      case 'most-vocabs': return 'Nhiều từ nhất';
      case 'title-az': return 'Tên (A - Z)';
      case 'oldest': return 'Cũ nhất';
      case 'custom':
      default: return 'Tùy chỉnh';
    }
  }, [sortBy]);
  const listsWithStats = useMemo(() => {
    return readingLists.map((list) => {
      const targetId = String(list.id);
      const matchedVocabs = vocabList.filter((v) => {
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
      });
      const vocabCount = matchedVocabs.length;

      const folder = list.folderId
        ? noteFolders.find((f) => String(f.id) === String(list.folderId))
        : null;

      return {
        ...list,
        folderName: list.folderName || folder?.name || null,
        folderCode: list.folderCode || folder?.code || null,
        vocabCount,
      };
    });
  }, [readingLists, vocabList, noteFolders]);

  // Tổng số từ vựng thuộc các bài đọc
  const totalVocabsInLists = useMemo(() => {
    const uniqueVocabIds = new Set();
    vocabList.forEach((v) => {
      if (
        v.readingListId != null ||
        v.noteListId != null ||
        (Array.isArray(v.noteListIds) && v.noteListIds.length > 0) ||
        (Array.isArray(v.noteLists) && v.noteLists.length > 0)
      ) {
        uniqueVocabIds.add(v.id || v.word);
      }
    });
    return uniqueVocabIds.size;
  }, [vocabList]);

  // Lọc và sắp xếp
  const filteredAndSortedLists = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    let result = listsWithStats;

    if (term) {
      result = result.filter(
        (list) =>
          (list.title && list.title.toLowerCase().includes(term)) ||
          (list.code && list.code.toLowerCase().includes(term)) ||
          (list.sourceReference && list.sourceReference.toLowerCase().includes(term)) ||
          (list.note && list.note.toLowerCase().includes(term))
      );
    }

    if (selectedFolderFilter && selectedFolderFilter !== 'all') {
      if (selectedFolderFilter === 'none') {
        result = result.filter((list) => !list.folderId);
      } else {
        result = result.filter((list) => String(list.folderId) === String(selectedFolderFilter));
      }
    }

    const sorted = [...result];
    switch (sortBy) {
      case 'newest':
        sorted.sort((a, b) => (new Date(b.createdAt || 0) - new Date(a.createdAt || 0)) || (Number(b.id || 0) - Number(a.id || 0)));
        break;
      case 'most-vocabs':
        sorted.sort((a, b) => b.vocabCount - a.vocabCount);
        break;
      case 'title-az':
        sorted.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
        break;
      case 'oldest':
        sorted.sort((a, b) => (new Date(a.createdAt || 0) - new Date(b.createdAt || 0)) || (Number(a.id || 0) - Number(b.id || 0)));
        break;
      case 'custom':
      default:
        // Giữ nguyên thứ tự của readingLists (thứ tự tự nhiên / thứ tự kéo thả đã lưu)
        break;
    }

    return sorted;
  }, [listsWithStats, searchTerm, sortBy, selectedFolderFilter]);

  // Nhóm các danh sách bài đọc theo Thư mục
  const folderGroups = useMemo(() => {
    const groupsMap = new Map();

    // 1. Khởi tạo nhóm cho từng folder trong noteFolders
    noteFolders.forEach((folder) => {
      groupsMap.set(String(folder.id), {
        id: String(folder.id),
        name: folder.name,
        code: folder.code,
        folder,
        isStandalone: false,
        lists: [],
      });
    });

    // 2. Nhóm danh sách riêng lẻ (chưa gán folder)
    const standaloneGroup = {
      id: '__standalone__',
      name: noteFolders.length > 0 ? 'Danh sách riêng lẻ' : 'Danh sách từ vựng',
      code: null,
      folder: null,
      isStandalone: true,
      lists: [],
    };

    // 3. Phân bổ các danh sách đã lọc và sắp xếp vào các nhóm
    filteredAndSortedLists.forEach((list) => {
      const folderId = list.folderId ? String(list.folderId) : null;
      if (folderId && groupsMap.has(folderId)) {
        groupsMap.get(folderId).lists.push(list);
      } else {
        standaloneGroup.lists.push(list);
      }
    });

    const result = [];

    if (selectedFolderFilter === 'all') {
      // Khi chọn "Tất cả thư mục": Hiển thị các thư mục trước
      noteFolders.forEach((f) => {
        const grp = groupsMap.get(String(f.id));
        if (grp) {
          if (searchTerm.trim()) {
            // Khi đang tìm kiếm: chỉ hiển thị thư mục có bài đọc khớp
            if (grp.lists.length > 0) result.push(grp);
          } else {
            // Bình thường: hiển thị tất cả thư mục
            result.push(grp);
          }
        }
      });

      // Thêm nhóm danh sách riêng lẻ nếu có phần tử
      if (standaloneGroup.lists.length > 0) {
        result.push(standaloneGroup);
      }
    } else if (selectedFolderFilter === 'none') {
      // Chỉ xem danh sách riêng lẻ
      if (standaloneGroup.lists.length > 0 || !searchTerm.trim()) {
        result.push(standaloneGroup);
      }
    } else {
      // Khi lọc theo một thư mục cụ thể
      const grp = groupsMap.get(String(selectedFolderFilter));
      if (grp) {
        result.push(grp);
      }
    }

    return result;
  }, [noteFolders, filteredAndSortedLists, selectedFolderFilter, searchTerm]);

  // Quản lý trạng thái mở rộng (hiển thị 3 hay 6 danh sách) cho từng thư mục
  const [expandedFolderIds, setExpandedFolderIds] = useState({});

  // Quản lý hộp thoại modal "Xem chi tiết" hiển thị trọn vẹn tất cả danh sách của thư mục
  const [viewingFolderId, setViewingFolderId] = useState(null);
  const [modalSearchTerm, setModalSearchTerm] = useState('');

  // Chế độ xem trong modal Xem chi tiết: 'grid' (Dạng cột / Lưới) | 'list' (Dạng danh sách / Hàng ngang)
  const [modalViewMode, setModalViewMode] = useState(() => {
    try {
      return localStorage.getItem('list_vocab_modal_view_mode') || 'grid';
    } catch {
      return 'grid';
    }
  });

  const handleSetModalViewMode = (mode) => {
    setModalViewMode(mode);
    try {
      localStorage.setItem('list_vocab_modal_view_mode', mode);
    } catch {}
  };

  // State hỗ trợ kéo thả sắp xếp (Drag & Drop) danh sách bài đọc trong thư mục
  const [draggedListId, setDraggedListId] = useState(null);
  const [dragOverListId, setDragOverListId] = useState(null);
  const [dropPosition, setDropPosition] = useState(null); // 'before' | 'after'
  const dragJustEndedRef = useRef(false);

  // Xử lý đổi thứ tự danh sách khi kéo thả
  const handleReorderInFolder = (draggedId, targetId, position) => {
    if (!viewingFolderGroup || String(draggedId) === String(targetId)) return;

    const currentFolderLists = [...viewingFolderGroup.lists];
    const draggedIndex = currentFolderLists.findIndex((l) => String(l.id) === String(draggedId));
    const targetIndex = currentFolderLists.findIndex((l) => String(l.id) === String(targetId));
    if (draggedIndex === -1 || targetIndex === -1) return;

    // Xác định vị trí chèn: nếu position null hoặc không hợp lệ,
    // kéo từ sau ra trước (draggedIndex > targetIndex) -> chèn trước target ('before')
    // kéo từ trước ra sau (draggedIndex < targetIndex) -> chèn sau target ('after')
    const effectivePos =
      position === 'before' || position === 'after'
        ? position
        : draggedIndex < targetIndex
        ? 'after'
        : 'before';

    // Tách phần tử được kéo
    const [moved] = currentFolderLists.splice(draggedIndex, 1);

    // Xác định lại vị trí của target trong mảng còn lại
    const newTargetIndex = currentFolderLists.findIndex((l) => String(l.id) === String(targetId));
    if (newTargetIndex === -1) return;

    let insertIndex = effectivePos === 'before' ? newTargetIndex : newTargetIndex + 1;
    insertIndex = Math.max(0, Math.min(insertIndex, currentFolderLists.length));
    currentFolderLists.splice(insertIndex, 0, moved);

    // Đồng bộ vào readingLists toàn cục
    const folderListIds = new Set(currentFolderLists.map((l) => String(l.id)));
    const folderListQueue = [...currentFolderLists];

    const updatedAllLists = readingLists.map((list) => {
      if (folderListIds.has(String(list.id))) {
        const nextItem = folderListQueue.shift();
        return nextItem || list;
      }
      return list;
    });

    // Luôn chuyển sortBy về 'custom' để không bị date sorting ghi đè
    setSortBy('custom');
    try {
      localStorage.setItem('list_vocab_sort_by', 'custom');
    } catch {}

    // Lưu thứ tự id vào localStorage ngay lập tức
    try {
      const orderIds = updatedAllLists.map((l) => l.id);
      localStorage.setItem('reading_list_custom_order', JSON.stringify(orderIds));
    } catch (e) {
      console.warn('Lỗi khi lưu thứ tự reading list vào localStorage:', e);
    }

    if (onReorderReadingLists) {
      onReorderReadingLists(updatedAllLists);
    }
  };

  const handleDragStart = (e, listId) => {
    dragJustEndedRef.current = false;
    setDraggedListId(listId);
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', String(listId));
    }
  };

  const handleDragOver = (e, targetId) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'move';
    }

    const transferId = e.dataTransfer ? e.dataTransfer.getData('text/plain') : null;
    const activeDraggedId = draggedListId || transferId;

    if (!activeDraggedId || String(activeDraggedId) === String(targetId)) {
      if (dragOverListId !== null) {
        setDragOverListId(null);
        setDropPosition(null);
      }
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const isList = modalViewMode === 'list';
    const offset = isList ? e.clientY - rect.top : e.clientX - rect.left;
    const dimension = isList ? rect.height : rect.width;
    const position = offset < dimension / 2 ? 'before' : 'after';

    if (dragOverListId !== targetId || dropPosition !== position) {
      setDragOverListId(targetId);
      setDropPosition(position);
    }
  };

  const handleDragLeave = (e, targetId) => {
    e.preventDefault();
    if (e.relatedTarget && !e.currentTarget.contains(e.relatedTarget)) {
      if (dragOverListId === targetId) {
        setDragOverListId(null);
        setDropPosition(null);
      }
    }
  };

  const handleDrop = (e, targetId) => {
    e.preventDefault();
    e.stopPropagation();

    const transferId = e.dataTransfer ? e.dataTransfer.getData('text/plain') : null;
    const activeDraggedId = draggedListId || transferId;
    const pos = dropPosition;

    cleanupDragState();

    if (!activeDraggedId || String(activeDraggedId) === String(targetId)) {
      return;
    }

    handleReorderInFolder(activeDraggedId, targetId, pos);
  };

  const handleDragEnd = () => {
    cleanupDragState();
  };

  const cleanupDragState = () => {
    dragJustEndedRef.current = true;
    setTimeout(() => {
      dragJustEndedRef.current = false;
    }, 200);
    setDraggedListId(null);
    setDragOverListId(null);
    setDropPosition(null);
  };

  const toggleExpandFolder = (folderId) => {
    setExpandedFolderIds((prev) => ({
      ...prev,
      [folderId]: !prev[folderId],
    }));
  };

  // Thư mục hiện tại đang mở trong modal Xem chi tiết
  const viewingFolderGroup = useMemo(() => {
    if (!viewingFolderId) return null;
    return folderGroups.find((g) => String(g.id) === String(viewingFolderId)) || null;
  }, [viewingFolderId, folderGroups]);

  // Lọc danh sách bài đọc bên trong modal Xem chi tiết khi người dùng gõ tìm kiếm
  const modalFilteredLists = useMemo(() => {
    if (!viewingFolderGroup) return [];
    const term = modalSearchTerm.trim().toLowerCase();
    if (!term) return viewingFolderGroup.lists;
    return viewingFolderGroup.lists.filter(
      (list) =>
        (list.title && list.title.toLowerCase().includes(term)) ||
        (list.code && list.code.toLowerCase().includes(term)) ||
        (list.sourceReference && list.sourceReference.toLowerCase().includes(term)) ||
        (list.note && list.note.toLowerCase().includes(term))
    );
  }, [viewingFolderGroup, modalSearchTerm]);

  // Tổng số từ vựng trong folder đang xem chi tiết
  const modalTotalVocabs = useMemo(() => {
    if (!viewingFolderGroup) return 0;
    return viewingFolderGroup.lists.reduce((acc, curr) => acc + (curr.vocabCount || 0), 0);
  }, [viewingFolderGroup]);

  // Đóng modal Xem chi tiết khi nhấn phím ESC
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && viewingFolderId) {
        setViewingFolderId(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewingFolderId]);

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

  const renderCard = (list, customOnSelect = null) => {
    const displayCode = list.code || list.shortTitle || 'LIST';
    const displayTitle = list.title || 'Danh sách từ vựng';

    return (
      <div
        key={list.id}
        onClick={() => {
          if (dragJustEndedRef.current) return;
          if (customOnSelect) {
            customOnSelect(list.id);
          } else if (onSelectList) {
            onSelectList(list.id);
          }
        }}
        className="group relative bg-white rounded-2xl border border-slate-200/90 hover:border-crimson-primary/40 hover:shadow-lg hover:shadow-red-950/5 transition-all duration-200 p-5 flex flex-col justify-between cursor-pointer"
      >
        {/* Card Top: Code badge & Actions */}
        <div>
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-crimson-subtle border border-border-crimson-tint text-crimson-primary text-xs font-black tracking-wide">
                <span className="material-symbols-outlined text-[14px]">article</span>
                <span>{displayCode}</span>
              </span>
            </div>

            <div className="flex items-center gap-1">
              {list.createdAt && (
                <span className="text-[11px] text-slate-400 font-medium mr-1 hidden sm:inline">
                  {formatDate(list.createdAt)}
                </span>
              )}

              {/* Edit Button */}
              {onEditReadingList && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditReadingList(list);
                  }}
                  title="Chỉnh sửa danh sách"
                  className="w-7 h-7 rounded-lg text-slate-400 hover:text-crimson-primary hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">edit</span>
                </button>
              )}

              {/* Delete Button */}
              {onDeleteReadingList && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteReadingList(list.id);
                  }}
                  title="Xóa danh sách từ vựng"
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
              {displayTitle}
            </h3>
          </div>

          {/* Source Reference / Note Slot (Fixed height h-6 to prevent layout jumping) */}
          <div className="h-6 flex items-center text-xs text-text-muted mt-1.5 overflow-hidden">
            {list.sourceReference ? (
              <div className="inline-flex items-center gap-1.5 text-slate-600 truncate" title={`Nguồn: ${list.sourceReference}`}>
                <span className="material-symbols-outlined text-[15px] text-slate-400 shrink-0">
                  menu_book
                </span>
                <span className="truncate font-medium">{list.sourceReference}</span>
              </div>
            ) : list.note ? (
              <div className="inline-flex items-center gap-1.5 text-slate-600 truncate" title={`Ghi chú: ${list.note}`}>
                <span className="material-symbols-outlined text-[15px] text-slate-400 shrink-0">
                  sticky_note_2
                </span>
                <span className="truncate font-medium">{list.note}</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-1.5 text-slate-300 text-[11px] italic select-none">
                <span className="material-symbols-outlined text-[14px] text-slate-300 shrink-0">
                  bookmark_border
                </span>
                <span>Chưa có nguồn / ghi chú</span>
              </div>
            )}
          </div>

          {/* Passage Preview Snippet (Fixed height h-[64px] with clear boundary) */}
          <div className="mt-3">
            {list.passage ? (
              <div className="h-[64px] p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600 line-clamp-2 leading-relaxed font-serif italic flex items-center">
                <span className="line-clamp-2">"{list.passage}"</span>
              </div>
            ) : (
              <div className="h-[64px] px-3 rounded-xl bg-slate-50/60 border border-dashed border-slate-200 text-[11px] text-slate-400 italic flex items-center justify-center gap-1.5 select-none">
                <span className="material-symbols-outlined text-[15px] text-slate-400/80 shrink-0">description</span>
                <span>Chưa có nội dung ngữ cảnh</span>
              </div>
            )}
          </div>
        </div>

        {/* Card Bottom: Vocab count & Navigation link */}
        <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-100 text-blue-700 text-xs font-bold">
            <span className="material-symbols-outlined text-[15px]">style</span>
            <span>{list.vocabCount} từ vựng</span>
          </span>

          <span className="inline-flex items-center gap-1 text-xs font-bold text-crimson-primary group-hover:translate-x-0.5 transition-transform">
            <span>Vào học từ</span>
            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </span>
        </div>
      </div>
    );
  };

  const renderRow = (list, customOnSelect = null, dragProps = null) => {
    const displayCode = list.code || list.shortTitle || 'LIST';
    const displayTitle = list.title || 'Danh sách từ vựng';

    return (
      <div
        key={list.id}
        draggable={dragProps?.draggable}
        onDragStart={dragProps?.onDragStart}
        onDragEnter={dragProps?.onDragEnter}
        onDragOver={dragProps?.onDragOver}
        onDragLeave={dragProps?.onDragLeave}
        onDragEnd={dragProps?.onDragEnd}
        onDrop={dragProps?.onDrop}
        onClick={() => {
          if (dragJustEndedRef.current) return;
          if (customOnSelect) {
            customOnSelect(list.id);
          } else if (onSelectList) {
            onSelectList(list.id);
          }
        }}
        className={`group relative bg-white rounded-xl border transition-all duration-150 px-4 py-3 sm:px-5 sm:py-3.5 flex items-center justify-between gap-3 sm:gap-4 cursor-pointer shadow-2xs hover:shadow-md hover:border-crimson-primary/40 ${
          dragProps?.isBeingDragged
            ? 'opacity-40 scale-[0.99] border-dashed border-crimson-primary bg-red-50/20'
            : dragProps?.isOverBefore
            ? 'border-t-2 border-t-crimson-primary bg-red-50/10'
            : dragProps?.isOverAfter
            ? 'border-b-2 border-b-crimson-primary bg-red-50/10'
            : 'border-slate-200/90'
        }`}
      >
        {/* Left Section: Drag handle + Code + Title + Date + Note/Source preview */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {/* Drag Handle */}
          <span
            className="material-symbols-outlined text-[19px] text-slate-300 group-hover:text-slate-500 cursor-grab active:cursor-grabbing select-none shrink-0"
            title="Kéo thả để sắp xếp vị trí"
            onClick={(e) => e.stopPropagation()}
          >
            drag_indicator
          </span>

          {/* Code Badge */}
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-crimson-subtle border border-border-crimson-tint text-crimson-primary text-xs font-black tracking-wide shrink-0">
            <span className="material-symbols-outlined text-[14px]">article</span>
            <span>{displayCode}</span>
          </span>

          {/* Title */}
          <h3 className="text-sm font-extrabold text-slate-900 group-hover:text-crimson-primary transition-colors truncate min-w-0">
            {displayTitle}
          </h3>

          {/* Date */}
          {list.createdAt && (
            <span className="text-[11px] text-slate-400 font-medium shrink-0 hidden md:inline">
              {formatDate(list.createdAt)}
            </span>
          )}

          {/* Source Reference / Note preview */}
          {list.sourceReference ? (
            <span
              className="inline-flex items-center gap-1 text-xs text-slate-500 font-medium truncate max-w-[220px] hidden lg:inline-flex"
              title={`Nguồn: ${list.sourceReference}`}
            >
              <span className="material-symbols-outlined text-[14px] text-slate-400 shrink-0">menu_book</span>
              <span className="truncate">{list.sourceReference}</span>
            </span>
          ) : list.note ? (
            <span
              className="inline-flex items-center gap-1 text-xs text-slate-500 font-medium truncate max-w-[220px] hidden lg:inline-flex"
              title={`Ghi chú: ${list.note}`}
            >
              <span className="material-symbols-outlined text-[14px] text-slate-400 shrink-0">sticky_note_2</span>
              <span className="truncate">{list.note}</span>
            </span>
          ) : null}
        </div>

        {/* Right Section: Vocab count + Actions (Edit, Delete, Vào học từ) */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Vocab count */}
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-100 text-blue-700 text-xs font-bold shrink-0">
            <span className="material-symbols-outlined text-[14px]">style</span>
            <span>{list.vocabCount} từ</span>
          </span>

          {/* Action buttons */}
          <div className="flex items-center gap-1">
            {onEditReadingList && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onEditReadingList(list);
                }}
                title="Chỉnh sửa danh sách"
                className="w-7 h-7 rounded-lg text-slate-400 hover:text-crimson-primary hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">edit</span>
              </button>
            )}

            {onDeleteReadingList && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteReadingList(list.id);
                }}
                title="Xóa danh sách từ vựng"
                className="w-7 h-7 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">delete</span>
              </button>
            )}
          </div>

          {/* Vào học từ button */}
          <span className="inline-flex items-center gap-1 text-xs font-bold text-crimson-primary group-hover:translate-x-0.5 transition-transform shrink-0 hidden sm:inline-flex">
            <span>Vào học từ</span>
            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full flex flex-col gap-6 animate-in fade-in duration-150">
      {/* 1. Hero Banner: List Vocabulary (Linearthinking) */}
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
          <div className="flex-1 min-w-0 flex flex-col gap-2.5">
            {/* Badges */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white text-[11px] font-black uppercase tracking-wider shadow-xs">
                <span className="material-symbols-outlined text-[14px]">auto_stories</span>
                <span>List Vocabulary</span>
              </span>
              <span className="text-xs text-white/90 font-medium tracking-wide">
                Quản lí danh sách từ vựng
              </span>
            </div>

            {/* Title & Description */}
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight drop-shadow-sm font-sans leading-tight">
              Quản lý danh sách từ vựng
            </h1>
            <p className="text-xs sm:text-sm text-white/90 leading-relaxed font-normal max-w-xl">
              Hệ thống hóa từ vựng theo từng chủ đề, bài đọc, bài nghe hay ngữ cảnh thực tế.
              Nắm bắt cấu trúc và liên kết từ vựng một cách mạch lạc và có hệ thống.
            </p>

            {/* Action Buttons & Statistics (Cả 5 nhãn trên cùng 1 hàng) */}
            <div className="flex items-center gap-2.5 pt-2 flex-wrap">
              {onOpenAddFolderModal && (
                <button
                  type="button"
                  onClick={onOpenAddFolderModal}
                  className="h-10 px-4 rounded-xl bg-white hover:bg-slate-50 text-amber-800 font-bold text-xs shadow-md shadow-red-950/20 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <span className="material-symbols-outlined text-[18px] text-amber-600">create_new_folder</span>
                  <span>Thêm thư mục</span>
                </button>
              )}

              <button
                type="button"
                onClick={onOpenAddReadingListModal}
                className="h-10 px-4 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/30 text-white font-bold text-xs shadow-xs active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
                <span>Thêm danh sách</span>
              </button>

              <div className="h-10 px-3.5 rounded-xl bg-black/15 backdrop-blur-md border border-white/20 text-white flex items-center gap-2 text-xs font-semibold shrink-0">
                <span className="material-symbols-outlined text-[16px] text-yellow-300">folder_open</span>
                <span>{noteFolders.length} thư mục</span>
              </div>

              <div className="h-10 px-3.5 rounded-xl bg-black/15 backdrop-blur-md border border-white/20 text-white flex items-center gap-2 text-xs font-semibold shrink-0">
                <span className="material-symbols-outlined text-[16px] text-amber-300">article</span>
                <span>{readingLists.length} bài đọc</span>
              </div>

              <div className="h-10 px-3.5 rounded-xl bg-black/15 backdrop-blur-md border border-white/20 text-white flex items-center gap-2 text-xs font-semibold shrink-0">
                <span className="material-symbols-outlined text-[16px] text-emerald-300">style</span>
                <span>{totalVocabsInLists} từ trong bài</span>
              </div>
            </div>
          </div>

          {/* Right Mascot */}
          <div className="shrink-0 hidden lg:flex items-center justify-center group/mascot">
            <div className="relative">
              <div className="absolute inset-0 bg-white/20 rounded-full blur-xl scale-75 animate-pulse group-hover/mascot:scale-110 transition-transform duration-300 pointer-events-none" />
              <img
                src={astronautImg}
                alt="LinearVocab Mascot"
                className="relative z-10 w-32 sm:w-36 lg:w-40 max-h-36 sm:max-h-40 object-contain drop-shadow-xl transition-all duration-300 ease-out hover:scale-110 hover:-translate-y-1 hover:rotate-2 select-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 2. Toolbar: Search, Filter, Sort & Count */}
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
            placeholder="Tìm theo mã code (CAM18, LIST...), tên bài đọc, nguồn..."
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

        {/* Right Filter & Sort Controls */}
        <div className="flex items-center gap-2.5 justify-between sm:justify-end flex-wrap">
          {/* Folder filter dropdown */}
          {noteFolders.length > 0 && (
            <div className="relative" ref={folderFilterRef}>
              <button
                type="button"
                onClick={() => {
                  setIsFolderFilterOpen((prev) => !prev);
                  setIsSortOpen(false);
                }}
                className={`h-10 px-3 rounded-xl border bg-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  isFolderFilterOpen
                    ? 'border-crimson-primary ring-4 ring-crimson-primary/10 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700'
                }`}
              >
                <span className="material-symbols-outlined text-[16px] text-amber-500">folder_open</span>
                <span className="text-slate-500 hidden sm:inline font-normal">Thư mục:</span>
                <span className="font-bold text-slate-800 max-w-[120px] truncate">{selectedFolderLabel}</span>
                <span className={`material-symbols-outlined text-[16px] text-slate-400 transition-transform duration-200 ${isFolderFilterOpen ? 'rotate-180 text-crimson-primary' : ''}`}>
                  expand_more
                </span>
              </button>

              {isFolderFilterOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-60 bg-white rounded-2xl shadow-2xl border border-slate-200/95 p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150 flex flex-col gap-0.5 max-h-60 overflow-y-auto custom-scrollbar ring-1 ring-black/5">
                  <div className="px-2.5 pt-1.5 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                    Lọc theo Thư mục
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFolderFilter('all');
                      setIsFolderFilterOpen(false);
                    }}
                    className={`w-full px-2.5 py-2 rounded-xl text-xs flex items-center justify-between text-left transition-colors cursor-pointer ${
                      selectedFolderFilter === 'all'
                        ? 'bg-surface-crimson-subtle text-crimson-primary font-bold'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span>Tất cả thư mục</span>
                    {selectedFolderFilter === 'all' && (
                      <span className="material-symbols-outlined text-[15px] text-crimson-primary">check</span>
                    )}
                  </button>
                  {noteFolders.map((f) => {
                    const isSelected = String(f.id) === String(selectedFolderFilter);
                    return (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => {
                          setSelectedFolderFilter(String(f.id));
                          setIsFolderFilterOpen(false);
                        }}
                        className={`w-full px-2.5 py-2 rounded-xl text-xs flex items-center justify-between text-left transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-surface-crimson-subtle text-crimson-primary font-bold'
                            : 'text-slate-700 hover:bg-amber-50/60'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 truncate flex-1 min-w-0 pr-1">
                          <span className="material-symbols-outlined text-[15px] text-amber-500 shrink-0">folder_open</span>
                          <span className="truncate">{f.name}</span>
                        </div>
                        {isSelected && (
                          <span className="material-symbols-outlined text-[15px] text-crimson-primary shrink-0">check</span>
                        )}
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFolderFilter('none');
                      setIsFolderFilterOpen(false);
                    }}
                    className={`w-full px-2.5 py-2 rounded-xl text-xs flex items-center justify-between text-left transition-colors cursor-pointer ${
                      selectedFolderFilter === 'none'
                        ? 'bg-surface-crimson-subtle text-crimson-primary font-bold'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[15px] text-slate-400">folder_off</span>
                      <span>Danh sách riêng lẻ</span>
                    </div>
                    {selectedFolderFilter === 'none' && (
                      <span className="material-symbols-outlined text-[15px] text-crimson-primary">check</span>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Sắp xếp dropdown */}
          <div className="relative" ref={sortRef}>
            <button
              type="button"
              onClick={() => {
                setIsSortOpen((prev) => !prev);
                setIsFolderFilterOpen(false);
              }}
              className={`h-10 px-3 rounded-xl border bg-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                isSortOpen
                  ? 'border-crimson-primary ring-4 ring-crimson-primary/10 shadow-xs'
                  : 'border-slate-200 hover:border-slate-300 text-slate-700'
              }`}
            >
              <span className="material-symbols-outlined text-[16px] text-slate-400">sort</span>
              <span className="text-slate-500 hidden md:inline font-normal">Sắp xếp:</span>
              <span className="font-bold text-slate-800">{selectedSortLabel}</span>
              <span className={`material-symbols-outlined text-[16px] text-slate-400 transition-transform duration-200 ${isSortOpen ? 'rotate-180 text-crimson-primary' : ''}`}>
                expand_more
              </span>
            </button>

            {isSortOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-52 bg-white rounded-2xl shadow-2xl border border-slate-200/95 p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150 flex flex-col gap-0.5 ring-1 ring-black/5">
                <div className="px-2.5 pt-1.5 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                  Sắp xếp theo
                </div>
                {[
                  { id: 'custom', label: 'Tùy chỉnh (Kéo thả)', icon: 'swap_vert' },
                  { id: 'oldest', label: 'Cũ nhất trước', icon: 'history' },
                  { id: 'newest', label: 'Mới nhất trước', icon: 'schedule' },
                  { id: 'most-vocabs', label: 'Nhiều từ vựng nhất', icon: 'format_list_numbered' },
                  { id: 'title-az', label: 'Tên danh sách (A - Z)', icon: 'sort_by_alpha' },
                ].map((opt) => {
                  const isSelected = sortBy === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        setSortBy(opt.id);
                        try {
                          localStorage.setItem('list_vocab_sort_by', opt.id);
                        } catch {}
                        setIsSortOpen(false);
                      }}
                      className={`w-full px-2.5 py-2 rounded-xl text-xs flex items-center justify-between text-left transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-surface-crimson-subtle text-crimson-primary font-bold'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`material-symbols-outlined text-[16px] ${isSelected ? 'text-crimson-primary' : 'text-slate-400'}`}>
                          {opt.icon}
                        </span>
                        <span>{opt.label}</span>
                      </div>
                      {isSelected && (
                        <span className="material-symbols-outlined text-[15px] text-crimson-primary">check</span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="text-xs font-semibold text-slate-500 pl-2 border-l border-slate-200">
            <span>{filteredAndSortedLists.length}</span> danh sách
          </div>
        </div>
      </div>

      {/* 3. Reading Task Cards Grid Grouped by Folder */}
      {folderGroups.length === 0 ? (
        /* Empty State */
        <div className="bg-white rounded-3xl border border-slate-200/90 p-10 sm:p-14 text-center max-w-xl mx-auto shadow-xs my-4">
          <div className="w-16 h-16 rounded-2xl bg-surface-crimson-subtle border border-border-crimson-tint text-crimson-primary flex items-center justify-center mx-auto mb-4 shadow-xs">
            <span className="material-symbols-outlined text-[34px]">auto_stories</span>
          </div>
          <h3 className="text-lg font-extrabold text-slate-900 mb-2 font-sans">
            {searchTerm
              ? 'Không tìm thấy danh sách từ vựng phù hợp'
              : selectedFolderFilter === 'none'
              ? 'Chưa có danh sách riêng lẻ nào'
              : 'Chưa có danh sách từ vựng nào'}
          </h3>
          <p className="text-xs sm:text-sm text-text-muted leading-relaxed max-w-md mx-auto mb-6">
            {searchTerm
              ? `Không tìm thấy danh sách nào khớp với từ khóa "${searchTerm}". Vui lòng thử tìm với từ khóa khác.`
              : selectedFolderFilter === 'none'
              ? 'Tất cả các bài đọc đã được phân bổ vào các thư mục tương ứng.'
              : 'Tạo các danh sách từ vựng để gom nhóm từ theo từng bài đọc, bài nghe, tin tức báo chí hoặc chủ đề riêng.'}
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
              onClick={onOpenAddReadingListModal}
              className="px-5 py-2.5 rounded-xl bg-crimson-primary hover:bg-crimson-dark text-white text-xs font-bold shadow-md shadow-red-200 transition-all cursor-pointer inline-flex items-center gap-1.5 active:scale-95"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              <span>Tạo Danh Sách Đầu Tiên</span>
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {folderGroups.map((group) => {
            const isExpanded = Boolean(expandedFolderIds[group.id]);
            const limit = isExpanded ? 6 : 3;
            const displayedLists = group.lists.slice(0, limit);

            return (
              <section key={group.id} className="flex flex-col">
                {/* Header: Tên folder bên trái trên cùng kèm một đường kẻ ngang */}
                <div className="flex items-center gap-3.5 mb-4">
                  {/* Left: Icon, Name, Badge, Count */}
                  <div className="flex items-center gap-2.5 shrink-0">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center border shadow-2xs ${
                        group.isStandalone
                          ? 'bg-slate-100 border-slate-200/90 text-slate-600'
                          : 'bg-amber-500/10 border-amber-500/25 text-amber-500'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        {group.isStandalone ? 'folder_off' : 'folder_open'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight font-sans">
                        {group.name}
                      </h2>

                      {group.code && (
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 border border-slate-200 text-[11px] font-semibold tracking-wide">
                          {group.code}
                        </span>
                      )}

                      <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-bold border border-slate-200/90 shadow-2xs">
                        {group.lists.length} danh sách
                      </span>
                    </div>
                  </div>

                  {/* Đường kẻ ngang sang bên phải */}
                  <div className="flex-1 h-px bg-slate-200" />

                  {/* Right: Actions */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {onOpenAddReadingListModal && (
                      <button
                        type="button"
                        onClick={() =>
                          onOpenAddReadingListModal(
                            group.isStandalone ? null : { defaultFolderId: group.id }
                          )
                        }
                        className="h-8 px-3 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-all shadow-2xs hover:border-slate-300 active:scale-95 cursor-pointer"
                        title={group.isStandalone ? 'Thêm danh sách mới riêng lẻ' : 'Thêm danh sách mới vào thư mục này'}
                      >
                        <span className="material-symbols-outlined text-[16px] text-crimson-primary">add</span>
                        <span className="hidden sm:inline">Thêm danh sách mới</span>
                      </button>
                    )}

                    {!group.isStandalone && onEditFolder && (
                      <button
                        type="button"
                        onClick={() => onEditFolder(group.folder)}
                        className="w-8 h-8 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-all shadow-2xs active:scale-95 cursor-pointer"
                        title="Chỉnh sửa thư mục"
                      >
                        <span className="material-symbols-outlined text-[16px]">edit</span>
                      </button>
                    )}

                    {!group.isStandalone && onDeleteFolder && (
                      <button
                        type="button"
                        onClick={() => onDeleteFolder(group.id)}
                        className="w-8 h-8 rounded-xl bg-white hover:bg-rose-50 border border-slate-200 text-slate-500 hover:text-rose-600 flex items-center justify-center transition-all shadow-2xs active:scale-95 cursor-pointer"
                        title="Xóa thư mục"
                      >
                        <span className="material-symbols-outlined text-[16px]">delete</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Danh sách thẻ: Mặc định hiển thị 3 thẻ, ấn Xem thêm sẽ hiển thị 6 thẻ */}
                {group.lists.length === 0 ? (
                  <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-6 sm:p-8 text-center flex flex-col items-center justify-center gap-2">
                    <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-500 border border-amber-200 flex items-center justify-center">
                      <span className="material-symbols-outlined text-[24px]">folder_open</span>
                    </div>
                    <p className="text-xs font-semibold text-slate-600">
                      Chưa có danh sách bài đọc nào trong thư mục này
                    </p>
                    {onOpenAddReadingListModal && (
                      <button
                        type="button"
                        onClick={() => onOpenAddReadingListModal({ defaultFolderId: group.id })}
                        className="mt-1 px-3.5 py-1.5 rounded-xl bg-crimson-primary hover:bg-crimson-dark text-white text-xs font-bold transition-all shadow-xs active:scale-95 flex items-center gap-1.5 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[16px]">add</span>
                        <span>Tạo danh sách mới vào thư mục</span>
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 p-1">
                      {displayedLists.map((list) => renderCard(list))}
                    </div>

                    {/* Dòng chữ nhỏ bên dưới: Xem thêm / Thu gọn & Xem chi tiết */}
                    <div className="flex items-center justify-between pt-2.5 pb-1 px-1 flex-wrap gap-2 text-xs border-t border-slate-100/80 mt-1">
                      <span className="text-[11.5px] text-slate-400 font-medium">
                        Đang hiển thị {displayedLists.length} / {group.lists.length} danh sách
                      </span>

                      <div className="flex items-center gap-2">
                        {group.lists.length > 3 && (
                          <button
                            type="button"
                            onClick={() => toggleExpandFolder(group.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200/80 text-slate-600 hover:text-slate-900 font-semibold transition-all cursor-pointer active:scale-95"
                          >
                            <span>{isExpanded ? 'Thu gọn' : 'Xem thêm'}</span>
                            <span
                              className={`material-symbols-outlined text-[15px] transition-transform duration-200 ${
                                isExpanded ? 'rotate-180' : ''
                              }`}
                            >
                              expand_more
                            </span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            setViewingFolderId(group.id);
                            setModalSearchTerm('');
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-crimson-primary hover:bg-red-50 font-bold transition-all cursor-pointer active:scale-95"
                        >
                          <span>Xem chi tiết</span>
                          <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}

      {/* Modal Xem chi tiết: Hiển thị trọn vẹn tất cả danh sách bài đọc của thư mục */}
      {viewingFolderGroup && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200"
          onClick={() => setViewingFolderId(null)}
        >
          <div
            className="relative w-full max-w-[1200px] bg-white rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col my-auto max-h-[92vh] overflow-hidden border border-slate-200/90 ring-1 ring-black/5 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Accent Line */}
            <div className="h-1.5 w-full bg-gradient-to-r from-crimson-dark via-crimson-primary to-rose-400 shrink-0" />

            {/* Modal Header */}
            <div className="px-6 sm:px-8 pt-5 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 bg-white shrink-0">
              <div className="flex items-center gap-3.5 min-w-0">
                <div
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center border shadow-xs shrink-0 ${
                    viewingFolderGroup.isStandalone
                      ? 'bg-slate-100 border-slate-200 text-slate-600'
                      : 'bg-amber-50 border-amber-200 text-amber-600'
                  }`}
                >
                  <span className="material-symbols-outlined text-[24px]">
                    {viewingFolderGroup.isStandalone ? 'folder_off' : 'folder_open'}
                  </span>
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="font-headline text-lg sm:text-xl font-bold text-slate-900 tracking-tight truncate">
                      {viewingFolderGroup.name}
                    </h2>
                    {viewingFolderGroup.code && (
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200 text-xs font-bold">
                        {viewingFolderGroup.code}
                      </span>
                    )}
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200">
                      {viewingFolderGroup.lists.length} danh sách
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-100">
                      {modalTotalVocabs} từ vựng
                    </span>
                  </div>

                  {viewingFolderGroup.folder?.description && (
                    <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                      {viewingFolderGroup.folder.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                {onOpenAddReadingListModal && (
                  <button
                    type="button"
                    onClick={() => {
                      onOpenAddReadingListModal(
                        viewingFolderGroup.isStandalone ? null : { defaultFolderId: viewingFolderGroup.id }
                      );
                    }}
                    className="h-9 px-3.5 rounded-xl bg-crimson-primary hover:bg-crimson-dark text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs active:scale-95 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">add</span>
                    <span>Thêm danh sách mới</span>
                  </button>
                )}

                <kbd className="hidden sm:inline-flex items-center px-2 py-1 text-[11px] font-semibold text-slate-400 bg-slate-100 rounded-md border border-slate-200">
                  ESC
                </kbd>

                <button
                  onClick={() => setViewingFolderId(null)}
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                  type="button"
                  title="Đóng hộp thoại (ESC)"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>
            </div>

            {/* Modal Toolbar: Tìm kiếm bài đọc & Chuyển đổi Dạng cột / Dạng danh sách (thay cho chữ Toàn bộ X bài đọc) */}
            <div className="px-6 sm:px-8 py-3 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between gap-3 shrink-0 flex-wrap">
              <div className="relative flex-1 max-w-sm">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
                  search
                </span>
                <input
                  type="text"
                  value={modalSearchTerm}
                  onChange={(e) => setModalSearchTerm(e.target.value)}
                  placeholder="Tìm danh sách theo tên, mã code, nguồn..."
                  className="w-full h-9 pl-9 pr-7 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-crimson-primary focus:ring-2 focus:ring-crimson-primary/10 transition-all"
                />
                {modalSearchTerm && (
                  <button
                    type="button"
                    onClick={() => setModalSearchTerm('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <span className="material-symbols-outlined text-[16px]">close</span>
                  </button>
                )}
              </div>

              {/* View Mode Toggle: Dạng cột (Grid) vs Dạng danh sách (List) */}
              <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200/90 shadow-2xs shrink-0">
                <button
                  type="button"
                  onClick={() => handleSetModalViewMode('grid')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer select-none ${
                    modalViewMode === 'grid'
                      ? 'bg-crimson-primary text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                  title="Xem dưới dạng cột (Grid)"
                >
                  <span className="material-symbols-outlined text-[16px]">grid_view</span>
                  <span>Dạng cột</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSetModalViewMode('list')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer select-none ${
                    modalViewMode === 'list'
                      ? 'bg-crimson-primary text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                  title="Xem dưới dạng danh sách (List) - Mỗi bài đọc nằm trên 1 hàng ngang"
                >
                  <span className="material-symbols-outlined text-[16px]">view_list</span>
                  <span>Dạng danh sách</span>
                </button>
              </div>
            </div>

            {/* Modal Body: Cards (Grid mode) or Rows (List mode) with Drag and Drop Reordering */}
            <div className="p-6 sm:p-8 overflow-y-auto flex-1 bg-slate-50/50 custom-scrollbar">
              {modalFilteredLists.length === 0 ? (
                <div className="py-12 text-center flex flex-col items-center justify-center gap-2">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[24px]">search_off</span>
                  </div>
                  <p className="text-xs font-semibold text-slate-600">
                    Không tìm thấy danh sách bài đọc nào khớp với từ khóa "{modalSearchTerm}"
                  </p>
                  <button
                    type="button"
                    onClick={() => setModalSearchTerm('')}
                    className="mt-1 text-xs text-crimson-primary font-bold hover:underline cursor-pointer"
                  >
                    Xóa tìm kiếm
                  </button>
                </div>
              ) : modalViewMode === 'list' ? (
                /* Dạng danh sách: Mỗi list nằm trên 1 hàng ngang */
                <div className="flex flex-col gap-2.5">
                  {modalFilteredLists.map((list) => {
                    const isBeingDragged = String(draggedListId) === String(list.id);
                    const isOverBefore = String(dragOverListId) === String(list.id) && dropPosition === 'before';
                    const isOverAfter = String(dragOverListId) === String(list.id) && dropPosition === 'after';

                    return renderRow(
                      list,
                      (id) => {
                        if (dragJustEndedRef.current) return;
                        setViewingFolderId(null);
                        if (onSelectList) onSelectList(id);
                      },
                      {
                        draggable: !modalSearchTerm.trim(),
                        onDragStart: (e) => handleDragStart(e, list.id),
                        onDragEnter: (e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        },
                        onDragOver: (e) => handleDragOver(e, list.id),
                        onDragLeave: (e) => handleDragLeave(e, list.id),
                        onDragEnd: handleDragEnd,
                        onDrop: (e) => handleDrop(e, list.id),
                        isBeingDragged,
                        isOverBefore,
                        isOverAfter,
                      }
                    );
                  })}
                </div>
              ) : (
                /* Dạng cột (Lưới 3 cột) */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {modalFilteredLists.map((list) => {
                    const isBeingDragged = String(draggedListId) === String(list.id);
                    const isOverBefore = String(dragOverListId) === String(list.id) && dropPosition === 'before';
                    const isOverAfter = String(dragOverListId) === String(list.id) && dropPosition === 'after';

                    return (
                      <div
                        key={list.id}
                        draggable={!modalSearchTerm.trim()}
                        onDragStart={(e) => handleDragStart(e, list.id)}
                        onDragEnter={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                        onDragOver={(e) => handleDragOver(e, list.id)}
                        onDragLeave={(e) => handleDragLeave(e, list.id)}
                        onDragEnd={handleDragEnd}
                        onDrop={(e) => handleDrop(e, list.id)}
                        className={`transition-all duration-150 rounded-2xl cursor-grab active:cursor-grabbing ${
                          isBeingDragged
                            ? 'opacity-35 scale-95 ring-2 ring-crimson-primary ring-dashed'
                            : isOverBefore
                            ? 'ring-2 ring-crimson-primary -translate-x-1.5 shadow-md'
                            : isOverAfter
                            ? 'ring-2 ring-crimson-primary translate-x-1.5 shadow-md'
                            : ''
                        }`}
                      >
                        {renderCard(list, (id) => {
                          if (dragJustEndedRef.current) return;
                          setViewingFolderId(null);
                          if (onSelectList) onSelectList(id);
                        })}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 sm:px-8 py-3.5 border-t border-slate-200/80 bg-white flex items-center justify-between shrink-0 flex-wrap gap-2">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="material-symbols-outlined text-[16px] text-amber-500">drag_indicator</span>
                <span>
                  {modalSearchTerm.trim()
                    ? 'Đang lọc tìm kiếm — Hãy xóa từ khóa tìm kiếm để kéo thả sắp xếp'
                    : 'Kéo thả danh sách bất kỳ để thay đổi vị trí sắp xếp'}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setViewingFolderId(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
