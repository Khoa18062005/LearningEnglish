import React from 'react';

export default function Header({
  searchTerm,
  setSearchTerm,
  selectedPos,
  setSelectedPos,
  onOpenAddModal
}) {
  const posOptions = [
    { id: 'all', label: 'All', colorClass: 'text-text-body' },
    { id: 'n', label: 'Noun (n)', colorClass: 'text-pos-noun-text hover:bg-pos-noun-bg' },
    { id: 'v', label: 'Verb (v)', colorClass: 'text-pos-verb-text hover:bg-pos-verb-bg' },
    { id: 'adj', label: 'Adj (adj)', colorClass: 'text-pos-adj-text hover:bg-pos-adj-bg' },
    { id: 'adv', label: 'Adv (adv)', colorClass: 'text-pos-adv-text hover:bg-pos-adv-bg' },
  ];

  return (
    <header className="fixed top-0 left-[260px] right-0 h-16 bg-card-white/90 backdrop-blur-xl border-b border-slate-line/80 z-40 flex items-center justify-between px-6 gap-4">
      {/* Search Bar & POS Pills */}
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

        {/* User Profile */}
        <div className="flex items-center gap-2.5 pl-1 cursor-pointer">
          <div className="w-8 h-8 rounded-full bg-crimson-primary text-white flex items-center justify-center shadow-sm font-bold text-xs">
            LH
          </div>
          <div className="hidden md:flex flex-col text-left">
            <span className="text-xs font-bold text-text-high-contrast leading-tight">Lê Hoàng</span>
            <span className="text-[10px] text-text-muted leading-tight">IELTS 8.5 Master</span>
          </div>
        </div>
      </div>
    </header>
  );
}
