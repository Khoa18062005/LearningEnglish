import React, { useMemo, useState, useEffect } from 'react';
import astronautImg from '../../../assets/Chibi_PhiHanhGia.png';

// Local storage key for persisting custom representative root word and member ordering
const STORAGE_KEY = 'linearvocab_family_config';

const loadSavedConfig = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
};

const saveConfigToStorage = (config) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (e) {
    console.error('Cannot save family config to localStorage', e);
  }
};

export default function WordFamiliesPage({
  vocabList = [],
  wordFamilies = [],
  onPronounce,
  onOpenAddModal,
  onEditVocab,
  onUpdateWordFamily,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [savedConfig, setSavedConfig] = useState(loadSavedConfig);
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  // Group and compute unified family cards
  const familiesToDisplay = useMemo(() => {
    const familyMap = new Map();

    // 1. Seed from wordFamilies if provided by backend
    if (Array.isArray(wordFamilies)) {
      wordFamilies.forEach((wf) => {
        if (!wf || !wf.rootWord) return;
        const key = wf.id ? `id_${wf.id}` : wf.rootWord.toLowerCase();
        familyMap.set(key, {
          id: wf.id,
          rootWord: wf.rootWord,
          description: wf.description || '',
          members: [],
          rawWords: wf.words || [],
          memberVocabs: wf.memberVocabs || [],
          memberOrder: wf.memberOrder || '',
        });
      });
    }

    // 2. Add vocabs from vocabList to their respective family
    if (Array.isArray(vocabList)) {
      vocabList.forEach((v) => {
        if (!v) return;
        let mapKey = null;
        let rootWordToUse = null;

        if (v.wordFamilyId) {
          const keyById = `id_${v.wordFamilyId}`;
          if (familyMap.has(keyById)) {
            mapKey = keyById;
            rootWordToUse = familyMap.get(keyById).rootWord;
          }
        }

        if (!mapKey) {
          if (v.rootWord && v.rootWord.trim()) {
            const keyByName = v.rootWord.trim().toLowerCase();
            mapKey = keyByName;
            rootWordToUse = v.rootWord.trim();
          } else if (Array.isArray(v.wordFamily) && v.wordFamily.length > 0 && v.wordFamily[0].trim()) {
            const first = v.wordFamily[0].split(' ')[0].trim();
            if (first) {
              mapKey = first.toLowerCase();
              rootWordToUse = first;
            }
          }
        }

        if (mapKey) {
          if (!familyMap.has(mapKey)) {
            familyMap.set(mapKey, {
              id: v.wordFamilyId || null,
              rootWord: rootWordToUse || mapKey,
              description: '',
              members: [],
              rawWords: [],
              memberVocabs: [],
              memberOrder: '',
            });
          }
          const family = familyMap.get(mapKey);
          if (!family.members.some((m) => (m.id && m.id === v.id) || m.word?.toLowerCase() === v.word.toLowerCase())) {
            family.members.push(v);
          }
        }
      });
    }

    // Convert map to array and apply custom config (representative root word & ordering)
    const list = Array.from(familyMap.values()).map((fam) => {
      const configKey = fam.id ? String(fam.id) : fam.rootWord.toLowerCase();
      const custom = savedConfig[configKey] || savedConfig[fam.rootWord.toLowerCase()] || {};

      const currentRootWord = custom.rootWord || fam.rootWord;

      const allWords = new Set();
      fam.members.forEach((m) => allWords.add(m.word.toLowerCase()));

      const extraWords = [];
      if (fam.rawWords) {
        fam.rawWords.forEach((rw) => {
          if (rw && !allWords.has(rw.toLowerCase())) {
            allWords.add(rw.toLowerCase());
            extraWords.push({ word: rw, isPlaceholder: true });
          }
        });
      }

      // Combine members and extra words
      let allItems = [...fam.members, ...extraWords];

      // Sort items by custom order if saved
      const orderList = custom.memberOrder || (fam.memberOrder ? fam.memberOrder.split(',') : null);
      if (Array.isArray(orderList) && orderList.length > 0) {
        allItems.sort((a, b) => {
          const wordA = a.word?.toLowerCase();
          const wordB = b.word?.toLowerCase();
          const idxA = orderList.findIndex((w) => w.toLowerCase() === wordA);
          const idxB = orderList.findIndex((w) => w.toLowerCase() === wordB);
          if (idxA === -1 && idxB === -1) return 0;
          if (idxA === -1) return 1;
          if (idxB === -1) return -1;
          return idxA - idxB;
        });
      }

      return {
        ...fam,
        rootWord: currentRootWord,
        items: allItems,
        totalCount: allItems.length,
      };
    }).filter((fam) => fam.totalCount > 0);

    // Filter by search term if user types
    if (searchTerm.trim()) {
      const q = searchTerm.trim().toLowerCase();
      return list.filter(
        (f) =>
          f.rootWord.toLowerCase().includes(q) ||
          f.items.some((item) => item.word.toLowerCase().includes(q) || item.meaning?.toLowerCase().includes(q))
      );
    }

    return list;
  }, [wordFamilies, vocabList, searchTerm, savedConfig]);

  // Handle saving changes to a family card
  const handleSaveFamilyChanges = ({ id, rootWord, oldRootWord, memberOrder }) => {
    const configKey = id ? String(id) : (oldRootWord || rootWord).toLowerCase();

    const newConfig = {
      ...savedConfig,
      [configKey]: {
        rootWord,
        memberOrder,
      },
      // also key by root word for fallback lookup
      [rootWord.toLowerCase()]: {
        rootWord,
        memberOrder,
      },
    };

    setSavedConfig(newConfig);
    saveConfigToStorage(newConfig);

    if (onUpdateWordFamily) {
      onUpdateWordFamily({ id, rootWord, oldRootWord, memberOrder });
    }

    showToast(`Đã lưu thay đổi cho gia đình từ "${rootWord}" thành công!`);
  };

  return (
    <div className="flex flex-col w-full pb-16 relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-semibold shadow-xl border border-emerald-500 animate-bounce">
          <span className="material-symbols-outlined text-[18px]">check_circle</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ======================================================== */}
      {/* TOP RED HERO CARD (Learning by word family + Cute Astronaut) */}
      {/* ======================================================== */}
      <section className="p-6 lg:p-8 pb-3">
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

          {/* Left Column: Title & Description */}
          <div className="flex flex-col gap-1.5 relative z-10 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-yellow-400/30 text-yellow-200 text-[10px] font-black uppercase tracking-wider border border-yellow-300/60 backdrop-blur-xs select-none shadow-[0_0_12px_rgba(250,204,21,0.25)]">
                WORD FAMILIES
              </span>
              <span className="text-white/80 text-xs font-semibold">
                Phương pháp Linearthinking
              </span>
            </div>

            <h1 className="font-headline text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight drop-shadow-xs leading-tight">
              Learning by word family
            </h1>

            <p className="text-xs text-white/90 leading-relaxed font-normal">
              Học từ vựng theo cụm gốc từ (Root &amp; Affixes) theo phương pháp Linearthinking giúp bạn mở rộng vốn từ gấp 4 lần.
            </p>

            <div className="flex items-center gap-2.5 mt-2 flex-wrap">
              <button
                type="button"
                onClick={onOpenAddModal}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-white text-crimson-primary font-bold text-xs shadow-md hover:bg-red-50 hover:shadow-lg active:scale-95 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">add</span>
                <span>Thêm Từ Mới</span>
              </button>

              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/15 text-white text-xs font-semibold backdrop-blur-xs border border-white/20">
                <span className="material-symbols-outlined text-[15px] text-yellow-300">account_tree</span>
                <span>{familiesToDisplay.length} cụm gia đình từ</span>
              </div>
            </div>
          </div>

          {/* Right Column: Cute Astronaut */}
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

      {/* Search Toolbar */}
      <section className="px-6 lg:px-8 py-3 bg-white border-y border-slate-line/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
            search
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo gốc từ hoặc từ con (e.g. account, able)..."
            className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:bg-white focus:border-crimson-primary focus:ring-2 focus:ring-crimson-primary/10 transition-all text-text-high-contrast placeholder:text-slate-400"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          )}
        </div>

        <div className="text-xs text-text-muted">
          Tìm thấy <b>{familiesToDisplay.length}</b> cụm từ
        </div>
      </section>

      {/* Grid of Word Family Cards */}
      <section className="p-6 lg:p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {familiesToDisplay.length === 0 ? (
          <div className="col-span-full py-20 flex flex-col items-center justify-center text-center">
            <div className="w-14 h-14 rounded-2xl bg-surface-crimson-subtle flex items-center justify-center text-crimson-primary mb-3">
              <span className="material-symbols-outlined text-[32px]">account_tree</span>
            </div>
            <p className="font-bold text-base text-text-high-contrast">Chưa có cây gia đình từ nào</p>
            <p className="text-xs text-text-muted max-w-md mt-1 mb-4 leading-relaxed">
              Cây gia đình từ sẽ tự động xuất hiện khi bạn thêm các từ vựng mới kèm chỉ định Word Family đại diện.
            </p>
            <button
              type="button"
              onClick={onOpenAddModal}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-crimson-primary text-white text-xs font-bold hover:bg-crimson-dark shadow-xs cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              <span>Thêm Từ Đầu Tiên</span>
            </button>
          </div>
        ) : (
          familiesToDisplay.map((family) => (
            <WordFamilyCard
              key={family.id || family.rootWord}
              family={family}
              onPronounce={onPronounce}
              onEditVocab={onEditVocab}
              onSaveFamily={handleSaveFamilyChanges}
            />
          ))
        )}
      </section>
    </div>
  );
}

