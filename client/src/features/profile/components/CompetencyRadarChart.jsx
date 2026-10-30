import React, { useState } from 'react';

/**
 * CompetencyRadarChart: Sơ đồ năng lực (Biểu đồ radar đa chiều)
 * Thiết kế chuẩn UI học thuật DOL English & Linearthinking.
 * 
 * So với hình 2 (mẫu cũ):
 * - Giao diện hiện đại, sắc nét với SVG Vector thuần (không bể ảnh trên màn Retina/4K).
 * - Phối màu chuẩn DOL Red & White phối cùng Sapphire Blue sang trọng.
 * - Hỗ trợ tương tác hover xem điểm số chi tiết từng trục năng lực.
 * - Có nút "Đánh giá năng lực đầu vào" và link "Chi tiết >" như hình 2 mẫu.
 * - Hai bộ chỉ số: Điểm vận dụng (Xanh dương) & Điểm thông hiểu (Đỏ).
 */
export default function CompetencyRadarChart({
  onOpenAssessmentModal,
  onOpenDetailModal,
}) {
  const [showApplication, setShowApplication] = useState(true);
  const [showComprehension, setShowComprehension] = useState(true);
  const [hoveredCompetency, setHoveredCompetency] = useState(null);
  const [showInfoTooltip, setShowInfoTooltip] = useState(false);

  // 8 Trục năng lực cốt lõi theo phương pháp Linearthinking & Học từ vựng chuẩn hóa
  const competencies = [
    {
      id: 'vocab',
      name: 'Từ vựng cốt lõi',
      en: 'Core Vocab',
      comprehension: 88, // Điểm thông hiểu
      application: 78,   // Điểm vận dụng
      comment: 'Vốn từ vựng học thuật phong phú, hiểu rõ bản chất ngữ nghĩa.',
    },
    {
      id: 'collocation',
      name: 'Collocation & Cụm từ',
      en: 'Collocations',
      comprehension: 85,
      application: 80,
      comment: 'Kết hợp từ tự nhiên chuẩn bản xứ, phản xạ tốt.',
    },
    {
      id: 'pattern',
      name: 'Cấu trúc & Pattern',
      en: 'Patterns',
      comprehension: 92,
      application: 84,
      comment: 'Nắm chắc mẫu câu ứng dụng theo phương pháp Linearthinking.',
    },
    {
      id: 'reading',
      name: 'Đọc hiểu Linear',
      en: 'Reading Comprehension',
      comprehension: 90,
      application: 82,
      comment: 'Tư duy xâu chuỗi thông tin nhanh, bắt keyword chuẩn xác.',
    },
    {
      id: 'word_family',
      name: 'Họ từ vựng',
      en: 'Word Families',
      comprehension: 84,
      application: 70,
      comment: 'Biến đổi từ loại (N/V/Adj/Adv) linh hoạt trong ngữ cảnh.',
    },
    {
      id: 'paraphrase',
      name: 'Tư duy Paraphrase',
      en: 'Paraphrasing',
      comprehension: 82,
      application: 75,
      comment: 'Khả năng diễn đạt đa dạng ý niệm bằng nhiều cách thức.',
    },
    {
      id: 'writing',
      name: 'Ứng dụng Viết',
      en: 'Writing Usage',
      comprehension: 78,
      application: 72,
      comment: 'Vận dụng từ vựng vào bài viết học thuật mượt mà.',
    },
    {
      id: 'phonetics',
      name: 'Phát âm & Phản xạ',
      en: 'Phonetics & Reflex',
      comprehension: 86,
      application: 80,
      comment: 'Nắm vững bảng phiên âm quốc tế IPA và trọng âm.',
    },
  ];

  // Radar chart mathematical dimensions
  const totalAxes = competencies.length;
  const size = 400;
  const center = size / 2;
  const radius = 115;
  const levels = [20, 40, 60, 80, 100];

  // Helper to convert polar coordinates to Cartesian
  const getCoordinates = (value, index) => {
    const angle = (Math.PI * 2 / totalAxes) * index - Math.PI / 2;
    const r = (value / 100) * radius;
    const x = center + r * Math.cos(angle);
    const y = center + r * Math.sin(angle);
    return { x, y, angle };
  };

  // Build polygon points for grid rings
  const getPolygonPoints = (levelValue) => {
    return competencies
      .map((_, i) => {
        const { x, y } = getCoordinates(levelValue, i);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  };

  // Build points for dataset polygons
  const applicationPoints = competencies
    .map((c, i) => {
      const { x, y } = getCoordinates(c.application, i);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  const comprehensionPoints = competencies
    .map((c, i) => {
      const { x, y } = getCoordinates(c.comprehension, i);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  // Compute averages
  const avgApplication = Math.round(
    competencies.reduce((acc, c) => acc + c.application, 0) / totalAxes
  );
  const avgComprehension = Math.round(
    competencies.reduce((acc, c) => acc + c.comprehension, 0) / totalAxes
  );
  const overallScore = Math.round((avgApplication + avgComprehension) / 2);

  return (
    <div className="h-full bg-white rounded-2xl border border-slate-200/90 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-5 flex flex-col justify-between relative overflow-hidden group/chart hover:shadow-md transition-all duration-200">
      {/* Top Header Row (Title, Tooltip & Actions) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2 relative">
          <h2 className="font-headline text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Sơ đồ năng lực</span>
          </h2>

          {/* Info Icon with Tooltip */}
          <div className="relative">
            <button
              type="button"
              onMouseEnter={() => setShowInfoTooltip(true)}
              onMouseLeave={() => setShowInfoTooltip(false)}
              onClick={() => setShowInfoTooltip(!showInfoTooltip)}
              className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer flex items-center"
              title="Thông tin sơ đồ"
            >
              <span className="material-symbols-outlined text-[17px]">info</span>
            </button>

            {showInfoTooltip && (
              <div className="absolute left-0 top-6 z-50 w-64 p-3 rounded-xl bg-slate-900/95 text-white text-[11px] leading-relaxed shadow-xl backdrop-blur-sm border border-slate-700 animate-in fade-in duration-150">
                <p className="font-semibold text-amber-300 mb-1">Phương pháp Linearthinking</p>
                Sơ đồ phản ánh toàn diện 8 khía cạnh năng lực ngôn ngữ theo thang điểm 0 - 100, gồm <strong>Điểm thông hiểu</strong> (hiểu bản chất) và <strong>Điểm vận dụng</strong> (thực hành thực tế).
              </div>
            )}
          </div>

          <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200 hidden sm:inline-block">
            DOL Matrix
          </span>
        </div>

        {/* Right Action Buttons (Như hình 2 nhưng hiện đại hơn) */}
        <div className="flex items-center gap-2.5 self-end sm:self-auto">
          <button
            type="button"
            onClick={onOpenAssessmentModal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-slate-700 bg-slate-50 hover:bg-red-50 hover:text-crimson-primary border border-slate-200/90 hover:border-red-200 shadow-xs active:scale-95 transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[15px] text-amber-500">auto_fix_high</span>
            <span>Đánh giá năng lực đầu vào</span>
          </button>

          <button
            type="button"
            onClick={onOpenDetailModal}
            className="inline-flex items-center gap-0.5 text-xs font-bold text-crimson-primary hover:text-crimson-dark transition-colors cursor-pointer group/link pl-1"
          >
            <span>Chi tiết</span>
            <span className="material-symbols-outlined text-[16px] group-hover/link:translate-x-0.5 transition-transform">
              chevron_right
            </span>
          </button>
        </div>
      </div>

      {/* Main Radar Chart Visualization Area */}
      <div className="relative flex-1 flex flex-col items-center justify-center my-2 min-h-[300px]">
        {/* Hover Tooltip Popup Card */}
        {hoveredCompetency && (
          <div className="absolute top-2 right-2 z-30 p-2.5 rounded-xl bg-slate-900/90 text-white text-xs shadow-xl backdrop-blur-md border border-slate-700/80 max-w-[220px] pointer-events-none animate-in fade-in zoom-in-95 duration-150">
            <div className="font-bold text-amber-300 text-xs flex items-center justify-between">
              <span>{hoveredCompetency.name}</span>
            </div>
            <div className="mt-1 flex flex-col gap-0.5 text-[11px]">
              <div className="flex justify-between items-center text-red-300">
                <span>Điểm thông hiểu:</span>
                <span className="font-extrabold">{hoveredCompetency.comprehension}/100</span>
              </div>
              <div className="flex justify-between items-center text-blue-300">
                <span>Điểm vận dụng:</span>
                <span className="font-extrabold">{hoveredCompetency.application}/100</span>
              </div>
            </div>
            <p className="mt-1.5 pt-1.5 border-t border-slate-700/80 text-[10px] text-slate-300 leading-snug">
              {hoveredCompetency.comment}
            </p>
          </div>
        )}

        {/* SVG Radar Chart */}
        <div className="relative w-full max-w-[420px] aspect-[420/380] flex items-center justify-center">
          <svg
            viewBox={`0 0 ${size} ${size}`}
            className="w-full h-full overflow-visible select-none drop-shadow-xs"
          >
            <defs>
              {/* Blue Gradient for Điểm vận dụng */}
              <linearGradient id="blueRadarGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#2563EB" stopOpacity="0.45" />
                <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.15" />
              </linearGradient>

              {/* Red Gradient for Điểm thông hiểu */}
              <linearGradient id="redRadarGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#E31E24" stopOpacity="0.45" />
                <stop offset="100%" stopColor="#FB7185" stopOpacity="0.18" />
              </linearGradient>

              {/* Glowing filters */}
              <filter id="glowBlue" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="2" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
              <filter id="glowRed" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="2" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Concentric Polygonal Background Grids */}
            {levels.map((lvl, idx) => {
              const points = getPolygonPoints(lvl);
              const isEven = idx % 2 === 0;
              return (
                <polygon
                  key={lvl}
                  points={points}
                  fill={isEven ? '#F8FAFC' : '#FFFFFF'}
                  stroke="#E2E8F0"
                  strokeWidth="1"
                  strokeDasharray={idx === levels.length - 1 ? 'none' : '2 3'}
                  className="transition-colors"
                />
              );
            })}

            {/* Radial Spokes (Trục nối từ tâm ra đỉnh) */}
            {competencies.map((_, i) => {
              const { x, y } = getCoordinates(100, i);
              return (
                <line
                  key={i}
                  x1={center}
                  y1={center}
                  x2={x}
                  y2={y}
                  stroke="#E2E8F0"
                  strokeWidth="1"
                />
              );
            })}

            {/* Level Scale Numbers on Vertical Axis (20, 40, 60, 80, 100) */}
            {levels.map((lvl) => {
              const r = (lvl / 100) * radius;
              return (
                <g key={`lvl-${lvl}`}>
                  <text
                    x={center + 3}
                    y={center - r + 3}
                    fontSize="9"
                    fontWeight="600"
                    fill="#94A3B8"
                    className="select-none pointer-events-none"
                  >
                    {lvl}
                  </text>
                </g>
              );
            })}

            {/* =================================================== */}
            {/* 1. BLUE POLYGON: Điểm vận dụng                       */}
            {/* =================================================== */}
            {showApplication && (
              <g className="transition-opacity duration-300">
                <polygon
                  points={applicationPoints}
                  fill="url(#blueRadarGradient)"
                  stroke="#2563EB"
                  strokeWidth="2.5"
                  strokeLinejoin="round"
                  filter="url(#glowBlue)"
                  className="transition-all duration-300"
                />

                {/* Vertices */}
                {competencies.map((c, i) => {
                  const { x, y } = getCoordinates(c.application, i);
                  const isHovered = hoveredCompetency?.id === c.id;
                  return (
                    <circle
                      key={`app-node-${i}`}
                      cx={x}
                      cy={y}
                      r={isHovered ? 6 : 4}
                      fill="#FFFFFF"
                      stroke="#2563EB"
                      strokeWidth={isHovered ? 3 : 2}
                      className="cursor-pointer transition-all duration-150 hover:scale-125"
                      onMouseEnter={() => setHoveredCompetency(c)}
                      onMouseLeave={() => setHoveredCompetency(null)}
                    />
                  );
                })}
              </g>
            )}

            {/* =================================================== */}
            {/* 2. RED POLYGON: Điểm thông hiểu                      */}
            {/* =================================================== */}
            {showComprehension && (
              <g className="transition-opacity duration-300">
                <polygon
                  points={comprehensionPoints}
                  fill="url(#redRadarGradient)"
                  stroke="#E31E24"
                  strokeWidth="2.5"
                  strokeLinejoin="round"
                  filter="url(#glowRed)"
                  className="transition-all duration-300"
                />

                {/* Vertices */}
                {competencies.map((c, i) => {
                  const { x, y } = getCoordinates(c.comprehension, i);
                  const isHovered = hoveredCompetency?.id === c.id;
                  return (
                    <circle
                      key={`comp-node-${i}`}
                      cx={x}
                      cy={y}
                      r={isHovered ? 6 : 4}
                      fill="#FFFFFF"
                      stroke="#E31E24"
                      strokeWidth={isHovered ? 3 : 2}
                      className="cursor-pointer transition-all duration-150 hover:scale-125"
                      onMouseEnter={() => setHoveredCompetency(c)}
                      onMouseLeave={() => setHoveredCompetency(null)}
                    />
                  );
                })}
              </g>
            )}

            {/* Center Hub Indicator */}
            <circle cx={center} cy={center} r={3} fill="#94A3B8" />

            {/* Outer Labels Around the Perimeter */}
            {competencies.map((c, i) => {
              const { x, y, angle } = getCoordinates(126, i);
              const isHovered = hoveredCompetency?.id === c.id;

              // Determine text-anchor based on cos of angle
              const cos = Math.cos(angle);
              let textAnchor = 'middle';
              if (cos > 0.3) textAnchor = 'start';
              else if (cos < -0.3) textAnchor = 'end';

              // Vertical offset adjustment
              const sin = Math.sin(angle);
              const dy = sin > 0.5 ? 12 : sin < -0.5 ? -4 : 4;

              return (
                <g
                  key={`label-${c.id}`}
                  className="cursor-pointer group/axis"
                  onMouseEnter={() => setHoveredCompetency(c)}
                  onMouseLeave={() => setHoveredCompetency(null)}
                >
                  <text
                    x={x}
                    y={y + dy}
                    textAnchor={textAnchor}
                    fontSize={isHovered ? '11' : '10'}
                    fontWeight={isHovered ? '800' : '600'}
                    fill={isHovered ? '#ba0013' : '#334155'}
                    className="transition-all duration-150"
                  >
                    {c.name}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Bottom Interactive Legend & Summary Pill */}
      <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        {/* Toggleable Legend Pills */}
        <div className="flex items-center gap-4 flex-wrap">
          {/* Blue: Điểm vận dụng */}
          <button
            type="button"
            onClick={() => setShowApplication(!showApplication)}
            className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
              showApplication
                ? 'bg-blue-50/80 border-blue-200 text-blue-700 font-bold'
                : 'bg-slate-50 border-slate-200 text-slate-400 opacity-60'
            }`}
            title="Nhấn để bật/tắt hiển thị Điểm vận dụng"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shadow-xs" />
            <span>Điểm vận dụng</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-white text-blue-800 font-black shadow-xs">
              {avgApplication}đ
            </span>
          </button>

          {/* Red: Điểm thông hiểu */}
          <button
            type="button"
            onClick={() => setShowComprehension(!showComprehension)}
            className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
              showComprehension
                ? 'bg-red-50/80 border-red-200 text-crimson-primary font-bold'
                : 'bg-slate-50 border-slate-200 text-slate-400 opacity-60'
            }`}
            title="Nhấn để bật/tắt hiển thị Điểm thông hiểu"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-crimson-primary shadow-xs" />
            <span>Điểm thông hiểu</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-white text-crimson-primary font-black shadow-xs">
              {avgComprehension}đ
            </span>
          </button>
        </div>

        {/* Overall Competency Metric */}
        <div className="inline-flex items-center gap-2 self-end sm:self-auto">
          <span className="text-[11px] text-slate-500">Chỉ số toàn diện:</span>
          <span className="px-2.5 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 font-extrabold text-xs shadow-xs">
            {overallScore}/100 • B2+ (IELTS 6.5+)
          </span>
        </div>
      </div>
    </div>
  );
}
