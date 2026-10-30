import React from 'react';

/**
 * CompetencyDetailModal: Hiển thị báo cáo chi tiết khi người dùng nhấn "Chi tiết >"
 * Cung cấp phân tích sâu từng trục kỹ năng, điểm mạnh, điểm cần cải thiện
 * và lộ trình luyện tập tiếp theo theo phương pháp Linearthinking.
 */
export default function CompetencyDetailModal({
  isOpen,
  onClose,
  onOpenAssessment,
}) {
  if (!isOpen) return null;

  const competencies = [
    {
      name: 'Từ vựng cốt lõi (Core Vocab)',
      comprehension: 88,
      application: 78,
      status: 'Xuất sắc',
      statusColor: 'text-emerald-700 bg-emerald-50 border-emerald-200',
      description: 'Nắm chắc hệ thống từ vựng học thuật, hiểu rõ nghĩa gốc và sắc thái biểu cảm.',
      recommendation: 'Duy trì thói quen học từ mới mỗi ngày và gắn với các văn cảnh thực tế.',
    },
    {
      name: 'Collocation & Cụm từ',
      comprehension: 85,
      application: 80,
      status: 'Rất tốt',
      statusColor: 'text-blue-700 bg-blue-50 border-blue-200',
      description: 'Sử dụng cụm từ cố định tự nhiên, tránh dịch word-by-word tiếng Việt.',
      recommendation: 'Tăng cường tra cứu Collocation Dictionary khi làm bài viết luận.',
    },
    {
      name: 'Cấu trúc & Pattern câu',
      comprehension: 92,
      application: 84,
      status: 'Xuất sắc',
      statusColor: 'text-emerald-700 bg-emerald-50 border-emerald-200',
      description: 'Ứng dụng chính xác các mẫu câu phức tạp theo chuẩn cấu trúc Linearthinking.',
      recommendation: 'Tiếp tục phát huy trong việc viết đoạn văn diễn dịch và quy nạp.',
    },
    {
      name: 'Đọc hiểu Linearthinking',
      comprehension: 90,
      application: 82,
      status: 'Xuất sắc',
      statusColor: 'text-emerald-700 bg-emerald-50 border-emerald-200',
      description: 'Khả năng xâu chuỗi logic và tóm tắt ý chính của bài đọc Reading nhanh chóng.',
      recommendation: 'Luyện tập các bài đọc Cambridge 18+ với thời gian giới hạn nghiêm ngặt.',
    },
    {
      name: 'Họ từ vựng (Word Families)',
      comprehension: 84,
      application: 70,
      status: 'Khá',
      statusColor: 'text-amber-700 bg-amber-50 border-amber-200',
      description: 'Nhận biết tốt các dạng từ nhưng đôi khi gặp lúng túng khi tự chia dạng từ trong câu viết.',
      recommendation: 'Ôn lại bảng Word Family trong tab Gia đình từ và làm bài tập biến đổi từ.',
    },
    {
      name: 'Tư duy Paraphrase',
      comprehension: 82,
      application: 75,
      status: 'Rất tốt',
      statusColor: 'text-blue-700 bg-blue-50 border-blue-200',
      description: 'Biết diễn đạt lại câu bằng cấu trúc tương đương mà không làm biến dạng ngữ nghĩa.',
      recommendation: 'Tận dụng phương pháp Simplify & Specify để paraphrase linh hoạt hơn.',
    },
    {
      name: 'Ứng dụng Viết (Writing)',
      comprehension: 78,
      application: 72,
      status: 'Khá',
      statusColor: 'text-amber-700 bg-amber-50 border-amber-200',
      description: 'Đã biết đưa từ vựng vào câu nhưng cần chú ý tính mạch lạc (Cohesion & Coherence).',
      recommendation: 'Thực hành viết ít nhất 3 câu ví dụ cho mỗi từ vựng mới lưu trong hệ thống.',
    },
    {
      name: 'Phát âm & Phản xạ',
      comprehension: 86,
      application: 80,
      status: 'Rất tốt',
      statusColor: 'text-blue-700 bg-blue-50 border-blue-200',
      description: 'Đọc đúng phiên âm IPA và trọng âm từ, ngữ điệu câu rõ ràng.',
      recommendation: 'Luyện nghe phản xạ với tính năng phát âm audio chuẩn US/UK trên thẻ từ.',
    },
  ];

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="w-full max-w-3xl max-h-[90vh] bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-crimson-primary/10 text-crimson-primary flex items-center justify-center font-bold">
              <span className="material-symbols-outlined text-[20px]">analytics</span>
            </div>
            <div>
              <h2 className="font-headline font-bold text-base text-slate-900">
                Báo cáo chi tiết Sơ đồ năng lực
              </h2>
              <p className="text-xs text-slate-500">
                Phân tích chuyên sâu 8 trụ cột ngôn ngữ theo phương pháp Linearthinking
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Top Metric Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-2xl bg-red-50/60 border border-red-100 flex flex-col justify-between">
              <span className="text-xs font-semibold text-red-700">Điểm Thông Hiểu TB</span>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-crimson-primary">85.6</span>
                <span className="text-xs text-red-500">/ 100</span>
              </div>
              <span className="text-[10px] text-red-600/80 mt-1">Xuất sắc • Vượt chuẩn mục tiêu</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-blue-50/60 border border-blue-100 flex flex-col justify-between">
              <span className="text-xs font-semibold text-blue-700">Điểm Vận Dụng TB</span>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-blue-600">77.6</span>
                <span className="text-xs text-blue-500">/ 100</span>
              </div>
              <span className="text-[10px] text-blue-600/80 mt-1">Khá tốt • Cần tăng tần suất viết</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-100 flex flex-col justify-between">
              <span className="text-xs font-semibold text-emerald-700">Trình độ quy đổi</span>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-emerald-600">B2+</span>
                <span className="text-xs font-bold text-emerald-700">IELTS 6.5 - 7.0</span>
              </div>
              <span className="text-[10px] text-emerald-600/80 mt-1">Đủ điều kiện bài thi học thuật</span>
            </div>
          </div>

          {/* Competency Breakdown List */}
          <div className="space-y-3">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500">
              Chi tiết từng trục kỹ năng
            </h3>

            <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden bg-white">
              {competencies.map((item, idx) => (
                <div key={idx} className="p-4 hover:bg-slate-50/60 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-xs sm:text-sm">
                        {item.name}
                      </span>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${item.statusColor}`}>
                        {item.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-red-600 font-bold">
                        Hiểu: {item.comprehension}đ
                      </span>
                      <span className="text-slate-300">|</span>
                      <span className="text-blue-600 font-bold">
                        Vận dụng: {item.application}đ
                      </span>
                    </div>
                  </div>

                  {/* Dual Progress Bars */}
                  <div className="space-y-1.5 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-semibold text-slate-400 w-16">Thông hiểu</span>
                      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-red-500 to-crimson-primary rounded-full transition-all duration-500"
                          style={{ width: `${item.comprehension}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-bold text-slate-600 w-8 text-right">
                        {item.comprehension}%
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-semibold text-slate-400 w-16">Vận dụng</span>
                      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full transition-all duration-500"
                          style={{ width: `${item.application}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-bold text-slate-600 w-8 text-right">
                        {item.application}%
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    {item.description}
                  </p>
                  <p className="text-[11px] text-amber-800 bg-amber-50/70 px-2.5 py-1 rounded-lg mt-1.5 border border-amber-100 inline-block">
                    💡 <strong>Gợi ý cải thiện:</strong> {item.recommendation}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              onClose();
              if (onOpenAssessment) onOpenAssessment();
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-crimson-primary hover:bg-crimson-dark text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">edit_document</span>
            <span>Làm bài kiểm tra đánh giá lại</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200 transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
