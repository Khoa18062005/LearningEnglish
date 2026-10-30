import React from 'react';

/**
 * Toast Component: Thông báo góc trên cùng bên phải
 * Thiết kế màu xanh lá (Emerald) hiện đại, bo góc mềm mại, icon trực quan.
 */
export default function Toast({ toast, onClose }) {
  if (!toast) return null;

  return (
    <div className="fixed top-5 right-5 z-[9999] flex items-center gap-3 px-4 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-600 to-teal-600 text-white shadow-[0_12px_32px_rgba(5,150,105,0.35)] border border-emerald-400/60 backdrop-blur-md animate-in slide-in-from-top-3 fade-in duration-300 max-w-sm select-none">
      <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0 border border-white/25 shadow-xs">
        <span className="material-symbols-outlined text-[20px] text-white">check_circle</span>
      </div>
      <div className="flex flex-col min-w-0 pr-2">
        <span className="font-bold text-xs leading-snug">{toast.title || 'Thông báo'}</span>
        <span className="text-[11px] text-white/90 leading-tight mt-0.5">{toast.message}</span>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="w-6 h-6 rounded-lg flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0 ml-auto"
        title="Đóng thông báo"
      >
        <span className="material-symbols-outlined text-[16px]">close</span>
      </button>
    </div>
  );
}
