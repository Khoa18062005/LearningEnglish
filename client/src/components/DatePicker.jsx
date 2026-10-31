import React, { useState, useRef, useEffect, useMemo } from 'react';

/**
 * Custom DatePicker Component
 * Phù hợp với DOL Crimson Design System
 * Hỗ trợ:
 * 1. Nhập trực tiếp ngày/tháng/năm từ bàn phím (định dạng dd/mm/yyyy, tự động chèn dấu /, hỗ trợ paste/xóa/phím tắt)
 * 2. Chọn qua Custom Dropdown Năm (1940 - Hiện tại) và Tháng (1 - 12) + Lịch ngày
 * Giá trị value & onChange định dạng chuẩn ISO: 'YYYY-MM-DD'
 */
export default function DatePicker({
  value = '',
  onChange,
  placeholder = 'dd/mm/yyyy',
  maxDate = new Date().toISOString().split('T')[0],
  minDate = '1940-01-01',
  required = false,
  disabled = false,
  className = '',
  placement = 'auto', // 'auto' | 'bottom' | 'top'
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMonthOpen, setIsMonthOpen] = useState(false);
  const [isYearOpen, setIsYearOpen] = useState(false);
  const [openUpward, setOpenUpward] = useState(placement === 'top');

  // Giá trị text đang nhập trong input (dd/mm/yyyy)
  const [inputValue, setInputValue] = useState(() => {
    if (value) {
      const parts = value.split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
    }
    return '';
  });

  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const isTypingRef = useRef(false);
  const isBackspaceRef = useRef(false);
  const monthMenuRef = useRef(null);
  const yearMenuRef = useRef(null);
  const monthListRef = useRef(null);
  const yearListRef = useRef(null);

  // Helper phân tích chuỗi DD/MM/YYYY thành { day, month, year }
  const parseDateString = (str) => {
    if (!str) return null;
    const parts = str.trim().split(/[/.-]/);
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10);
      const year = parseInt(parts[2], 10);
      if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
        return { day, month, year };
      }
    }
    return null;
  };

  // Helper kiểm tra tính hợp lệ của ngày tháng năm (bao gồm năm nhuận và min/max date)
  const isValidDate = (day, month, year, minLimit = minDate, maxLimit = maxDate) => {
    if (!day || !month || !year) return false;
    const currentMaxYear = parseInt(maxLimit.split('-')[0], 10) || new Date().getFullYear();
    const currentMinYear = parseInt(minLimit.split('-')[0], 10) || 1940;

    if (year < currentMinYear || year > currentMaxYear) return false;
    if (month < 1 || month > 12) return false;

    // Số ngày tối đa trong tháng đó của năm (new Date(year, month, 0).getDate() xử lý đúng cả năm nhuận)
    const daysInMonth = new Date(year, month, 0).getDate();
    if (day < 1 || day > daysInMonth) return false;

    const targetDate = new Date(year, month - 1, day);
    if (maxLimit) {
      const [maxY, maxM, maxD] = maxLimit.split('-').map(Number);
      const max = new Date(maxY, maxM - 1, maxD, 23, 59, 59, 999);
      if (targetDate > max) return false;
    }
    if (minLimit) {
      const [minY, minM, minD] = minLimit.split('-').map(Number);
      const min = new Date(minY, minM - 1, minD, 0, 0, 0, 0);
      if (targetDate < min) return false;
    }

    return true;
  };

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

  // Khi value thay đổi từ ngoài và người dùng không đang gõ, cập nhật view và text hiển thị
  useEffect(() => {
    if (isTypingRef.current) return;

    if (value) {
      const parts = value.split('-');
      if (parts.length === 3) {
        setInputValue(`${parts[2]}/${parts[1]}/${parts[0]}`);
        setViewYear(parseInt(parts[0], 10));
        setViewMonth(parseInt(parts[1], 10) - 1);
      }
    } else {
      setInputValue('');
    }
  }, [value]);

  // Đóng toàn bộ popover khi click ra ngoài container
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
    return !isValidDate(day, month + 1, year, minDate, maxDate);
  };

  // Chọn ngày từ lịch click
  const handleSelectDay = (year, month, day) => {
    if (isDateDisabled(year, month, day)) return;

    // Chuẩn hóa tháng và năm nếu bấm vào ngày tháng lân cận
    const dateObj = new Date(year, month, day);
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const d = String(dateObj.getDate()).padStart(2, '0');

    const formattedIso = `${y}-${m}-${d}`;
    isTypingRef.current = false;
    setInputValue(`${d}/${m}/${y}`);
    onChange(formattedIso);
    setIsOpen(false);
    setIsMonthOpen(false);
    setIsYearOpen(false);
  };

  // Xử lý khi gõ bàn phím vào ô nhập
  const handleInputChange = (e) => {
    isTypingRef.current = true;
    let val = e.target.value;

    if (!val) {
      setInputValue('');
      onChange('');
      return;
    }

    const isBackspace = isBackspaceRef.current || e.nativeEvent?.inputType?.includes('delete');

    // Chuyển dấu gạch ngang hoặc chấm thành gạch chéo /
    val = val.replace(/[-.]/g, '/');

    // Chỉ giữ lại chữ số và ký tự gạch chéo /
    val = val.replace(/[^\d/]/g, '');

    // Loại bỏ gạch chéo ở đầu
    val = val.replace(/^\/+/, '');

    // Tránh nhiều dấu gạch chéo liên tiếp
    val = val.replace(/\/+/g, '/');

    if (!isBackspace) {
      // Khi gõ 2 chữ số ngày: tự động thêm /
      if (/^\d{2}$/.test(val)) {
        val = val + '/';
      }
      // Khi gõ 1 chữ số rồi gõ /: tự động bổ sung số 0 ở đầu (ví dụ: 5/ -> 05/)
      else if (/^\d\/$/.test(val)) {
        val = '0' + val;
      }
      // Khi gõ tiếp 2 chữ số tháng: tự động thêm /
      else if (/^\d{2}\/\d{2}$/.test(val)) {
        val = val + '/';
      }
      // Khi gõ tháng 1 chữ số rồi gõ /: tự động bổ sung số 0 ở đầu tháng
      else if (/^\d{2}\/\d\/$/.test(val)) {
        const parts = val.split('/');
        val = `${parts[0]}/0${parts[1]}/`;
      }
    }

    // Giới hạn tối đa 10 ký tự: dd/mm/yyyy
    if (val.length > 10) {
      val = val.slice(0, 10);
    }

    setInputValue(val);

    // Khi đã gõ đủ 10 ký tự, kiểm tra tính hợp lệ và đồng bộ lịch
    if (val.length === 10) {
      const parsed = parseDateString(val);
      if (parsed) {
        const { day, month, year } = parsed;
        if (isValidDate(day, month, year, minDate, maxDate)) {
          const mPad = String(month).padStart(2, '0');
          const dPad = String(day).padStart(2, '0');
          const iso = `${year}-${mPad}-${dPad}`;
          setViewYear(year);
          setViewMonth(month - 1);
          onChange(iso);
          return;
        }
      }
    }

    // Nếu chưa đủ ngày hoàn chỉnh hoặc ngày không hợp lệ, xóa giá trị ở parent để tránh submit sai
    if (value) {
      onChange('');
    }
  };

  // Phím bấm: Enter để xác nhận & đóng, Escape để đóng, Backspace flag
  const handleKeyDown = (e) => {
    if (e.key === 'Backspace') {
      isBackspaceRef.current = true;
    } else {
      isBackspaceRef.current = false;
    }

    if (e.key === 'Escape') {
      setIsOpen(false);
      setIsMonthOpen(false);
      setIsYearOpen(false);
    } else if (e.key === 'Enter') {
      const parsed = parseDateString(inputValue);
      if (parsed) {
        const { day, month, year } = parsed;
        if (isValidDate(day, month, year, minDate, maxDate)) {
          e.preventDefault();
          const mPad = String(month).padStart(2, '0');
          const dPad = String(day).padStart(2, '0');
          const formatted = `${dPad}/${mPad}/${year}`;
          const iso = `${year}-${mPad}-${dPad}`;
          isTypingRef.current = false;
          setInputValue(formatted);
          setViewYear(year);
          setViewMonth(month - 1);
          onChange(iso);
          setIsOpen(false);
          setIsMonthOpen(false);
          setIsYearOpen(false);
          inputRef.current?.blur();
        }
      }
    }
  };

  // Hỗ trợ paste chuỗi ngày tháng ở nhiều định dạng: dd/mm/yyyy, yyyy-mm-dd, hoặc ddmmyyyy
  const handlePaste = (e) => {
    const pasteData = e.clipboardData.getData('text').trim();

    // Dạng ISO: YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(pasteData)) {
      e.preventDefault();
      const [y, m, d] = pasteData.split('-').map(Number);
      if (isValidDate(d, m, y, minDate, maxDate)) {
        const mPad = String(m).padStart(2, '0');
        const dPad = String(d).padStart(2, '0');
        isTypingRef.current = false;
        setInputValue(`${dPad}/${mPad}/${y}`);
        setViewYear(y);
        setViewMonth(m - 1);
        onChange(`${y}-${mPad}-${dPad}`);
      }
      return;
    }

    // Dạng 8 số liền: DDMMYYYY
    if (/^\d{8}$/.test(pasteData)) {
      e.preventDefault();
      const d = parseInt(pasteData.slice(0, 2), 10);
      const m = parseInt(pasteData.slice(2, 4), 10);
      const y = parseInt(pasteData.slice(4, 8), 10);
      if (isValidDate(d, m, y, minDate, maxDate)) {
        const mPad = String(m).padStart(2, '0');
        const dPad = String(d).padStart(2, '0');
        isTypingRef.current = false;
        setInputValue(`${dPad}/${mPad}/${y}`);
        setViewYear(y);
        setViewMonth(m - 1);
        onChange(`${y}-${mPad}-${dPad}`);
      }
      return;
    }
  };

  // Khi rời khỏi ô nhập (Blur)
  const handleBlur = (e) => {
    // Nếu click vào nội dung trong popover của DatePicker, không reset
    if (containerRef.current && containerRef.current.contains(e.relatedTarget)) {
      return;
    }

    isTypingRef.current = false;

    if (!inputValue.trim()) {
      setInputValue('');
      if (value) onChange('');
      return;
    }

    const parsed = parseDateString(inputValue);
    if (parsed) {
      const { day, month, year } = parsed;
      if (isValidDate(day, month, year, minDate, maxDate)) {
        const mPad = String(month).padStart(2, '0');
        const dPad = String(day).padStart(2, '0');
        const formatted = `${dPad}/${mPad}/${year}`;
        const iso = `${year}-${mPad}-${dPad}`;
        setInputValue(formatted);
        setViewYear(year);
        setViewMonth(month - 1);
        onChange(iso);
        return;
      }
    }

    // Nếu chuỗi nhập dở dang hoặc ngày không hợp lệ, khôi phục lại giá trị hợp lệ trước đó hoặc xóa rỗng
    if (value) {
      const parts = value.split('-');
      if (parts.length === 3) {
        setInputValue(`${parts[2]}/${parts[1]}/${parts[0]}`);
      } else {
        setInputValue('');
      }
    } else {
      setInputValue('');
    }
  };

  // Nút xóa nhanh ngày đã chọn
  const handleClear = (e) => {
    e.stopPropagation();
    isTypingRef.current = false;
    setInputValue('');
    onChange('');
    setIsMonthOpen(false);
    setIsYearOpen(false);
    inputRef.current?.focus();
  };

  // Nút đóng/mở popover lịch
  const toggleOpen = (e) => {
    e.stopPropagation();
    setIsOpen((prev) => !prev);
    setIsMonthOpen(false);
    setIsYearOpen(false);
    if (!isOpen) {
      inputRef.current?.focus();
    }
  };

  // Nút chọn nhanh "Hôm nay"
  const handleSelectToday = () => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    isTypingRef.current = false;
    setInputValue(`${d}/${m}/${y}`);
    onChange(`${y}-${m}-${d}`);
    setIsOpen(false);
    setIsMonthOpen(false);
    setIsYearOpen(false);
  };

  // Kiểm tra xem chuỗi đủ 10 ký tự có bị lỗi ngày không tồn tại hoặc ngoài khoảng không
  const isInvalidCompleteDate = useMemo(() => {
    if (inputValue.length === 10) {
      const parsed = parseDateString(inputValue);
      if (!parsed) return true;
      return !isValidDate(parsed.day, parsed.month, parsed.year, minDate, maxDate);
    }
    return false;
  }, [inputValue, minDate, maxDate]);

  return (
    <div className="relative w-full" ref={containerRef}>
      {/* Input Box Wrapper */}
      <div className="relative w-full">
        {/* Left Calendar Icon Button */}
        <button
          type="button"
          onClick={toggleOpen}
          tabIndex={-1}
          disabled={disabled}
          className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-crimson-primary text-[19px] transition-colors cursor-pointer select-none z-10 p-0 border-0 bg-transparent flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          title={isOpen ? 'Đóng lịch' : 'Mở lịch'}
        >
          calendar_month
        </button>

        {/* Real Input Element for Keyboard Typing */}
        <input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          onFocus={() => {
            if (!isOpen) setIsOpen(true);
            setIsMonthOpen(false);
            setIsYearOpen(false);
          }}
          onBlur={handleBlur}
          onClick={() => {
            if (!isOpen) setIsOpen(true);
          }}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          title={
            isInvalidCompleteDate
              ? 'Ngày không hợp lệ hoặc nằm ngoài khoảng cho phép (1940 - Hiện tại)'
              : undefined
          }
          className={`w-full h-11 pl-10 ${
            inputValue ? 'pr-14' : 'pr-10'
          } rounded-xl border bg-white text-sm font-medium transition-all focus:outline-none ${
            isInvalidCompleteDate
              ? 'border-red-400 text-red-600 focus:border-red-500 focus:ring-2 focus:ring-red-200'
              : isOpen
              ? 'ring-2 ring-crimson-primary/20 border-crimson-primary shadow-xs text-text-high-contrast'
              : 'border-slate-200 text-text-high-contrast hover:border-slate-300 focus:border-crimson-primary focus:ring-2 focus:ring-crimson-primary/20'
          } placeholder:text-text-disabled disabled:bg-slate-50 disabled:text-text-disabled disabled:cursor-not-allowed ${className}`}
        />

        {/* Right Action Icons: Clear & Expand Toggle */}
        <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1 z-10">
          {inputValue && !disabled ? (
            <button
              type="button"
              onClick={handleClear}
              className="text-text-disabled hover:text-text-high-contrast transition-colors p-0.5 cursor-pointer flex items-center justify-center rounded-full hover:bg-slate-100"
              title="Xóa ngày"
            >
              <span className="material-symbols-outlined text-[16px]">cancel</span>
            </button>
          ) : null}

          <button
            type="button"
            onClick={toggleOpen}
            tabIndex={-1}
            disabled={disabled}
            className="text-text-muted hover:text-crimson-primary transition-colors p-0.5 cursor-pointer flex items-center justify-center rounded-full hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
            title={isOpen ? 'Đóng lịch' : 'Mở lịch'}
          >
            <span
              className={`material-symbols-outlined text-[20px] transition-transform duration-200 select-none ${
                isOpen ? 'rotate-180 text-crimson-primary' : ''
              }`}
            >
              expand_more
            </span>
          </button>
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
              const disabledDay = isDateDisabled(item.year, item.month, item.day);
              const mPad = String(item.month + 1).padStart(2, '0');
              const dPad = String(item.day).padStart(2, '0');
              const isoString = `${item.year}-${mPad}-${dPad}`;
              const isSelected = value === isoString;

              return (
                <button
                  key={index}
                  type="button"
                  disabled={disabledDay}
                  onClick={() => handleSelectDay(item.year, item.month, item.day)}
                  className={`h-8 w-full rounded-lg text-xs font-semibold flex items-center justify-center transition-all ${
                    isSelected
                      ? 'bg-crimson-primary text-white font-bold shadow-[0_4px_12px_rgba(227,30,36,0.35)] scale-105'
                      : disabledDay
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
              onClick={handleSelectToday}
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
