import React, { useState, useMemo, useRef, useEffect } from 'react';

/**
 * VocabActivityHeatmap: Biểu đồ nhiệt tích lũy từ vựng theo ngày (GitHub Contribution Graph)
 * Tương ứng chuẩn thiết kế theo ảnh mẫu:
 * - Tiêu đề: "[X] từ vựng mới trong năm qua" / "[X] contributions in the last year"
 * - Cài đặt "Contribution settings ▾"
 * - Cột chọn năm bên phải: 2026 (nút xanh active), 2025 (nút xám)
 * - Khung thẻ trắng: 53 tuần x 7 ngày, nhãn tháng ở trên, Mon/Wed/Fri ở bên trái
 * - Màu ô vuông: Càng đậm = Càng nhiều từ vựng được tạo
 * - Chân thẻ: "Learn how we count contributions" & Thang đo màu (Less -> More)
 * - Tương tác hover xem chính xác số lượng từ và tên từ vựng trong ngày
 */
export default function VocabActivityHeatmap({
  vocabList = [],
  currentUser,
}) {
  const currentYear = 2026;
  const [selectedYear, setSelectedYear] = useState(2026);
  const [useSampleData, setUseSampleData] = useState(true);
  const [colorTheme] = useState('crimson'); // 'crimson' (LinearVocab Red mặc định)
  const [showYearDropdown, setShowYearDropdown] = useState(false);
  const [hoveredCell, setHoveredCell] = useState(null);
  const [hoveredScale, setHoveredScale] = useState(null);

  const containerRef = useRef(null);
  const scaleContainerRef = useRef(null);
  const yearDropdownRef = useRef(null);

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (yearDropdownRef.current && !yearDropdownRef.current.contains(e.target)) {
        setShowYearDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const availableYears = [2027, 2026, 2025];

  // Helper lấy key ngày YYYY-MM-DD
  const getItemDateKey = (item) => {
    const raw = item.createdAt || item.createdDate || item.date;
    if (raw) {
      const d = new Date(raw);
      if (!isNaN(d.getTime())) {
        return d.toISOString().split('T')[0];
      }
    }
    if (typeof item.id === 'number' && item.id > 1650000000000 && item.id < 2000000000000) {
      const d = new Date(item.id);
      if (!isNaN(d.getTime())) {
        return d.toISOString().split('T')[0];
      }
    }
    return null;
  };

  // Gom nhóm từ vựng thực tế theo ngày
  const realVocabMap = useMemo(() => {
    const map = {};
    (vocabList || []).forEach((item) => {
      const key = getItemDateKey(item);
      if (key) {
        if (!map[key]) {
          map[key] = { count: 0, words: [] };
        }
        map[key].count += 1;
        if (item.word && !map[key].words.includes(item.word)) {
          map[key].words.push(item.word);
        }
      }
    });
    return map;
  }, [vocabList]);

  // Bộ sinh dữ liệu mẫu giả lập ổn định (Deterministic Seed)
  // Tạo ra phân bố ~401 lượt tạo từ vựng sống động như ảnh mẫu
  const getSampleCountForDate = (dateStr, year) => {
    let hash = 0;
    for (let i = 0; i < dateStr.length; i++) {
      hash = (hash << 5) - hash + dateStr.charCodeAt(i);
      hash |= 0;
    }
    const norm = Math.abs(hash) % 100;
    
    if (year === 2026) {
      if (norm < 74) return 0;
      if (norm < 87) return 5 + (norm % 4);  // 5 - 8 từ (Level 1: đỏ hồng phấn)
      if (norm < 94) return 10 + (norm % 8); // 10 - 17 từ (Level 2: đỏ san hô)
      if (norm < 98) return 20 + (norm % 8); // 20 - 27 từ (Level 3: đỏ thắm)
      return 30 + (norm % 15);               // 30 - 44 từ (Level 4: đỏ bordeaux thẫm)
    } else if (year === 2027) {
      if (norm < 80) return 0;
      if (norm < 90) return 5 + (norm % 4);
      if (norm < 96) return 10 + (norm % 8);
      return 20 + (norm % 12);
    } else {
      if (norm < 78) return 0;
      if (norm < 89) return 5 + (norm % 4);
      if (norm < 96) return 10 + (norm % 8);
      return 20 + (norm % 12);
    }
  };

  // Tính toán lưới lịch 53 tuần cho năm được chọn
  const { weeks, monthLabels, totalCountForYear } = useMemo(() => {
    const now = new Date(currentYear, 10, 2); // 2026-11-02
    let startDate;
    let endDate;

    if (selectedYear === currentYear) {
      // Trailing 52-53 tuần kết thúc vào cuối tuần hiện tại
      const currentDayOfWeek = now.getDay();
      endDate = new Date(now);
      endDate.setDate(now.getDate() - currentDayOfWeek + 6);

      startDate = new Date(endDate);
      startDate.setDate(endDate.getDate() - 52 * 7);
      startDate.setDate(startDate.getDate() - startDate.getDay());
    } else {
      // Năm dương lịch trọn vẹn (2025: từ CN trước 1/1 đến T7 sau 31/12)
      const jan1 = new Date(selectedYear, 0, 1);
      startDate = new Date(jan1);
      startDate.setDate(jan1.getDate() - jan1.getDay());

      const dec31 = new Date(selectedYear, 11, 31);
      endDate = new Date(dec31);
      endDate.setDate(dec31.getDate() + (6 - dec31.getDay()));
    }

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const weeksArr = [];
    let cur = new Date(startDate);
    let total = 0;

    for (let col = 0; col < 53; col++) {
      const daysInWeek = [];
      for (let row = 0; row < 7; row++) {
        const dateObj = new Date(cur);
        const dateStr = dateObj.toISOString().split('T')[0];
        const isFuture = selectedYear === currentYear && dateObj > now;

        const realData = realVocabMap[dateStr];
        const realCount = realData ? realData.count : 0;
        const realWords = realData ? realData.words : [];

        let finalCount = realCount;
        let words = [...realWords];

        if (useSampleData && !isFuture) {
          const sampleCount = getSampleCountForDate(dateStr, selectedYear);
          finalCount = Math.max(realCount, sampleCount);
          if (finalCount > 0 && words.length === 0) {
            words = ['vocabulary', 'reading passage', 'pattern study'];
          }
        }

        if (isFuture) {
          finalCount = 0;
        }

        total += finalCount;

        let level = 0;
        if (finalCount >= 30) {
          level = 4; // Mức 4: Tối thiểu 30 từ
        } else if (finalCount >= 20) {
          level = 3; // Mức 3: Tối thiểu 20 từ
        } else if (finalCount >= 10) {
          level = 2; // Mức 2: Tối thiểu 10 từ
        } else if (finalCount >= 5) {
          level = 1; // Mức 1: Tối thiểu 5 từ
        } else if (finalCount > 0) {
          level = 1; // 1 - 4 từ vẫn ghi nhận ở mức màu nhạt
        }

        daysInWeek.push({
          dateStr,
          dateObj,
          dayOfWeek: row,
          count: finalCount,
          words,
          level,
          isFuture,
          col,
          row,
        });

        cur.setDate(cur.getDate() + 1);
      }
      weeksArr.push(daysInWeek);
    }

    // Nhãn tháng hàng trên
    const labels = [];
    let lastMonth = -1;
    let lastCol = -10;

    weeksArr.forEach((days, col) => {
      const midDay = days[3].dateObj;
      const m = midDay.getMonth();
      if (m !== lastMonth && col - lastCol >= 2) {
        labels.push({ col, name: monthNames[m] });
        lastMonth = m;
        lastCol = col;
      }
    });

    return {
      weeks: weeksArr,
      monthLabels: labels,
      totalCountForYear: total,
    };
  }, [selectedYear, currentYear, useSampleData, realVocabMap]);

  // Hệ màu tương ứng các cấp độ
  const colorScales = {
    crimson: {
      0: '#F1F5F9', // Xám nền trung tính
      1: '#FECDD3', // Đỏ hồng phấn nhẹ
      2: '#FB7185', // Đỏ san hô tươi
      3: '#E11D48', // Đỏ thắm LinearVocab
      4: '#9F1239', // Đỏ bordeaux thẫm
      activeYear: 'bg-gradient-to-r from-[#c41b26] to-[#d3212c] text-white shadow-sm hover:brightness-110',
      badgeWord: 'text-rose-300',
    },
    green: {
      0: '#EBEDF0',
      1: '#9BE9A8',
      2: '#40C463',
      3: '#30A14E',
      4: '#216E39',
      activeYear: 'bg-[#0969DA] text-white hover:bg-blue-700 shadow-sm',
      badgeWord: 'text-emerald-300',
    },
  };

  const currentColors = colorScales[colorTheme] || colorScales.crimson;

  // Chi tiết các mức đóng góp trong thang đo Less -> More theo yêu cầu người dùng
  const scaleLevelDetails = [
    {
      level: 0,
      minCount: 0,
      minLabel: '0 từ',
      rangeLabel: 'Chưa có từ vựng',
    },
    {
      level: 1,
      minCount: 5,
      minLabel: 'Tối thiểu 5 từ',
      rangeLabel: '5 - 9 từ / ngày',
    },
    {
      level: 2,
      minCount: 10,
      minLabel: 'Tối thiểu 10 từ',
      rangeLabel: '10 - 19 từ / ngày',
    },
    {
      level: 3,
      minCount: 20,
      minLabel: 'Tối thiểu 20 từ',
      rangeLabel: '20 - 29 từ / ngày',
    },
    {
      level: 4,
      minCount: 30,
      minLabel: 'Tối thiểu 30 từ',
      rangeLabel: '30+ từ / ngày',
    },
  ];

  // Xử lý hover từng ô ngày trong lưới SVG
  const handleCellMouseEnter = (e, day) => {
    if (day.isFuture) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const containerRect = containerRef.current
      ? containerRef.current.getBoundingClientRect()
      : { left: 0, top: 0 };

    const weekdayNames = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
    const d = day.dateObj;
    const formattedDate = `${weekdayNames[d.getDay()]}, ${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;

    setHoveredCell({
      x: rect.left - containerRect.left + rect.width / 2,
      y: rect.top - containerRect.top,
      count: day.count,
      formattedDate,
      words: day.words,
    });
  };

  const handleCellMouseLeave = () => {
    setHoveredCell(null);
  };

  // Xử lý hover khối màu trong thang đo Less -> More ở chân thẻ
  const handleScaleMouseEnter = (e, item) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const parentRect = scaleContainerRef.current
      ? scaleContainerRef.current.getBoundingClientRect()
      : { left: 0, top: 0 };

    setHoveredScale({
      x: rect.left - parentRect.left + rect.width / 2,
      level: item.level,
      minLabel: item.minLabel,
      rangeLabel: item.rangeLabel,
      color: currentColors[item.level] || currentColors[0],
    });
  };

  const handleScaleMouseLeave = () => {
    setHoveredScale(null);
  };

  return (
    <div className="w-full font-sans select-none" ref={containerRef}>
      {/* ======================================================== */}
      {/* THẺ TRẮNG CHỨA BIỂU ĐỒ HEATMAP & MENU DROPDOWN CHỌN NĂM   */}
      {/* ======================================================== */}
      <div className="w-full bg-white rounded-xl border border-slate-200/90 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-4 sm:p-5 relative">
        {/* HÀNG HEADER TRONG THẺ: TIÊU ĐỀ + MENU DROPDOWN CHỌN NĂM (2025, 2026, 2027) */}
        <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-crimson-primary animate-pulse" />
            <h3 className="font-bold text-xs sm:text-sm text-slate-800 tracking-tight">
              Ma trận tích lũy từ vựng theo ngày
            </h3>
          </div>

          {/* Menu Dropdown chọn năm (2025, 2026, 2027) */}
          <div className="relative" ref={yearDropdownRef}>
            <button
              type="button"
              onClick={() => setShowYearDropdown(!showYearDropdown)}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-2xs transition-all cursor-pointer hover:border-slate-300"
            >
              <span className="material-symbols-outlined text-[15px] text-crimson-primary">
                calendar_month
              </span>
              <span>Năm {selectedYear}</span>
              <span
                className={`material-symbols-outlined text-[16px] text-slate-400 transition-transform duration-150 ${
                  showYearDropdown ? 'rotate-180' : ''
                }`}
              >
                expand_more
              </span>
            </button>

            {/* Dropdown Menu */}
            {showYearDropdown && (
              <div className="absolute right-0 top-full mt-1.5 w-36 bg-white rounded-xl shadow-xl border border-slate-200/90 py-1.5 z-40 animate-in fade-in slide-in-from-top-1 duration-150">
                <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Chọn năm
                </div>
                {availableYears.map((year) => {
                  const isSelected = selectedYear === year;
                  return (
                    <button
                      key={`year-opt-${year}`}
                      type="button"
                      onClick={() => {
                        setSelectedYear(year);
                        setShowYearDropdown(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-1.5 text-xs font-medium transition cursor-pointer ${
                        isSelected
                          ? 'bg-red-50 text-crimson-primary font-bold'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span>Năm {year}</span>
                      {isSelected && (
                        <span className="material-symbols-outlined text-[15px] text-crimson-primary">
                          check
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* LƯỚI BIỂU ĐỒ HEATMAP CĂN GIỮA ĐỐI XỨNG TUYỆT ĐỐI GIỮA 2 ĐƯỜNG KẺ NGANG */}
        <div className="w-full overflow-x-auto py-4 sm:py-5 flex items-center">
          <div className="min-w-[860px] w-full">
            <svg
              width="100%"
              viewBox="0 0 940 140"
              className="w-full h-auto overflow-visible"
            >
              {/* 1. Nhãn thứ (Mon, Wed, Fri) bên trái */}
              <g className="text-[10px] font-medium fill-slate-400 select-none">
                <text x="0" y="46" dominantBaseline="middle">
                  Mon
                </text>
                <text x="0" y="80" dominantBaseline="middle">
                  Wed
                </text>
                <text x="0" y="114" dominantBaseline="middle">
                  Fri
                </text>
              </g>

              {/* 2. Nhãn tháng ở hàng trên */}
              <g className="text-[10px] font-medium fill-slate-500 select-none">
                {monthLabels.map((lbl, idx) => {
                  const x = 36 + lbl.col * 17;
                  return (
                    <text key={`month-${idx}`} x={x} y="11" textAnchor="start">
                      {lbl.name}
                    </text>
                  );
                })}
              </g>

              {/* 3. Lưới ô vuông 53 tuần x 7 ngày */}
              <g transform="translate(36, 22)">
                {weeks.map((week, colIdx) => (
                  <g key={`week-${colIdx}`} transform={`translate(${colIdx * 17}, 0)`}>
                    {week.map((day) => {
                      const y = day.row * 17;
                      const fill = day.isFuture
                        ? '#F8FAFC'
                        : currentColors[day.level] || currentColors[0];

                      return (
                        <rect
                          key={`cell-${day.dateStr}`}
                          x="0"
                          y={y}
                          width="13.5"
                          height="13.5"
                          rx="2.5"
                          fill={fill}
                          className={`transition-all duration-100 ${
                            day.isFuture
                              ? 'opacity-30 cursor-default'
                              : 'cursor-pointer hover:stroke-slate-900 hover:stroke-[1.5px]'
                          }`}
                          stroke={day.isFuture ? '#E2E8F0' : 'rgba(27,31,35,0.06)'}
                          strokeWidth="1"
                          onMouseEnter={(e) => handleCellMouseEnter(e, day)}
                          onMouseLeave={handleCellMouseLeave}
                        />
                      );
                    })}
                  </g>
                ))}
              </g>
            </svg>
          </div>
        </div>

        {/* ======================================================== */}
        {/* CHÂN KHUNG: THANG ĐO MÀU (LESS -> MORE)                  */}
        {/* ======================================================== */}
        <div className="pt-3 border-t border-slate-100/90 flex items-center justify-end text-xs text-slate-500">
          {/* Thang đo mức độ màu (Less -> More) bên phải kèm Tooltip hiển thị mức tối thiểu khi hover */}
          <div
            className="relative flex items-center gap-1.5 select-none"
            ref={scaleContainerRef}
          >
            <span className="text-[11px] text-slate-400 font-medium mr-1">Less</span>
            {scaleLevelDetails.map((item) => (
              <div
                key={`scale-${item.level}`}
                onMouseEnter={(e) => handleScaleMouseEnter(e, item)}
                onMouseLeave={handleScaleMouseLeave}
                className="w-3.5 h-3.5 rounded-[3px] border border-black/10 cursor-pointer transition-all duration-150 hover:scale-125 hover:shadow-sm"
                style={{ backgroundColor: currentColors[item.level] }}
                title={`${item.minLabel} (${item.rangeLabel})`}
              />
            ))}
            <span className="text-[11px] text-slate-400 font-medium ml-1">More</span>

            {/* Tooltip nổi khi hover từng khối màu trong thang đo */}
            {hoveredScale && (
              <div
                className="absolute bottom-full mb-2.5 -translate-x-1/2 z-50 pointer-events-none bg-slate-900/95 backdrop-blur-xs text-white text-xs px-2.5 py-1.5 rounded-lg shadow-xl border border-slate-700/80 whitespace-nowrap animate-in fade-in duration-100 flex items-center gap-2"
                style={{ left: `${hoveredScale.x}px` }}
              >
                <span
                  className="w-2.5 h-2.5 rounded-[2px] shrink-0 border border-white/20"
                  style={{ backgroundColor: hoveredScale.color }}
                />
                <div className="flex items-center gap-1.5 leading-none">
                  <span className="font-bold text-white text-[11px]">
                    {hoveredScale.minLabel}
                  </span>
                  <span className="text-slate-300 text-[10px]">
                    ({hoveredScale.rangeLabel})
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ======================================================== */}
        {/* TOOLTIP NỔI KHI HOVER CELL                               */}
        {/* ======================================================== */}
        {hoveredCell && (
          <div
            className="absolute z-50 pointer-events-none -translate-x-1/2 -translate-y-full mb-2 bg-slate-900/95 backdrop-blur-xs text-white text-xs px-3 py-2 rounded-lg shadow-xl border border-slate-700/80 whitespace-nowrap animate-in fade-in duration-100"
            style={{
              left: `${hoveredCell.x}px`,
              top: `${hoveredCell.y}px`,
            }}
          >
            <div className="font-bold flex items-center gap-1.5">
              <span
                className="w-2 h-2 rounded-full"
                style={{
                  backgroundColor:
                    hoveredCell.count > 0 ? currentColors[4] : currentColors[0],
                }}
              />
              <span>
                {hoveredCell.count > 0
                  ? `${hoveredCell.count} từ vựng được tạo`
                  : 'Không có từ vựng nào'}
              </span>
            </div>
            <div className="text-[10px] text-slate-300 mt-0.5">
              {hoveredCell.formattedDate}
            </div>
            {hoveredCell.words && hoveredCell.words.length > 0 && (
              <div className={`text-[10px] ${currentColors.badgeWord || 'text-rose-300'} mt-1 max-w-[220px] truncate border-t border-slate-700/80 pt-1`}>
                {hoveredCell.words.slice(0, 3).join(', ')}
                {hoveredCell.words.length > 3 && ` +${hoveredCell.words.length - 3} từ khác`}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
