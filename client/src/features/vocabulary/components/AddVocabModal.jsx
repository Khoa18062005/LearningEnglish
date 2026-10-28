import React, { useState, useEffect, useMemo, useRef } from 'react';

const POS_OPTIONS = [
  {
    id: 'v',
    label: 'Verb (Động từ)',
    shortLabel: 'Verb',
    desc: 'Pattern & Collocation',
    colorActive: 'bg-white text-crimson-primary shadow-xs ring-2 ring-crimson-primary/25 border-crimson-primary/50 font-bold',
    colorInactive: 'bg-slate-50/70 hover:bg-white text-crimson-primary border-slate-200/90 hover:border-red-200 font-semibold',
    badgeColor: 'bg-pos-verb-bg text-pos-verb-text border-red-200',
    dotColor: 'bg-crimson-primary',
  },
  {
    id: 'n',
    label: 'Noun (Danh từ)',
    shortLabel: 'Noun',
    desc: 'Tính đếm & Collocation',
    colorActive: 'bg-white text-blue-600 shadow-xs ring-2 ring-blue-500/25 border-blue-400 font-bold',
    colorInactive: 'bg-slate-50/70 hover:bg-white text-blue-600 border-slate-200/90 hover:border-blue-200 font-semibold',
    badgeColor: 'bg-pos-noun-bg text-pos-noun-text border-blue-200',
    dotColor: 'bg-blue-600',
  },
  {
    id: 'adj',
    label: 'Adj (Tính từ)',
    shortLabel: 'Adjective',
    desc: 'Pattern & Collocation',
    colorActive: 'bg-white text-emerald-600 shadow-xs ring-2 ring-emerald-500/25 border-emerald-400 font-bold',
    colorInactive: 'bg-slate-50/70 hover:bg-white text-emerald-600 border-slate-200/90 hover:border-emerald-200 font-semibold',
    badgeColor: 'bg-pos-adj-bg text-pos-adj-text border-emerald-200',
    dotColor: 'bg-emerald-600',
  },
  {
    id: 'adv',
    label: 'Adv (Trạng từ)',
    shortLabel: 'Adverb',
    desc: 'Pattern & Collocation',
    colorActive: 'bg-white text-purple-600 shadow-xs ring-2 ring-purple-500/25 border-purple-400 font-bold',
    colorInactive: 'bg-slate-50/70 hover:bg-white text-purple-600 border-slate-200/90 hover:border-purple-200 font-semibold',
    badgeColor: 'bg-pos-adv-bg text-pos-adv-text border-purple-200',
    dotColor: 'bg-purple-600',
  },
  {
    id: 'idiom',
    label: 'Idioms (Thành ngữ / Cụm từ)',
    shortLabel: 'Idioms',
    desc: 'Không cần pattern/collocation',
    colorActive: 'bg-white text-amber-700 shadow-xs ring-2 ring-amber-500/25 border-amber-400 font-bold',
    colorInactive: 'bg-slate-50/70 hover:bg-white text-amber-700 border-slate-200/90 hover:border-amber-200 font-semibold',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
    dotColor: 'bg-amber-600',
  },
];

