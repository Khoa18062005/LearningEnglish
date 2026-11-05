import React, { useState, useEffect } from 'react';
import NotificationModal from '../../../components/NotificationModal';

export default function AddNoteFolderModal({
  isOpen,
  onClose,
  onSave,
  existingFolders = [],
  initialData = null,
}) {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalAlert, setModalAlert] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'warning',
  });

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setCode(initialData.code || '');
        setName(initialData.name || '');
        setDescription(initialData.description || '');
      } else {
        setCode('');
        setName('');
        setDescription('');
      }
      setIsSubmitting(false);
      setModalAlert({ isOpen: false, title: '', message: '', type: 'warning' });
    }
  }, [isOpen, initialData]);

  // Phím tắt ESC để đóng, Ctrl/Cmd + Enter để submit
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (modalAlert.isOpen) {
          setModalAlert((prev) => ({ ...prev, isOpen: false }));
        } else {
          onClose();
        }
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        handleSubmit(e);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, code, name, description, modalAlert.isOpen]);

  const trimmedName = (name || '').trim().toLowerCase();
  const isNameDuplicate = Boolean(
    trimmedName &&
      existingFolders.some((f) => {
        if (initialData && String(f.id) === String(initialData.id)) {
          return false;
        }
        return (f.name || '').trim().toLowerCase() === trimmedName;
      })
  );

  const trimmedCode = (code || '').trim().toUpperCase().replace(/[^a-zA-Z0-9]/g, '').slice(0, 8);
  const isCodeDuplicate = Boolean(
    trimmedCode &&
      existingFolders.some((f) => {
        if (initialData && String(f.id) === String(initialData.id)) {
          return false;
        }
        return (f.code || '').trim().toUpperCase() === trimmedCode;
      })
  );

  const handleCodeChange = (e) => {
    // Chỉ chấp nhận số và chữ (alphanumeric), không kí tự đặc biệt và khoảng cách - tối đa 8 ký tự
    const sanitized = e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 8);
    setCode(sanitized);
  };

  const handleCodeKeyDown = (e) => {
    // Chặn dấu cách và phím đặc biệt ngay khi nhấn
    if (e.key === ' ' || e.code === 'Space') {
      e.preventDefault();
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();

    if (!name.trim()) {
      setModalAlert({
        isOpen: true,
        title: 'Thiếu thông tin',
        message: 'Vui lòng nhập tên thư mục trước khi lưu!',
        type: 'warning',
      });
      return;
    }

    if (isNameDuplicate) {
      setModalAlert({
        isOpen: true,
        title: 'Trùng tên thư mục',
        message: (
          <span>
            Thư mục <strong className="font-bold text-crimson-primary">"{name.trim()}"</strong> đã tồn tại trong hệ thống. Vui lòng chọn một tên khác để dễ quản lý!
          </span>
        ),
        type: 'warning',
      });
      return;
    }

    if (isCodeDuplicate) {
      setModalAlert({
        isOpen: true,
        title: 'Trùng mã thư mục',
        message: (
          <span>
            Mã thư mục <strong className="font-bold text-crimson-primary">"{trimmedCode}"</strong> đã tồn tại trong hệ thống. Vui lòng chọn một mã khác!
          </span>
        ),
        type: 'warning',
      });
      return;
    }

    try {
      setIsSubmitting(true);
      await onSave({
        id: initialData?.id,
        code: trimmedCode || null,
        name: name.trim(),
        description: description.trim() || null,
      });
      onClose();
    } catch (err) {
      setModalAlert({
        isOpen: true,
        title: 'Lỗi lưu thư mục',
        message: err.response?.data?.message || err.message || 'Có lỗi xảy ra khi lưu thư mục!',
        type: 'danger',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
        <div className="relative w-full max-w-[720px] bg-white rounded-2xl sm:rounded-3xl shadow-[0_25px_60px_-15px_rgba(15,23,42,0.3)] flex flex-col my-auto max-h-[92vh] overflow-hidden border border-slate-200/90 ring-1 ring-black/5 animate-in zoom-in-95 duration-150">
          
          {/* Top Gradient Hairline Accent */}
          <div className="h-1.5 w-full bg-gradient-to-r from-crimson-dark via-crimson-primary to-rose-400 shrink-0"></div>

          {/* Modal Header */}
          <div className="px-6 sm:px-8 pt-5 pb-4 flex items-center justify-between border-b border-slate-100 bg-white shrink-0">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-rose-50 to-red-100/60 border border-red-200/60 flex items-center justify-center text-crimson-primary shadow-xs shrink-0">
                <span className="material-symbols-outlined text-[24px]">folder_open</span>
              </div>
              <div>
                <h2 className="font-headline text-lg sm:text-xl font-bold text-text-high-contrast tracking-tight">
                  {initialData ? 'Chỉnh Sửa Thư Mục (Bộ Đề)' : 'Tạo Thư Mục (Bộ Đề) Mới'}
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 text-[11px] font-semibold text-slate-400 bg-slate-100 rounded-md border border-slate-200">
                ESC
              </kbd>
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                type="button"
                title="Đóng cửa sổ (ESC)"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
          </div>

          {/* Modal Body Form */}
          <form onSubmit={handleSubmit} className="px-6 sm:px-8 py-5 overflow-y-auto flex flex-col gap-4.5 bg-slate-50/70">
            {/* Mã thư mục (Code) & Tên thư mục (Name) Row */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5 sm:gap-4">
              {/* Mã thư mục (Code) */}
              <div className="sm:col-span-5 flex flex-col gap-1.5">
                <div className="flex items-center justify-between gap-2 whitespace-nowrap">
                  <label className="text-xs font-bold text-text-high-contrast flex items-center gap-1.5 shrink-0">
                    <span>Mã thư mục</span>
                    <span className="text-[10px] text-text-muted font-normal">(Viết tắt)</span>
                  </label>
                  <span className="text-[10px] text-text-muted font-normal shrink-0">
                    {code.length > 0 ? `${code.length}/8 ký tự` : 'Tối đa 8 ký tự'}
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    value={code}
                    onChange={handleCodeChange}
                    onKeyDown={handleCodeKeyDown}
                    placeholder="VD: AV2"
                    maxLength={8}
                    className={`w-full h-11 px-3.5 bg-white rounded-xl text-xs font-bold tracking-wider transition-all outline-none uppercase ${
                      isCodeDuplicate
                        ? 'text-red-600 border-2 border-red-500 bg-red-50/40 focus:border-red-600 focus:ring-4 focus:ring-red-500/10'
                        : 'text-amber-700 border border-slate-200 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10'
                    }`}
                  />
                  {isCodeDuplicate && (
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-red-500 text-[18px]">
                      error
                    </span>
                  )}
                </div>
                {isCodeDuplicate ? (
                  <span className="text-[10px] text-red-600 font-semibold flex items-center gap-1">
                    <span className="material-symbols-outlined text-[12px]">warning</span>
                    Mã thư mục đã tồn tại
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-400 font-normal whitespace-nowrap">
                    Chỉ chữ và số, không khoảng cách
                  </span>
                )}
              </div>

              {/* Tên thư mục (Name) */}
              <div className="sm:col-span-7 flex flex-col gap-1.5">
                <div className="flex items-center justify-between gap-2 whitespace-nowrap">
                  <label className="text-xs font-bold text-text-high-contrast flex items-center gap-1 shrink-0">
                    <span>Tên thư mục</span>
                    <span className="text-crimson-primary">*</span>
                  </label>
                  <span className="text-[10px] text-text-muted font-normal shrink-0">Bắt buộc</span>
                </div>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="VD: Anh văn 2, Cambridge 18, ETS TOEIC 2024..."
                  className={`w-full h-11 px-3.5 bg-white rounded-xl text-xs font-semibold text-text-high-contrast border transition-all outline-none ${
                    isNameDuplicate
                      ? 'border-2 border-red-500 bg-red-50/40 focus:border-red-600 focus:ring-4 focus:ring-red-500/10'
                      : 'border-slate-200 focus:border-crimson-primary focus:ring-4 focus:ring-crimson-primary/10'
                  }`}
                  autoFocus={!initialData}
                />
                {isNameDuplicate && (
                  <span className="text-[10px] text-red-600 font-semibold flex items-center gap-1">
                    <span className="material-symbols-outlined text-[12px]">warning</span>
                    Tên thư mục đã tồn tại
                  </span>
                )}
              </div>
            </div>

            {/* Ghi chú thư mục (Notes) */}
            <div className="flex flex-col gap-1.5 pt-2.5 sm:pt-3">
              <div className="flex items-center justify-between gap-2">
                <label className="text-xs font-bold text-text-high-contrast">
                  Ghi chú thư mục
                </label>
                <span className="text-[10px] text-text-muted font-normal">Tùy chọn</span>
              </div>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="VD: Tập trung vào các bài đọc Reading Part 5-7, nạp 100 từ vựng cốt lõi..."
                className="w-full p-3 bg-white rounded-xl text-xs text-text-high-contrast border border-slate-200 focus:border-crimson-primary focus:ring-4 focus:ring-crimson-primary/10 transition-all outline-none resize-none font-normal leading-relaxed"
              />
            </div>
          </form>

          {/* Modal Footer */}
          <div className="px-6 sm:px-8 py-3.5 border-t border-slate-100 bg-white flex items-center justify-between shrink-0">
            <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-text-muted select-none">
              <span>Mẹo: Nhấn</span>
              <kbd className="inline-flex items-center px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded border border-slate-200 text-[10px] font-mono font-bold shadow-2xs">
                Ctrl + Enter
              </kbd>
              <span>để tạo nhanh</span>
            </div>

            <div className="flex items-center gap-2.5 ml-auto">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-text-muted hover:text-text-high-contrast hover:bg-slate-100 transition-colors disabled:opacity-50 cursor-pointer"
              >
                Hủy bỏ
              </button>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting || !name.trim()}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-crimson-primary hover:bg-crimson-dark text-white text-xs font-bold transition-all shadow-sm shadow-red-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>{initialData ? 'Đang lưu...' : 'Đang tạo...'}</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[16px]">{initialData ? 'save' : 'add'}</span>
                    <span>{initialData ? 'Lưu Thay Đổi' : 'Tạo Thư Mục Mới'}</span>
                  </>
                )}
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Modal Thông Báo / Cảnh Báo Form (Popup Center) */}
      <NotificationModal
        isOpen={modalAlert.isOpen}
        onClose={() => setModalAlert((prev) => ({ ...prev, isOpen: false }))}
        title={modalAlert.title}
        message={modalAlert.message}
        type={modalAlert.type}
        isAlertOnly={true}
        confirmText="Đã hiểu"
        zIndex="z-[70]"
      />
    </>
  );
}
