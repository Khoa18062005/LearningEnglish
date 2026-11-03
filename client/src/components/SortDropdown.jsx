import React, { useState, useRef, useEffect } from 'react';
import { isVocabStarred, isVocabBookmarked } from '../utils/userVocabPreferences';

export const SORT_OPTIONS = [
  { id: 'newest', label: 'Ngày thêm gần nhất', shortLabel: 'Gần nhất', icon: 'schedule', section: 'sort' },
  { id: 'oldest', label: 'Ngày thêm xa nhất', shortLabel: 'Xa nhất', icon: 'history', section: 'sort' },
  { id: 'az', label: 'Từ điển (A → Z)', shortLabel: 'A → Z', icon: 'sort_by_alpha', section: 'sort' },
  { id: 'za', label: 'Từ điển (Z → A)', shortLabel: 'Z → A', icon: 'sort_by_alpha', section: 'sort' },
  { id: 'starred', label: 'Đã đánh dấu sao', shortLabel: 'Đánh dấu sao', icon: 'star', section: 'folder', iconColor: 'text-amber-500' },
  { id: 'bookmarked', label: 'Đã lưu (Bookmark)', shortLabel: 'Đã lưu', icon: 'bookmark', section: 'folder', iconColor: 'text-crimson-primary' },
];

export function sortVocabularies(items, sortBy = 'newest') {
  if (!Array.isArray(items)) return [];
  const copied = [...items];

  switch (sortBy) {
    case 'starred':
      return copied
        .filter((v) => isVocabStarred(v))
        .sort((a, b) => {
          const timeA = a.createdAt ? new Date(a.createdAt).getTime() : (a.id || 0);
          const timeB = b.createdAt ? new Date(b.createdAt).getTime() : (b.id || 0);
          return timeB - timeA;
        });
    case 'bookmarked':
      return copied
        .filter((v) => isVocabBookmarked(v))
        .sort((a, b) => {
          const timeA = a.createdAt ? new Date(a.createdAt).getTime() : (a.id || 0);
          const timeB = b.createdAt ? new Date(b.createdAt).getTime() : (b.id || 0);
          return timeB - timeA;
        });
    case 'az':
      return copied.sort((a, b) =>
        (a.word || '').localeCompare(b.word || '', undefined, { sensitivity: 'base' })
      );
    case 'za':
      return copied.sort((a, b) =>
        (b.word || '').localeCompare(a.word || '', undefined, { sensitivity: 'base' })
      );
    case 'oldest':
      return copied.sort((a, b) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : (a.id || 0);
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : (b.id || 0);
        return timeA - timeB;
      });
    case 'newest':
    default:
      return copied.sort((a, b) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : (a.id || 0);
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : (b.id || 0);
        return timeB - timeA;
      });
  }
}

export default function SortDropdown({ sortBy = 'newest', onSortChange, className = '' }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const currentOption = SORT_OPTIONS.find((opt) => opt.id === sortBy) || SORT_OPTIONS[0];
  const isCustomSort = sortBy !== 'newest';

  const sortSectionOptions = SORT_OPTIONS.filter((opt) => opt.section === 'sort');
  const folderSectionOptions = SORT_OPTIONS.filter((opt) => opt.section === 'folder');

  return (
    <div className={`relative inline-block text-left shrink-0 ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`h-11 px-3.5 flex items-center gap-1.5 rounded-xl text-xs font-semibold whitespace-nowrap border transition-all duration-150 cursor-pointer ${
          isOpen || isCustomSort
            ? currentOption.id === 'starred'
              ? 'bg-amber-50/70 text-amber-900 border-amber-300 shadow-xs ring-2 ring-amber-400/15'
              : currentOption.id === 'bookmarked'
              ? 'bg-red-50/70 text-crimson-primary border-red-300 shadow-xs ring-2 ring-crimson-primary/15'
              : 'bg-white text-crimson-primary border-crimson-primary/40 shadow-xs ring-2 ring-crimson-primary/10'
            : 'bg-slate-100 text-slate-700 border-slate-200/80 hover:bg-slate-200/70 hover:text-slate-900 shadow-xs'
        }`}
        title={`Đang chọn: ${currentOption.label}`}
      >
        <span
          className={`material-symbols-outlined text-[18px] ${
            currentOption.id === 'starred'
              ? 'text-amber-500'
              : currentOption.id === 'bookmarked'
              ? 'text-crimson-primary'
              : 'text-crimson-primary'
          }`}
        >
          {currentOption.id === 'starred'
            ? 'star'
            : currentOption.id === 'bookmarked'
            ? 'bookmark'
            : 'swap_vert'}
        </span>
        <span className="hidden sm:inline">{currentOption.label}</span>
        <span className="sm:hidden">{currentOption.shortLabel}</span>
        <span
          className={`material-symbols-outlined text-[16px] transition-transform duration-200 text-slate-400 ${
            isOpen ? 'rotate-180 text-crimson-primary' : ''
          }`}
        >
          expand_more
        </span>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1.5 w-56 bg-white rounded-xl shadow-xl border border-slate-200/90 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100 divide-y divide-slate-100">
          
          {/* Section 1: Sắp xếp từ vựng theo */}
          <div className="pb-1">
            <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[14px]">sort</span>
              <span>Sắp xếp từ vựng theo</span>
            </div>
            <div className="flex flex-col">
              {sortSectionOptions.map((opt) => {
                const isSelected = sortBy === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      if (onSortChange) onSortChange(opt.id);
                      setIsOpen(false);
                    }}
                    className={`w-full px-3 py-2 text-left text-xs font-medium flex items-center justify-between transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-red-50 text-crimson-primary font-bold'
                        : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`material-symbols-outlined text-[17px] ${
                          isSelected ? 'text-crimson-primary' : 'text-slate-400'
                        }`}
                      >
                        {opt.icon}
                      </span>
                      <span>{opt.label}</span>
                    </div>
                    {isSelected && (
                      <span className="material-symbols-outlined text-[16px] text-crimson-primary">
                        check
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 2: Thư mục đặc biệt (Đánh dấu sao / Lưu) */}
          <div className="pt-1">
            <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[14px] text-amber-500">folder_special</span>
              <span>Thư mục đánh dấu &amp; lưu</span>
            </div>
            <div className="flex flex-col">
              {folderSectionOptions.map((opt) => {
                const isSelected = sortBy === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      if (onSortChange) onSortChange(opt.id);
                      setIsOpen(false);
                    }}
                    className={`w-full px-3 py-2 text-left text-xs font-medium flex items-center justify-between transition-colors cursor-pointer ${
                      isSelected
                        ? opt.id === 'starred'
                          ? 'bg-amber-50 text-amber-900 font-bold'
                          : 'bg-red-50 text-crimson-primary font-bold'
                        : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`material-symbols-outlined text-[18px] ${
                          opt.iconColor || (isSelected ? 'text-crimson-primary' : 'text-slate-400')
                        }`}
                      >
                        {opt.icon}
                      </span>
                      <span>{opt.label}</span>
                    </div>
                    {isSelected && (
                      <span
                        className={`material-symbols-outlined text-[16px] ${
                          opt.id === 'starred' ? 'text-amber-600' : 'text-crimson-primary'
                        }`}
                      >
                        check
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
