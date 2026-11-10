import React from 'react';
import VocabCard from '../../vocabulary/components/VocabCard';
import SortDropdown, { sortVocabularies } from '../../../components/SortDropdown';
import TipTapEditor from '../../../components/TipTapEditor';
import ReadingPassageReader from '../components/ReadingPassageReader';

export default function ReadingListView({
  readingList,
  vocabList,
  existingLists = [],
  noteFolders = [],
  onOpenAddModal,
  onPronounce,
  onEditVocab,
  onDeleteVocab,
  onDeleteReadingList,
  onUpdateReadingList,
  onEditReadingList,
  showNotification,
  onBackToListVocabulary,
  searchTerm = '',
  setSearchTerm,
  selectedPos = 'all',
  setSelectedPos,
  onSelectRelatedWord,
  onOpenRelatedGroup,
  sortBy = 'newest',
  setSortBy,
}) {
  const [localSortBy, setLocalSortBy] = React.useState('newest');
  const activeSortBy = setSortBy ? sortBy : localSortBy;
  const handleSortChange = setSortBy || setLocalSortBy;

  const parentFolder = React.useMemo(() => {
    if (readingList?.folderId) {
      return noteFolders.find((f) => String(f.id) === String(readingList.folderId));
    }
    if (readingList?.folderCode || readingList?.folderName) {
      return { code: readingList.folderCode, name: readingList.folderName };
    }
    return null;
  }, [readingList, noteFolders]);

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

  // Danh sách bài đọc (hỗ trợ nhiều bài đọc hoặc bài đọc cũ)
  const passageList = React.useMemo(() => {
    if (Array.isArray(readingList?.passages) && readingList.passages.length > 0) {
      return readingList.passages;
    }
    if (readingList?.passage) {
      const clean = readingList.passage.replace(/<[^>]*>/g, ' ').trim();
      const words = clean ? clean.split(/\s+/).filter(Boolean).length : 0;
      return [
        {
          id: 'legacy',
          title: 'Bài đọc chính',
          content: readingList.passage,
          wordCount: words,
        },
      ];
    }
    return [];
  }, [readingList?.passages, readingList?.passage]);

  const [activePassageIndex, setActivePassageIndex] = React.useState(0);
  const [showPassage, setShowPassage] = React.useState(true);
  const [isCopied, setIsCopied] = React.useState(false);

  const totalWords = React.useMemo(() => {
    return passageList.reduce((acc, cur) => acc + (cur.wordCount || 0), 0);
  }, [passageList]);

  const handleCopyPassage = (content) => {
    if (!content) return;
    const textToCopy = content.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').trim();
    navigator.clipboard.writeText(textToCopy);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleDeletePassage = React.useCallback(
    async (indexToDelete) => {
      const targetPassage = passageList[indexToDelete];
      if (!targetPassage) return;

      const doDelete = async () => {
        const remainingPassages = passageList.filter((_, idx) => idx !== indexToDelete);
        const payload = {
          title: readingList.title,
          code: readingList.code,
          sourceReference: readingList.sourceReference,
          note: readingList.note,
          folderId: readingList.folderId,
          passages: remainingPassages.map((p, idx) => ({
            id: typeof p.id === 'number' && p.id > 0 ? p.id : null,
            title: p.title,
            content: p.content,
            wordCount: p.wordCount,
            sortOrder: idx,
          })),
          passage: remainingPassages[0]?.content || null,
        };

        if (onUpdateReadingList && readingList?.id) {
          await onUpdateReadingList(readingList.id, payload);
        }
        setActivePassageIndex((prev) => Math.max(0, Math.min(prev, remainingPassages.length - 1)));
      };

      if (showNotification) {
        showNotification({
          title: 'Xóa bài đọc',
          message: `Bạn có chắc chắn muốn xóa bài đọc "${targetPassage.title || 'này'}" không? Hành động này không thể hoàn tác.`,
          type: 'danger',
          confirmText: 'Xóa bài đọc',
          cancelText: 'Hủy bỏ',
          onConfirm: doDelete,
        });
      } else if (window.confirm(`Bạn có chắc chắn muốn xóa bài đọc "${targetPassage.title || 'này'}" không?`)) {
        await doDelete();
      }
    },
    [passageList, readingList, onUpdateReadingList, showNotification]
  );

  // Trạng thái soạn thảo TipTap inline ngay tại bài đọc
  const [isEditingPassage, setIsEditingPassage] = React.useState(false);
  const [isCreatingPassage, setIsCreatingPassage] = React.useState(false);
  const [editingPassageTitle, setEditingPassageTitle] = React.useState('');
  const [editingPassageContent, setEditingPassageContent] = React.useState('');
  const [editingPassageWordCount, setEditingPassageWordCount] = React.useState(0);
  const [isSavingPassage, setIsSavingPassage] = React.useState(false);
  const isInEditPassageMode = isEditingPassage || isCreatingPassage;
  const passageEditorRef = React.useRef(null);

  const handleAddNewPassageInline = () => {
    setShowPassage(true);
    setIsCreatingPassage(true);
    setIsEditingPassage(true);
    setEditingPassageTitle('');
    setEditingPassageContent('');
    setEditingPassageWordCount(0);
    setActivePassageIndex(passageList.length);
  };

  const handleToggleEditPassage = () => {
    if (isInEditPassageMode) {
      handleSaveInlinePassage();
    } else {
      const current = passageList[activePassageIndex] || passageList[0];
      if (current) {
        setEditingPassageTitle(current.title || `Bài đọc ${activePassageIndex + 1}`);
        setEditingPassageContent(current.content || '');
        setEditingPassageWordCount(current.wordCount || 0);
      }
      setIsCreatingPassage(false);
      setIsEditingPassage(true);
    }
  };

  const handleCancelEditPassage = () => {
    setIsEditingPassage(false);
    setIsCreatingPassage(false);
    setActivePassageIndex((prev) => Math.min(prev, Math.max(0, passageList.length - 1)));
  };

  const handleSaveInlinePassage = async () => {
    if (isSavingPassage) return;
    setIsSavingPassage(true);
    try {
      let updatedPassages;
      if (isCreatingPassage) {
        const newPassage = {
          id: null,
          title: editingPassageTitle.trim() || `Bài đọc ${passageList.length + 1}`,
          content: editingPassageContent,
          wordCount: editingPassageWordCount,
        };
        updatedPassages = [...passageList, newPassage];
      } else {
        updatedPassages = passageList.map((p, idx) => {
          if (idx === activePassageIndex) {
            return {
              ...p,
              title: editingPassageTitle.trim() || `Bài đọc ${idx + 1}`,
              content: editingPassageContent,
              wordCount: editingPassageWordCount,
            };
          }
          return p;
        });
      }

      const payload = {
        title: readingList.title,
        code: readingList.code,
        sourceReference: readingList.sourceReference,
        note: readingList.note,
        folderId: readingList.folderId,
        passages: updatedPassages.map((p, idx) => ({
          id: typeof p.id === 'number' && p.id > 0 ? p.id : null,
          title: p.title,
          content: p.content,
          wordCount: p.wordCount,
          sortOrder: idx,
        })),
        passage: updatedPassages[0]?.content || null,
      };

      if (onUpdateReadingList && readingList?.id) {
        await onUpdateReadingList(readingList.id, payload);
      }
      const newIndex = isCreatingPassage ? passageList.length : activePassageIndex;
      setIsEditingPassage(false);
      setIsCreatingPassage(false);
      setActivePassageIndex(newIndex);
    } catch (err) {
      console.error('Lỗi khi lưu bài đọc:', err);
    } finally {
      setIsSavingPassage(false);
    }
  };

  // Lắng nghe phím tắt Ctrl + Enter (hoặc Cmd + Enter) để lưu bài đọc nhanh, Esc để hủy
  React.useEffect(() => {
    if (!isInEditPassageMode) return;

    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleSaveInlinePassage();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleCancelEditPassage();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isInEditPassageMode, isCreatingPassage, editingPassageTitle, editingPassageContent, editingPassageWordCount, passageList, activePassageIndex, readingList]);

  const [isEditing, setIsEditing] = React.useState(false);
  const [editCode, setEditCode] = React.useState(readingList?.code || readingList?.shortTitle || '');
  const [editTitle, setEditTitle] = React.useState(readingList?.title || '');
  const [editSource, setEditSource] = React.useState(readingList?.sourceReference || '');
  const [editNote, setEditNote] = React.useState(readingList?.note || '');

  // Reset and sync state when readingList changes
  React.useEffect(() => {
    setIsEditing(false);
    setIsEditingPassage(false);
    setIsCreatingPassage(false);
    setActivePassageIndex(0);
    setShowPassage(true);
    setEditCode(readingList?.code || readingList?.shortTitle || '');
    setEditTitle(readingList?.title || '');
    setEditSource(readingList?.sourceReference || '');
    setEditNote(readingList?.note || '');
  }, [readingList?.id]);

  React.useEffect(() => {
    if (!isCreatingPassage) {
      setIsEditingPassage(false);
    }
  }, [activePassageIndex, isCreatingPassage]);

  // Tooltip hiển thị đầy đủ tên bài đọc khi hover tab (giảm thời gian chờ xuống ~1s mượt mà)
  const [hoveredTabTooltip, setHoveredTabTooltip] = React.useState(null);
  const tabTooltipTimeoutRef = React.useRef(null);

  const handleTabMouseEnter = (e, title) => {
    if (tabTooltipTimeoutRef.current) {
      clearTimeout(tabTooltipTimeoutRef.current);
    }
    const rect = e.currentTarget.getBoundingClientRect();
    tabTooltipTimeoutRef.current = setTimeout(() => {
      setHoveredTabTooltip({
        x: rect.left + rect.width / 2,
        y: rect.bottom + 8,
        title,
      });
    }, 1000);
  };

  const handleTabMouseLeave = () => {
    if (tabTooltipTimeoutRef.current) {
      clearTimeout(tabTooltipTimeoutRef.current);
    }
    setHoveredTabTooltip(null);
  };

  React.useEffect(() => {
    return () => {
      if (tabTooltipTimeoutRef.current) {
        clearTimeout(tabTooltipTimeoutRef.current);
      }
    };
  }, []);


  const handleSaveHighlight = async (newHtml, newWordCount) => {
    const updatedPassages = passageList.map((p, idx) => {
      if (idx === activePassageIndex) {
        return {
          ...p,
          content: newHtml,
          wordCount: newWordCount,
        };
      }
      return p;
    });

    const payload = {
      title: readingList.title,
      code: readingList.code,
      sourceReference: readingList.sourceReference,
      note: readingList.note,
      folderId: readingList.folderId,
      passages: updatedPassages.map((p, idx) => ({
        id: typeof p.id === 'number' && p.id > 0 ? p.id : null,
        title: p.title,
        content: p.content,
        wordCount: p.wordCount,
        sortOrder: idx,
      })),
      passage: updatedPassages[0]?.content || null,
    };

    if (onUpdateReadingList && readingList?.id) {
      await onUpdateReadingList(readingList.id, payload, { silent: true });
    }
  };

  // Lắng nghe sự kiện cập nhật star/bookmark để cập nhật danh sách ngay lập tức
  const [prefVersion, setPrefVersion] = React.useState(0);
  React.useEffect(() => {
    const handlePrefChange = () => setPrefVersion((v) => v + 1);
    window.addEventListener('vocab_preference_changed', handlePrefChange);
    return () => window.removeEventListener('vocab_preference_changed', handlePrefChange);
  }, []);

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

  // Kiểm tra trùng mã danh sách khi sửa inline
  const isInlineCodeDuplicate = React.useMemo(() => {
    const trimmed = (editCode || '').trim().toUpperCase();
    if (!trimmed) return false;
    return existingLists.some(
      (l) =>
        String(l.id) !== String(readingList?.id) &&
        (l.code || l.shortTitle || '').trim().toUpperCase() === trimmed
    );
  }, [editCode, existingLists, readingList?.id]);

  const handleSaveEdit = React.useCallback(async () => {
    const trimmedTitle = (editTitle || '').trim();
    if (!trimmedTitle) {
      alert('Vui lòng nhập tiêu đề danh mục từ vựng!');
      return;
    }

    const trimmedCode = (editCode || '').trim().toUpperCase();
    if (
      trimmedCode &&
      existingLists.some(
        (l) =>
          String(l.id) !== String(readingList?.id) &&
          (l.code || l.shortTitle || '').trim().toUpperCase() === trimmedCode
      )
    ) {
      alert(`Mã danh sách "${editCode.trim()}" đã được sử dụng bởi danh sách khác. Vui lòng chọn một mã khác!`);
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
  }, [editCode, editTitle, editSource, editNote, readingList, existingLists, onUpdateReadingList]);

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

  // 1. Toàn bộ từ vựng thuộc về danh sách bài đọc này (so khớp chặt chẽ theo ID duy nhất)
  const targetId = String(readingList.id);
  const seenAllKeys = new Set();
  const allReadingListWords = vocabList.filter((item) => {
    if (!item) return false;
    const key = item.id ? `id-${item.id}` : `word-${item.word?.toLowerCase()}`;
    if (seenAllKeys.has(key)) return false;

    // So khớp theo ID duy nhất để đảm bảo các list trùng tiêu đề không bị đồng bộ nhầm từ vựng
    let isMatch = false;
    if (item.readingListId != null && item.readingListId !== '') {
      isMatch = String(item.readingListId) === targetId;
    } else if (item.noteListId != null && item.noteListId !== '') {
      isMatch = String(item.noteListId) === targetId;
    } else if (Array.isArray(item.noteLists) && item.noteLists.length > 0) {
      isMatch = item.noteLists.some((nl) => nl && String(nl.id) === targetId);
    } else if (Array.isArray(item.noteListIds) && item.noteListIds.length > 0) {
      isMatch = item.noteListIds.some((id) => id != null && String(id) === targetId);
    } else if (item.readingListName && readingList.code) {
      // Chỉ fallback so khớp theo Mã code duy nhất (VD: LIST 01 vs LIST 02) khi item hoàn toàn không có ID
      isMatch = item.readingListName === readingList.code;
    }

    if (isMatch) {
      seenAllKeys.add(key);
      return true;
    }
    return false;
  });

  // 2. Danh sách từ vựng sau khi áp dụng bộ lọc loại từ (POS), tìm kiếm và sắp xếp
  const listWords = React.useMemo(() => {
    const filtered = allReadingListWords.filter((item) => {
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

    return sortVocabularies(filtered, activeSortBy);
  }, [allReadingListWords, selectedPos, searchTerm, activeSortBy, prefVersion]);

  // 3. Danh sách từ vựng tinh gọn để tự động highlight màu đỏ trong bài đọc
  const readingListVocabs = React.useMemo(() => {
    return allReadingListWords
      .map((v) => ({
        id: v.id,
        word: (v.word || '').trim(),
        meaning: v.vietnameseDefinition || v.meaning || v.definition || '',
        pos: v.pos || v.partOfSpeech || '',
      }))
      .filter((v) => v.word.length > 0);
  }, [allReadingListWords]);

  // Từ vựng đang được rê chuột hoặc focus ở danh sách bên dưới
  const [hoveredVocabWord, setHoveredVocabWord] = React.useState('');

  // Cuộn mượt đến thẻ từ vựng bên dưới khi click vào từ highlight trong bài đọc
  const handleScrollToVocab = React.useCallback((word) => {
    if (!word) return;
    const cleanWord = word.trim().toLowerCase();
    let targetCard = document.querySelector(`[data-vocab-word="${cleanWord}"]`);
    if (!targetCard) {
      // Thử tìm thẻ từ theo các biến thể hình thái học (bỏ đuôi ed, ing, s, es hoặc thêm)
      const variants = [
        cleanWord.replace(/ed$/, ''),
        cleanWord.replace(/ing$/, ''),
        cleanWord.replace(/es$/, ''),
        cleanWord.replace(/s$/, ''),
        cleanWord + 'ed',
        cleanWord + 'ing',
        cleanWord + 's',
      ];
      for (const v of variants) {
        if (!v || v === cleanWord) continue;
        targetCard = document.querySelector(`[data-vocab-word="${v}"]`);
        if (targetCard) break;
      }
    }
    if (targetCard) {
      targetCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
      targetCard.classList.add('ring-4', 'ring-crimson-primary/40');
      setTimeout(() => {
        targetCard.classList.remove('ring-4', 'ring-crimson-primary/40');
      }, 2000);
    }
  }, []);


  const totalCollocationsCount = listWords.reduce(
    (acc, w) => acc + w.forms.filter((f) => f.type === 'collocation' || (f.collocation && !f.pattern)).length,
    0
  );

  const displayTitle = readingList.title || readingList.fullTitle || 'Danh sách bài đọc';
  const displayCode = readingList.code || readingList.shortTitle || 'LIST';

  return (
    <div className="flex flex-col w-full pb-16">
      <div className="px-6 lg:px-8 pt-5 pb-1 max-w-[1600px] mx-auto w-full flex flex-col gap-4">
        {/* BREADCRUMB PHÂN CẤP */}
        <div className="flex items-center gap-2 text-xs text-slate-500 flex-wrap">
          <button
            type="button"
            onClick={onBackToListVocabulary}
            className="hover:text-crimson-primary font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">auto_stories</span>
            <span>List Vocabulary</span>
          </button>
          <span className="text-slate-300">/</span>
          {parentFolder && (
            <>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200/80 font-bold text-[11px] shadow-2xs">
                <span className="material-symbols-outlined text-[13px] text-amber-600">folder_open</span>
                <span>{parentFolder.name}</span>
              </span>
              <span className="text-slate-300">/</span>
            </>
          )}
          <span className="font-bold text-slate-800 truncate max-w-sm">{displayTitle}</span>
        </div>

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
                      className={`w-24 px-2 py-1 rounded-md text-xs font-black uppercase tracking-wider backdrop-blur-xs text-center focus:outline-none transition-all ${
                        isInlineCodeDuplicate
                          ? 'bg-red-500/90 text-white border-2 border-white shadow-[0_0_14px_rgba(239,68,68,0.6)] animate-pulse'
                          : 'bg-yellow-400/35 text-yellow-100 placeholder-yellow-200/50 border border-yellow-300/80 focus:ring-1 focus:ring-yellow-200 focus:bg-yellow-400/45 shadow-[0_0_14px_rgba(250,204,21,0.35)]'
                      }`}
                      title={isInlineCodeDuplicate ? 'Cảnh báo: Mã này đã bị trùng!' : 'Mã danh mục (nhấn Enter hoặc cây bút để lưu)'}
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

                  <div className="ml-auto flex items-center gap-2 flex-wrap">
                    {parentFolder && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold backdrop-blur-xs border border-white/30 shadow-xs">
                        <span className="material-symbols-outlined text-[14px]">folder_open</span>
                        <span>{parentFolder.name}</span>
                      </span>
                    )}

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
                      onClick={() => {
                        if (onEditReadingList) {
                          onEditReadingList(readingList);
                        } else {
                          handleToggleEdit();
                        }
                      }}
                      title="Thiết lập danh mục từ vựng & Quản lý bài đọc"
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
                      {allReadingListWords.length}
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
        {/* READING PASSAGE COLLAPSIBLE SECTION (Hỗ trợ nhiều bài đọc TipTap) */}
        {passageList.length > 0 || isCreatingPassage ? (
          <section className="bg-card-white rounded-2xl border border-slate-line/80 shadow-xs overflow-hidden transition-all">
            <div className="w-full px-5 py-3.5 bg-slate-50/80 border-b border-slate-line/60 flex items-center justify-between gap-3 text-left">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="material-symbols-outlined text-[20px] text-crimson-primary shrink-0">
                  menu_book
                </span>
                <span className="font-headline font-bold text-sm text-text-high-contrast truncate">
                  Tài liệu liên quan
                </span>
                {readingListVocabs.length > 0 && (
                  <span
                    className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-50 text-crimson-primary text-[11px] font-bold border border-red-200/80 shrink-0"
                    title={`Đang tự động highlight màu đỏ ${readingListVocabs.length} từ vựng thuộc bài đọc này`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-crimson-primary" />
                    <span>Auto-highlight {readingListVocabs.length} từ</span>
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleAddNewPassageInline}
                  disabled={isSavingPassage}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:text-crimson-primary hover:bg-crimson-primary/10 transition-colors cursor-pointer border border-slate-200/80 hover:border-crimson-primary/30"
                  title="Thêm bài đọc mới"
                >
                  <span className="material-symbols-outlined text-[18px]">add</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowPassage(!showPassage)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:text-text-high-contrast hover:bg-slate-200/60 transition-colors cursor-pointer border border-slate-200/80"
                  title={showPassage ? 'Thu gọn' : 'Xem nội dung'}
                  aria-label={showPassage ? 'Thu gọn' : 'Xem nội dung'}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {showPassage ? 'expand_less' : 'expand_more'}
                  </span>
                </button>
              </div>
            </div>

            {showPassage && (
              <div className="flex flex-col bg-white">
                {/* Tabs bài đọc (nếu có từ 2 bài trở lên hoặc đang tạo bài mới) */}
                {(passageList.length > 1 || (isCreatingPassage && passageList.length > 0)) && (
                  <div className="px-5 pt-2.5 pb-0 bg-slate-50/50 border-b border-slate-200/70 flex items-center gap-1.5 overflow-x-auto custom-scrollbar">
                    {passageList.map((p, idx) => {
                      const isActive = !isCreatingPassage && activePassageIndex === idx;
                      const passageTitle = p.title || `Bài đọc ${idx + 1}`;
                      return (
                        <button
                          key={p.id || idx}
                          type="button"
                          title=""
                          onClick={() => {
                            if (isCreatingPassage) {
                              setIsCreatingPassage(false);
                              setIsEditingPassage(false);
                            }
                            setActivePassageIndex(idx);
                            handleTabMouseLeave();
                          }}
                          onMouseEnter={(e) => handleTabMouseEnter(e, passageTitle)}
                          onMouseLeave={handleTabMouseLeave}
                          className={`w-40 sm:w-44 px-3.5 py-2 rounded-t-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 border-t-2 border-x-2 border-b-0 -mb-px ${
                            isActive
                              ? 'bg-white text-crimson-primary border-border-crimson-tint z-10 shadow-xs'
                              : 'bg-slate-100/60 text-slate-600 border-slate-200/80 hover:text-slate-900 hover:bg-slate-100 hover:border-slate-300'
                          }`}
                        >
                          <span className={`material-symbols-outlined text-[17px] shrink-0 ${
                            isActive ? 'text-crimson-primary' : 'text-slate-400 group-hover:text-slate-600'
                          }`}>
                            article
                          </span>
                          <span title="" className="line-clamp-1 flex-1 text-left">
                            {passageTitle}
                          </span>
                        </button>
                      );
                    })}

                    {/* Tab bài đọc mới đang thêm */}
                    {isCreatingPassage && (
                      <div className="w-40 sm:w-44 px-3.5 py-2 rounded-t-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 border-t-2 border-x-2 border-b-0 -mb-px bg-white text-crimson-primary border-border-crimson-tint z-10 shadow-xs">
                        <span className="material-symbols-outlined text-[17px] text-crimson-primary shrink-0">
                          note_add
                        </span>
                        <span className="line-clamp-1 flex-1 text-left">
                          {editingPassageTitle.trim() || `Bài đọc ${passageList.length + 1}`}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Nội dung bài đọc hiện tại */}
                {(() => {
                  const current = isCreatingPassage
                    ? { title: editingPassageTitle, content: editingPassageContent, wordCount: editingPassageWordCount }
                    : (passageList[activePassageIndex] || passageList[0]);
                  if (!current && !isCreatingPassage) return null;
                  const isHtml = /<[a-z][\s\S]*>/i.test(current?.content || '');

                  return (
                    <div className="p-5 sm:p-6 flex flex-col gap-3">
                      {/* Sub-header trong bài đọc */}
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-wrap gap-2">
                        <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
                          <span className="w-6 h-6 rounded-lg bg-crimson-primary/10 text-crimson-primary flex items-center justify-center text-xs font-bold shrink-0">
                            {isCreatingPassage ? passageList.length + 1 : activePassageIndex + 1}
                          </span>
                          {isInEditPassageMode ? (
                            <input
                              type="text"
                              value={editingPassageTitle}
                              onChange={(e) => setEditingPassageTitle(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === 'Tab') {
                                  e.preventDefault();
                                  if (passageEditorRef.current) {
                                    passageEditorRef.current.commands?.focus?.('end');
                                  } else {
                                    const proseMirrorEl = document.querySelector('.tiptap-content .ProseMirror');
                                    proseMirrorEl?.focus();
                                  }
                                }
                              }}
                              placeholder={isCreatingPassage ? `Nhập tiêu đề bài đọc ${passageList.length + 1}...` : "Nhập tiêu đề bài đọc..."}
                              autoFocus={isCreatingPassage}
                              className="font-bold text-xs sm:text-sm text-crimson-primary bg-white border border-crimson-primary/40 rounded-lg px-2.5 py-1 focus:border-crimson-primary focus:ring-2 focus:ring-crimson-primary/10 focus:outline-none flex-1 max-w-md shadow-2xs"
                            />
                          ) : (
                            <h3 className="font-headline font-bold text-sm sm:text-base text-crimson-primary truncate">
                              {current?.title || `Bài đọc ${activePassageIndex + 1}`}
                            </h3>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {/* Nút Sao chép (Icon only - màu xám) - ẩn khi đang soạn thảo */}
                          {!isInEditPassageMode && (
                            <button
                              type="button"
                              onClick={() => handleCopyPassage(current?.content)}
                              className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer border border-slate-200"
                              title={isCopied ? 'Đã sao chép nội dung!' : 'Sao chép nội dung bài đọc'}
                            >
                              <span className="material-symbols-outlined text-[17px]">
                                {isCopied ? 'check' : 'content_copy'}
                              </span>
                            </button>
                          )}

                          {/* Nút Cây bút (Khi ấn vào lập tức chuyển sang màu đỏ) */}
                          <button
                            type="button"
                            onClick={handleToggleEditPassage}
                            disabled={isSavingPassage}
                            className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                              isInEditPassageMode
                                ? 'bg-crimson-primary text-white border border-crimson-primary shadow-xs ring-2 ring-crimson-primary/20'
                                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-slate-200'
                            }`}
                            title={
                              isSavingPassage
                                ? 'Đang lưu...'
                                : isInEditPassageMode
                                ? (isCreatingPassage ? 'Lưu bài đọc mới' : 'Lưu thay đổi bài đọc')
                                : 'Chỉnh sửa bài đọc này ngay tại đây'
                            }
                          >
                            <span className="material-symbols-outlined text-[17px]">
                              {isSavingPassage ? 'sync' : isInEditPassageMode ? 'check' : 'edit'}
                            </span>
                          </button>

                          {/* Nút Hủy (khi đang edit) hoặc Nút Thùng rác (khi đang xem) */}
                          {isInEditPassageMode ? (
                            <button
                              type="button"
                              onClick={handleCancelEditPassage}
                              disabled={isSavingPassage}
                              className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer border border-slate-200"
                              title="Hủy bỏ"
                            >
                              <span className="material-symbols-outlined text-[17px]">close</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleDeletePassage(activePassageIndex)}
                              className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer border border-slate-200 hover:border-rose-200"
                              title="Xóa bài đọc này"
                            >
                              <span className="material-symbols-outlined text-[17px]">delete</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Vùng hiển thị hoặc Soạn thảo TipTap ngay tại bài đọc */}
                      {isInEditPassageMode ? (
                        <div className="flex flex-col gap-3 animate-in fade-in duration-150">
                          <TipTapEditor
                            editorRef={passageEditorRef}
                            content={editingPassageContent}
                            onSaveShortcut={handleSaveInlinePassage}
                            onChange={(html, wc) => {
                              setEditingPassageContent(html);
                              setEditingPassageWordCount(wc);
                            }}
                            placeholder="Dán hoặc soạn thảo bài đọc, transcript nghe... Hỗ trợ in đậm, in nghiêng, highlight từ vựng quan trọng."
                            minHeight="220px"
                          />

                          <div className="flex items-center justify-between pt-1 flex-wrap gap-2">
                            <div className="flex items-center gap-1.5 text-[11px] text-text-muted select-none">
                              <span>Mẹo: Nhấn</span>
                              <kbd className="inline-flex items-center px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded border border-slate-200 text-[10px] font-mono font-bold shadow-2xs">
                                Ctrl + Enter
                              </kbd>
                              <span>để lưu nhanh</span>
                            </div>

                            <div className="flex items-center gap-2 ml-auto">
                              <button
                                type="button"
                                onClick={handleCancelEditPassage}
                                disabled={isSavingPassage}
                                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                              >
                                Hủy bỏ
                              </button>

                              <button
                                type="button"
                                onClick={handleSaveInlinePassage}
                                disabled={isSavingPassage}
                                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-crimson-primary hover:bg-crimson-dark text-white text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
                              >
                                {isSavingPassage ? (
                                  <>
                                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    <span>Đang lưu...</span>
                                  </>
                                ) : (
                                  <>
                                    <span className="material-symbols-outlined text-[15px]">check</span>
                                    <span>{isCreatingPassage ? 'Thêm bài đọc' : 'Lưu thay đổi'}</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <ReadingPassageReader
                          key={`passage-reader-${activePassageIndex}-${current?.id || 'p'}-${readingListVocabs.map((v) => v.id || v.word).join('_')}`}
                          content={current?.content}
                          vocabs={readingListVocabs}
                          activeVocabWord={hoveredVocabWord}
                          onSelectVocabWord={handleScrollToVocab}
                          onSaveHighlight={handleSaveHighlight}
                        />
                      )}
                    </div>
                  );
                })()}
              </div>
            )}
          </section>
        ) : (
          /* Empty State khi chưa có bài đọc */
          (
            <section className="p-4 rounded-2xl border border-dashed border-slate-200/90 bg-white/70 hover:bg-white transition-all flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-3">
                <span className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
                  <span className="material-symbols-outlined text-[20px]">menu_book</span>
                </span>
                <div className="flex flex-col">
                  <span className="font-headline font-bold text-xs sm:text-sm text-slate-700">
                    Danh mục chưa có tài liệu
                  </span>
                  <span className="text-[11px] text-text-muted">
                    Thêm bài đọc hoặc transcript để tiện theo dõi ngữ cảnh từ vựng.
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleAddNewPassageInline}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-crimson-primary/10 hover:bg-crimson-primary text-crimson-primary hover:text-white text-xs font-bold transition-all cursor-pointer shadow-2xs"
              >
                <span className="material-symbols-outlined text-[16px]">add_circle</span>
                <span>Thêm nội dung bài đọc</span>
              </button>
            </section>
          )
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

          {/* POS Filter Pills & Nút Sắp Xếp (Sát mép phải) */}
          <div className="flex items-center gap-2 flex-wrap sm:ml-auto shrink-0">
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200/80 shadow-xs flex-wrap">
              {posOptions.map((opt) => {
                const isActive = selectedPos === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setSelectedPos && setSelectedPos(opt.id)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap border transition-colors duration-150 cursor-pointer ${isActive ? opt.activeClass : `border-transparent ${opt.inactiveClass}`}`}
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

        {/* VOCABULARY CARDS LIST */}
        <div className="flex flex-col gap-4">
          {listWords.map((item) => (
            <div
              key={item.id}
              data-vocab-word={(item.word || '').trim().toLowerCase()}
              onMouseEnter={() => setHoveredVocabWord(item.word || '')}
              onMouseLeave={() => setHoveredVocabWord('')}
              className="rounded-2xl transition-all"
            >
              <VocabCard
                vocab={item}
                vocabList={vocabList}
                onPronounce={onPronounce}
                onEdit={onEditVocab}
                onDelete={onDeleteVocab}
                onSelectRelatedWord={onSelectRelatedWord}
                onOpenRelatedGroup={onOpenRelatedGroup}
                showReadingList={false}
              />
            </div>
          ))}

          {listWords.length === 0 && (
            <div className="p-14 text-center bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col items-center justify-center gap-3">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                activeSortBy === 'starred'
                  ? 'bg-amber-50 text-amber-500'
                  : activeSortBy === 'bookmarked'
                  ? 'bg-surface-crimson-subtle text-crimson-primary'
                  : 'bg-surface-crimson-subtle text-crimson-primary'
              }`}>
                <span className="material-symbols-outlined text-[28px]">
                  {activeSortBy === 'starred'
                    ? 'star'
                    : activeSortBy === 'bookmarked'
                    ? 'bookmark'
                    : allReadingListWords.length > 0
                    ? 'filter_alt_off'
                    : 'article'}
                </span>
              </div>
              <div>
                <p className="font-bold text-sm text-text-high-contrast">
                  {activeSortBy === 'starred'
                    ? 'Chưa có từ vựng nào được đánh dấu sao trong bài này'
                    : activeSortBy === 'bookmarked'
                    ? 'Chưa có từ vựng nào được lưu (Bookmark) trong bài này'
                    : allReadingListWords.length > 0
                    ? 'Không có từ vựng nào phù hợp với bộ lọc'
                    : 'Chưa có từ vựng nào trong danh sách này'}
                </p>
                <p className="text-xs text-text-muted mt-1 leading-relaxed">
                  {activeSortBy === 'starred'
                    ? 'Nhấn vào biểu tượng ngôi sao (☆) ở góc phải của thẻ từ để đánh dấu các từ vựng trọng tâm trong bài này.'
                    : activeSortBy === 'bookmarked'
                    ? 'Nhấn vào biểu tượng bookmark (🔖) ở góc phải của thẻ từ để lưu từ cần ôn lại trong bài này.'
                    : allReadingListWords.length > 0
                    ? 'Bạn đang chọn bộ lọc loại từ hoặc tìm kiếm khiến từ vựng không khớp. Bấm nút bên dưới để xem lại tất cả.'
                    : 'Bấm nút "Thêm từ vào List này" phía trên để lưu từ vựng kèm ngữ cảnh câu đọc.'}
                </p>
              </div>
              {activeSortBy === 'starred' || activeSortBy === 'bookmarked' ? (
                <button
                  type="button"
                  onClick={() => handleSortChange('newest')}
                  className="mt-1 flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-text-body text-xs font-bold transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                  <span>Xem lại toàn bộ từ trong bài ({allReadingListWords.length} từ)</span>
                </button>
              ) : allReadingListWords.length > 0 ? (
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

      {/* Floating Tooltip hiển thị đầy đủ tên bài đọc khi hover tab */}
      {hoveredTabTooltip && (
        <div
          style={{ left: `${hoveredTabTooltip.x}px`, top: `${hoveredTabTooltip.y}px` }}
          className="fixed -translate-x-1/2 z-[9999] pointer-events-none animate-in fade-in zoom-in-95 duration-150 flex flex-col items-center"
        >
          <div className="w-2 h-1 border-x-4 border-x-transparent border-b-4 border-b-slate-900" />
          <div className="bg-slate-900 text-white text-[11px] font-medium px-2.5 py-1.5 rounded-lg shadow-2xl whitespace-nowrap max-w-[340px] truncate border border-slate-700">
            {hoveredTabTooltip.title}
          </div>
        </div>
      )}
    </div>
  );
}
