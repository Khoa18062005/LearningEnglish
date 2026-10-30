import React, { useEffect } from 'react';

/**
 * NotificationModal: Mẫu popup thông báo & xác nhận trung tâm (Popup Center)
 * Dùng chung cho toàn bộ ứng dụng (Xóa, Cảnh báo, Thông báo thành công, Thông tin).
 * 
 * Props:
 * - isOpen: boolean (Trạng thái mở modal)
 * - onClose: function (Hàm gọi khi hủy / đóng modal)
 * - onConfirm: function (Hàm gọi khi xác nhận thực hiện hành động)
 * - title: string (Tiêu đề thông báo)
 * - message: string | ReactNode (Nội dung chi tiết thông báo)
 * - type: 'danger' | 'warning' | 'info' | 'success' (Kiểu thông báo, mặc định: 'danger')
 * - confirmText: string (Chữ hiển thị ở nút xác nhận)
 * - cancelText: string (Chữ hiển thị ở nút hủy bỏ)
 * - isAlertOnly: boolean (Nếu true: chỉ hiển thị nút Đóng/Đã hiểu, không có nút Hủy)
 * - isLoading: boolean (Hiển thị spinner khi đang xử lý tác vụ bất đồng bộ)
 */
export default function NotificationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  type = 'danger',
  confirmText,
  cancelText = 'Hủy bỏ',
  isAlertOnly = false,
  isLoading = false,
  zIndex = 'z-[70]',
}) {
  // Lắng nghe phím tắt ESC và Enter
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      } else if (e.key === 'Enter' && !isLoading) {
        e.stopPropagation();
        if (isAlertOnly) {
          onClose();
        } else if (onConfirm) {
          onConfirm();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, onConfirm, isAlertOnly, isLoading]);

  if (!isOpen) return null;

  // Cấu hình Icon và Màu sắc theo từng kiểu thông báo
  const config = {
    danger: {
      defaultTitle: 'Xác nhận xóa',
      defaultConfirmText: 'Xác nhận xóa',
      icon: 'delete_forever',
      iconContainerClass: 'bg-rose-50 text-crimson-primary border-rose-200/60',
      confirmBtnClass: 'bg-crimson-primary hover:bg-crimson-dark text-white shadow-xs focus:ring-crimson-primary/20',
      topBarClass: 'from-crimson-dark via-crimson-primary to-rose-400',
    },
    warning: {
      defaultTitle: 'Cảnh báo',
      defaultConfirmText: 'Tiếp tục',
      icon: 'warning',
      iconContainerClass: 'bg-amber-50 text-amber-600 border-amber-200/60',
      confirmBtnClass: 'bg-amber-600 hover:bg-amber-700 text-white shadow-xs focus:ring-amber-500/20',
      topBarClass: 'from-amber-600 via-amber-500 to-yellow-400',
    },
    success: {
      defaultTitle: 'Thành công',
      defaultConfirmText: 'Đã hiểu',
      icon: 'check_circle',
      iconContainerClass: 'bg-emerald-50 text-emerald-600 border-emerald-200/60',
      confirmBtnClass: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs focus:ring-emerald-500/20',
      topBarClass: 'from-emerald-600 via-emerald-500 to-teal-400',
    },
    info: {
      defaultTitle: 'Thông báo',
      defaultConfirmText: 'Đã hiểu',
      icon: 'info',
      iconContainerClass: 'bg-blue-50 text-blue-600 border-blue-200/60',
      confirmBtnClass: 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs focus:ring-blue-500/20',
      topBarClass: 'from-blue-600 via-blue-500 to-sky-400',
    },
  }[type] || {
    defaultTitle: 'Thông báo',
    defaultConfirmText: 'Xác nhận',
    icon: 'notifications',
    iconContainerClass: 'bg-slate-50 text-slate-700 border-slate-200',
    confirmBtnClass: 'bg-slate-800 hover:bg-slate-900 text-white',
    topBarClass: 'from-slate-700 to-slate-900',
  };

  const finalTitle = title || config.defaultTitle;
  const finalConfirmText = confirmText || (isAlertOnly ? 'Đã hiểu' : config.defaultConfirmText);

  const handleConfirm = () => {
    if (isLoading) return;
    if (isAlertOnly) {
      onClose();
    } else if (onConfirm) {
      onConfirm();
    }
  };

  return (
    <div
      className={`fixed inset-0 ${zIndex || 'z-[70]'} flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200`}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[420px] bg-white rounded-2xl shadow-[0_20px_50px_rgba(15,23,42,0.25)] border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Đường viền gradient phía trên */}
        <div className={`h-1.5 w-full bg-gradient-to-r ${config.topBarClass} shrink-0`} />

        {/* Nút đóng góc phải */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3.5 right-3.5 w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          title="Đóng (ESC)"
        >
          <span className="material-symbols-outlined text-[18px]">close</span>
        </button>

        {/* Nội dung trung tâm */}
        <div className="p-6 pt-5 flex flex-col items-center text-center">
          {/* Icon nổi bật */}
          <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center mb-3.5 shadow-xs ${config.iconContainerClass}`}>
            <span className="material-symbols-outlined text-[26px]">{config.icon}</span>
          </div>

          {/* Tiêu đề */}
          <h3 className="font-headline text-lg font-bold text-text-high-contrast tracking-tight">
            {finalTitle}
          </h3>

          {/* Nội dung tin nhắn */}
          <div className="text-xs sm:text-[13px] text-text-muted mt-2 leading-relaxed px-2">
            {message}
          </div>
        </div>

        {/* Các nút hành động phía dưới */}
        <div className="px-6 pb-5 pt-1 flex items-center justify-center gap-2.5">
          {!isAlertOnly && (
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 rounded-xl text-xs font-bold text-text-muted hover:text-text-high-contrast hover:bg-slate-100 border border-slate-200/80 transition-colors disabled:opacity-50"
            >
              {cancelText}
            </button>
          )}

          <button
            type="button"
            onClick={handleConfirm}
            disabled={isLoading}
            className={`flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all focus:ring-4 outline-none disabled:opacity-50 ${config.confirmBtnClass}`}
          >
            {isLoading ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Đang xử lý...</span>
              </>
            ) : (
              <span>{finalConfirmText}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
