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
      {/* Left side: Clean Section Breadcrumb / App Title */}
      <div className="flex items-center gap-2 text-xs">
        <span className="font-bold text-text-high-contrast flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-crimson-primary animate-pulse" />
          LinearVocab LMS
        </span>
        <span className="material-symbols-outlined text-[14px] text-text-disabled">chevron_right</span>
        <span className="text-crimson-primary font-semibold">
          {currentView === 'profile'
            ? 'Hồ sơ người dùng & Sơ đồ năng lực'
            : currentView === 'word-families'
            ? 'Word Families (Gia đình từ)'
            : currentView === 'reading-list'
            ? 'Reading List'
            : currentView === 'category'
            ? 'Danh mục'
            : 'Kho từ vựng trung tâm'}
        </span>
      </div>

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
          className="w-9 h-9 rounded-lg flex items-center justify-center text-text-muted hover:text-crimson-primary hover:bg-surface-crimson-subtle transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined text-[20px]">notifications</span>
        </button>

        <button
          type="button"
          title="Cài đặt hệ thống"
          className="w-9 h-9 rounded-lg flex items-center justify-center text-text-muted hover:text-crimson-primary hover:bg-surface-crimson-subtle transition-colors cursor-pointer"
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

                <div className="px-2 py-1 border-b border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setIsDropdownOpen(false);
                      if (onNavigateProfile) { onNavigateProfile(); } else { window.scrollTo({ top: 0, behavior: 'smooth' }); }
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px] text-crimson-primary">account_circle</span>
                    <span>Hồ sơ & Sơ đồ năng lực</span>
                  </button>
                </div>

                {/* Logout Action */}
                <div className="px-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIsDropdownOpen(false);
                      onLogout();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
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
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-crimson-primary hover:bg-crimson-dark text-white text-xs font-bold shadow-[0_2px_8px_rgba(227,30,36,0.25)] hover:shadow-[0_4px_12px_rgba(227,30,36,0.35)] transition-all cursor-pointer"
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