export default function AddVocabModal({
  isOpen,
  initialVocab = null,
  onClose,
  onSave,
  readingLists = [],
  categories = [],
  vocabList = [],
  onOpenAddReadingListModal,
}) {
  // SECTION 1: Core Word & Metadata
  const [word, setWord] = useState('');
  const [meaning, setMeaning] = useState('');
  const [phonetic, setPhonetic] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const [isFetchingDict, setIsFetchingDict] = useState(false);

  // Auto-fetch phonetic IPA and human audio MP3 from Free Dictionary API
  const fetchDictionaryData = async (wordToSearch) => {
    const query = (wordToSearch || word).trim();
    if (!query) return;

    setIsFetchingDict(true);
    try {
      const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(query)}`);
      if (!res.ok) {
        setIsFetchingDict(false);
        return;
      }
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const entry = data[0];
        // 1. Extract standard IPA phonetic
        let foundPhonetic = entry.phonetic || '';
        if (!foundPhonetic && entry.phonetics && entry.phonetics.length > 0) {
          const withText = entry.phonetics.find((p) => p.text && p.text.trim());
          if (withText) foundPhonetic = withText.text;
        }
        if (foundPhonetic) {
          setPhonetic(foundPhonetic.trim());
        }

        // 2. Extract human audio MP3
        let foundAudio = '';
        if (entry.phonetics && entry.phonetics.length > 0) {
          const preferred = entry.phonetics.find(
            (p) => p.audio && (p.audio.includes('-us.mp3') || p.audio.includes('-uk.mp3'))
          );
          if (preferred) {
            foundAudio = preferred.audio;
          } else {
            const anyAudio = entry.phonetics.find((p) => p.audio && p.audio.trim().endsWith('.mp3'));
            if (anyAudio) foundAudio = anyAudio.audio;
          }
        }
        if (foundAudio) {
          setAudioUrl(foundAudio.trim());
        }
      }
    } catch (err) {
      console.warn('Free Dictionary API lookup failed:', err);
    } finally {
      setIsFetchingDict(false);
    }
  };
  const [pos, setPos] = useState('v');
  const [countability, setCountability] = useState('[C]');
  const [wordFamilyInput, setWordFamilyInput] = useState('');
  const [wordFamily, setWordFamily] = useState([]);
  const [selectedReadingList, setSelectedReadingList] = useState('');
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [isReadingListDropdownOpen, setIsReadingListDropdownOpen] = useState(false);
  const categoryDropdownRef = useRef(null);
  const readingListDropdownRef = useRef(null);

  // SECTION 2: Patterns & Collocations data
  const [synonyms, setSynonyms] = useState('');
  const [patterns, setPatterns] = useState([
    {
      id: 101,
      pattern: '',
      meaning: '',
      example: '',
      note: '',
    },
  ]);
  const [collocations, setCollocations] = useState([
    {
      id: 201,
      collocation: '',
      meaning: '',
      example: '',
      note: '',
    },
  ]);

  // Populate form if editing, or reset if creating new
  useEffect(() => {
    if (!isOpen) return;

    if (initialVocab) {
      setWord(initialVocab.word || '');
      setMeaning(initialVocab.meaning || initialVocab.forms?.[0]?.meaning || '');
      setPos(initialVocab.pos || initialVocab.forms?.[0]?.pos || 'v');
      setCountability(initialVocab.countability || initialVocab.forms?.[0]?.countability || '[C]');
      setPhonetic(initialVocab.phonetic || '');
      setAudioUrl(initialVocab.audioUrl || '');
      setWordFamily(initialVocab.wordFamily || []);
      setSelectedReadingList(initialVocab.readingListId || '');
      setSelectedCategories(initialVocab.categories || []);

      const foundSynonym = initialVocab.forms?.find((f) => f.synonym)?.synonym || '';
      setSynonyms(foundSynonym);

      const rawPatterns = (initialVocab.forms || []).filter(
        (f) => Boolean(f.pattern && f.pattern.trim())
      );
      if (rawPatterns.length > 0) {
        setPatterns(
          rawPatterns.map((p, idx) => ({
            id: Date.now() + idx,
            pattern: p.pattern || '',
            meaning: p.meaning || '',
            example: p.example || '',
            note: p.note || '',
          }))
        );
      } else {
        setPatterns([
          {
            id: 101,
            pattern: '',
            meaning: '',
            example: '',
            note: '',
          },
        ]);
      }

      const rawCollocations = (initialVocab.forms || []).filter(
        (f) => Boolean(f.collocation && f.collocation.trim())
      );
      if (rawCollocations.length > 0) {
        setCollocations(
          rawCollocations.map((c, idx) => ({
            id: Date.now() + 100 + idx,
            collocation: c.collocation || '',
            meaning: c.meaning || '',
            example: c.example || '',
            note: c.note || '',
          }))
        );
      } else {
        setCollocations([
          {
            id: 201,
            collocation: '',
            meaning: '',
            example: '',
            note: '',
          },
        ]);
      }
    } else {
      // Reset for creating new word
      setWord('');
      setMeaning('');
      setPhonetic('');
      setAudioUrl('');
      setPos('v');
      setCountability('[C]');
      setWordFamily([]);
      setWordFamilyInput('');
      setSelectedCategories([]);
      setSynonyms('');
      setPatterns([
        {
          id: 101,
          pattern: '',
          meaning: '',
          example: '',
          note: '',
        },
      ]);
      setCollocations([
        {
          id: 201,
          collocation: '',
          meaning: '',
          example: '',
          note: '',
        },
      ]);
      if (readingLists.length > 0) {
        setSelectedReadingList(readingLists[0].id);
      }
    }
  }, [isOpen, initialVocab, readingLists]);

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
  }, [
    isOpen,
    isCategoryDropdownOpen,
    isReadingListDropdownOpen,
    word,
    meaning,
    pos,
    countability,
    synonyms,
    patterns,
    collocations,
    selectedReadingList,
    selectedCategories,
    wordFamily,
  ]);

  if (!isOpen) return null;

  // Handle POS switch in Section 1
  const handleSelectPos = (newPos) => {
    setPos(newPos);
    if (newPos === 'n' && !countability) {
      setCountability('[C]');
    }
  };

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

  // --- PATTERNS HANDLERS ---
  const handleAddPattern = () => {
    setPatterns([
      ...patterns,
      {
        id: Date.now(),
        pattern: '',
        meaning: '',
        example: '',
        note: '',
      },
    ]);
  };

  const handleUpdatePattern = (patId, field, val) => {
    setPatterns(
      patterns.map((p) => (p.id === patId ? { ...p, [field]: val } : p))
    );
  };

  const handleDeletePattern = (patId) => {
    setPatterns(patterns.filter((p) => p.id !== patId));
  };

  // --- COLLOCATIONS HANDLERS ---
  const handleAddCollocation = () => {
    setCollocations([
      ...collocations,
      {
        id: Date.now(),
        collocation: '',
        meaning: '',
        example: '',
        note: '',
      },
    ]);
  };

  const handleUpdateCollocation = (colId, field, val) => {
    setCollocations(
      collocations.map((c) => (c.id === colId ? { ...c, [field]: val } : c))
    );
  };

  const handleDeleteCollocation = (colId) => {
    setCollocations(collocations.filter((c) => c.id !== colId));
  };

  // Form submission
  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (!word.trim()) {
      alert('Vui lòng nhập Từ vựng tiếng Anh / Cụm từ!');
      return;
    }
    if (!meaning.trim()) {
      alert('Vui lòng nhập Nghĩa của từ (nét nghĩa chung) ở Mục 1!');
      return;
    }

    const currentOption = POS_OPTIONS.find((p) => p.id === pos);
    const posLabel = currentOption ? currentOption.shortLabel : 'Verb';
    const compiledForms = [];

    // 1. Idioms: no patterns, no collocations
    if (pos === 'idiom') {
      compiledForms.push({
        type: 'idiom',
        pos: 'idiom',
        posLabel: 'Idioms',
        countability: null,
        pattern: '',
        collocation: '',
        synonym: synonyms?.trim() || '',
        meaning: meaning.trim(),
        example: '',
        note: '',
      });
    } else if (pos === 'n') {
      // 2. Noun: Countability + Collocations only
      collocations.forEach((c) => {
        if (c.meaning.trim() || c.collocation.trim()) {
          compiledForms.push({
            type: 'collocation',
            pos: 'n',
            posLabel: 'Noun',
            countability: countability || '[C]',
            pattern: '',
            collocation: c.collocation.trim(),
            synonym: synonyms?.trim() || '',
            meaning: c.meaning.trim() || meaning.trim(),
            example: c.example.trim(),
            note: c.note.trim(),
          });
        }
      });

      // Fallback base form if user didn't enter specific collocations
      if (compiledForms.length === 0) {
        compiledForms.push({
          type: 'base',
          pos: 'n',
          posLabel: 'Noun',
          countability: countability || '[C]',
          pattern: '',
          collocation: '',
          synonym: synonyms?.trim() || '',
          meaning: meaning.trim(),
          example: '',
          note: '',
        });
      }
    } else {
      // 3. Verb, Adjective, Adverb: Patterns + Collocations
      patterns.forEach((p) => {
        if (p.meaning.trim() || p.pattern.trim()) {
          compiledForms.push({
            type: 'pattern',
            pos: pos,
            posLabel: posLabel,
            countability: null,
            pattern: p.pattern.trim(),
            collocation: '',
            synonym: synonyms?.trim() || '',
            meaning: p.meaning.trim() || meaning.trim(),
            example: p.example.trim(),
            note: p.note.trim(),
          });
        }
      });

      collocations.forEach((c) => {
        if (c.meaning.trim() || c.collocation.trim()) {
          compiledForms.push({
            type: 'collocation',
            pos: pos,
            posLabel: posLabel,
            countability: null,
            pattern: '',
            collocation: c.collocation.trim(),
            synonym: synonyms?.trim() || '',
            meaning: c.meaning.trim() || meaning.trim(),
            example: c.example.trim(),
            note: c.note.trim(),
          });
        }
      });

      // Fallback base form if neither pattern nor collocation is filled
      if (compiledForms.length === 0) {
        compiledForms.push({
          type: 'base',
          pos: pos,
          posLabel: posLabel,
          countability: null,
          pattern: '',
          collocation: '',
          synonym: synonyms?.trim() || '',
          meaning: meaning.trim(),
          example: '',
          note: '',
        });
      }
    }

    const matchedList = readingLists.find((r) => r.id === selectedReadingList);

    const newVocab = {
      id: initialVocab?.id || Date.now(),
      word: word.trim(),
      meaning: meaning.trim(),
      phonetic: phonetic.trim() || `/${word.trim()}/`,
      audioUrl: audioUrl.trim(),
      pos: pos,
      posLabel: posLabel,
      countability: pos === 'n' ? countability : null,
      wordFamily:
        wordFamily.length > 0
          ? wordFamily
          : pos !== 'idiom'
          ? [`${word.trim()} (${pos})`]
          : [word.trim()],
      readingListId: selectedReadingList,
      readingListName: matchedList
        ? matchedList.code || matchedList.shortTitle || matchedList.title
        : 'Chung',
      categories:
        selectedCategories.length > 0 ? selectedCategories : ['IELTS Acad'],
      forms: compiledForms,
    };

    onSave(newVocab, initialVocab?.id);

    // Reset form to fresh state
    setWord('');
    setMeaning('');
    setPos('v');
    setCountability('[C]');
    setWordFamily([]);
    setWordFamilyInput('');
    setSelectedCategories([]);
    setSynonyms('');
    setPatterns([
      {
        id: Date.now() + 1,
        pattern: '',
        meaning: '',
        example: '',
        note: '',
      },
    ]);
    setCollocations([
      {
        id: Date.now() + 2,
        collocation: '',
        meaning: '',
        example: '',
        note: '',
      },
    ]);
    onClose();
  };

  // Helper info for current POS
  const currentPosConfig = POS_OPTIONS.find((p) => p.id === pos) || POS_OPTIONS[0];

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
                  {initialVocab ? `Chỉnh Sửa Từ Vựng: ${initialVocab.word}` : 'Thêm Từ Vựng Mới'}
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
          
          {/* ========================================================= */}
          {/* SECTION 1: CORE WORD, PART OF SPEECH, MEANING & METADATA */}
          {/* ========================================================= */}
          <div className="flex flex-col gap-4">
            
            {/* Section 1 Header (Đồng bộ cấu trúc như Mục 2) */}
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-lg bg-surface-crimson-subtle text-crimson-primary text-xs font-bold flex items-center justify-center border border-border-crimson-tint/50">
                  1
                </span>
                <div>
                  <h3 className="font-headline font-bold text-sm text-text-high-contrast leading-tight">
                    Thông tin từ gốc &amp; Danh mục phân loại
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Cấu hình từ vựng tiếng Anh, từ loại, nét nghĩa chung và gán vào bài đọc tương ứng.
                  </p>
                </div>
              </div>
            </div>

            {/* Section 1 Card */}
            <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/90 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col gap-5">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-5">
              
              {/* Field 1: PART OF SPEECH SELECTION */}
              <div className="md:col-span-12 flex flex-col gap-1.5">
                <label className="text-xs font-bold text-text-high-contrast block">
                  Từ loại (Part of Speech) <span className="text-crimson-primary">*</span>
                </label>

                {/* 5 POS Options Pills */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 pt-0.5">
                  {POS_OPTIONS.map((opt) => {
                    const isActive = pos === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => handleSelectPos(opt.id)}
                        className={`px-3 py-2.5 rounded-xl text-xs flex flex-col items-center justify-center text-center gap-1 border transition-all cursor-pointer ${
                          isActive
                            ? `${opt.colorActive} scale-[1.02]`
                            : opt.colorInactive
                        }`}
                      >
                        <span className="font-bold tracking-tight text-xs">{opt.shortLabel}</span>
                        <span className="text-[10px] text-slate-400 truncate max-w-full font-normal">
                          {opt.label.split('(')[1]?.replace(')', '') || opt.shortLabel}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Field 2: Word or Phrase */}
              <div className="md:col-span-6 flex flex-col gap-1.5">
                <label className="h-5 text-xs font-bold text-text-high-contrast flex items-center justify-between">
                  <span>
                    Từ vựng / Cụm từ tiếng Anh <span className="text-crimson-primary">*</span>
                  </span>
                  <span className="text-[11px] font-normal text-text-muted">
                    {pos === 'idiom' ? 'e.g. on cloud nine, a hot potato' : 'e.g. lease, fluctuate, accountant'}
                  </span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={word}
                    onChange={(e) => setWord(e.target.value)}
                    onBlur={() => {
                      if (word.trim() && !phonetic) {
                        fetchDictionaryData(word);
                      }
                    }}
                    placeholder={pos === 'idiom' ? 'Nhập thành ngữ hoặc cụm từ...' : 'Nhập từ vựng tiếng Anh...'}
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
                      onClick={() => {
                        setWord('');
                        setPhonetic('');
                        setAudioUrl('');
                      }}
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

              {/* Field 3: Phonetic IPA & Native Audio */}
              <div className="md:col-span-6 flex flex-col gap-1.5">
                <label className="h-5 text-xs font-bold text-text-high-contrast flex items-center justify-between">
                  <span>Phiên âm IPA &amp; Audio</span>
                  <span className="text-[11px] font-normal text-text-muted">
                    {audioUrl ? 'Đã có audio bản xứ' : 'Tự động hoặc sửa trực tiếp'}
                  </span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={phonetic}
                    onChange={(e) => setPhonetic(e.target.value)}
                    placeholder="e.g. /liːs/ hoặc gõ sửa trực tiếp..."
                    className="w-full h-11 pl-3.5 pr-32 bg-slate-50/70 hover:bg-white focus:bg-white rounded-xl text-xs font-mono font-bold text-crimson-primary border border-slate-200 focus:border-crimson-primary focus:ring-4 focus:ring-crimson-primary/10 transition-all outline-none"
                  />
                  {audioUrl ? (
                    <button
                      type="button"
                      onClick={() => {
                        try {
                          new Audio(audioUrl).play();
                        } catch (e) {
                          console.error(e);
                        }
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-[11px] font-bold transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                      title="Nghe thử phát âm chuẩn người thật (.mp3)"
                    >
                      <span className="material-symbols-outlined text-[14px]">volume_up</span>
                      <span>Nghe thử bản xứ</span>
                    </button>
                  ) : (
                    word.trim() && (
                      <button
                        type="button"
                        onClick={() => {
                          if ('speechSynthesis' in window) {
                            const u = new SpeechSynthesisUtterance(word.trim());
                            u.lang = 'en-US';
                            window.speechSynthesis.speak(u);
                          }
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 px-2.5 py-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200 text-[11px] font-medium transition-colors cursor-pointer flex items-center gap-1"
                        title="Phát âm qua giọng đọc máy (TTS)"
                      >
                        <span className="material-symbols-outlined text-[14px]">volume_up</span>
                        <span>Phát âm (TTS)</span>
                      </button>
                    )
                  )}
                </div>
              </div>


              {/* Field 4: CORE / GENERAL MEANING OF THE WORD */}
              <div className="md:col-span-12 flex flex-col gap-1.5">
                <label className="text-xs font-bold text-text-high-contrast flex items-center justify-between">
                  <span>
                    Nghĩa của từ (Nét nghĩa chung) <span className="text-crimson-primary">*</span>
                  </span>
                  <span className="text-[11px] font-normal text-text-muted">
                    Nét nghĩa tiếng Việt cơ bản của từ vựng / cụm từ này
                  </span>
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
                    translate
                  </span>
                  <input
                    type="text"
                    value={meaning}
                    onChange={(e) => setMeaning(e.target.value)}
                    placeholder={
                      pos === 'v'
                        ? 'e.g. thuê, mướn tài sản (ngắn hạn hoặc dài hạn)'
                        : pos === 'n'
                        ? 'e.g. nhân viên kế toán, kiểm toán / hợp đồng thuê mướn'
                        : pos === 'adj'
                        ? 'e.g. có thể chịu trách nhiệm, đáng tin cậy'
                        : pos === 'adv'
                        ? 'e.g. một cách đáng kể, rõ rệt'
                        : 'e.g. cực kỳ vui sướng, hạnh phúc ngập tràn'
                    }
                    className="w-full h-11 pl-10 pr-3.5 bg-slate-50/70 hover:bg-white focus:bg-white rounded-xl text-xs font-semibold text-text-high-contrast border border-slate-200 focus:border-crimson-primary focus:ring-4 focus:ring-crimson-primary/10 transition-all outline-none"
                    required
                  />
                  {meaning && (
                    <button
                      type="button"
                      onClick={() => setMeaning('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                    >
                      <span className="material-symbols-outlined text-[16px]">cancel</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Field 5: Word Family Tags */}
              <div className="md:col-span-4 flex flex-col gap-1.5">
                <label className="text-xs font-bold text-text-high-contrast flex items-center justify-between">
                  <span>Gia đình từ (Word Family)</span>
                  <span className="text-[11px] font-normal text-text-muted">Nhấn Enter</span>
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
                    placeholder="+ Thêm từ (e.g. lessor)..."
                    className="flex-1 min-w-[120px] bg-transparent text-xs px-2 py-1 outline-none text-text-high-contrast placeholder:text-slate-400"
                  />
                </div>
              </div>

              {/* Field 6: Reading Note List Dropdown (Nằm giữa Word Family và Categories) */}
              <div className="md:col-span-4 flex flex-col gap-1.5 relative" ref={readingListDropdownRef}>
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
                  className={`w-full min-h-[46px] px-3.5 py-1.5 bg-slate-50/70 hover:bg-white focus:bg-white rounded-xl text-xs font-medium text-text-body border transition-all outline-none flex items-center justify-between gap-2 text-left cursor-pointer ${
                    isReadingListDropdownOpen
                      ? 'border-crimson-primary ring-4 ring-crimson-primary/10 bg-white'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-1.5 overflow-hidden flex-1">
                    {(() => {
                      const matched = readingLists.find((r) => r.id === selectedReadingList);
                      if (!matched) {
                        return <span className="text-slate-400 text-xs truncate">-- Chọn list bài đọc --</span>;
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

              {/* Field 7: Categories Dropdown */}
              <div className="md:col-span-4 flex flex-col gap-1.5 relative" ref={categoryDropdownRef}>
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
                  className={`w-full min-h-[46px] px-3.5 py-1.5 bg-slate-50/70 hover:bg-white focus:bg-white rounded-xl text-xs font-medium text-text-body border transition-all outline-none flex items-center justify-between gap-2 text-left cursor-pointer ${
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
        </div>

          {/* ========================================================= */}
          {/* SECTION 2: DYNAMICALLY CONFIGURED BASED ON SECTION 1 POS  */}
          {/* ========================================================= */}
          <div className="flex flex-col gap-4">
            
            {/* Section 2 Header */}
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-lg bg-surface-crimson-subtle text-crimson-primary text-xs font-bold flex items-center justify-center border border-border-crimson-tint/50">
                  2
                </span>
                <div>
                  <h3 className="font-headline font-bold text-sm text-text-high-contrast leading-tight">
                    {pos === 'v' && 'Cấu trúc Động từ: Pattern & Collocations'}
                    {pos === 'n' && 'Cấu trúc Danh từ: Tính đếm & Collocations'}
                    {pos === 'adj' && 'Cấu trúc Tính từ: Pattern & Collocations'}
                    {pos === 'adv' && 'Cấu trúc Trạng từ: Pattern & Collocations'}
                    {pos === 'idiom' && 'Cấu trúc Idioms (Thành ngữ / Cụm từ)'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {pos === 'v' && 'Động từ xuất hiện mục Pattern cấu trúc ngữ pháp và Collocations cố định.'}
                    {pos === 'n' && 'Danh từ xuất hiện mục Tính đếm (Countability) và Collocations.'}
                    {pos === 'adj' && 'Tính từ xuất hiện mục Pattern cấu trúc và Collocations.'}
                    {pos === 'adv' && 'Trạng từ xuất hiện mục Pattern cấu trúc và Collocations.'}
                    {pos === 'idiom' && 'Thành ngữ / Cụm từ không cần cấu trúc thêm Pattern hay Collocation.'}
                  </p>
                </div>
              </div>

              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${currentPosConfig.badgeColor}`}>
                {currentPosConfig.shortLabel}
              </span>
            </div>

            {/* CASE 1: IDIOMS (Không có gì cả) */}
            {pos === 'idiom' && (
              <div className="p-6 rounded-2xl bg-amber-50/70 border border-amber-200/90 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex items-start gap-4 animate-in fade-in duration-150">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 border border-amber-300/60 shadow-2xs">
                  <span className="material-symbols-outlined text-[26px]">auto_stories</span>
                </div>
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-amber-950">
                      Chế độ Idioms (Thành ngữ / Cụm từ hay)
                    </h4>
                    <span className="px-2 py-0.2 rounded-full bg-amber-200/80 text-amber-900 text-[10px] font-extrabold uppercase">
                      Lưu trực tiếp
                    </span>
                  </div>
                  <p className="text-xs text-amber-900/80 leading-relaxed">
                    Theo cấu hình của bạn, đối với <strong>Idioms (Thành ngữ / Cụm từ)</strong> sẽ <strong>không có mục Pattern hay Collocation</strong>.
                    Toàn bộ cụm từ và nét nghĩa chung đã được lưu trữ hoàn chỉnh tại <strong>Mục 1</strong>. Bạn có thể nhấn <strong>&quot;Lưu Từ Vựng&quot;</strong> ngay bây giờ!
                  </p>
                </div>
              </div>
            )}

            {/* CASES 2, 3, 4, 5: V, N, ADJ, ADV */}
            {pos !== 'idiom' && (
              <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/90 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col gap-5">
                
                {/* --- COUNTABILITY BLOCK (Chỉ hiển thị cho NOUN) --- */}
                {pos === 'n' && (
                  <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-150">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-blue-600 text-[18px]">data_array</span>
                      <div>
                        <span className="text-xs font-bold text-text-high-contrast">
                          Tính đếm của Danh từ (Countability):
                        </span>
                        <p className="text-[11px] text-slate-500">
                          Xác định danh từ là đếm được hay không đếm được trong tiếng Anh.
                        </p>
                      </div>
                    </div>

                    <div className="inline-flex rounded-xl bg-white p-1 border border-blue-200/80 gap-1 shadow-2xs self-start sm:self-auto">
                      {[
                        { val: '[C]', label: 'Đếm được [C]' },
                        { val: '[U]', label: 'Không đếm được [U]' },
                        { val: '[C/U]', label: 'Cả hai [C/U]' },
                      ].map((c) => (
                        <button
                          key={c.val}
                          type="button"
                          onClick={() => setCountability(c.val)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                            countability === c.val
                              ? 'bg-blue-600 text-white shadow-xs'
                              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                          }`}
                        >
                          {c.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Common Synonyms Input */}
                <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
                  <span className="text-[11px] font-bold text-slate-500 shrink-0 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[15px] text-slate-400">sync_alt</span>
                    <span>Từ đồng nghĩa chung (Synonyms):</span>
                  </span>
                  <input
                    type="text"
                    value={synonyms}
                    onChange={(e) => setSynonyms(e.target.value)}
                    placeholder="e.g. hire, rent, charter..."
                    className="flex-1 h-8 px-3 bg-slate-50/70 hover:bg-white focus:bg-white rounded-lg text-xs font-medium text-slate-800 border border-slate-200 focus:border-crimson-primary focus:ring-2 focus:ring-crimson-primary/10 transition-all outline-none"
                  />
                </div>

                {/* --- KHỐI PATTERN (Hiển thị cho VERB, ADJECTIVE, ADVERB - Ẩn đối với NOUN) --- */}
                {pos !== 'n' && (
                  <div className="flex flex-col gap-3 p-4 rounded-xl bg-slate-50/70 border border-slate-200/80 animate-in fade-in duration-150">
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
                              {patterns.length} pattern
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500">
                            {pos === 'v' && 'Các cấu trúc ngữ pháp như: + sth from sb, + to V, + sb into doing sth...'}
                            {pos === 'adj' && 'Các cấu trúc tính từ như: be adj to V, be adj that + clause, be adj about sth...'}
                            {pos === 'adv' && 'Các cấu trúc vị trí như: adv + V, V + adv, be + adv + adj...'}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleAddPattern}
                        className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-crimson-primary text-xs font-bold text-slate-700 hover:text-crimson-primary shadow-2xs transition-all flex items-center gap-1 active:scale-[0.98]"
                      >
                        <span className="material-symbols-outlined text-[16px]">add</span>
                        <span>Thêm Pattern</span>
                      </button>
                    </div>

                    {/* List of Patterns */}
                    <div className="flex flex-col gap-3 pt-1">
                      {patterns.map((pat, pIdx) => (
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
                              onClick={() => handleDeletePattern(pat.id)}
                              className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 p-1 rounded-lg transition-colors flex items-center gap-1 text-[11px] font-medium"
                              title="Xóa pattern này"
                            >
                              <span className="material-symbols-outlined text-[15px]">delete</span>
                              <span className="hidden sm:inline">Xóa</span>
                            </button>
                          </div>

                          {/* Row 1: Formula & Meaning */}
                          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                            <div className="md:col-span-2 flex flex-col gap-1">
                              <label className="text-[11px] font-bold text-text-high-contrast flex items-center justify-between">
                                <span>Mẫu Pattern cấu trúc</span>
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
                                    handleUpdatePattern(pat.id, 'pattern', e.target.value)
                                  }
                                  placeholder={
                                    pos === 'v'
                                      ? 'e.g. + sth from sb, + to V...'
                                      : pos === 'adj'
                                      ? 'e.g. be + adj + to V...'
                                      : 'e.g. adv + V...'
                                  }
                                  className="w-full h-9 pl-9 pr-3 bg-slate-50/70 hover:bg-white focus:bg-white rounded-lg text-xs font-mono font-semibold text-crimson-primary border border-slate-200 focus:border-crimson-primary focus:ring-2 focus:ring-crimson-primary/10 transition-all outline-none"
                                />
                              </div>
                            </div>

                            <div className="md:col-span-3 flex flex-col gap-1">
                              <label className="text-[11px] font-bold text-text-high-contrast flex items-center justify-between">
                                <span>Nghĩa của Pattern này</span>
                                <span className="text-[10px] text-slate-400 font-normal">Bỏ trống sẽ dùng nghĩa ở Mục 1</span>
                              </label>
                              <div className="relative">
                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[15px]">
                                  translate
                                </span>
                                <input
                                  type="text"
                                  value={pat.meaning}
                                  onChange={(e) =>
                                    handleUpdatePattern(pat.id, 'meaning', e.target.value)
                                  }
                                  placeholder={meaning ? `Mặc định: ${meaning}` : 'e.g. thuê, mướn dài hạn từ ai đó'}
                                  className="w-full h-9 pl-9 pr-3 bg-slate-50/70 hover:bg-white focus:bg-white rounded-lg text-xs font-semibold text-text-high-contrast border border-slate-200 focus:border-crimson-primary focus:ring-2 focus:ring-crimson-primary/10 transition-all outline-none"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Row 2: Note & Example */}
                          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                            <div className="md:col-span-2 flex flex-col gap-1">
                              <label className="text-[11px] font-medium text-slate-500">
                                Ghi chú ngữ cảnh
                              </label>
                              <input
                                type="text"
                                value={pat.note}
                                onChange={(e) =>
                                  handleUpdatePattern(pat.id, 'note', e.target.value)
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
                                  handleUpdatePattern(pat.id, 'example', e.target.value)
                                }
                                placeholder="e.g. They decided to lease the office space from a commercial developer."
                                className="w-full h-8 px-3 bg-slate-50/50 hover:bg-white focus:bg-white rounded-lg text-xs text-text-body border border-slate-200 focus:border-crimson-primary focus:ring-2 focus:ring-crimson-primary/10 transition-all outline-none"
                              />
                            </div>
                          </div>
                        </div>
                      ))}

                      {patterns.length === 0 && (
                        <div className="py-4 px-3 rounded-lg border border-dashed border-slate-200 bg-white/60 text-center flex items-center justify-center gap-2 text-xs text-slate-400">
                          <span>Chưa có mẫu pattern nào.</span>
                          <button
                            type="button"
                            onClick={handleAddPattern}
                            className="text-crimson-primary font-bold hover:underline"
                          >
                            + Thêm pattern
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* --- KHỐI COLLOCATIONS (Hiển thị cho VERB, NOUN, ADJECTIVE, ADVERB) --- */}
                <div className="flex flex-col gap-3 p-4 rounded-xl bg-indigo-50/30 border border-indigo-100/90 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-indigo-100/70 text-collocation-indigo flex items-center justify-center border border-indigo-200/50 shadow-2xs">
                        <span className="material-symbols-outlined text-[16px]">link</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-text-high-contrast">
                            {pos === 'n' ? 'Mục Collocations chuẩn (Cụm từ cố định)' : '2. Collocations chuẩn (Cụm từ cố định)'}
                          </span>
                          <span className="px-2 py-0.2 rounded-full bg-white text-collocation-indigo text-[10px] font-bold border border-indigo-200">
                            {collocations.length} collocation
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500">
                          Mỗi collocation là cụm từ đi kèm có nghĩa tiếng Việt riêng biệt.
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleAddCollocation}
                      className="px-3 py-1.5 rounded-lg bg-white border border-indigo-200 hover:border-collocation-indigo text-xs font-bold text-collocation-indigo shadow-2xs transition-all flex items-center gap-1 active:scale-[0.98]"
                    >
                      <span className="material-symbols-outlined text-[16px]">add</span>
                      <span>Thêm Collocation</span>
                    </button>
                  </div>

                  {/* List of Collocations */}
                  <div className="flex flex-col gap-3 pt-1">
                    {collocations.map((col, cIdx) => (
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
                            onClick={() => handleDeleteCollocation(col.id)}
                            className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 p-1 rounded-lg transition-colors flex items-center gap-1 text-[11px] font-medium"
                            title="Xóa collocation này"
                          >
                            <span className="material-symbols-outlined text-[15px]">delete</span>
                            <span className="hidden sm:inline">Xóa</span>
                          </button>
                        </div>

                        {/* Row 1: Collocation Text & Meaning */}
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                          <div className="md:col-span-2 flex flex-col gap-1">
                            <label className="text-[11px] font-bold text-text-high-contrast flex items-center justify-between">
                              <span>Cụm Collocation</span>
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
                                  handleUpdateCollocation(col.id, 'collocation', e.target.value)
                                }
                                placeholder={
                                  pos === 'n'
                                    ? 'e.g. lease agreement, sign a lease...'
                                    : 'e.g. lease commercial space...'
                                }
                                className="w-full h-9 pl-9 pr-3 bg-slate-50/70 hover:bg-white focus:bg-white rounded-lg text-xs font-semibold text-collocation-indigo border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all outline-none"
                              />
                            </div>
                          </div>

                          <div className="md:col-span-3 flex flex-col gap-1">
                            <label className="text-[11px] font-bold text-text-high-contrast flex items-center justify-between">
                              <span>Nghĩa của Collocation này</span>
                              <span className="text-[10px] text-slate-400 font-normal">Bỏ trống sẽ dùng nghĩa ở Mục 1</span>
                            </label>
                            <div className="relative">
                              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[15px]">
                                translate
                              </span>
                              <input
                                type="text"
                                value={col.meaning}
                                onChange={(e) =>
                                  handleUpdateCollocation(col.id, 'meaning', e.target.value)
                                }
                                placeholder={meaning ? `Mặc định: ${meaning}` : 'e.g. hợp đồng thuê mướn tài sản (có cam kết)'}
                                className="w-full h-9 pl-9 pr-3 bg-slate-50/70 hover:bg-white focus:bg-white rounded-lg text-xs font-semibold text-text-high-contrast border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all outline-none"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Row 2: Note & Example */}
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                          <div className="md:col-span-2 flex flex-col gap-1">
                            <label className="text-[11px] font-medium text-slate-500">
                              Ghi chú ngữ cảnh
                            </label>
                            <input
                              type="text"
                              value={col.note}
                              onChange={(e) =>
                                handleUpdateCollocation(col.id, 'note', e.target.value)
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
                                handleUpdateCollocation(col.id, 'example', e.target.value)
                              }
                              placeholder="e.g. Both parties signed a five-year commercial lease agreement."
                              className="w-full h-8 px-3 bg-slate-50/50 hover:bg-white focus:bg-white rounded-lg text-xs text-text-body border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    ))}

                    {collocations.length === 0 && (
                      <div className="py-4 px-3 rounded-lg border border-dashed border-indigo-200 bg-white/60 text-center flex items-center justify-center gap-2 text-xs text-slate-400">
                        <span>Chưa có collocation nào.</span>
                        <button
                          type="button"
                          onClick={handleAddCollocation}
                          className="text-collocation-indigo font-bold hover:underline"
                        >
                          + Thêm collocation
                        </button>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            )}

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
            ) : word.trim() && meaning.trim() ? (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 font-semibold animate-in fade-in">
                <span className="material-symbols-outlined text-[16px] text-emerald-600">check_circle</span>
                <span>Hợp lệ — Sẵn sàng lưu vào hệ thống</span>
              </div>
            ) : word.trim() ? (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-800 font-semibold animate-in fade-in">
                <span className="material-symbols-outlined text-[16px] text-blue-600">edit_note</span>
                <span>Vui lòng nhập thêm Nghĩa của từ ở Mục 1</span>
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
              <span>{initialVocab ? 'Cập Nhật Thay Đổi' : 'Lưu Từ Vựng'}</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
