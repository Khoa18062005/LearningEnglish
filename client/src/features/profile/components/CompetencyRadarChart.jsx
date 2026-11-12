import React, { useState, useMemo } from 'react';

/**
 * CompetencyRadarChart: Sơ đồ cơ cấu kho từ vựng 9 chiều (Nonagon Radar Matrix)
 * Thiết kế chuẩn UI học thuật DOL English & Lexicon.
 * 
 * 9 Trục thể hiện 9 trường thông tin:
 * 1. Danh từ (Nouns)
 * 2. Động từ (Verbs)
 * 3. Tính từ (Adjectives)
 * 4. Trạng từ (Adverbs)
 * 5. Collocation & Cụm từ
 * 6. Idioms & Phrasal Verbs
 * 7. Word Family (Gia đình từ)
 * 8. Reading List (Danh sách bài đọc)
 * 9. Topic (Chủ đề từ vựng)
 */
export default function CompetencyRadarChart({
  vocabList = [],
  readingLists = [],
  categories = [],
  wordFamilies = [],
  onOpenAssessmentModal,
  onOpenDetailModal,
}) {
  const [hoveredDimension, setHoveredDimension] = useState(null);

  // 1. Số lượng Danh từ (Nouns)
  const nounCount = useMemo(() => {
    return (vocabList || []).filter((v) => {
      const pos = (v.pos || v.forms?.[0]?.pos || '').toLowerCase();
      if (pos === 'n' || pos === 'noun') return true;
      return (v.forms || []).some(
        (f) => (f.pos || '').toLowerCase() === 'n' || (f.pos || '').toLowerCase() === 'noun'
      );
    }).length;
  }, [vocabList]);

  // 2. Số lượng Động từ (Verbs)
  const verbCount = useMemo(() => {
    return (vocabList || []).filter((v) => {
      const pos = (v.pos || v.forms?.[0]?.pos || '').toLowerCase();
      if (pos === 'v' || pos === 'verb') return true;
      return (v.forms || []).some(
        (f) => (f.pos || '').toLowerCase() === 'v' || (f.pos || '').toLowerCase() === 'verb'
      );
    }).length;
  }, [vocabList]);

  // 3. Số lượng Tính từ (Adjectives)
  const adjCount = useMemo(() => {
    return (vocabList || []).filter((v) => {
      const pos = (v.pos || v.forms?.[0]?.pos || '').toLowerCase();
      if (pos === 'adj' || pos === 'adjective') return true;
      return (v.forms || []).some(
        (f) => (f.pos || '').toLowerCase() === 'adj' || (f.pos || '').toLowerCase() === 'adjective'
      );
    }).length;
  }, [vocabList]);

  // 4. Số lượng Trạng từ (Adverbs)
  const advCount = useMemo(() => {
    return (vocabList || []).filter((v) => {
      const pos = (v.pos || v.forms?.[0]?.pos || '').toLowerCase();
      if (pos === 'adv' || pos === 'adverb') return true;
      return (v.forms || []).some(
        (f) => (f.pos || '').toLowerCase() === 'adv' || (f.pos || '').toLowerCase() === 'adverb'
      );
    }).length;
  }, [vocabList]);

  // 5. Số lượng Collocation (Cụm từ)
  const collocationCount = useMemo(() => {
    return (vocabList || []).reduce((acc, v) => {
      const posLower = (v.pos || '').toLowerCase();
      const isDirectCollocation = posLower === 'collocation' || posLower === 'collocations';
      const count = (v.forms || []).filter(
        (f) => Boolean(f.collocation && f.collocation.trim() && f.type !== 'phrasal_verb')
      ).length;
      return acc + (isDirectCollocation ? Math.max(1, count) : count);
    }, 0);
  }, [vocabList]);

  // 6. Số lượng Idioms & Phrasal Verbs (Thành ngữ)
  const idiomCount = useMemo(() => {
    return (vocabList || []).reduce((acc, v) => {
      const posLower = (v.pos || '').toLowerCase();
      const isDirect = posLower === 'idiom' || posLower === 'phrasal_verb' || posLower === 'phrasal verb';
      const formCount = (v.forms || []).filter(
        (f) =>
          f.type === 'phrasal_verb' ||
          (f.pos || '').toLowerCase() === 'phrasal_verb' ||
          (f.pos || '').toLowerCase() === 'idiom' ||
          Boolean(f.phrase)
      ).length;
      return acc + (isDirect ? 1 : 0) + formCount;
    }, 0);
  }, [vocabList]);

  // 7. Số lượng Word Family (Gia đình từ)
  const wordFamilyCount = useMemo(() => {
    const listLen = (wordFamilies || []).length;
    if (listLen > 0) return listLen;
    const roots = new Set();
    (vocabList || []).forEach((v) => {
      if (v.wordFamilyId) roots.add(String(v.wordFamilyId));
      else if (v.rootWord && v.rootWord.trim()) roots.add(v.rootWord.trim().toLowerCase());
    });
    return roots.size;
  }, [wordFamilies, vocabList]);

  // 8. Số lượng Reading List (Danh sách bài đọc)
  const listCount = (readingLists || []).length;

  // 9. Số lượng Topic (Chủ đề từ vựng)
  const topicCount = (categories || []).length;

  // 9 Trục thông tin theo cấu trúc hình học đối xứng thuận chiều kim đồng hồ
  const dimensions = useMemo(() => [
    {
      id: 'noun',
      name: 'Danh từ',
      en: 'Nouns (n)',
      count: nounCount,
      target: 60,
      comment: 'Danh từ là nòng cốt cấu trúc câu. Cần tiếp tục tích lũy theo các chủ đề chuyên sâu.',
    },
    {
      id: 'verb',
      name: 'Động từ',
      en: 'Verbs (v)',
      count: verbCount,
      target: 45,
      comment: 'Động từ mang hành động và ý niệm chính. Nên kết hợp ghi nhớ cùng các Pattern câu.',
    },
    {
      id: 'adj',
      name: 'Tính từ',
      en: 'Adjectives (adj)',
      count: adjCount,
      target: 35,
      comment: 'Tính từ tăng độ phong phú và biểu cảm khi miêu tả đặc điểm trong bài thi IELTS/TOEIC.',
    },
    {
      id: 'adv',
      name: 'Trạng từ',
      en: 'Adverbs (adv)',
      count: advCount,
      target: 20,
      comment: 'Trạng từ bổ nghĩa sắc thái tinh tế cho động từ và tính từ trong câu học thuật.',
    },
    {
      id: 'collocation',
      name: 'Collocation',
      en: 'Collocations',
      count: collocationCount,
      target: 40,
      comment: 'Cụm từ đi liền tự nhiên giúp tránh lỗi dịch word-by-word và nâng band điểm Lexical Resource.',
    },
    {
      id: 'idiom',
      name: 'Idioms & Phrasal',
      en: 'Idioms & Phrasal',
      count: idiomCount,
      target: 20,
      comment: 'Thành ngữ và phrasal verbs tạo phản xạ tự nhiên trong giao tiếp và Speaking/Writing.',
    },
    {
      id: 'word_family',
      name: 'Word Family',
      en: 'Word Families',
      count: wordFamilyCount,
      target: 25,
      comment: 'Gia đình từ giúp nhân rộng vốn từ nhanh chóng bằng cách học gốc từ và hậu tố (Suffix).',
    },
    {
      id: 'list',
      name: 'List vocabulary',
      en: 'List Vocabulary',
      count: listCount,
      target: 12,
      comment: 'Các danh sách bài học từ vựng lưu trữ ngữ cảnh giúp học và ghi nhớ từ bền bỉ.',
    },
    {
      id: 'topic',
      name: 'Topic',
      en: 'Topics / Categories',
      count: topicCount,
      target: 12,
      comment: 'Chủ đề từ vựng phân loại hệ thống theo các lĩnh vực: Môi trường, Kinh tế, Công nghệ...',
    },
  ], [nounCount, verbCount, adjCount, advCount, collocationCount, idiomCount, wordFamilyCount, listCount, topicCount]);

  // Thông số toán học cho biểu đồ Nonagon (9 trục) - Kích thước cực đại, bội số 50
  const totalAxes = dimensions.length; // 9
  const width = 720;
  const height = 540;
  const centerX = width / 2; // 360
  const centerY = height / 2; // 270
  const radius = 210;
  const labelRadius = 242;
  const maxScale = 250;
  const levels = [50, 100, 150, 200, 250];

  // Hàm chuyển đổi tọa độ Cực (Polar) sang Descartes (Cartesian)
  const getCoordinates = (value, index, customRadius = radius) => {
    const angle = (Math.PI * 2 / totalAxes) * index - Math.PI / 2;
    const r = (value / maxScale) * customRadius;
    const x = centerX + r * Math.cos(angle);
    const y = centerY + r * Math.sin(angle);
    return { x, y, angle };
  };

  // Tạo các vòng đa giác lưới nền 9 cạnh
  const getPolygonPoints = (levelValue) => {
    return dimensions
      .map((_, i) => {
        const { x, y } = getCoordinates(levelValue, i);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  };

  // Tọa độ cho Vòng năng lực màu đỏ (Chuẩn mức 200/250 = 80%)
  const benchmarkValue = 200;
  const ringPoints = dimensions
    .map((_, i) => {
      const { x, y } = getCoordinates(benchmarkValue, i);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  // Tổng hợp thống kê
  const totalCorpus = nounCount + verbCount + adjCount + advCount + collocationCount + idiomCount;

  return (
    <div className="h-full bg-white rounded-2xl border border-slate-200/90 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-5 flex flex-col justify-between relative overflow-hidden group/chart hover:shadow-md transition-all duration-200">
      {/* Top Header Row (Title, Tooltip & Actions) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2 relative">
          <h2 className="font-headline text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Biểu đồ thống kê</span>
          </h2>
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-2.5 self-end sm:self-auto">
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
      <div className="relative flex-1 flex flex-col items-center justify-center py-1 min-h-0 w-full">
        {/* SVG Radar Chart (Nonagon 9 Đỉnh) - Kích thước cực đại, sắc nét, phủ trọn không gian thẻ */}
        <div className="relative w-full max-w-[760px] aspect-[720/540] max-h-[530px] flex items-center justify-center">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-full max-h-full object-contain overflow-visible select-none drop-shadow-xs"
          >
            <defs>
              {/* Red / Crimson Gradient cho Vòng năng lực duy nhất */}
              <linearGradient id="redRadarGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#E31E24" stopOpacity="0.38" />
                <stop offset="100%" stopColor="#FDA4AF" stopOpacity="0.10" />
              </linearGradient>

              {/* Glowing filter cho Vòng năng lực đỏ */}
              <filter id="glowRed" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="2.5" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* 1. Lớp nền đa giác xen kẽ (vẽ từ ngoài vào trong: 250 -> 50) */}
            {levels.slice().reverse().map((lvl, idx) => {
              const points = getPolygonPoints(lvl);
              const isEven = idx % 2 === 0;
              return (
                <polygon
                  key={`bg-${lvl}`}
                  points={points}
                  fill={isEven ? '#F8FAFC' : '#FFFFFF'}
                />
              );
            })}

            {/* 2. Các hình đa giác nhỏ bên trong ứng với từng bội số 50 (50, 100, 150, 200, 250 - Chuẩn khung lưới Liên Quân Mobile) */}
            {levels.map((lvl) => {
              const points = getPolygonPoints(lvl);
              return (
                <polygon
                  key={`wireframe-${lvl}`}
                  points={points}
                  fill="none"
                  stroke="#CBD5E1"
                  strokeWidth={lvl === maxScale ? '1.5' : '1.2'}
                  className="transition-colors"
                />
              );
            })}

            {/* 3. 9 Trục nan quạt (Spokes) nối từ tâm ra 9 đỉnh */}
            {dimensions.map((_, i) => {
              const { x, y } = getCoordinates(maxScale, i);
              return (
                <line
                  key={`spoke-${i}`}
                  x1={centerX}
                  y1={centerY}
                  x2={x}
                  y2={y}
                  stroke="#CBD5E1"
                  strokeWidth="1.2"
                />
              );
            })}

            {/* Vạch chia mức thang đo (50, 100, 150, 200, 250) - Trục xoay nghiêng từ tâm sang phải -70° (không phải tịnh tiến), chữ đứng thẳng */}
            {levels.map((lvl) => {
              const r = (lvl / maxScale) * radius;
              // Trục thẳng đứng (-90°) được xoay nghiêng sang phải 20° quanh tâm -> tạo thành tia góc -70°
              const rotatedAngleRad = (-70 * Math.PI) / 180;
              const x = centerX + r * Math.cos(rotatedAngleRad);
              const y = centerY + r * Math.sin(rotatedAngleRad) + 3.5;

              return (
                <g key={`lvl-${lvl}`}>
                  <text
                    x={x}
                    y={y}
                    textAnchor="middle"
                    fontSize="10"
                    fontWeight="700"
                    fill="#64748B"
                    stroke="#FFFFFF"
                    strokeWidth="3"
                    paintOrder="stroke fill"
                    strokeLinejoin="round"
                    className="select-none pointer-events-none"
                  >
                    {lvl}
                  </text>
                </g>
              );
            })}

            {/* DUY NHẤT 1 VÒNG NĂNG LỰC MÀU ĐỎ (DOL Red #E31E24) */}
            <g className="transition-opacity duration-300">
              <polygon
                points={ringPoints}
                fill="url(#redRadarGradient)"
                stroke="#E31E24"
                strokeWidth="2.8"
                strokeLinejoin="round"
                filter="url(#glowRed)"
                className="transition-all duration-300"
              />

              {/* Các đỉnh vòng năng lực màu đỏ */}
              {dimensions.map((d, i) => {
                const { x, y } = getCoordinates(benchmarkValue, i);
                const isHovered = hoveredDimension?.id === d.id;
                return (
                  <g
                    key={`ring-node-${i}`}
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredDimension(d)}
                    onMouseLeave={() => setHoveredDimension(null)}
                  >
                    {/* Vùng cảm ứng chuột mở rộng (Hit Area) ngăn chặn hoàn toàn flickering */}
                    <circle cx={x} cy={y} r={18} fill="transparent" />

                    {/* Vầng sáng viền khi hover */}
                    {isHovered && (
                      <circle
                        cx={x}
                        cy={y}
                        r={12}
                        fill="#FDA4AF"
                        fillOpacity={0.35}
                        className="pointer-events-none"
                      />
                    )}

                    {/* Chấm tròn đỉnh chính */}
                    <circle
                      cx={x}
                      cy={y}
                      r={isHovered ? 7.5 : 5}
                      fill="#FFFFFF"
                      stroke="#E31E24"
                      strokeWidth={isHovered ? 3.5 : 2.5}
                      className="pointer-events-none transition-all duration-150"
                    />
                  </g>
                );
              })}
            </g>

            {/* Điểm tâm trung tâm */}
            <circle cx={centerX} cy={centerY} r={4} fill="#E31E24" opacity="0.6" />

            {/* 9 Nhãn chữ hiển thị Tên trường (Không kèm số thứ tự) quanh viền */}
            {dimensions.map((d, i) => {
              const { x, y, angle } = getCoordinates(maxScale, i, labelRadius);
              const isHovered = hoveredDimension?.id === d.id;

              // Căn chỉnh chữ theo góc tọa độ
              const cos = Math.cos(angle);
              let textAnchor = 'middle';
              if (cos > 0.25) textAnchor = 'start';
              else if (cos < -0.25) textAnchor = 'end';

              // Độ dịch chuyển chiều dọc
              const sin = Math.sin(angle);
              const dy = sin > 0.6 ? 16 : sin < -0.6 ? -6 : 4;

              return (
                <g
                  key={`label-${d.id}`}
                  className="cursor-pointer group/axis"
                  onMouseEnter={() => setHoveredDimension(d)}
                  onMouseLeave={() => setHoveredDimension(null)}
                >
                  <text
                    x={x}
                    y={y + dy}
                    textAnchor={textAnchor}
                    fontSize="12.5"
                    fontWeight={isHovered ? '800' : '650'}
                    fill={isHovered ? '#BA0013' : '#334155'}
                    className="transition-colors duration-150 select-none"
                  >
                    {d.name}
                  </text>
                </g>
              );
            })}

            {/* Floating Number Badge on Hovered Node (chỉ hiện con số khi hover) */}
            {hoveredDimension && (() => {
              const hoveredIndex = dimensions.findIndex((dim) => dim.id === hoveredDimension.id);
              if (hoveredIndex === -1) return null;
              const { x, y } = getCoordinates(benchmarkValue, hoveredIndex);
              const countVal = hoveredDimension.count ?? 0;
              const countStr = String(countVal);
              const badgeWidth = Math.max(34, countStr.length * 10 + 20);
              const badgeHeight = 25;
              const badgeY = y - 35;

              return (
                <g key="hover-number-badge" className="pointer-events-none select-none">
                  {/* Shadow */}
                  <rect
                    x={x - badgeWidth / 2}
                    y={badgeY + 2}
                    width={badgeWidth}
                    height={badgeHeight}
                    rx={6}
                    fill="#000000"
                    opacity={0.15}
                  />
                  {/* Badge pill */}
                  <rect
                    x={x - badgeWidth / 2}
                    y={badgeY}
                    width={badgeWidth}
                    height={badgeHeight}
                    rx={6}
                    fill="#E31E24"
                    stroke="#FFFFFF"
                    strokeWidth={1.5}
                  />
                  {/* Triangle pointer pointing down to node */}
                  <polygon
                    points={`${x - 4},${badgeY + badgeHeight} ${x + 4},${badgeY + badgeHeight} ${x},${badgeY + badgeHeight + 5}`}
                    fill="#E31E24"
                  />
                  {/* The number */}
                  <text
                    x={x}
                    y={badgeY + 17}
                    textAnchor="middle"
                    fontSize="13"
                    fontWeight="900"
                    fill="#FFFFFF"
                  >
                    {countStr}
                  </text>
                </g>
              );
            })()}
          </svg>
        </div>
      </div>

      {/* Bottom Summary Pill */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-end text-xs">
        {/* Tổng dung lượng kho - Màu đỏ */}
        <div className="inline-flex items-center gap-2">
          <span className="text-[11px] text-slate-500 font-medium">Tổng kho từ vựng:</span>
          <span className="px-2.5 py-0.5 rounded-lg bg-red-50 text-crimson-primary border border-red-200 font-extrabold text-xs shadow-xs">
            {totalCorpus} từ vựng & cụm từ
          </span>
        </div>
      </div>
    </div>
  );
}
