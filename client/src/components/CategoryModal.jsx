import React, { useState, useEffect } from 'react';

const PRESET_COLORS = [
  { label: 'DOL Crimson', value: '#E31E24' },
  { label: 'Royal Blue', value: '#2563EB' },
  { label: 'Emerald', value: '#059669' },
  { label: 'Purple', value: '#7C3AED' },
  { label: 'Warm Amber', value: '#EA580C' },
  { label: 'Rose Pink', value: '#DB2777' },
  { label: 'Teal Cyan', value: '#0891B2' },
  { label: 'Slate Dark', value: '#475569' },
];

export default function CategoryModal({
  isOpen,
  initialCategory = null,
  onClose,
  onSave,
  existingCategories = [],
}) {
  const [name, setName] = useState('');
  const [colorCode, setColorCode] = useState('#E31E24');
  const [description, setDescription] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditing = Boolean(initialCategory);

  useEffect(() => {
    if (isOpen) {
      if (initialCategory) {
        setName(initialCategory.name || '');
        setColorCode(initialCategory.colorCode || '#E31E24');
        setDescription(initialCategory.description || '');
      } else {
        setName('');
        setColorCode('#E31E24');
        setDescription('');
      }
      setErrorMessage('');
      setIsSubmitting(false);
    }
  }, [isOpen, initialCategory]);

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();

    const cleanName = name.trim();
    if (!cleanName) {
      setErrorMessage('Vui lòng nhập tên danh mục.');
      return;
    }

    // Check duplicate name (case-insensitive) except current category if editing
    const isDuplicate = existingCategories.some((cat) => {
      if (isEditing && cat.id === initialCategory.id) return false;
      return cat.name.toLowerCase() === cleanName.toLowerCase();
    });

    if (isDuplicate) {
      setErrorMessage(`Danh mục "${cleanName}" đã tồn tại! Vui lòng chọn tên khác.`);
      return;
    }

    setErrorMessage('');
    setIsSubmitting(true);

    try {
      const payload = {
        name: cleanName,
        colorCode: colorCode || '#E31E24',
        description: description.trim() || null,
      };

      await onSave(payload, initialCategory?.id);
    } catch (err) {
      console.error('Lỗi khi lưu danh mục:', err);
      setErrorMessage(err.message || 'Có lỗi xảy ra khi lưu danh mục. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        handleSubmit(e);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, name, colorCode, description, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-[650px] bg-white rounded-2xl sm:rounded-3xl shadow-[0_25px_60px_-15px_rgba(15,23,42,0.3)] flex flex-col my-auto max-h-[92vh] overflow-hidden border border-slate-200/90 ring-1 ring-black/5 animate-in zoom-in-95 duration-150">
        
        {/* Top Gradient Hairline Accent */}
        <div 
          className="h-1.5 w-full bg-gradient-to-r from-crimson-dark via-crimson-primary to-rose-400 shrink-0"
          style={colorCode ? { background: `linear-gradient(to right, ${colorCode}, #E31E24, #FB7185)` } : {}}
        />

        {/* Modal Header */}
        <div className="px-6 sm:px-8 pt-5 pb-4 flex items-center justify-between border-b border-slate-100 bg-white shrink-0">
          <div className="flex items-center gap-3.5">
            <div 
              className="w-11 h-11 rounded-2xl border flex items-center justify-center shadow-xs shrink-0 transition-colors"
              style={{
                backgroundColor: `${colorCode}15`,
                borderColor: `${colorCode}40`,
                color: colorCode,
              }}
            >
              <span className="material-symbols-outlined text-[24px]">label</span>
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="font-headline text-lg sm:text-xl font-bold text-text-high-contrast tracking-tight">
                  {isEditing ? `Chỉnh Sửa Danh Mục: ${initialCategory?.name}` : 'Tạo Danh Mục Mới'}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-surface-crimson-soft text-crimson-dark text-[10px] font-extrabold uppercase tracking-wider border border-border-crimson-tint/60">
                  CATEGORY
                </span>
              </div>
              <p className="text-xs text-text-muted mt-0.5 whitespace-normal sm:whitespace-nowrap">
                {isEditing ? 'Cập nhật tên, mã màu sắc hoặc mô tả cho danh mục.' : 'Phân loại các từ vựng theo chủ đề, chứng chỉ hoặc mục đích học.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 text-[11px] font-semibold text-slate-400 bg-slate-100 rounded-md border border-slate-200">
              ESC
            </kbd>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              type="button"
              title="Đóng cửa sổ (ESC)"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="px-6 sm:px-8 py-5 overflow-y-auto flex flex-col gap-4 bg-slate-50/70">
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200/80 text-xs font-semibold text-crimson-dark flex items-center gap-2 animate-in fade-in">
              <span className="material-symbols-outlined text-[18px] text-crimson-primary shrink-0">error</span>
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Field 1: Category Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-text-high-contrast flex items-center justify-between">
              <span>
                Tên danh mục <span className="text-crimson-primary">*</span>
              </span>
              <span className="text-[11px] font-normal text-text-muted">
                e.g. IELTS Acad, Business English, Oxford 3000
              </span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nhập tên danh mục..."
              className="w-full h-11 px-3.5 bg-white rounded-xl text-sm font-semibold text-text-high-contrast border border-slate-200 focus:border-crimson-primary focus:ring-4 focus:ring-crimson-primary/10 transition-all outline-none"
              autoFocus
              required
            />
          </div>

          {/* Field 2: Color Palette Selection */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-text-high-contrast flex items-center justify-between">
              <span>Màu sắc nhận diện</span>
              <span className="text-[11px] font-mono text-text-muted">{colorCode}</span>
            </label>

            {/* Presets Grid */}
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
              {PRESET_COLORS.map((c) => {
                const isSelected = colorCode.toLowerCase() === c.value.toLowerCase();
                return (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setColorCode(c.value)}
                    title={c.label}
                    className={`h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer relative shadow-2xs ${
                      isSelected ? 'ring-2 ring-offset-2 ring-slate-800 scale-105' : 'hover:scale-105 opacity-90 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: c.value }}
                  >
                    {isSelected && (
                      <span className="material-symbols-outlined text-white text-[16px] font-bold drop-shadow-xs">
                        check
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Custom Color Input */}
            <div className="flex items-center gap-3 pt-1">
              <label className="relative flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:border-slate-300 cursor-pointer text-xs font-semibold text-slate-700 transition-colors">
                <input
                  type="color"
                  value={colorCode}
                  onChange={(e) => setColorCode(e.target.value)}
                  className="w-5 h-5 rounded-md cursor-pointer border-0 p-0 bg-transparent"
                />
                <span>Chọn màu khác</span>
              </label>

              {/* Live Preview Pill */}
              <div className="flex items-center gap-2 ml-auto text-xs">
                <span className="text-slate-400 text-[11px]">Xem trước:</span>
                <span 
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold border transition-colors shadow-2xs"
                  style={{
                    backgroundColor: `${colorCode}15`,
                    borderColor: `${colorCode}30`,
                    color: colorCode,
                  }}
                >
                  <span className="material-symbols-outlined text-[15px]">label</span>
                  <span>{name.trim() || 'Tên danh mục'}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Field 3: Description */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-text-high-contrast flex items-center justify-between">
              <span>Mô tả danh mục</span>
              <span className="text-[11px] font-normal text-text-muted">Tùy chọn</span>
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ghi chú về nhóm từ vựng hoặc phạm vi áp dụng..."
              className="w-full px-3.5 py-2.5 bg-white rounded-xl text-xs font-normal text-text-body border border-slate-200 focus:border-crimson-primary focus:ring-4 focus:ring-crimson-primary/10 transition-all outline-none resize-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 bg-white hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-crimson-primary hover:bg-crimson-dark shadow-sm hover:shadow transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                  <span>Đang lưu...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[16px]">
                    {isEditing ? 'check' : 'add'}
                  </span>
                  <span>{isEditing ? 'Cập nhật danh mục' : 'Tạo danh mục'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