/**
 * Individual Word Family Card Component
 * Supports:
 * - Green pen button to toggle edit mode
 * - Selecting any member word as the representative word (rootWord)
 * - Reordering words inside the family via Up/Down buttons or Drag & Drop
 * - Removal of bottom footer ("1 cấu trúc & collocation và ETM reading...")
 */
function WordFamilyCard({ family, onPronounce, onEditVocab, onSaveFamily }) {
  const [isEditing, setIsEditing] = useState(false);
  const [currentRootWord, setCurrentRootWord] = useState(family.rootWord);
  const [items, setItems] = useState(family.items);
  const [draggedIndex, setDraggedIndex] = useState(null);

  // Sync state whenever family prop updates and not currently in edit mode
  useEffect(() => {
    if (!isEditing) {
      setCurrentRootWord(family.rootWord);
      setItems(family.items);
    }
  }, [family, isEditing]);

  // Start edit mode
  const handleStartEdit = () => {
    setCurrentRootWord(family.rootWord);
    setItems([...family.items]);
    setIsEditing(true);
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setCurrentRootWord(family.rootWord);
    setItems([...family.items]);
    setIsEditing(false);
  };

  // Save changes
  const handleSave = () => {
    setIsEditing(false);
    if (onSaveFamily) {
      onSaveFamily({
        id: family.id,
        rootWord: currentRootWord,
        oldRootWord: family.rootWord,
        memberOrder: items.map((it) => it.word),
      });
    }
  };

  // Move item by direction (-1 for up, +1 for down)
  const handleMove = (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= items.length) return;
    const updated = [...items];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);
    setItems(updated);
  };

  // Drag and Drop handlers
  const handleDragStart = (e, index) => {
    if (!isEditing) return;
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (!isEditing || draggedIndex === null || draggedIndex === index) return;
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, targetIndex) => {
    e.preventDefault();
    if (!isEditing || draggedIndex === null || draggedIndex === targetIndex) return;
    const updated = [...items];
    const [moved] = updated.splice(draggedIndex, 1);
    updated.splice(targetIndex, 0, moved);
    setItems(updated);
    setDraggedIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  return (
    <div
      className={`p-5 rounded-xl bg-white border transition-all flex flex-col gap-3.5 group relative ${
        isEditing
          ? 'ring-2 ring-emerald-500/40 border-emerald-400 shadow-md bg-emerald-50/10'
          : 'border-slate-line/80 shadow-xs hover:shadow-md'
      }`}
    >
      {/* Header: Root Word & Action (Green Pen / Save & Cancel) */}
      <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
        <div className="flex items-center gap-2 overflow-hidden flex-1 min-w-0">
          <span className="material-symbols-outlined text-[20px] text-crimson-primary shrink-0">
            account_tree
          </span>
          <span
            className={`font-headline font-extrabold text-lg tracking-tight truncate ${
              isEditing ? 'text-emerald-700' : 'text-crimson-primary'
            }`}
            title={currentRootWord}
          >
            {currentRootWord}
          </span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-text-muted shrink-0">
            {items.length} từ
          </span>
          {isEditing && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 shrink-0">
              Đang chỉnh sửa
            </span>
          )}
        </div>

        {/* Action button: Green Pen (normal) or Save/Cancel (editing) */}
        <div className="flex items-center gap-1.5 shrink-0 ml-2">
          {isEditing ? (
            <>
              {/* Cancel button */}
              <button
                type="button"
                onClick={handleCancelEdit}
                title="Hủy bỏ chỉnh sửa"
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>

              {/* Save button with green style */}
              <button
                type="button"
                onClick={handleSave}
                title="Lưu thay đổi (Từ đại diện & Thứ tự)"
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all cursor-pointer active:scale-95"
              >
                <span className="material-symbols-outlined text-[15px]">check</span>
                <span>Lưu</span>
              </button>
            </>
          ) : (
            /* Green Pen Button replacing the red speaker */
            <button
              type="button"
              onClick={handleStartEdit}
              title="Chỉnh sửa gia đình từ (Chọn từ đại diện, sắp xếp thứ tự)"
              className="w-7 h-7 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200/80 hover:bg-emerald-100 hover:border-emerald-300 flex items-center justify-center transition-all cursor-pointer shadow-2xs hover:scale-105"
            >
              <span className="material-symbols-outlined text-[15px]">edit</span>
            </button>
          )}
        </div>
      </div>

      {/* Editing Guide Hint */}
      {isEditing && (
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-[11px] font-medium animate-fadeIn">
          <span className="material-symbols-outlined text-[15px] text-emerald-600 shrink-0">touch_app</span>
          <span>Chọn từ đại diện và bấm mũi tên ▲ ▼ hoặc kéo thả để đổi thứ tự</span>
        </div>
      )}

      {/* Subtitle / Label */}
      <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
        CÁC TỪ TRONG GIA ĐÌNH:
      </span>

      {/* List of Member Words */}
      <div className="flex flex-col gap-2">
        {items.map((item, index) => {
          const isSelectedAsRoot =
            item.word?.toLowerCase() === currentRootWord?.toLowerCase();
          const isBeingDragged = draggedIndex === index;

          return (
            <div
              key={item.id || item.word || `idx-${index}`}
              draggable={isEditing}
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
              onClick={() => {
                if (!isEditing && !item.isPlaceholder && onEditVocab) {
                  onEditVocab(item);
                }
              }}
              className={`p-2.5 rounded-lg transition-all flex flex-col gap-1 ${
                isEditing
                  ? `border ${
                      isSelectedAsRoot
                        ? 'bg-emerald-50/70 border-emerald-300 ring-1 ring-emerald-300/60'
                        : 'bg-white border-slate-200 hover:border-emerald-200'
                    } ${isBeingDragged ? 'opacity-40 scale-98 border-dashed border-emerald-400' : ''}`
                  : 'bg-slate-50/80 hover:bg-surface-crimson-subtle/50 border border-slate-200/80 hover:border-red-200 cursor-pointer group/item'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                {/* Left Area: Representative selector (in edit mode) or word name */}
                <div className="flex items-center gap-2 overflow-hidden flex-1 min-w-0">
                  {/* Edit mode: Drag Handle & Representative selector */}
                  {isEditing && (
                    <div className="flex items-center gap-1 shrink-0">
                      <span
                        className="material-symbols-outlined text-[16px] text-slate-400 hover:text-slate-700 cursor-grab active:cursor-grabbing select-none"
                        title="Kéo thả để sắp xếp"
                      >
                        drag_indicator
                      </span>

                      {/* Representative Word Radio / Badge */}
                      {isSelectedAsRoot ? (
                        <button
                          type="button"
                          className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-300 shadow-2xs select-none"
                          title="Từ này đang là từ đại diện cho Word Family"
                        >
                          <span className="material-symbols-outlined text-[13px] text-emerald-600">
                            radio_button_checked
                          </span>
                          <span>Đại diện</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setCurrentRootWord(item.word);
                          }}
                          className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-slate-100 hover:bg-emerald-50 text-slate-500 hover:text-emerald-700 text-[10px] font-medium border border-slate-200 hover:border-emerald-300 transition-all cursor-pointer select-none"
                          title={`Chọn "${item.word}" làm từ đại diện`}
                        >
                          <span className="material-symbols-outlined text-[13px] text-slate-400">
                            radio_button_unchecked
                          </span>
                          <span>Đặt làm đại diện</span>
                        </button>
                      )}
                    </div>
                  )}

                  {/* Word title & Part of speech badge */}
                  <span
                    className={`font-bold text-xs truncate transition-colors ${
                      isSelectedAsRoot
                        ? 'text-emerald-900 font-extrabold'
                        : 'text-text-high-contrast group-hover/item:text-crimson-primary'
                    }`}
                  >
                    {item.word}
                  </span>

                  {item.pos && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded font-bold uppercase shrink-0 ${
                        item.pos === 'v'
                          ? 'bg-red-50 text-red-600'
                          : item.pos === 'n'
                          ? 'bg-blue-50 text-blue-600'
                          : item.pos === 'adj'
                          ? 'bg-emerald-50 text-emerald-600'
                          : 'bg-purple-50 text-purple-600'
                      }`}
                    >
                      {item.posLabel || item.pos}
                    </span>
                  )}

                  {item.isPlaceholder && (
                    <span className="text-[10px] text-slate-400 italic shrink-0">
                      chưa tạo chi tiết
                    </span>
                  )}
                </div>

                {/* Right Area: Controls */}
                <div className="flex items-center gap-1 shrink-0">
                  {isEditing ? (
                    /* Up / Down Arrow Reorder Buttons */
                    <div className="flex items-center gap-0.5 bg-white border border-slate-200 rounded-md p-0.5 shadow-2xs">
                      <button
                        type="button"
                        disabled={index === 0}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMove(index, -1);
                        }}
                        className={`w-5 h-5 rounded flex items-center justify-center transition-colors ${
                          index === 0
                            ? 'text-slate-200 cursor-not-allowed'
                            : 'text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 cursor-pointer'
                        }`}
                        title="Di chuyển lên trên"
                      >
                        <span className="material-symbols-outlined text-[16px]">keyboard_arrow_up</span>
                      </button>

                      <button
                        type="button"
                        disabled={index === items.length - 1}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMove(index, 1);
                        }}
                        className={`w-5 h-5 rounded flex items-center justify-center transition-colors ${
                          index === items.length - 1
                            ? 'text-slate-200 cursor-not-allowed'
                            : 'text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 cursor-pointer'
                        }`}
                        title="Di chuyển xuống dưới"
                      >
                        <span className="material-symbols-outlined text-[16px]">keyboard_arrow_down</span>
                      </button>
                    </div>
                  ) : (
                    /* Normal mode: Pronounce & Edit icon */
                    <>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onPronounce(item.word, item.audioUrl);
                        }}
                        className="w-5 h-5 rounded flex items-center justify-center text-slate-400 hover:text-crimson-primary cursor-pointer"
                        title={`Phát âm từ "${item.word}"`}
                      >
                        <span className="material-symbols-outlined text-[14px]">volume_up</span>
                      </button>

                      {!item.isPlaceholder && (
                        <span className="material-symbols-outlined text-[14px] text-slate-400 opacity-0 group-hover/item:opacity-100 transition-opacity">
                          edit
                        </span>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Meaning preview */}
              {item.meaning && (
                <p className="text-[11px] text-text-muted line-clamp-1 pl-0.5">
                  {item.meaning}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* NOTE: Requirement 1 fulfilled - The bottom footer showing
          "1 cấu trúc & collocation" and reading list name has been completely removed. */}
    </div>
  );
}
