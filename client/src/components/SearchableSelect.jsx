import React, { useState, useRef, useEffect, useMemo } from 'react';

/**
 * Loại bỏ dấu tiếng Việt để tìm kiếm không dấu (ví dụ: 'hà nội' -> 'ha noi')
 */
const removeVietnameseTones = (str) => {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase();
};

/**
 * SearchableSelect Component (Autocomplete / Combobox)
 * Chuẩn DOL Crimson Design System
 * - Người dùng gõ trực tiếp từ bàn phím vào chính ô input để lọc danh sách tức thì
 * - Menu popover hiển thị danh sách 5 mục với thanh scrollbar tinh tế
 * - Chọn mục bằng click chuột hoặc nhấn Enter
 * - Tự động phát hiện hướng mở (lên trên hoặc xuống dưới) theo khoảng trống màn hình
 */
export default function SearchableSelect({
  value = '',
  onChange,
  options = [],
  placeholder = 'Chọn...',
  icon = 'location_on',
  disabled = false,
  loading = false,
  required = false,
  className = '',
  emptyText = 'Không tìm thấy kết quả phù hợp',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);

  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  // Tìm item đang được chọn hiện tại
  const selectedItem = useMemo(() => {
    if (!value) return null;
    return options.find((opt) => String(opt.code) === String(value)) || null;
  }, [value, options]);

  // Đồng bộ text trong input khi prop value hoặc options thay đổi (và người dùng không đang gõ)
  useEffect(() => {
    if (isTyping) return;
    if (selectedItem) {
      setInputText(selectedItem.name);
    } else {
      setInputText('');
    }
  }, [selectedItem, isTyping]);

  // Danh sách các mục sau khi lọc theo từ khóa mà người dùng đang gõ trực tiếp
  const filteredOptions = useMemo(() => {
    if (!isTyping || !inputText.trim()) {
      return options;
    }
    const cleanQuery = removeVietnameseTones(inputText.trim());
    return options.filter((item) => {
      const cleanName = removeVietnameseTones(item.name || '');
      return cleanName.includes(cleanQuery);
    });
  }, [options, inputText, isTyping]);

  // Tự động phát hiện hướng mở (lên trên hoặc xuống dưới)
  useEffect(() => {
    if (isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const spaceBelow = windowHeight - rect.bottom;
      const spaceAbove = rect.top;
      // Chiều cao dropdown khoảng 206px (190px cho 5 items + padding)
      if (spaceBelow < 215 && spaceAbove > spaceBelow) {
        setOpenUpward(true);
      } else {
        setOpenUpward(false);
      }
    }
  }, [isOpen]);

  // Tự động cuộn đến mục đã chọn khi mở danh sách
  useEffect(() => {
    if (isOpen && value && listRef.current && !isTyping) {
      const timer = setTimeout(() => {
        const activeEl = listRef.current?.querySelector(`[data-code="${value}"]`);
        if (activeEl) {
          activeEl.scrollIntoView({ block: 'nearest' });
        }
      }, 40);
      return () => clearTimeout(timer);
    }
  }, [isOpen, value, isTyping]);

  // Đóng dropdown khi click ra ngoài container
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
        setIsTyping(false);
        // Khôi phục lại tên item đã chọn nếu chưa chọn item mới
        if (selectedItem) {
          setInputText(selectedItem.name);
        } else {
          setInputText('');
        }
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, selectedItem]);

  // Khi người dùng gõ vào ô input
  const handleInputChange = (e) => {
    const val = e.target.value;
    setInputText(val);
    setIsTyping(true);
    if (!isOpen) {
      setIsOpen(true);
    }
  };

  // Khi click vào ô input
  const handleInputClick = () => {
    if (!disabled) {
      if (!isOpen) {
        setIsOpen(true);
      }
    }
  };

  // Khi ô input được focus
  const handleInputFocus = () => {
    if (!disabled && !isOpen) {
      setIsOpen(true);
    }
  };

  // Khi ô input mất focus (Blur)
  const handleInputBlur = (e) => {
    // Nếu click vào một mục trong danh sách dropdown thì bỏ qua vì handleSelect sẽ xử lý
    if (containerRef.current && containerRef.current.contains(e.relatedTarget)) {
      return;
    }

    setIsOpen(false);
    setIsTyping(false);

    const trimmed = inputText.trim();
    if (!trimmed) {
      setInputText('');
      onChange(null);
      return;
    }

    // Kiểm tra xem chuỗi vừa gõ có khớp chính xác với mục nào trong danh sách không
    const clean = removeVietnameseTones(trimmed);
    const exactMatch = options.find((o) => removeVietnameseTones(o.name) === clean);
    if (exactMatch) {
      setInputText(exactMatch.name);
      onChange(exactMatch);
    } else if (selectedItem) {
      // Khôi phục lại giá trị hợp lệ trước đó
      setInputText(selectedItem.name);
    } else {
      setInputText('');
      onChange(null);
    }
  };

  // Khi chọn một mục từ danh sách dropdown
  const handleSelect = (item) => {
    setInputText(item.name);
    setIsTyping(false);
    onChange(item);
    setIsOpen(false);
  };

  // Nút xóa nhanh lựa chọn
  const handleClear = (e) => {
    e.stopPropagation();
    setInputText('');
    setIsTyping(false);
    onChange(null);
    setIsOpen(true);
    inputRef.current?.focus();
  };

  // Nút bấm chevron mở/đóng danh sách
  const toggleOpen = (e) => {
    e.stopPropagation();
    if (disabled) return;
    if (isOpen) {
      setIsOpen(false);
      setIsTyping(false);
      if (selectedItem) {
        setInputText(selectedItem.name);
      }
    } else {
      setIsOpen(true);
      setIsTyping(false);
      inputRef.current?.focus();
    }
  };

  // Xử lý phím Enter / Escape trong ô input
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      setIsTyping(false);
      if (selectedItem) {
        setInputText(selectedItem.name);
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (isOpen && filteredOptions.length > 0) {
        handleSelect(filteredOptions[0]);
        inputRef.current?.blur();
      }
    }
  };

  return (
    <div className={`relative w-full ${className}`} ref={containerRef}>
      {/* Real Input Element Box */}
      <div className="relative w-full">
        {/* Left Icon Button */}
        <button
          type="button"
          tabIndex={-1}
          onClick={toggleOpen}
          disabled={disabled}
          className={`material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[18px] transition-colors p-0 border-0 bg-transparent flex items-center justify-center select-none z-10 ${
            disabled
              ? 'text-text-disabled cursor-not-allowed'
              : isOpen
              ? 'text-crimson-primary cursor-pointer'
              : 'text-text-muted hover:text-crimson-primary cursor-pointer'
          }`}
          title={isOpen ? 'Đóng danh sách' : 'Mở danh sách'}
        >
          {icon}
        </button>

        {/* User Types Directly Here */}
        <input
          ref={inputRef}
          type="text"
          value={inputText}
          onChange={handleInputChange}
          onClick={handleInputClick}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          required={required}
          placeholder={loading ? 'Đang tải dữ liệu...' : placeholder}
          className={`w-full h-11 pl-10 ${
            inputText && !disabled ? 'pr-14' : 'pr-10'
          } rounded-xl border bg-white text-sm font-medium transition-all focus:outline-none ${
            disabled
              ? 'bg-slate-50 border-slate-200 text-text-disabled cursor-not-allowed opacity-80'
              : isOpen
              ? 'ring-2 ring-crimson-primary/20 border-crimson-primary shadow-xs text-text-high-contrast'
              : 'border-slate-200 text-text-high-contrast hover:border-slate-300 focus:border-crimson-primary focus:ring-2 focus:ring-crimson-primary/20'
          } placeholder:text-text-disabled`}
        />

        {/* Right Action Icons: Loading / Clear (x) / Chevron */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-0.5 z-10">
          {loading ? (
            <span className="material-symbols-outlined animate-spin text-[18px] text-crimson-primary p-1">
              progress_activity
            </span>
          ) : (
            <>
              {inputText && !disabled ? (
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={handleClear}
                  className="text-text-disabled hover:text-text-high-contrast transition-colors p-1 cursor-pointer rounded-full flex items-center justify-center hover:bg-slate-100"
                  title="Xóa lựa chọn"
                >
                  <span className="material-symbols-outlined text-[16px]">cancel</span>
                </button>
              ) : null}

              <button
                type="button"
                tabIndex={-1}
                disabled={disabled}
                onClick={toggleOpen}
                className="text-text-muted hover:text-crimson-primary transition-colors p-1 cursor-pointer flex items-center justify-center rounded-full hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                title={isOpen ? 'Đóng danh sách' : 'Mở danh sách'}
              >
                <span
                  className={`material-symbols-outlined text-[20px] transition-transform duration-200 select-none ${
                    isOpen ? 'rotate-180 text-crimson-primary' : ''
                  }`}
                >
                  expand_more
                </span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Dropdown Popover: 5-Item Scrollable Options List */}
      {isOpen && !disabled && (
        <div
          className={`absolute left-0 ${
            openUpward ? 'bottom-full mb-1.5' : 'top-full mt-1.5'
          } z-50 w-full bg-white rounded-2xl shadow-[0_16px_36px_rgba(0,0,0,0.18)] border border-slate-200/90 p-1.5 animate-in fade-in zoom-in-95 duration-150 select-none`}
        >
          {/* Scrollable Container (Xuất hiện 5 mục với thanh scrollbar) */}
          <div
            ref={listRef}
            className="max-h-[190px] overflow-y-auto space-y-0.5 custom-scrollbar pr-0.5"
            style={{ scrollbarWidth: 'thin' }}
          >
            {filteredOptions.length > 0 ? (
              filteredOptions.map((item) => {
                const isSelected = String(item.code) === String(value);
                return (
                  <button
                    key={item.code}
                    type="button"
                    data-code={item.code}
                    onClick={() => handleSelect(item)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-crimson-primary text-white shadow-xs font-bold'
                        : 'text-text-body hover:bg-surface-crimson-subtle hover:text-crimson-primary'
                    }`}
                  >
                    <span className="truncate">{item.name}</span>
                    {isSelected && (
                      <span className="material-symbols-outlined text-[16px] shrink-0 ml-1.5">
                        check
                      </span>
                    )}
                  </button>
                );
              })
            ) : (
              <div className="py-5 text-center text-xs text-text-muted">
                <span className="material-symbols-outlined text-[22px] text-slate-300 block mb-1 mx-auto">
                  search_off
                </span>
                <span>{emptyText}</span>
              </div>
            )}
          </div>

          {/* Footer count when filtering */}
          {isTyping && filteredOptions.length > 0 && (
            <div className="pt-1.5 mt-1 border-t border-slate-100 flex items-center justify-between text-[11px] text-text-muted px-1.5">
              <span>{filteredOptions.length} kết quả phù hợp</span>
              <span className="text-crimson-primary font-medium">Nhấn Enter để chọn</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
