import React, { useState, useRef, useEffect, useMemo } from 'react';

/**
 * Custom DatePicker Component
 * Phù hợp với DOL Crimson Design System
 * Hỗ trợ chọn Ngày sinh nhanh chóng qua Custom Dropdown Năm (1940 - Hiện tại) và Tháng (1 - 12)
 * Giá trị value & onChange định dạng: 'YYYY-MM-DD'
 */
export default function DatePicker({
  value = '',
  onChange,
  placeholder = 'dd/mm/yyyy',
  maxDate = new Date().toISOString().split('T')[0],
  minDate = '1940-01-01',
  required = false,
  className = '',
  placement = 'auto', // 'auto' | 'bottom' | 'top'
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMonthOpen, setIsMonthOpen] = useState(false);
  const [isYearOpen, setIsYearOpen] = useState(false);
  const [openUpward, setOpenUpward] = useState(placement === 'top');

  const containerRef = useRef(null);
  const monthMenuRef = useRef(null);
  const yearMenuRef = useRef(null);
  const monthListRef = useRef(null);
  const yearListRef = useRef(null);

  // Tự động phát hiện hướng mở (upward / downward) khi mở dropdown
  useEffect(() => {
    if (isOpen && containerRef.current) {
      if (placement === 'top') {
        setOpenUpward(true);
        return;
      }
      if (placement === 'bottom') {
        setOpenUpward(false);
        return;
      }
      // 'auto': tính toán khoảng trống phía dưới màn hình
      const rect = containerRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const spaceBelow = windowHeight - rect.bottom;
      const spaceAbove = rect.top;
      // Nếu phía dưới còn ít hơn 350px và phía trên rộng hơn thì mở lên trên
      if (spaceBelow < 350 && spaceAbove > spaceBelow) {
        setOpenUpward(true);
      } else {
        setOpenUpward(false);
      }
    }
  }, [isOpen, placement]);

  // Phân tích giá trị ban đầu nếu có, hoặc mặc định 18 tuổi (~2008) cho ngày sinh
  const initialDate = useMemo(() => {
    if (value) {
      const parts = value.split('-');
      if (parts.length === 3) {
        return {
          year: parseInt(parts[0], 10),
          month: parseInt(parts[1], 10) - 1, // 0-indexed
          day: parseInt(parts[2], 10),
        };
      }
    }
    const today = new Date();
    return {
      year: today.getFullYear() - 18, // Mặc định mở ở 18 tuổi
      month: today.getMonth(),
      day: today.getDate(),
    };
  }, [value]);

  const [viewYear, setViewYear] = useState(initialDate.year);
  const [viewMonth, setViewMonth] = useState(initialDate.month);

  // Khi value thay đổi từ ngoài, cập nhật view
  useEffect(() => {
    if (value) {
      const parts = value.split('-');
      if (parts.length === 3) {
        setViewYear(parseInt(parts[0], 10));
        setViewMonth(parseInt(parts[1], 10) - 1);
      }
    }
  }, [value]);

  // Đóng toàn bộ popover khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
        setIsMonthOpen(false);
        setIsYearOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Đóng riêng dropdown Tháng / Năm khi click bên ngoài menu tương ứng
  useEffect(() => {
    const handleMenuClickOutside = (event) => {
      if (monthMenuRef.current && !monthMenuRef.current.contains(event.target)) {
        setIsMonthOpen(false);
      }
      if (yearMenuRef.current && !yearMenuRef.current.contains(event.target)) {
        setIsYearOpen(false);
      }
    };
    if (isMonthOpen || isYearOpen) {
      document.addEventListener('mousedown', handleMenuClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleMenuClickOutside);
    };
  }, [isMonthOpen, isYearOpen]);

  // Tự động cuộn đến năm được chọn khi mở dropdown Năm
  useEffect(() => {
    if (isYearOpen && yearListRef.current) {
      const activeEl = yearListRef.current.querySelector(`[data-year="${viewYear}"]`);
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'center' });
      }
    }
  }, [isYearOpen, viewYear]);

  // Tự động cuộn đến tháng được chọn khi mở dropdown Tháng
  useEffect(() => {
    if (isMonthOpen && monthListRef.current) {
      const activeEl = monthListRef.current.querySelector(`[data-month="${viewMonth}"]`);
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'center' });
      }
    }
  }, [isMonthOpen, viewMonth]);

  // Danh sách năm (từ năm hiện tại lùi về 1940)
  const currentMaxYear = parseInt(maxDate.split('-')[0], 10) || new Date().getFullYear();
  const currentMinYear = parseInt(minDate.split('-')[0], 10) || 1940;
  const years = useMemo(() => {
    const list = [];
    for (let y = currentMaxYear; y >= currentMinYear; y--) {
      list.push(y);
    }
    return list;
  }, [currentMaxYear, currentMinYear]);

  // Danh sách tháng tiếng Việt
  const months = [
    'Tháng 1',
    'Tháng 2',
    'Tháng 3',
    'Tháng 4',
    'Tháng 5',
    'Tháng 6',
    'Tháng 7',
    'Tháng 8',
    'Tháng 9',
    'Tháng 10',
    'Tháng 11',
    'Tháng 12',
  ];

  // Tính số ngày trong tháng view và offset thứ trong tuần (T2 = 0, CN = 6)
  const calendarDays = useMemo(() => {
    const firstDayIndex = (new Date(viewYear, viewMonth, 1).getDay() + 6) % 7;
    const daysInCurrentMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

    const days = [];

    // Ngày của tháng trước
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      days.push({
        day: daysInPrevMonth - i,
        month: viewMonth - 1,
        year: viewYear,
        isCurrentMonth: false,
      });
    }

    // Ngày của tháng hiện tại
    for (let d = 1; d <= daysInCurrentMonth; d++) {
      days.push({
        day: d,
        month: viewMonth,
        year: viewYear,
        isCurrentMonth: true,
      });
    }

    // Ngày của tháng sau để hoàn thành lưới 35 hoặc 42 ô
    const remaining = (7 - (days.length % 7)) % 7;
    for (let d = 1; d <= remaining; d++) {
      days.push({
        day: d,
        month: viewMonth + 1,
        year: viewYear,
        isCurrentMonth: false,
      });
    }

    return days;
  }, [viewYear, viewMonth]);

  const handlePrevMonth = (e) => {
    e.stopPropagation();
    setIsMonthOpen(false);
    setIsYearOpen(false);
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const handleNextMonth = (e) => {
    e.stopPropagation();
    setIsMonthOpen(false);
    setIsYearOpen(false);
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const isDateDisabled = (year, month, day) => {
    const targetDate = new Date(year, month, day);
    if (maxDate) {
      const max = new Date(maxDate);
      max.setHours(23, 59, 59, 999);
      if (targetDate > max) return true;
    }
    if (minDate) {
      const min = new Date(minDate);
      min.setHours(0, 0, 0, 0);
      if (targetDate < min) return true;
    }
    return false;
  };

  const handleSelectDay = (year, month, day) => {
    if (isDateDisabled(year, month, day)) return;

    // Chuẩn hóa tháng và năm nếu bấm vào ngày tháng lân cận
    const dateObj = new Date(year, month, day);
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const d = String(dateObj.getDate()).padStart(2, '0');

    const formattedIso = `${y}-${m}-${d}`;
    onChange(formattedIso);
    setIsOpen(false);
    setIsMonthOpen(false);
    setIsYearOpen(false);
  };

  // Định dạng hiển thị DD/MM/YYYY
  const displayFormattedDate = useMemo(() => {
    if (!value) return '';
    const parts = value.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return value;
  }, [value]);

  return (
    <div className="relative w-full" ref={containerRef}>
      {/* Input Box Trigger */}
      <div
        onClick={() => {
          setIsOpen(!isOpen);
          setIsMonthOpen(false);
          setIsYearOpen(false);
        }}
        className={`w-full h-11 pl-10 pr-9 rounded-xl border border-slate-200 bg-white flex items-center cursor-pointer transition-all ${
          isOpen
            ? 'ring-2 ring-crimson-primary/20 border-crimson-primary shadow-xs'
            : 'hover:border-slate-300'
        } ${className}`}
      >
        {/* Left Calendar Icon */}
        <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted text-[19px] pointer-events-none">
          calendar_month
        </span>

        {/* Display Text */}
        <span
          className={`text-sm select-none truncate ${
            displayFormattedDate
              ? 'text-text-high-contrast font-medium'
              : 'text-text-disabled'
          }`}
        >
          {displayFormattedDate || placeholder}
        </span>

        {/* Right Arrow / Clear Icon */}
        <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center">
          {value ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange('');
                setIsMonthOpen(false);
                setIsYearOpen(false);
              }}
              className="text-text-disabled hover:text-text-high-contrast transition-colors p-0.5"
              title="Xóa ngày"
            >
              <span className="material-symbols-outlined text-[16px]">cancel</span>
            </button>
          ) : (
            <span
              className={`material-symbols-outlined text-text-muted text-[20px] transition-transform duration-200 pointer-events-none ${
                isOpen ? 'rotate-180 text-crimson-primary' : ''
              }`}
            >
              expand_more
            </span>
          )}
        </div>
      </div>

      {/* Popover Calendar Dropdown (Tự động mở lên trên hoặc xuống dưới tùy theo khoảng trống) */}
      {isOpen && (
        <div
          className={`absolute left-0 ${
            openUpward ? 'bottom-full mb-2' : 'top-full mt-2'
          } z-[100] w-[310px] sm:w-[325px] bg-white rounded-2xl shadow-[0_16px_40px_rgba(0,0,0,0.22)] border border-slate-200/90 p-3.5 animate-in fade-in zoom-in-95 duration-150 select-none`}
        >
          {/* Header: Custom Month & Year Selectors + Arrow Nav */}
          <div className="flex items-center justify-between gap-1 pb-3 border-b border-slate-100 relative">
            {/* Prev Month */}
            <button
              type="button"
              onClick={handlePrevMonth}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-text-high-contrast hover:bg-slate-100 transition-colors shrink-0"
              title="Tháng trước"
            >
              <span className="material-symbols-outlined text-[20px]">chevron_left</span>
            </button>

            {/* Custom Month & Year Selectors */}
            <div className="flex items-center gap-1.5 flex-1 justify-center relative">
              {/* Custom Month Dropdown */}
              <div className="relative" ref={monthMenuRef}>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMonthOpen((prev) => !prev);
                    setIsYearOpen(false);
                  }}
                  className={`h-8 px-2.5 rounded-lg border text-xs font-bold flex items-center gap-1 transition-all select-none ${
                    isMonthOpen
                      ? 'border-crimson-primary bg-surface-crimson-subtle text-crimson-primary ring-2 ring-crimson-primary/20 shadow-xs'
                      : 'border-slate-200 bg-slate-50 text-text-body hover:bg-white hover:border-slate-300'
                  }`}
                >
                  <span>{months[viewMonth]}</span>
                  <span
                    className={`material-symbols-outlined text-[16px] transition-transform duration-200 ${
                      isMonthOpen ? 'rotate-180 text-crimson-primary' : 'text-text-muted'
                    }`}
                  >
                    expand_more
                  </span>
                </button>

                {/* Dropdown Menu for Months */}
                {isMonthOpen && (
                  <div
                    ref={monthListRef}
                    className="absolute left-1/2 -translate-x-1/2 top-full mt-1.5 z-40 w-36 max-h-56 overflow-y-auto bg-white rounded-xl shadow-[0_12px_28px_rgba(0,0,0,0.16)] border border-slate-200 p-1 space-y-0.5 animate-in fade-in zoom-in-95 duration-150"
                  >
                    {months.map((m, idx) => {
                      const isSelected = viewMonth === idx;
                      return (
                        <button
                          key={idx}
                          data-month={idx}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setViewMonth(idx);
                            setIsMonthOpen(false);
                          }}
                          className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-between transition-colors ${
                            isSelected
                              ? 'bg-crimson-primary text-white shadow-xs'
                              : 'text-text-body hover:bg-surface-crimson-subtle hover:text-crimson-primary'
                          }`}
                        >
                          <span>{m}</span>
                          {isSelected && (
                            <span className="material-symbols-outlined text-[14px]">check</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Custom Year Dropdown */}
              <div className="relative" ref={yearMenuRef}>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsYearOpen((prev) => !prev);
                    setIsMonthOpen(false);
                  }}
                  className={`h-8 px-2.5 rounded-lg border text-xs font-bold flex items-center gap-1 transition-all select-none ${
                    isYearOpen
                      ? 'border-crimson-primary bg-surface-crimson-subtle text-crimson-primary ring-2 ring-crimson-primary/20 shadow-xs'
                      : 'border-slate-200 bg-slate-50 text-text-body hover:bg-white hover:border-slate-300'
                  }`}
                >
                  <span>{viewYear}</span>
                  <span
                    className={`material-symbols-outlined text-[16px] transition-transform duration-200 ${
                      isYearOpen ? 'rotate-180 text-crimson-primary' : 'text-text-muted'
                    }`}
                  >
                    expand_more
                  </span>
                </button>

                {/* Dropdown Menu for Years */}
                {isYearOpen && (
                  <div
                    ref={yearListRef}
                    className="absolute left-1/2 -translate-x-1/2 top-full mt-1.5 z-40 w-28 max-h-56 overflow-y-auto bg-white rounded-xl shadow-[0_12px_28px_rgba(0,0,0,0.16)] border border-slate-200 p-1 space-y-0.5 animate-in fade-in zoom-in-95 duration-150"
                  >
                    {years.map((y) => {
                      const isSelected = viewYear === y;
                      return (
                        <button
                          key={y}
                          data-year={y}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setViewYear(y);
                            setIsYearOpen(false);
                          }}
                          className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-between transition-colors ${
                            isSelected
                              ? 'bg-crimson-primary text-white shadow-xs'
                              : 'text-text-body hover:bg-surface-crimson-subtle hover:text-crimson-primary'
                          }`}
                        >
                          <span>{y}</span>
                          {isSelected && (
                            <span className="material-symbols-outlined text-[14px]">check</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Next Month */}
            <button
              type="button"
              onClick={handleNextMonth}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-text-high-contrast hover:bg-slate-100 transition-colors shrink-0"
              title="Tháng sau"
            >
              <span className="material-symbols-outlined text-[20px]">chevron_right</span>
            </button>
          </div>

          {/* Weekday Labels Header */}
          <div className="grid grid-cols-7 gap-1 pt-2.5 pb-1 text-center">
            {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((w, idx) => (
              <span
                key={idx}
                className="text-[11px] font-bold text-text-muted py-0.5 tracking-wider"
              >
                {w}
              </span>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1 pt-1">
            {calendarDays.map((item, index) => {
              const disabled = isDateDisabled(item.year, item.month, item.day);
              const mPad = String(item.month + 1).padStart(2, '0');
              const dPad = String(item.day).padStart(2, '0');
              const isoString = `${item.year}-${mPad}-${dPad}`;
              const isSelected = value === isoString;

              return (
                <button
                  key={index}
                  type="button"
                  disabled={disabled}
                  onClick={() => handleSelectDay(item.year, item.month, item.day)}
                  className={`h-8 w-full rounded-lg text-xs font-semibold flex items-center justify-center transition-all ${
                    isSelected
                      ? 'bg-crimson-primary text-white font-bold shadow-[0_4px_12px_rgba(227,30,36,0.35)] scale-105'
                      : disabled
                      ? 'text-slate-300 opacity-40 cursor-not-allowed'
                      : item.isCurrentMonth
                      ? 'text-text-high-contrast hover:bg-surface-crimson-soft hover:text-crimson-dark'
                      : 'text-slate-300 hover:bg-slate-100'
                  }`}
                >
                  {item.day}
                </button>
              );
            })}
          </div>

          {/* Footer Quick Action */}
          <div className="pt-2.5 mt-2 border-t border-slate-100 flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={() => {
                const today = new Date();
                const y = today.getFullYear();
                const m = String(today.getMonth() + 1).padStart(2, '0');
                const d = String(today.getDate()).padStart(2, '0');
                onChange(`${y}-${m}-${d}`);
                setIsOpen(false);
                setIsMonthOpen(false);
                setIsYearOpen(false);
              }}
              className="text-crimson-primary hover:text-crimson-dark font-bold py-1 px-1.5 rounded transition-colors"
            >
              Hôm nay
            </button>
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setIsMonthOpen(false);
                setIsYearOpen(false);
              }}
              className="text-text-muted hover:text-text-high-contrast font-medium py-1 px-1.5 rounded transition-colors"
            >
              Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
