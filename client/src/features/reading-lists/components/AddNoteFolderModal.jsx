import React, { useState, useEffect } from 'react';
import NotificationModal from '../../../components/NotificationModal';

export default function AddNoteFolderModal({
  isOpen,
  onClose,
  onSave,
  existingFolders = [],
  initialData = null,
}) {
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
        setName(initialData.name || '');
        setDescription(initialData.description || '');
      } else {
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
  }, [isOpen, name, description, modalAlert.isOpen]);

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

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();

    if (!name.trim()) {
      setModalAlert({
        isOpen: true,
        title: 'Thiếu thông tin',
        message: 'Vui lòng nhập tên danh mục trước khi lưu!',
        type: 'warning',
      });
      return;
    }

    if (isNameDuplicate) {
      setModalAlert({
        isOpen: true,
        title: 'Trùng tên danh mục',
        message: (
          <span>
            Danh mục <strong className="font-bold text-crimson-primary">"{name.trim()}"</strong> đã tồn tại trong hệ thống. Vui lòng chọn một tên khác để dễ quản lý!
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
        code: initialData?.code || null,
        name: name.trim(),
        description: description.trim() || null,
      });
      onClose();
    } catch (err) {
      setModalAlert({
        isOpen: true,
        title: 'Lỗi lưu danh mục',
        message: err.response?.data?.message || err.message || 'Có lỗi xảy ra khi lưu danh mục!',
        type: 'danger',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
        <div className="relative w-full max-w-[620px] bg-white rounded-2xl sm:rounded-3xl shadow-[0_25px_60px_-15px_rgba(15,23,42,0.3)] flex flex-col my-auto max-h-[92vh] overflow-hidden border border-slate-200/90 ring-1 ring-black/5 animate-in zoom-in-95 duration-150">
          
          {/* Top Gradient Hairline Accent */}
          <div className="h-1.5 w-full bg-gradient-to-r from-crimson-dark via-crimson-primary to-rose-400 shrink-0"></div>

          {/* Modal Header */}
          <div className="px-6 sm:px-8 pt-5 pb-4 flex items-center justify-between border-b border-slate-100 bg-white shrink-0">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-rose-50 to-red-100/60 border border-red-200/60 flex items-center justify-center text-crimson-primary shadow-xs shrink-0">
                <span className="material-symbols-outlined text-[24px]">folder</span>
              </div>
              <div>
                <h2 className="font-headline text-lg sm:text-xl font-bold text-text-high-contrast tracking-tight">
                  {initialData ? 'Chỉnh Sửa Danh Mục' : 'Tạo Danh Mục Mới'}
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
            {/* Tên danh mục (Name) */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-text-high-contrast flex items-center gap-1">
                  <span>Tên danh mục</span>
                  <span className="text-crimson-primary">*</span>
                </label>
                <span className="text-[10px] text-text-muted font-normal">Bắt buộc</span>
              </div>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="VD: Cambridge 18, ETS TOEIC 2024, Anh văn 2 - HCMUTE..."
                className="w-full h-11 px-3.5 bg-white rounded-xl text-xs font-semibold text-text-high-contrast border border-slate-200 focus:border-crimson-primary focus:ring-4 focus:ring-crimson-primary/10 transition-all outline-none"
                autoFocus
              />
            </div>

            {/* Ghi chú danh mục / Mục tiêu (Notes) */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-text-high-contrast">
                  Ghi chú danh mục / Mục tiêu (Notes)
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
                    <span>{initialData ? 'Lưu Thay Đổi' : 'Tạo Danh Mục Mới'}</span>
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
