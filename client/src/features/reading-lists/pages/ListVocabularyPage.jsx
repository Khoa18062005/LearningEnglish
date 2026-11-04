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
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFolderFilter, setSelectedFolderFilter] = useState('all'); // 'all' | folderId | 'none'
  const [sortBy, setSortBy] = useState('oldest'); // 'oldest' (mặc định) | 'newest' | 'most-vocabs' | 'title-az'
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
      case 'oldest':
      default: return 'Cũ nhất';
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
      return {
        ...list,
        vocabCount,
      };
    });
  }, [readingLists, vocabList]);

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
      default:
        sorted.sort((a, b) => (new Date(a.createdAt || 0) - new Date(b.createdAt || 0)) || (Number(a.id || 0) - Number(b.id || 0)));
        break;
    }

    return sorted;
  }, [listsWithStats, searchTerm, sortBy, selectedFolderFilter]);

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
          <div className="max-w-2xl flex flex-col gap-2.5">
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

            {/* Action Buttons & Statistics */}
            <div className="flex items-center gap-3 pt-2 flex-wrap">
              {onOpenAddFolderModal && (
                <button
                  type="button"
                  onClick={onOpenAddFolderModal}
                  className="h-10 px-4 rounded-xl bg-white hover:bg-slate-50 text-amber-800 font-bold text-xs shadow-md shadow-red-950/20 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px] text-amber-600">create_new_folder</span>
                  <span>Tạo Thư Mục (Bộ Đề)</span>
                </button>
              )}

              <button
                type="button"
                onClick={onOpenAddReadingListModal}
                className="h-10 px-4 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/30 text-white font-bold text-xs shadow-xs active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
                <span>Tạo Danh Sách Bài Đọc</span>
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
              <div className="flex items-center gap-2 pl-1 flex-wrap">
                <div className="h-10 px-3.5 rounded-xl bg-black/15 backdrop-blur-md border border-white/20 text-white flex items-center gap-2 text-xs font-semibold">
                  <span className="material-symbols-outlined text-[16px] text-yellow-300">folder</span>
                  <span>{noteFolders.length} thư mục</span>
                </div>
                <div className="h-10 px-3.5 rounded-xl bg-black/15 backdrop-blur-md border border-white/20 text-white flex items-center gap-2 text-xs font-semibold">
                  <span className="material-symbols-outlined text-[16px] text-amber-300">article</span>
                  <span>{readingLists.length} bài đọc</span>
                </div>
                <div className="h-10 px-3.5 rounded-xl bg-black/15 backdrop-blur-md border border-white/20 text-white flex items-center gap-2 text-xs font-semibold">
                  <span className="material-symbols-outlined text-[16px] text-emerald-300">style</span>
                  <span>{totalVocabsInLists} từ trong bài</span>
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
                <span className="material-symbols-outlined text-[16px] text-amber-500">folder</span>
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
                          <span className="material-symbols-outlined text-[15px] text-amber-500 shrink-0">folder</span>
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
                  { id: 'oldest', label: 'Cũ nhất trước (Mặc định)', icon: 'history' },
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

      {/* 3. Reading Task Cards Grid */}
      {filteredAndSortedLists.length === 0 ? (
        /* Empty State */
        <div className="bg-white rounded-3xl border border-slate-200/90 p-10 sm:p-14 text-center max-w-xl mx-auto shadow-xs my-4">
          <div className="w-16 h-16 rounded-2xl bg-surface-crimson-subtle border border-border-crimson-tint text-crimson-primary flex items-center justify-center mx-auto mb-4 shadow-xs">
            <span className="material-symbols-outlined text-[34px]">auto_stories</span>
          </div>
          <h3 className="text-lg font-extrabold text-slate-900 mb-2 font-sans">
            {searchTerm ? 'Không tìm thấy danh sách từ vựng phù hợp' : 'Chưa có danh sách từ vựng nào'}
          </h3>
          <p className="text-xs sm:text-sm text-text-muted leading-relaxed max-w-md mx-auto mb-6">
            {searchTerm
              ? `Không tìm thấy danh sách nào khớp với từ khóa "${searchTerm}". Vui lòng thử tìm với từ khóa khác.`
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredAndSortedLists.map((list) => {
            const displayCode = list.code || list.shortTitle || 'LIST';
            const displayTitle = list.title || 'Danh sách từ vựng';

            return (
              <div
                key={list.id}
                onClick={() => onSelectList && onSelectList(list.id)}
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

                      {(list.folderId || list.folderCode || list.folderName) && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-yellow-400/20 text-yellow-900 border border-yellow-300 text-[10.5px] font-bold">
                          <span className="material-symbols-outlined text-[12px] text-amber-600">folder</span>
                          <span className="truncate max-w-[130px]">{list.folderName || list.folderCode}</span>
                        </span>
                      )}
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
          })}
        </div>
      )}
    </div>
  );
}
