import React, { useState } from 'react';

/**
 * UserProfileCard: Hiển thị thông tin cá nhân dùng để đăng ký tài khoản
 * Nằm gọn gàng ở một góc bên trái (như yêu cầu của người dùng).
 * 
 * Các trường thông tin đăng ký:
 * - Họ và tên (fullName)
 * - Email (email)
 * - Ngày sinh (dateOfBirth)
 * - Giới tính (gender: MALE / FEMALE / OTHER)
 * - Vai trò / Quyền (role: ROLE_USER / ROLE_ADMIN)
 * - Ngày tham gia hệ thống
 */
export default function UserProfileCard({
  currentUser,
  onOpenEditModal,
  onOpenPasswordModal,
}) {
  const [copySuccess, setCopySuccess] = useState(false);

  // Fallback an toàn nếu chưa đăng nhập hoặc thiếu trường thông tin
  const userData = {
    fullName: currentUser?.fullName || 'Nguyễn Quốc Khoa',
    email: currentUser?.email || 'nguyenquockhoa18062005@gmail.com',
    dateOfBirth: currentUser?.dateOfBirth || '2005-06-18',
    gender: currentUser?.gender || 'MALE',
    role: currentUser?.role || 'ROLE_USER',
    createdAt: currentUser?.createdAt || '2026-10-28',
  };

  const getGenderInfo = (gender) => {
    switch (gender) {
      case 'MALE':
        return { label: 'Nam', icon: 'male', color: 'text-blue-600 bg-blue-50 border-blue-200' };
      case 'FEMALE':
        return { label: 'Nữ', icon: 'female', color: 'text-pink-600 bg-pink-50 border-pink-200' };
      default:
        return { label: 'Khác', icon: 'person', color: 'text-purple-600 bg-purple-50 border-purple-200' };
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Chưa cập nhật';
    try {
      const parts = dateStr.toString().split('T')[0].split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  const getUserInitial = () => {
    if (!userData.fullName || !userData.fullName.trim()) return 'U';
    const parts = userData.fullName.trim().split(' ');
    return parts[parts.length - 1].charAt(0).toUpperCase();
  };

  const handleCopyEmail = () => {
    navigator.clipboard?.writeText(userData.email);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const genderInfo = getGenderInfo(userData.gender);

  return (
    <div className="h-full bg-white rounded-2xl border border-slate-200/90 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-5 flex flex-col justify-between relative overflow-hidden group/card hover:shadow-md transition-all duration-200">
      {/* Decorative gradient top accent bar */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-crimson-primary via-rose-500 to-amber-500" />

      {/* Decorative subtle background watermark */}
      <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-crimson-primary/5 rounded-full blur-2xl pointer-events-none" />

      <div>
        {/* Top Header: Badge & Quick Action */}
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-[11px] font-bold tracking-wide uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Hồ sơ người dùng</span>
          </div>

          <button
            type="button"
            onClick={onOpenEditModal}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-crimson-primary hover:bg-surface-crimson-subtle transition-colors cursor-pointer border border-transparent hover:border-red-200"
            title="Chỉnh sửa thông tin cá nhân"
          >
            <span className="material-symbols-outlined text-[15px]">edit_note</span>
            <span>Chỉnh sửa</span>
          </button>
        </div>

        {/* User Identity Avatar & Main Info */}
        <div className="flex items-center gap-3.5 mb-4 pb-4 border-b border-slate-100">
          <div className="relative shrink-0">
            <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-crimson-primary via-rose-600 to-red-500 text-white font-black text-xl flex items-center justify-center shadow-md shadow-red-200 ring-2 ring-white">
              {getUserInitial()}
            </div>
            {/* Status dot */}
            <span 
              className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center"
              title="Trạng thái: Trực tuyến"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-white" />
            </span>
          </div>

          <div className="flex flex-col min-w-0">
            <h3 className="text-base font-extrabold text-slate-900 tracking-tight truncate leading-snug">
              {userData.fullName}
            </h3>
            
            <div className="flex items-center gap-1 text-slate-500 text-xs mt-0.5 truncate">
              <span className="material-symbols-outlined text-[14px] text-slate-400 shrink-0">mail</span>
              <span className="truncate">{userData.email}</span>
              <button
                type="button"
                onClick={handleCopyEmail}
                className="text-slate-400 hover:text-crimson-primary ml-0.5 transition-colors"
                title="Sao chép email"
              >
                <span className="material-symbols-outlined text-[13px]">
                  {copySuccess ? 'check' : 'content_copy'}
                </span>
              </button>
            </div>

            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 text-[10px] font-bold border border-amber-200">
                <span className="material-symbols-outlined text-[12px] text-amber-500">workspace_premium</span>
                <span>{userData.role === 'ROLE_ADMIN' ? 'Quản trị viên' : 'Người dùng Pro'}</span>
              </span>

              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${genderInfo.color}`}>
                <span className="material-symbols-outlined text-[12px]">{genderInfo.icon}</span>
                <span>{genderInfo.label}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Registration Details Grid */}
        <div className="grid grid-cols-2 gap-2.5 text-xs">
          {/* Ngày sinh */}
          <div className="p-2.5 rounded-xl bg-slate-50/80 border border-slate-100 flex flex-col gap-1">
            <span className="text-[10px] font-semibold text-slate-500 flex items-center gap-1">
              <span className="material-symbols-outlined text-[13px] text-rose-500">cake</span>
              <span>Ngày sinh</span>
            </span>
            <span className="font-bold text-slate-800 tracking-tight">
              {formatDate(userData.dateOfBirth)}
            </span>
          </div>

          {/* Ngày tham gia */}
          <div className="p-2.5 rounded-xl bg-slate-50/80 border border-slate-100 flex flex-col gap-1">
            <span className="text-[10px] font-semibold text-slate-500 flex items-center gap-1">
              <span className="material-symbols-outlined text-[13px] text-indigo-500">event_available</span>
              <span>Ngày tham gia</span>
            </span>
            <span className="font-bold text-slate-800 tracking-tight">
              {formatDate(userData.createdAt)}
            </span>
          </div>
        </div>

        {/* Quick Study Metrics */}
        <div className="mt-3 p-3 rounded-xl bg-gradient-to-r from-red-50/70 to-rose-50/40 border border-red-100/80 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="text-xl">🔥</span>
            <div className="flex flex-col">
              <span className="font-bold text-slate-900 leading-tight">Chuỗi học tập</span>
              <span className="text-[10px] text-slate-500">7 ngày liên tục</span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs font-black text-crimson-primary bg-white px-2 py-0.5 rounded-lg border border-red-200 shadow-xs">
              Mục tiêu 100%
            </span>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="pt-3 mt-3 border-t border-slate-100/90 flex items-center justify-between text-[11px] text-slate-500">
        <span className="flex items-center gap-1">
          <span className="material-symbols-outlined text-[14px] text-emerald-500">verified_user</span>
          <span>Tài khoản đã xác thực</span>
        </span>
        <span className="text-slate-400">ID: #{currentUser?.id || '2005'}</span>
      </div>
    </div>
  );
}
