import { useState, useRef, useEffect } from 'react';

export default function Header({
  searchTerm,
  setSearchTerm,
  selectedPos,
  setSelectedPos,
  onOpenAddModal,
  currentView,
  currentUser = null,
  onOpenAuthModal,
  onLogout,
}) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const isSearchHidden = currentView === 'reading-list' || currentView === 'category' || currentView === 'word-families';

  const posOptions = [
    { id: 'all', label: 'Tất cả', colorClass: 'text-text-body' },
    { id: 'n', label: 'Danh từ (N)', colorClass: 'text-pos-noun-text hover:bg-pos-noun-bg' },
    { id: 'v', label: 'Động từ (V)', colorClass: 'text-pos-verb-text hover:bg-pos-verb-bg' },
    { id: 'adj', label: 'Tính từ (Adj)', colorClass: 'text-pos-adj-text hover:bg-pos-adj-bg' },
    { id: 'adv', label: 'Trạng từ (Adv)', colorClass: 'text-pos-adv-text hover:bg-pos-adv-bg' },
    { id: 'phrasal_verb', label: 'Cụm ĐT (Phrasal Verb)', colorClass: 'text-teal-700 hover:bg-teal-50' },
    { id: 'idiom', label: 'Cụm từ (Idioms)', colorClass: 'text-amber-800 hover:bg-amber-50' },
  ];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getGenderLabel = (gender) => {
    switch (gender) {
      case 'MALE':
        return 'Nam';
      case 'FEMALE':
        return 'Nữ';
      default:
        return 'Khác';
    }
  };

  const getUserInitial = () => {
    if (!currentUser || !currentUser.fullName) return 'U';
    const parts = currentUser.fullName.trim().split(' ');
    return parts[parts.length - 1].charAt(0).toUpperCase();
  };

  return (
    <header className="fixed top-0 left-[260px] right-0 h-16 bg-card-white/90 backdrop-blur-xl border-b border-slate-line/80 z-40 flex items-center justify-between px-6 gap-4">
      {/* Search Bar & POS Pills */}
      {!isSearchHidden ? (
        <div className="flex items-center flex-1 max-w-3xl gap-4">
          {/* Search Input */}
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-[20px]">
              search
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm từ vựng, pattern, collocation, nghĩa tiếng Việt..."
              className="w-full h-10 pl-10 pr-9 bg-canvas-slate rounded-lg text-sm text-text-high-contrast placeholder:text-text-disabled focus:outline-none focus:bg-card-white focus:ring-1 focus:ring-crimson-primary border border-transparent focus:border-crimson-primary/30 shadow-[0_1px_3px_rgba(15,23,42,0.05)] transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-high-contrast text-xs"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            )}
          </div>

          {/* POS Filter Pills */}
          <div className="hidden lg:flex items-center gap-1 p-1 bg-canvas-slate rounded-lg border border-slate-line/60">
            {posOptions.map((opt) => {
              const isActive = selectedPos === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setSelectedPos(opt.id)}
                  className={`px-2.5 py-1 rounded text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-card-white text-crimson-primary shadow-[0_1px_2px_rgba(0,0,0,0.08)]'
                      : `${opt.colorClass} text-text-muted hover:text-text-high-contrast`
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="flex-1" />
      )}

      {/* Right Controls & User Profile */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onOpenAddModal}
          className="lg:hidden flex items-center gap-1 px-3 py-1.5 rounded-lg bg-crimson-primary text-white text-xs font-semibold"
        >
          <span className="material-symbols-outlined text-[16px]">add</span>
          <span>Thêm từ</span>
        </button>

        <button
          type="button"
          title="Thông báo"
          className="w-9 h-9 rounded-lg flex items-center justify-center text-text-muted hover:text-crimson-primary hover:bg-surface-crimson-subtle transition-colors"
        >
          <span className="material-symbols-outlined text-[20px]">notifications</span>
        </button>

        <button
          type="button"
          title="Cài đặt hệ thống"
          className="w-9 h-9 rounded-lg flex items-center justify-center text-text-muted hover:text-crimson-primary hover:bg-surface-crimson-subtle transition-colors"
        >
          <span className="material-symbols-outlined text-[20px]">settings</span>
        </button>

        <div className="h-5 w-px bg-slate-line mx-1"></div>

        {/* User Profile / Auth Action */}
        {currentUser ? (
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 pl-1 py-1 pr-2 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer group"
              title="Thông tin tài khoản"
            >
              <div className="w-8 h-8 rounded-full bg-crimson-primary text-white flex items-center justify-center shadow-xs font-bold text-xs ring-2 ring-transparent group-hover:ring-crimson-primary/20 transition-all">
                {getUserInitial()}
              </div>
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-xs font-bold text-text-high-contrast max-w-[120px] truncate leading-tight">
                  {currentUser.fullName}
                </span>
                <span className="text-[10px] text-text-muted max-w-[120px] truncate leading-tight">
                  {currentUser.email}
                </span>
              </div>
              <span className="material-symbols-outlined text-text-muted text-[16px]">
                {isDropdownOpen ? 'expand_less' : 'expand_more'}
              </span>
            </button>

            {/* Profile Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-[0_12px_32px_rgba(15,23,42,0.15)] border border-slate-200/90 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                {/* User Info Header */}
                <div className="px-4 py-3 border-b border-slate-100">
                  <p className="text-xs font-bold text-text-high-contrast">
                    {currentUser.fullName}
                  </p>
                  <p className="text-xs text-text-muted truncate mt-0.5">
                    {currentUser.email}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="px-2 py-0.5 rounded-md bg-surface-crimson-subtle text-crimson-primary text-[10px] font-bold border border-border-crimson-tint">
                      {getGenderLabel(currentUser.gender)}
                    </span>
                    {currentUser.dateOfBirth && (
                      <span className="text-[11px] text-text-muted flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">cake</span>
                        {currentUser.dateOfBirth}
                      </span>
                    )}
                  </div>
                </div>

                {/* Logout Action */}
                <div className="px-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIsDropdownOpen(false);
                      onLogout();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]">logout</span>
                    <span>Đăng xuất</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onOpenAuthModal && onOpenAuthModal('login')}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-crimson-primary hover:bg-crimson-dark text-white text-xs font-bold shadow-[0_2px_8px_rgba(227,30,36,0.25)] hover:shadow-[0_4px_12px_rgba(227,30,36,0.35)] transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">login</span>
              <span>Đăng nhập</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
