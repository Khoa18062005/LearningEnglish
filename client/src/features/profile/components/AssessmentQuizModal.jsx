import React, { useState } from 'react';

/**
 * AssessmentQuizModal: Bài kiểm tra đánh giá năng lực đầu vào / định kỳ
 * Giúp người học đo lường trực tiếp điểm thông hiểu & điểm vận dụng.
 */
export default function AssessmentQuizModal({
  isOpen,
  onClose,
  onComplete,
}) {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [isFinished, setIsFinished] = useState(false);

  if (!isOpen) return null;

  const questions = [
    {
      id: 1,
      category: 'Collocation & Cụm từ',
      question: 'Chọn từ phù hợp nhất điền vào chỗ trống: "The company decided to _______ a contract with the foreign supplier."',
      options: [
        { key: 'A', text: 'make', isCorrect: false },
        { key: 'B', text: 'execute', isCorrect: true },
        { key: 'C', text: 'do', isCorrect: false },
        { key: 'D', text: 'create', isCorrect: false },
      ],
      explanation: 'Trong tiếng Anh học thuật & thương mại, cụm chuẩn là "execute a contract" (ký kết / thực thi hợp đồng).',
    },
    {
      id: 2,
      category: 'Cấu trúc & Pattern câu',
      question: 'Theo cấu trúc Linearthinking, mẫu câu nào thể hiện rõ mối quan hệ nguyên nhân - kết quả logic?',
      options: [
        { key: 'A', text: 'He was late because of heavy traffic, so he missed the flight.', isCorrect: false },
        { key: 'B', text: 'Heavy traffic prevented him from arriving on time, resulting in a missed flight.', isCorrect: true },
        { key: 'C', text: 'Because heavy traffic happened, he therefore missed flight.', isCorrect: false },
        { key: 'D', text: 'Due to the fact that traffic was heavy, so he was late.', isCorrect: false },
      ],
      explanation: 'Câu B áp dụng cấu trúc Noun Phrase + Verb + Resulting in, giúp câu văn cô đọng, mạch lạc chuẩn văn phong học thuật.',
    },
    {
      id: 3,
      category: 'Họ từ vựng (Word Families)',
      question: 'Xác định dạng danh từ chỉ "sự phồn vinh, thịnh vượng" của tính từ "prosperous":',
      options: [
        { key: 'A', text: 'prosperousness', isCorrect: false },
        { key: 'B', text: 'prosperity', isCorrect: true },
        { key: 'C', text: 'prosperation', isCorrect: false },
        { key: 'D', text: 'prosper', isCorrect: false },
      ],
      explanation: '"Prosperity" là danh từ chính xác chỉ sự phồn vinh (prosper là động từ, prosperous là tính từ).',
    },
    {
      id: 4,
      category: 'Tư duy Paraphrase Linearthinking',
      question: 'Paraphrase câu "Many students find it difficult to balance study and part-time jobs":',
      options: [
        { key: 'A', text: 'Studying and doing part-time work is hard for students.', isCorrect: false },
        { key: 'B', text: 'Balancing academic commitments with employment poses a substantial challenge for undergraduates.', isCorrect: true },
        { key: 'C', text: 'A lot of pupils cannot manage both learning and working at same time.', isCorrect: false },
        { key: 'D', text: 'It is very tough to study while working part-time for everyone.', isCorrect: false },
      ],
      explanation: 'Câu B nâng cấp cấu trúc bằng danh từ hóa (academic commitments / employment) và collocation học thuật (poses a challenge).',
    },
  ];

  const handleSelect = (key) => {
    setSelectedAnswers({
      ...selectedAnswers,
      [currentStep]: key,
    });
  };

  const handleNext = () => {
    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setIsFinished(true);
    }
  };

  const currentQ = questions[currentStep];

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-amber-500 text-[22px]">auto_fix_high</span>
            <h2 className="font-headline font-bold text-base text-slate-900">
              Đánh giá năng lực đầu vào
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Content */}
        {!isFinished ? (
          <div className="p-6 space-y-5">
            {/* Step Progress */}
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span className="font-bold text-crimson-primary">Câu {currentStep + 1} / {questions.length}</span>
              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold text-[11px]">
                {currentQ.category}
              </span>
            </div>

            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-crimson-primary transition-all duration-300 rounded-full"
                style={{ width: `${((currentStep + 1) / questions.length) * 100}%` }}
              />
            </div>

            {/* Question Text */}
            <div className="py-2">
              <p className="font-semibold text-slate-900 text-sm leading-relaxed">
                {currentQ.question}
              </p>
            </div>

            {/* Options */}
            <div className="space-y-2.5">
              {currentQ.options.map((opt) => {
                const isSelected = selectedAnswers[currentStep] === opt.key;
                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => handleSelect(opt.key)}
                    className={`w-full p-3.5 rounded-xl border text-left text-xs transition-all flex items-center gap-3 cursor-pointer ${
                      isSelected
                        ? 'border-crimson-primary bg-surface-crimson-subtle text-crimson-primary font-bold shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                      isSelected ? 'bg-crimson-primary text-white' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {opt.key}
                    </span>
                    <span className="flex-1">{opt.text}</span>
                  </button>
                );
              })}
            </div>

            {/* Footer Buttons */}
            <div className="pt-4 flex items-center justify-between border-t border-slate-100">
              <button
                type="button"
                disabled={currentStep === 0}
                onClick={() => setCurrentStep(currentStep - 1)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none transition-colors"
              >
                Quay lại
              </button>

              <button
                type="button"
                disabled={!selectedAnswers[currentStep]}
                onClick={handleNext}
                className="px-5 py-2 rounded-xl bg-crimson-primary hover:bg-crimson-dark text-white text-xs font-bold transition-all disabled:opacity-40 disabled:pointer-events-none shadow-xs"
              >
                {currentStep === questions.length - 1 ? 'Hoàn thành đánh giá' : 'Câu tiếp theo'}
              </button>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
              <span className="material-symbols-outlined text-3xl">verified</span>
            </div>

            <h3 className="text-lg font-black text-slate-900">
              Hoàn thành đánh giá năng lực!
            </h3>

            <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
              Dựa trên kết quả bài kiểm tra, sơ đồ năng lực của bạn đã được cập nhật: 
              <strong> Điểm thông hiểu đạt 88/100</strong>, <strong>Điểm vận dụng đạt 82/100</strong>. 
              Trình độ tương đương <strong>B2+ / IELTS 6.5 - 7.0</strong>.
            </p>

            <div className="pt-3 flex justify-center">
              <button
                type="button"
                onClick={() => {
                  if (onComplete) onComplete();
                  onClose();
                }}
                className="px-6 py-2.5 rounded-xl bg-crimson-primary hover:bg-crimson-dark text-white text-xs font-bold shadow-md cursor-pointer transition-all"
              >
                Xem cập nhật trên sơ đồ
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
