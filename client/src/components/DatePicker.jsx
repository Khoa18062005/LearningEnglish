import React, { useState, useRef, useEffect, useMemo } from 'react';

/**
 * Custom DatePicker Component
 * Phù hợp với DOL Crimson Design System
 * Hỗ trợ chọn Ngày sinh nhanh chóng qua Dropdown Năm (1940 - Hiện tại) và Tháng (1 - 12)
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
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Phân tích giá trị ban đầu nếu có, hoặc mặc định năm 2000 cho ngày sinh
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
      year: today.getFullYear() - 18, // Mặc định mở ở 18 tuổi (~2008)
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

  // Đóng popover khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
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
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const handleNextMonth = (e) => {
    e.stopPropagation();
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
        onClick={() => setIsOpen(!isOpen)}
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

      {/* Popover Calendar Dropdown */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-2 z-50 w-[310px] sm:w-[325px] bg-white rounded-2xl shadow-[0_16px_40px_rgba(0,0,0,0.18)] border border-slate-200/90 p-3.5 animate-in fade-in zoom-in-95 duration-150 select-none">
          {/* Header: Month & Year Selectors + Arrow Nav */}
          <div className="flex items-center justify-between gap-1.5 pb-3 border-b border-slate-100">
            {/* Prev Month */}
            <button
              type="button"
              onClick={handlePrevMonth}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-text-high-contrast hover:bg-slate-100 transition-colors shrink-0"
              title="Tháng trước"
            >
              <span className="material-symbols-outlined text-[20px]">chevron_left</span>
            </button>

            {/* Month & Year Selects */}
            <div className="flex items-center gap-1.5 flex-1 justify-center">
              {/* Month Select */}
              <select
                value={viewMonth}
                onChange={(e) => setViewMonth(parseInt(e.target.value, 10))}
                className="h-8 px-2 py-0 rounded-lg border border-slate-200 bg-slate-50 text-xs font-bold text-text-body focus:outline-none focus:border-crimson-primary cursor-pointer hover:bg-white transition-colors"
              >
                {months.map((m, idx) => (
                  <option key={idx} value={idx}>
                    {m}
                  </option>
                ))}
              </select>

              {/* Year Select (Chọn nhanh từ 1940 - Hiện tại) */}
              <select
                value={viewYear}
                onChange={(e) => setViewYear(parseInt(e.target.value, 10))}
                className="h-8 px-2 py-0 rounded-lg border border-slate-200 bg-slate-50 text-xs font-bold text-text-body focus:outline-none focus:border-crimson-primary cursor-pointer hover:bg-white transition-colors"
              >
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
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
              }}
              className="text-crimson-primary hover:text-crimson-dark font-bold py-1 px-1.5 rounded transition-colors"
            >
              Hôm nay
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
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
