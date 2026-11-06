import React from 'react';

export interface MoveFolderConfirmModalProps {
  /** Trạng thái mở / đóng của modal */
  isOpen: boolean;
  /** Callback khi người dùng hủy hoặc đóng modal */
  onClose: () => void;
  /** Callback bất đồng bộ hoặc đồng bộ khi người dùng bấm xác nhận chuyển */
  onConfirm: () => Promise<void> | void;
  /** Tiêu đề modal (Mặc định: 'Chuyển danh sách từ vựng') */
  title?: string;
  /** Tên danh sách / bài đọc đang được chuyển */
  listName: string;
  /** Mã danh sách (VD: 'AV3-Week01') */
  listCode?: string;
  /** Tên thư mục xuất phát (Mặc định: 'Danh sách riêng lẻ') */
  sourceFolderName?: string;
  /** Tên thư mục chuyển đến (Mặc định: 'Danh sách riêng lẻ') */
  targetFolderName?: string;
  /** Nhãn nút xác nhận (Mặc định: 'Xác nhận chuyển') */
  confirmText?: string;
  /** Nhãn nút hủy (Mặc định: 'Hủy') */
  cancelText?: string;
  /** Cờ trạng thái đang tải hoặc xử lý */
  isLoading?: boolean;
  /** Tuỳ chỉnh z-index hiển thị (Mặc định: 'z-[75]') */
  zIndex?: string;
}

declare const MoveFolderConfirmModal: React.FC<MoveFolderConfirmModalProps>;

export default MoveFolderConfirmModal;
