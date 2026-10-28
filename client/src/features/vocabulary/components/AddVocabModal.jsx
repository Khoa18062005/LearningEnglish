import React, { useState, useEffect, useMemo, useRef } from 'react';

export default function AddVocabModal({
  isOpen,
  onClose,
  onSave,
  readingLists = [],
  categories = [],
  vocabList = [],
  onOpenAddReadingListModal,
}) {
  const [word, setWord] = useState('');
  const [wordFamilyInput, setWordFamilyInput] = useState('');
  const [wordFamily, setWordFamily] = useState([]);
  const [selectedReadingList, setSelectedReadingList] = useState('');
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [isReadingListDropdownOpen, setIsReadingListDropdownOpen] = useState(false);
  const categoryDropdownRef = useRef(null);
  const readingListDropdownRef = useRef(null);

  // Dynamic Word Forms with clean empty initial state
  const [forms, setForms] = useState([
    {
      id: 1,
      pos: 'v',
      posLabel: 'Verb',
      countability: null,
      synonyms: '',
      patterns: [
        {
          id: 101,
          pattern: '',
          meaning: '',
          example: '',
          note: '',
        },
      ],
      collocations: [
        {
          id: 201,
          collocation: '',
          meaning: '',
          example: '',
          note: '',
        },
      ],
    },
  ]);

  // Set default selectedReadingList when readingLists changes or modal opens
  useEffect(() => {
    if (readingLists.length > 0 && !selectedReadingList) {
      setSelectedReadingList(readingLists[0].id);
    }
  }, [readingLists, selectedReadingList]);

  // Check duplicate word in real-time
  const duplicateMatch = useMemo(() => {
    if (!word.trim() || !vocabList?.length) return null;
    return vocabList.find(
      (v) => v.word.toLowerCase() === word.trim().toLowerCase()
    );
  }, [word, vocabList]);

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        categoryDropdownRef.current &&
        !categoryDropdownRef.current.contains(event.target)
      ) {
        setIsCategoryDropdownOpen(false);
      }
      if (
        readingListDropdownRef.current &&
        !readingListDropdownRef.current.contains(event.target)
      ) {
        setIsReadingListDropdownOpen(false);
      }
    };

    if (isCategoryDropdownOpen || isReadingListDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isCategoryDropdownOpen, isReadingListDropdownOpen]);

  // Handle hotkeys: Escape to close, Cmd/Ctrl + Enter to submit
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (isCategoryDropdownOpen) {
          setIsCategoryDropdownOpen(false);
        } else if (isReadingListDropdownOpen) {
          setIsReadingListDropdownOpen(false);
        } else {
          onClose();
        }
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        handleSubmit(e);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isCategoryDropdownOpen, isReadingListDropdownOpen, word, forms, selectedReadingList, selectedCategories, wordFamily]);

  if (!isOpen) return null;

  // Add word family chip
  const handleAddWordFamily = (e) => {
    if (e.key === 'Enter' && wordFamilyInput.trim()) {
      e.preventDefault();
      const trimmed = wordFamilyInput.trim();
      if (!wordFamily.includes(trimmed)) {
        setWordFamily([...wordFamily, trimmed]);
      }
      setWordFamilyInput('');
    }
  };

  const handleRemoveWordFamily = (item) => {
    setWordFamily(wordFamily.filter((wf) => wf !== item));
  };

  // Toggle Category in Dropdown
  const handleToggleCategory = (catName) => {
    if (selectedCategories.includes(catName)) {
      setSelectedCategories(selectedCategories.filter((c) => c !== catName));
    } else {
      setSelectedCategories([...selectedCategories, catName]);
    }
  };

  // Update POS for word (1 từ vựng chỉ 1 từ loại duy nhất)
  const handleUpdatePos = (arg1, arg2) => {
    const newPos = arg2 !== undefined ? arg2 : arg1;
    const labelMap = { n: 'Noun', v: 'Verb', adj: 'Adjective', adv: 'Adverb' };
    setForms([
      {
        ...forms[0],
        pos: newPos,
        posLabel: labelMap[newPos],
        countability: newPos === 'n' ? '[C]' : null,
      },
    ]);
  };

  // Update countability
  const handleUpdateCountability = (arg1, arg2) => {
    const val = arg2 !== undefined ? arg2 : arg1;
    setForms([
      {
        ...forms[0],
        countability: val,
      },
    ]);
  };

  // Update synonyms
  const handleUpdateSynonyms = (arg1, arg2) => {
    const val = arg2 !== undefined ? arg2 : arg1;
    setForms([
      {
        ...forms[0],
        synonyms: val,
      },
    ]);
  };

  // --- PATTERNS HANDLERS ---
  const handleAddPattern = () => {
    setForms([
      {
        ...forms[0],
        patterns: [
          ...forms[0].patterns,
          {
            id: Date.now(),
            pattern: '',
            meaning: '',
            example: '',
            note: '',
          },
        ],
      },
    ]);
  };

  const handleUpdatePattern = (arg1, arg2, arg3, arg4) => {
    const patId = arg4 !== undefined ? arg2 : arg1;
    const field = arg4 !== undefined ? arg3 : arg2;
    const val = arg4 !== undefined ? arg4 : arg3;
    setForms([
      {
        ...forms[0],
        patterns: forms[0].patterns.map((p) =>
          p.id === patId ? { ...p, [field]: val } : p
        ),
      },
    ]);
  };

  const handleDeletePattern = (arg1, arg2) => {
    const patId = arg2 !== undefined ? arg2 : arg1;
    setForms([
      {
        ...forms[0],
        patterns: forms[0].patterns.filter((p) => p.id !== patId),
      },
    ]);
  };

  // --- COLLOCATIONS HANDLERS ---
  const handleAddCollocation = () => {
    setForms([
      {
        ...forms[0],
        collocations: [
          ...forms[0].collocations,
          {
            id: Date.now(),
            collocation: '',
            meaning: '',
            example: '',
            note: '',
          },
        ],
      },
    ]);
  };

  const handleUpdateCollocation = (arg1, arg2, arg3, arg4) => {
    const colId = arg4 !== undefined ? arg2 : arg1;
    const field = arg4 !== undefined ? arg3 : arg2;
    const val = arg4 !== undefined ? arg4 : arg3;
    setForms([
      {
        ...forms[0],
        collocations: forms[0].collocations.map((c) =>
          c.id === colId ? { ...c, [field]: val } : c
        ),
      },
    ]);
  };

  const handleDeleteCollocation = (arg1, arg2) => {
    const colId = arg2 !== undefined ? arg2 : arg1;
    setForms([
      {
        ...forms[0],
        collocations: forms[0].collocations.filter((c) => c.id !== colId),
      },
    ]);
  };

  // Form submission
  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (!word.trim()) {
      alert('Vui lòng nhập Từ vựng tiếng Anh');
      return;
    }

    // Flatten forms for single POS: each pattern has its own row, each collocation has its own row
    const form = forms[0];
    const compiledForms = [];

    // 1. Process patterns
    form.patterns.forEach((p) => {
      if (p.meaning.trim() || p.pattern.trim()) {
        compiledForms.push({
          type: 'pattern',
          pos: form.pos,
          posLabel: form.posLabel,
          countability: form.countability,
          pattern: p.pattern.trim(),
          collocation: '',
          synonym: form.synonyms?.trim() || '',
          meaning: p.meaning.trim() || 'Chưa cập nhật nghĩa',
          example: p.example.trim(),
          note: p.note.trim(),
        });
      }
    });

    // 2. Process collocations
    form.collocations.forEach((c) => {
      if (c.meaning.trim() || c.collocation.trim()) {
        compiledForms.push({
          type: 'collocation',
          pos: form.pos,
          posLabel: form.posLabel,
          countability: form.countability,
          pattern: '',
          collocation: c.collocation.trim(),
          synonym: form.synonyms?.trim() || '',
          meaning: c.meaning.trim() || 'Chưa cập nhật nghĩa',
          example: c.example.trim(),
          note: c.note.trim(),
        });
      }
    });

    if (compiledForms.length === 0) {
      alert('Vui lòng nhập ít nhất 1 định nghĩa nghĩa tiếng Việt cho Mẫu Pattern hoặc Collocation');
      return;
    }

    const matchedList = readingLists.find((r) => r.id === selectedReadingList);

    const newVocab = {
      id: Date.now(),
      word: word.trim(),
      phonetic: `/${word.trim()}/`,
      pos: form.pos,
      posLabel: form.posLabel,
      countability: form.countability,
      wordFamily: wordFamily.length > 0 ? wordFamily : [`${word.trim()} (${form.pos})`],
      readingListId: selectedReadingList,
      readingListName: matchedList ? matchedList.shortTitle : 'Chung',
      categories: selectedCategories.length > 0 ? selectedCategories : ['IELTS Acad'],
      forms: compiledForms,
    };

    onSave(newVocab);
    // Reset all fields to fresh empty state
    setWord('');
    setWordFamily([]);
    setWordFamilyInput('');
    setSelectedCategories([]);
    setForms([
      {
        id: Date.now(),
        pos: 'v',
        posLabel: 'Verb',
        countability: null,
        synonyms: '',
        patterns: [
          {
            id: Date.now() + 1,
            pattern: '',
            meaning: '',
            example: '',
            note: '',
          },
        ],
        collocations: [
          {
            id: Date.now() + 2,
            collocation: '',
            meaning: '',
            example: '',
            note: '',
          },
        ],
      },
    ]);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-[1060px] bg-white rounded-2xl sm:rounded-3xl shadow-[0_25px_60px_-15px_rgba(15,23,42,0.3)] flex flex-col my-auto max-h-[92vh] overflow-hidden border border-slate-200/90 ring-1 ring-black/5 animate-in zoom-in-95 duration-150">
        
        {/* Top Gradient Hairline Accent */}
        <div className="h-1.5 w-full bg-gradient-to-r from-crimson-dark via-crimson-primary to-rose-400 shrink-0"></div>

        {/* Modal Header */}
        <div className="px-6 sm:px-8 pt-5 pb-4 flex items-center justify-between border-b border-slate-100 bg-white shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-rose-50 to-red-100/60 border border-red-200/60 flex items-center justify-center text-crimson-primary shadow-xs shrink-0">
              <span className="material-symbols-outlined text-[24px]">menu_book</span>
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="font-headline text-lg sm:text-xl font-bold text-text-high-contrast tracking-tight">
                  Thêm Từ Vựng Mới
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-surface-crimson-soft text-crimson-dark text-[10px] font-extrabold uppercase tracking-wider border border-border-crimson-tint/60">
                  LinearVocab™
                </span>
              </div>
              <p className="text-xs text-text-muted mt-0.5">
                Xây dựng cấu trúc từ loại, các pattern cấu trúc &amp; collocations kèm nghĩa tương ứng.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 text-[11px] font-semibold text-slate-400 bg-slate-100 rounded-md border border-slate-200">
              ESC
            </kbd>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              type="button"
              title="Đóng cửa sổ (ESC)"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="px-6 sm:px-8 py-6 overflow-y-auto flex flex-col gap-6 bg-slate-50/70">
          
          {/* SECTION 1: CORE WORD & METADATA */}
          <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/90 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col gap-5">
            
            {/* Section Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-lg bg-surface-crimson-subtle text-crimson-primary text-xs font-bold flex items-center justify-center border border-border-crimson-tint/50">
                  1
                </span>
                <span className="font-headline font-bold text-sm text-text-high-contrast">
                  Thông tin từ gốc &amp; Danh mục phân loại
                </span>
              </div>
              <span className="text-[11px] font-medium text-slate-400">
                Các mục có <span className="text-crimson-primary font-bold">*</span> là bắt buộc
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-5">
              
              {/* Input 1: Vocabulary */}
              <div className="md:col-span-6 flex flex-col gap-1.5">
                <label className="text-xs font-bold text-text-high-contrast flex items-center justify-between">
                  <span>
                    Từ vựng tiếng Anh <span className="text-crimson-primary">*</span>
                  </span>
                  <span className="text-[11px] font-normal text-text-muted">e.g. lease, fluctuate</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={word}
                    onChange={(e) => setWord(e.target.value)}
                    placeholder="Nhập từ vựng..."
                    className={`w-full h-11 pl-3.5 pr-8 bg-slate-50/70 hover:bg-white focus:bg-white rounded-xl text-sm font-semibold text-text-high-contrast border transition-all outline-none ${
                      duplicateMatch
                        ? 'border-amber-400 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10'
                        : 'border-slate-200 focus:border-crimson-primary focus:ring-4 focus:ring-crimson-primary/10'
                    }`}
                    required
                    autoFocus
                  />
                  {word && (
                    <button
                      type="button"
                      onClick={() => setWord('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                    >
                      <span className="material-symbols-outlined text-[16px]">cancel</span>
                    </button>
                  )}
                </div>

                {/* Inline Duplicate Warning if any */}
                {duplicateMatch && (
                  <p className="text-[11px] font-medium text-amber-700 flex items-center gap-1 animate-in fade-in">
                    <span className="material-symbols-outlined text-[14px]">warning</span>
                    <span>Từ này đã có trong kho từ vựng. Bạn vẫn có thể lưu bổ sung nghĩa mới!</span>
                  </p>
                )}
              </div>

              {/* Input 2: Reading Note List (Custom Styled Dropdown) */}
              <div className="md:col-span-6 flex flex-col gap-1.5 relative" ref={readingListDropdownRef}>
                <label className="text-xs font-bold text-text-high-contrast flex items-center justify-between">
                  <span>Gán vào thẻ List bài đọc</span>
                  {(() => {
                    const matched = readingLists.find((r) => r.id === selectedReadingList);
                    return matched?.code ? (
                      <span className="text-[11px] font-semibold text-crimson-primary">
                        {matched.code}
                      </span>
                    ) : null;
                  })()}
                </label>

                {/* Dropdown Trigger Button */}
                <button
                  type="button"
                  onClick={() => setIsReadingListDropdownOpen((prev) => !prev)}
                  className={`w-full h-11 px-3.5 bg-slate-50/70 hover:bg-white focus:bg-white rounded-xl text-xs font-medium text-text-body border transition-all outline-none flex items-center justify-between gap-2 text-left cursor-pointer ${
                    isReadingListDropdownOpen
                      ? 'border-crimson-primary ring-4 ring-crimson-primary/10 bg-white'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2 overflow-hidden flex-1">
                    {(() => {
                      const matched = readingLists.find((r) => r.id === selectedReadingList);
                      if (!matched) {
                        return <span className="text-slate-400">-- Chọn danh sách bài đọc --</span>;
                      }
                      return (
                        <>
                          <span className="px-2 py-0.5 rounded-md bg-surface-crimson-subtle text-crimson-primary border border-border-crimson-tint text-[11px] font-bold shrink-0">
                            {matched.code || matched.shortTitle || 'LIST'}
                          </span>
                          <span className="truncate text-xs font-semibold text-text-high-contrast">
                            {matched.title || matched.shortTitle || matched.code}
                          </span>
                        </>
                      );
                    })()}
                  </div>
                  <span
                    className={`material-symbols-outlined text-slate-400 text-[20px] transition-transform duration-200 shrink-0 ${
                      isReadingListDropdownOpen ? 'rotate-180 text-crimson-primary' : ''
                    }`}
                  >
                    expand_more
                  </span>
                </button>

                {/* Dropdown Popover */}
                {isReadingListDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1.5 z-40 bg-white rounded-xl shadow-[0_12px_28px_rgba(0,0,0,0.12)] border border-slate-200/90 py-1.5 max-h-64 overflow-y-auto animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-3.5 py-1.5 border-b border-slate-100 flex items-center justify-between text-[11px] font-semibold text-slate-400">
                      <span>Chọn bài đọc tương ứng</span>
                      {onOpenAddReadingListModal && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsReadingListDropdownOpen(false);
                            onOpenAddReadingListModal();
                          }}
                          className="text-crimson-primary hover:underline font-bold"
                        >
                          + Tạo list mới
                        </button>
                      )}
                    </div>
                    <div className="divide-y divide-slate-50">
                      {readingLists.length === 0 ? (
                        <div className="p-3 text-center text-xs text-text-muted">
                          <p>Chưa có danh sách bài đọc nào.</p>
                          {onOpenAddReadingListModal && (
                            <button
                              type="button"
                              onClick={() => {
                                setIsReadingListDropdownOpen(false);
                                onOpenAddReadingListModal();
                              }}
                              className="mt-1 text-crimson-primary font-bold hover:underline"
                            >
                              + Bấm vào đây để tạo
                            </button>
                          )}
                        </div>
                      ) : (
                        readingLists.map((rl) => {
                          const isSelected = rl.id === selectedReadingList;
                          const code = rl.code || rl.shortTitle || 'LIST';
                          const title = rl.title || rl.fullTitle || '';
                          return (
                            <button
                              key={rl.id}
                              type="button"
                              onClick={() => {
                                setSelectedReadingList(rl.id);
                                setIsReadingListDropdownOpen(false);
                              }}
                              className={`w-full px-3.5 py-2.5 flex items-center justify-between gap-3 text-left transition-colors text-xs select-none ${
                                isSelected
                                  ? 'bg-surface-crimson-subtle/80 text-crimson-primary font-semibold'
                                  : 'hover:bg-slate-50 text-slate-700'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 overflow-hidden flex-1">
                                <span
                                  className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                                    isSelected
                                      ? 'bg-crimson-primary text-white'
                                      : 'border border-slate-300'
                                  }`}
                                >
                                  {isSelected && (
                                    <span className="material-symbols-outlined text-[12px]">check</span>
                                  )}
                                </span>
                                <div className="flex flex-col overflow-hidden">
                                  <span className="font-bold text-xs truncate">{code}</span>
                                  {title && title !== code && (
                                    <span className="text-[11px] text-slate-400 truncate">
                                      {title}
                                    </span>
                                  )}
                                </div>
                              </div>
                              {rl.count !== undefined && (
                                <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full font-normal shrink-0">
                                  {rl.count} từ
                                </span>
                              )}
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Input 3: Word Family Tags */}
              <div className="md:col-span-6 flex flex-col gap-1.5">
                <label className="text-xs font-bold text-text-high-contrast flex items-center justify-between">
                  <span>Gia đình từ (Word Family)</span>
                  <span className="text-[11px] font-normal text-text-muted">Nhấn Enter để thêm</span>
                </label>
                <div className="min-h-[46px] p-2 bg-slate-50/70 rounded-xl border border-slate-200 flex flex-wrap items-center gap-1.5 focus-within:border-crimson-primary focus-within:bg-white focus-within:ring-4 focus-within:ring-crimson-primary/10 transition-all">
                  {wordFamily.map((item) => (
                    <span
                      key={item}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white text-xs font-medium text-text-body border border-slate-200/90 shadow-2xs group"
                    >
                      <span>{item}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveWordFamily(item)}
                        className="text-slate-400 group-hover:text-crimson-primary hover:bg-slate-100 rounded p-0.5 transition-colors"
                      >
                        <span className="material-symbols-outlined text-[13px] block">close</span>
                      </button>
                    </span>
                  ))}
                  <input
                    type="text"
                    value={wordFamilyInput}
                    onChange={(e) => setWordFamilyInput(e.target.value)}
                    onKeyDown={handleAddWordFamily}
                    placeholder="+ Thêm từ (e.g. lessor (n), leasehold (adj))..."
                    className="flex-1 min-w-[160px] bg-transparent text-xs px-2 py-1 outline-none text-text-high-contrast placeholder:text-slate-400"
                  />
                </div>
              </div>

              {/* Input 4: Categories Dropdown with Checkboxes */}
              <div className="md:col-span-6 flex flex-col gap-1.5 relative" ref={categoryDropdownRef}>
                <label className="text-xs font-bold text-text-high-contrast flex items-center justify-between">
                  <span>Danh mục áp dụng (Categories)</span>
                  <span className="text-[11px] font-normal text-text-muted">
                    {selectedCategories.length > 0 ? `Đã chọn (${selectedCategories.length})` : 'Chọn danh mục'}
                  </span>
                </label>

                {/* Dropdown Trigger Button */}
                <button
                  type="button"
                  onClick={() => setIsCategoryDropdownOpen((prev) => !prev)}
                  className={`w-full min-h-[44px] px-3.5 py-1.5 bg-slate-50/70 hover:bg-white focus:bg-white rounded-xl text-xs font-medium text-text-body border transition-all outline-none flex items-center justify-between gap-2 text-left cursor-pointer ${
                    isCategoryDropdownOpen
                      ? 'border-crimson-primary ring-4 ring-crimson-primary/10 bg-white'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-1.5 flex-wrap flex-1 overflow-hidden">
                    {selectedCategories.length === 0 ? (
                      <span className="text-slate-400 text-xs">-- Chọn danh mục áp dụng --</span>
                    ) : (
                      selectedCategories.map((catName) => (
                        <span
                          key={catName}
                          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-surface-crimson-subtle text-crimson-primary border border-border-crimson-tint/80 text-[11px] font-semibold"
                        >
                          <span>{catName}</span>
                        </span>
                      ))
                    )}
                  </div>
                  <span
                    className={`material-symbols-outlined text-slate-400 text-[20px] transition-transform duration-200 shrink-0 ${
                      isCategoryDropdownOpen ? 'rotate-180 text-crimson-primary' : ''
                    }`}
                  >
                    expand_more
                  </span>
                </button>

                {/* Dropdown Menu */}
                {isCategoryDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1.5 z-40 bg-white rounded-xl shadow-[0_12px_28px_rgba(0,0,0,0.12)] border border-slate-200/90 py-1.5 max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-3 py-1.5 border-b border-slate-100 flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-slate-500">Danh sách danh mục</span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedCategories(categories.map((c) => c.name))}
                          className="text-crimson-primary hover:underline font-semibold"
                        >
                          Chọn tất cả
                        </button>
                        <span className="text-slate-300">|</span>
                        <button
                          type="button"
                          onClick={() => setSelectedCategories([])}
                          className="text-slate-500 hover:underline"
                        >
                          Bỏ chọn
                        </button>
                      </div>
                    </div>
                    <div className="divide-y divide-slate-50">
                      {categories.map((cat) => {
                        const isSelected = selectedCategories.includes(cat.name);
                        return (
                          <label
                            key={cat.id}
                            className={`px-3.5 py-2.5 flex items-center gap-3 cursor-pointer transition-colors text-xs select-none ${
                              isSelected
                                ? 'bg-rose-50/50 hover:bg-rose-50/80 font-semibold text-text-high-contrast'
                                : 'hover:bg-slate-50 text-slate-700'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleCategory(cat.name)}
                              className="w-4 h-4 rounded text-crimson-primary accent-crimson-primary border-slate-300 focus:ring-crimson-primary cursor-pointer"
                            />
                            <span className="flex-1">{cat.name}</span>
                            {cat.count !== undefined && (
                              <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full font-normal">
                                {cat.count} từ
                              </span>
                            )}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>

          {/* SECTION 2: WORD FORMS & SENSES BUILDER */}
          <div className="flex flex-col gap-4">
            
            {/* Section Header */}
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-lg bg-surface-crimson-subtle text-crimson-primary text-xs font-bold flex items-center justify-center border border-border-crimson-tint/50">
                  2
                </span>
                <div>
                  <h3 className="font-headline font-bold text-sm text-text-high-contrast leading-tight">
                    Cấu trúc Từ loại, Pattern &amp; Collocations
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Mỗi từ vựng chỉ thể hiện 1 từ loại duy nhất, có thể chứa nhiều Pattern cấu trúc và nhiều Collocations.
                  </p>
                </div>
              </div>
            </div>

            {/* Word Form Card (1 Từ loại duy nhất) */}
            {(() => {
              const form = forms[0];
              return (
                <div
                  key={form.id}
                  className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/90 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col gap-5"
                >
                  {/* Form Card Header: Single POS */}
                  <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                    <span className="w-2.5 h-2.5 rounded-full bg-crimson-primary"></span>
                    <span className="text-sm font-bold text-text-high-contrast">
                      Từ loại (Part of Speech):
                    </span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 font-bold text-crimson-primary">
                      {form.posLabel}
                    </span>
                  </div>

                {/* POS Selector & Countability Bar */}
                <div className="flex flex-col gap-3.5 pb-2">
                  <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                    {/* POS Selector Pills */}
                    <div className="inline-flex rounded-xl bg-slate-100/80 p-1 border border-slate-200/60 gap-1">
                      {[
                        { id: 'v', label: 'Verb (Động từ)', colorActive: 'bg-white text-crimson-primary shadow-xs ring-1 ring-black/5 font-bold' },
                        { id: 'n', label: 'Noun (Danh từ)', colorActive: 'bg-white text-blue-600 shadow-xs ring-1 ring-black/5 font-bold' },
                        { id: 'adj', label: 'Adj (Tính từ)', colorActive: 'bg-white text-emerald-600 shadow-xs ring-1 ring-black/5 font-bold' },
                        { id: 'adv', label: 'Adv (Trạng từ)', colorActive: 'bg-white text-purple-600 shadow-xs ring-1 ring-black/5 font-bold' },
                      ].map((p) => {
                        const isActive = form.pos === p.id;
                        return (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => handleUpdatePos(form.id, p.id)}
                            className={`px-3 py-1.5 rounded-lg text-xs transition-all ${
                              isActive
                                ? p.colorActive
                                : 'text-slate-500 hover:text-slate-800 font-medium'
                            }`}
                          >
                            {p.label}
                          </button>
                        );
                      })}
                    </div>

                    {/* Countability toggle if Noun */}
                    {form.pos === 'n' && (
                      <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
                        <span className="text-[11px] font-semibold text-slate-500">Tính đếm:</span>
                        <div className="inline-flex rounded-lg bg-slate-100 p-0.5 border border-slate-200/60 gap-0.5">
                          {[
                            { val: '[C]', label: 'Đếm được [C]' },
                            { val: '[U]', label: 'Không đếm được [U]' },
                            { val: '[C/U]', label: 'Cả hai [C/U]' },
                          ].map((c) => (
                            <button
                              key={c.val}
                              type="button"
                              onClick={() => handleUpdateCountability(form.id, c.val)}
                              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                                form.countability === c.val
                                  ? 'bg-blue-600 text-white shadow-xs'
                                  : 'text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              {c.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Synonyms field for this POS form */}
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-[11px] font-bold text-slate-500 shrink-0 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[15px] text-slate-400">sync_alt</span>
                      <span>Từ đồng nghĩa chung (Synonyms):</span>
                    </span>
                    <input
                      type="text"
                      value={form.synonyms || ''}
                      onChange={(e) => handleUpdateSynonyms(form.id, e.target.value)}
                      placeholder="e.g. hire, rent, charter..."
                      className="flex-1 h-8 px-3 bg-slate-50/70 hover:bg-white focus:bg-white rounded-lg text-xs font-medium text-slate-800 border border-slate-200 focus:border-crimson-primary focus:ring-2 focus:ring-crimson-primary/10 transition-all outline-none"
                    />
                  </div>
                </div>

                {/* --- KHỐI 1: DANH SÁCH MẪU PATTERN (Mỗi pattern kèm 1 nghĩa) --- */}
                <div className="flex flex-col gap-3 p-4 rounded-xl bg-slate-50/70 border border-slate-200/80">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-surface-crimson-subtle text-crimson-primary flex items-center justify-center border border-border-crimson-tint/60 shadow-2xs">
                        <span className="material-symbols-outlined text-[16px]">account_tree</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-text-high-contrast">
                            1. Mẫu Pattern cấu trúc (Grammar Patterns)
                          </span>
                          <span className="px-2 py-0.2 rounded-full bg-white text-crimson-primary text-[10px] font-bold border border-border-crimson-tint">
                            {form.patterns.length} pattern
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500">
                          Mỗi pattern có cấu trúc ngữ pháp và nghĩa tiếng Việt tương ứng.
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleAddPattern(form.id)}
                      className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-crimson-primary text-xs font-bold text-slate-700 hover:text-crimson-primary shadow-2xs transition-all flex items-center gap-1 active:scale-[0.98]"
                    >
                      <span className="material-symbols-outlined text-[16px]">add</span>
                      <span>Thêm Pattern</span>
                    </button>
                  </div>

                  {/* List of Patterns */}
                  <div className="flex flex-col gap-3 pt-1">
                    {form.patterns.map((pat, pIdx) => (
                      <div
                        key={pat.id}
                        className="p-3.5 sm:p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs flex flex-col gap-3 hover:border-slate-300 transition-all"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-bold font-mono border border-slate-200/70">
                              Pattern #{pIdx + 1}
                            </span>
                            {pat.pattern && (
                              <span className="text-xs font-mono font-semibold text-crimson-primary">
                                {pat.pattern}
                              </span>
                            )}
                            {pat.meaning && (
                              <span className="text-xs text-slate-500 font-medium truncate max-w-[340px]">
                                — {pat.meaning}
                              </span>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeletePattern(form.id, pat.id)}
                            className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 p-1 rounded-lg transition-colors flex items-center gap-1 text-[11px] font-medium"
                            title="Xóa pattern này"
                          >
                            <span className="material-symbols-outlined text-[15px]">delete</span>
                            <span className="hidden sm:inline">Xóa</span>
                          </button>
                        </div>

                        {/* Row 1: Pattern Structure (40%) & Meaning (60%) */}
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                          <div className="md:col-span-2 flex flex-col gap-1">
                            <label className="text-[11px] font-bold text-text-high-contrast flex items-center justify-between">
                              <span>Mẫu Pattern cấu trúc <span className="text-crimson-primary">*</span></span>
                              <span className="text-[10px] text-slate-400 font-normal">Công thức</span>
                            </label>
                            <div className="relative">
                              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[15px]">
                                account_tree
                              </span>
                              <input
                                type="text"
                                value={pat.pattern}
                                onChange={(e) =>
                                  handleUpdatePattern(form.id, pat.id, 'pattern', e.target.value)
                                }
                                placeholder="e.g. + sth from sb, + to V..."
                                className="w-full h-9 pl-9 pr-3 bg-slate-50/70 hover:bg-white focus:bg-white rounded-lg text-xs font-mono font-semibold text-crimson-primary border border-slate-200 focus:border-crimson-primary focus:ring-2 focus:ring-crimson-primary/10 transition-all outline-none"
                              />
                            </div>
                          </div>

                          <div className="md:col-span-3 flex flex-col gap-1">
                            <label className="text-[11px] font-bold text-text-high-contrast flex items-center gap-1">
                              <span>Nghĩa của Pattern này</span>
                              <span className="text-crimson-primary font-bold">*</span>
                            </label>
                            <div className="relative">
                              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[15px]">
                                translate
                              </span>
                              <input
                                type="text"
                                value={pat.meaning}
                                onChange={(e) =>
                                  handleUpdatePattern(form.id, pat.id, 'meaning', e.target.value)
                                }
                                placeholder="e.g. thuê, mướn (tài sản) dài hạn từ ai đó"
                                className="w-full h-9 pl-9 pr-3 bg-slate-50/70 hover:bg-white focus:bg-white rounded-lg text-xs font-semibold text-text-high-contrast border border-slate-200 focus:border-crimson-primary focus:ring-2 focus:ring-crimson-primary/10 transition-all outline-none"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Row 2: Note (40%) & Example Sentence (60%) */}
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                          <div className="md:col-span-2 flex flex-col gap-1">
                            <label className="text-[11px] font-medium text-slate-500">
                              Ghi chú ngữ cảnh
                            </label>
                            <input
                              type="text"
                              value={pat.note}
                              onChange={(e) =>
                                handleUpdatePattern(form.id, pat.id, 'note', e.target.value)
                              }
                              placeholder="e.g. Có hợp đồng pháp lý rõ ràng."
                              className="w-full h-8 px-3 bg-slate-50/50 hover:bg-white focus:bg-white rounded-lg text-xs text-text-body border border-slate-200 focus:border-crimson-primary focus:ring-2 focus:ring-crimson-primary/10 transition-all outline-none"
                            />
                          </div>

                          <div className="md:col-span-3 flex flex-col gap-1">
                            <label className="text-[11px] font-medium text-slate-500">
                              Ví dụ thực tế cho pattern này
                            </label>
                            <input
                              type="text"
                              value={pat.example}
                              onChange={(e) =>
                                handleUpdatePattern(form.id, pat.id, 'example', e.target.value)
                              }
                              placeholder="e.g. We decided to lease the office space from a commercial developer."
                              className="w-full h-8 px-3 bg-slate-50/50 hover:bg-white focus:bg-white rounded-lg text-xs text-text-body border border-slate-200 focus:border-crimson-primary focus:ring-2 focus:ring-crimson-primary/10 transition-all outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    ))}

                    {form.patterns.length === 0 && (
                      <div className="py-4 px-3 rounded-lg border border-dashed border-slate-200 bg-white/60 text-center flex items-center justify-center gap-2 text-xs text-slate-400">
                        <span>Chưa có mẫu pattern nào cho từ loại này.</span>
                        <button
                          type="button"
                          onClick={() => handleAddPattern(form.id)}
                          className="text-crimson-primary font-bold hover:underline"
                        >
                          + Thêm pattern đầu tiên
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* --- KHỐI 2: DANH SÁCH COLLOCATIONS (Mỗi collocation kèm 1 nghĩa) --- */}
                <div className="flex flex-col gap-3 p-4 rounded-xl bg-indigo-50/30 border border-indigo-100/90">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-indigo-100/70 text-collocation-indigo flex items-center justify-center border border-indigo-200/50 shadow-2xs">
                        <span className="material-symbols-outlined text-[16px]">link</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-text-high-contrast">
                            2. Collocations chuẩn (Cụm từ cố định)
                          </span>
                          <span className="px-2 py-0.2 rounded-full bg-white text-collocation-indigo text-[10px] font-bold border border-indigo-200">
                            {form.collocations.length} collocation
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500">
                          Mỗi collocation là cụm từ đi kèm và có nghĩa tiếng Việt riêng biệt.
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleAddCollocation(form.id)}
                      className="px-3 py-1.5 rounded-lg bg-white border border-indigo-200 hover:border-collocation-indigo text-xs font-bold text-collocation-indigo shadow-2xs transition-all flex items-center gap-1 active:scale-[0.98]"
                    >
                      <span className="material-symbols-outlined text-[16px]">add</span>
                      <span>Thêm Collocation</span>
                    </button>
                  </div>

                  {/* List of Collocations */}
                  <div className="flex flex-col gap-3 pt-1">
                    {form.collocations.map((col, cIdx) => (
                      <div
                        key={col.id}
                        className="p-3.5 sm:p-4 rounded-xl bg-white border border-indigo-100 shadow-2xs flex flex-col gap-3 hover:border-indigo-200 transition-all"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-0.5 rounded-md bg-indigo-50 text-collocation-indigo text-[11px] font-bold border border-indigo-200/70">
                              Collocation #{cIdx + 1}
                            </span>
                            {col.collocation && (
                              <span className="text-xs font-semibold text-collocation-indigo">
                                {col.collocation}
                              </span>
                            )}
                            {col.meaning && (
                              <span className="text-xs text-slate-500 font-medium truncate max-w-[340px]">
                                — {col.meaning}
                              </span>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeleteCollocation(form.id, col.id)}
                            className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 p-1 rounded-lg transition-colors flex items-center gap-1 text-[11px] font-medium"
                            title="Xóa collocation này"
                          >
                            <span className="material-symbols-outlined text-[15px]">delete</span>
                            <span className="hidden sm:inline">Xóa</span>
                          </button>
                        </div>

                        {/* Row 1: Collocation Text (40%) & Meaning (60%) */}
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                          <div className="md:col-span-2 flex flex-col gap-1">
                            <label className="text-[11px] font-bold text-text-high-contrast flex items-center justify-between">
                              <span>Cụm Collocation <span className="text-crimson-primary">*</span></span>
                              <span className="text-[10px] text-slate-400 font-normal">Cụm từ</span>
                            </label>
                            <div className="relative">
                              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[15px]">
                                link
                              </span>
                              <input
                                type="text"
                                value={col.collocation}
                                onChange={(e) =>
                                  handleUpdateCollocation(form.id, col.id, 'collocation', e.target.value)
                                }
                                placeholder="e.g. lease agreement, sign a lease..."
                                className="w-full h-9 pl-9 pr-3 bg-slate-50/70 hover:bg-white focus:bg-white rounded-lg text-xs font-semibold text-collocation-indigo border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all outline-none"
                              />
                            </div>
                          </div>

                          <div className="md:col-span-3 flex flex-col gap-1">
                            <label className="text-[11px] font-bold text-text-high-contrast flex items-center gap-1">
                              <span>Nghĩa của Collocation này</span>
                              <span className="text-crimson-primary font-bold">*</span>
                            </label>
                            <div className="relative">
                              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[15px]">
                                translate
                              </span>
                              <input
                                type="text"
                                value={col.meaning}
                                onChange={(e) =>
                                  handleUpdateCollocation(form.id, col.id, 'meaning', e.target.value)
                                }
                                placeholder="e.g. hợp đồng thuê mướn tài sản (có cam kết)"
                                className="w-full h-9 pl-9 pr-3 bg-slate-50/70 hover:bg-white focus:bg-white rounded-lg text-xs font-semibold text-text-high-contrast border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all outline-none"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Row 2: Note (40%) & Example Sentence (60%) */}
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                          <div className="md:col-span-2 flex flex-col gap-1">
                            <label className="text-[11px] font-medium text-slate-500">
                              Ghi chú ngữ cảnh
                            </label>
                            <input
                              type="text"
                              value={col.note}
                              onChange={(e) =>
                                handleUpdateCollocation(form.id, col.id, 'note', e.target.value)
                              }
                              placeholder="e.g. Thường đi với động từ sign, terminate, renew."
                              className="w-full h-8 px-3 bg-slate-50/50 hover:bg-white focus:bg-white rounded-lg text-xs text-text-body border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all outline-none"
                            />
                          </div>

                          <div className="md:col-span-3 flex flex-col gap-1">
                            <label className="text-[11px] font-medium text-slate-500">
                              Ví dụ thực tế cho collocation này
                            </label>
                            <input
                              type="text"
                              value={col.example}
                              onChange={(e) =>
                                handleUpdateCollocation(form.id, col.id, 'example', e.target.value)
                              }
                              placeholder="e.g. Both parties signed a five-year commercial lease agreement."
                              className="w-full h-8 px-3 bg-slate-50/50 hover:bg-white focus:bg-white rounded-lg text-xs text-text-body border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    ))}

                    {form.collocations.length === 0 && (
                      <div className="py-4 px-3 rounded-lg border border-dashed border-indigo-200 bg-white/60 text-center flex items-center justify-center gap-2 text-xs text-slate-400">
                        <span>Chưa có collocation nào cho từ loại này.</span>
                        <button
                          type="button"
                          onClick={() => handleAddCollocation(form.id)}
                          className="text-collocation-indigo font-bold hover:underline"
                        >
                          + Thêm collocation đầu tiên
                        </button>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            );
          })()}
        </div>

        </div>

        {/* Modal Footer */}
        <div className="px-6 sm:px-8 py-4 border-t border-slate-100 bg-white flex flex-wrap items-center justify-between gap-4 shrink-0">
          
          {/* Duplicate check live status */}
          <div className="flex items-center gap-2 text-xs">
            {duplicateMatch ? (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 font-semibold animate-in fade-in">
                <span className="material-symbols-outlined text-[16px] text-amber-600">warning</span>
                <span>Từ &quot;{duplicateMatch.word}&quot; đã tồn tại (Lưu sẽ cập nhật thêm nghĩa)</span>
              </div>
            ) : word.trim() ? (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 font-semibold animate-in fade-in">
                <span className="material-symbols-outlined text-[16px] text-emerald-600">check_circle</span>
                <span>Từ hợp lệ — Chưa có trong kho dữ liệu</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-1.5 text-slate-400">
                <span className="material-symbols-outlined text-[16px]">verified_user</span>
                <span>Tự động kiểm tra trùng lặp từ vựng khi nhập</span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <span className="hidden md:inline-flex text-[11px] text-slate-400 font-medium">
              Nhấn <kbd className="px-1.5 py-0.5 bg-slate-100 rounded border border-slate-200 text-slate-500 font-semibold">⌘ + Enter</kbd> để lưu
            </span>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 hover:border-slate-300 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-50 transition-colors"
            >
              Hủy
            </button>

            <button
              type="button"
              onClick={handleSubmit}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-crimson-dark to-crimson-primary hover:brightness-105 active:scale-[0.98] text-white text-xs font-bold shadow-md shadow-crimson-primary/20 transition-all flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[18px]">check</span>
              <span>Lưu Từ Vựng</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
