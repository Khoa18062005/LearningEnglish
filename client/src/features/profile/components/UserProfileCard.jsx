import React, { useState } from 'react';

/**
 * UserProfileCard: Hiển thị thông tin cá nhân của học viên
 * 
 * Bố cục:
 * - Trên cùng: Tiêu đề "Thông tin cá nhân" bên trái, nút "Chỉnh sửa" bên phải + gạch ngang.
 * - Trung tâm: Avatar hình tròn to đẹp, cách trên dưới đều đặn, thoáng đãng.
 * - Bên dưới: Các trường thông tin chuẩn template (Họ tên, Email, Ngày sinh, Giới tính, Tỉnh/Thành phố, Phường/Xã, Ngày tạo tài khoản).
 */
export default function UserProfileCard({
  currentUser,
  onOpenEditModal,
  onOpenPasswordModal,
}) {
  const [copySuccess, setCopySuccess] = useState(false);

  // Thông tin người dùng hiện tại
  const userData = {
    fullName: currentUser?.fullName || 'Người dùng',
    email: currentUser?.email || '',
    dateOfBirth: currentUser?.dateOfBirth || '',
    gender: currentUser?.gender || 'MALE',
    provinceName: currentUser?.provinceName || '',
    wardName: currentUser?.wardName || '',
    role: currentUser?.role || 'ROLE_USER',
    createdAt: currentUser?.createdAt || '',
    avatar: currentUser?.avatar || null,
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
    if (!userData.fullName || !userData.fullName.trim()) return 'K';
    const parts = userData.fullName.trim().split(' ');
    return parts[parts.length - 1].charAt(0).toUpperCase();
  };

  const handleCopyEmail = () => {
    navigator.clipboard?.writeText(userData.email);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const normalizedGender = (userData.gender || 'MALE').toUpperCase();

  return (
    <div className="h-full bg-white rounded-2xl border border-slate-200/90 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-5 flex flex-col justify-start relative overflow-hidden group/card hover:shadow-md transition-all duration-200">
      <div>
        {/* Top Header Row: "Thông tin cá nhân" bên trái, nút "Chỉnh sửa" bên phải + gạch ngang bên dưới */}
        <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-100 mb-2">
          <h2 className="font-headline text-base font-extrabold text-slate-900 tracking-tight">
            Thông tin cá nhân
          </h2>

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

        {/* 1. TRÊN CÙNG: AVATAR HÌNH TRÒN TO ĐẸP */}
        <div className="flex flex-col items-center justify-center pt-3.5 pb-5 sm:pt-4 sm:pb-6 text-center">
          <div 
            onClick={onOpenEditModal}
            className="relative group/avatar cursor-pointer transition-transform duration-200 hover:scale-105"
            title="Bấm để chỉnh sửa ảnh đại diện"
          >
            {/* Vòng viền ngoài gradient to tròn */}
            <div className="w-24 h-24 rounded-full p-1 bg-gradient-to-tr from-crimson-primary via-rose-500 to-amber-400 shadow-lg shadow-red-500/20 ring-4 ring-rose-50 flex items-center justify-center">
              {userData.avatar ? (
                <img
                  src={userData.avatar}
                  alt={userData.fullName}
                  className="w-full h-full rounded-full object-cover bg-white"
                />
              ) : (
                <div className="w-full h-full rounded-full bg-gradient-to-tr from-crimson-primary via-rose-600 to-red-500 text-white font-black text-3xl flex items-center justify-center shadow-inner select-none tracking-tight">
                  {getUserInitial()}
                </div>
              )}
            </div>

            {/* Trạng thái trực tuyến (Online Dot) */}
            <span
              className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center shadow-sm"
              title="Đang hoạt động"
            >
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            </span>

            {/* Hover overlay biểu tượng máy ảnh */}
            <div className="absolute inset-0 rounded-full bg-black/30 opacity-0 group-hover/avatar:opacity-100 transition-opacity flex items-center justify-center text-white backdrop-blur-[1px]">
              <span className="material-symbols-outlined text-[22px]">photo_camera</span>
            </div>
          </div>
        </div>

        {/* 2. BÊN DƯỚI: CÁC TRƯỜNG THÔNG TIN TÁCH BIỆT THEO CHUẨN TEMPLATE */}
        <div className="space-y-3 mt-0.5">
          {/* Trường 1: Họ và tên */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700">
              Họ và tên <span className="text-crimson-primary">*</span>
            </label>
            <div className="h-10 px-3.5 rounded-xl border border-slate-200/90 bg-slate-50/60 hover:bg-slate-50 transition-colors flex items-center gap-2.5 text-slate-800 text-xs font-semibold">
              <span className="material-symbols-outlined text-[19px] text-slate-400 shrink-0">
                badge
              </span>
              <span className="truncate">{userData.fullName}</span>
            </div>
          </div>

          {/* Trường 2: Email */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700">
              Email <span className="text-crimson-primary">*</span>
            </label>
            <div className="h-10 px-3.5 rounded-xl border border-slate-200/90 bg-slate-50/60 hover:bg-slate-50 transition-colors flex items-center justify-between gap-2 text-slate-800 text-xs">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="material-symbols-outlined text-[19px] text-slate-400 shrink-0">
                  mail
                </span>
                <span className="truncate font-semibold text-slate-800">{userData.email}</span>
              </div>
              <button
                type="button"
                onClick={handleCopyEmail}
                className="shrink-0 p-1 rounded-lg text-slate-400 hover:text-crimson-primary hover:bg-slate-200/60 transition-colors cursor-pointer"
                title="Sao chép email"
              >
                <span className="material-symbols-outlined text-[15px]">
                  {copySuccess ? 'check' : 'content_copy'}
                </span>
              </button>
            </div>
          </div>

          {/* Trường 3 & 4: Ngày sinh & Giới tính (Grid 2 cột) */}
          <div className="grid grid-cols-2 gap-2.5">
            {/* Cột Ngày sinh */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">
                Ngày sinh <span className="text-crimson-primary">*</span>
              </label>
              <div 
                onClick={onOpenEditModal}
                className="h-10 px-3 rounded-xl border border-slate-200/90 bg-slate-50/60 hover:bg-slate-50 transition-colors flex items-center justify-between gap-1 text-slate-800 text-xs font-semibold cursor-pointer"
                title="Bấm để đổi ngày sinh"
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="material-symbols-outlined text-[18px] text-slate-400 shrink-0">
                    calendar_month
                  </span>
                  <span className="truncate text-xs">{formatDate(userData.dateOfBirth)}</span>
                </div>
                <span className="material-symbols-outlined text-[16px] text-slate-400 shrink-0">
                  expand_more
                </span>
              </div>
            </div>

            {/* Cột Giới tính (Segmented control: Nam / Nữ / Khác) */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">
                Giới tính <span className="text-crimson-primary">*</span>
              </label>
              <div className="h-10 p-1 bg-slate-100/90 rounded-xl border border-slate-200/90 grid grid-cols-3 gap-1">
                {[
                  { id: 'MALE', label: 'Nam' },
                  { id: 'FEMALE', label: 'Nữ' },
                  { id: 'OTHER', label: 'Khác' },
                ].map((item) => {
                  const isSelected = normalizedGender === item.id;
                  return (
                    <div
                      key={item.id}
                      className={`h-full rounded-lg flex items-center justify-center text-xs transition-all select-none ${
                        isSelected
                          ? 'bg-crimson-primary text-white font-bold shadow-xs'
                          : 'text-slate-500 font-medium'
                      }`}
                    >
                      {item.label}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Trường 5: Tỉnh / Thành phố */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700">
              Tỉnh / Thành phố
            </label>
            <div 
              onClick={onOpenEditModal}
              className="h-10 px-3.5 rounded-xl border border-slate-200/90 bg-slate-50/60 hover:bg-slate-50 transition-colors flex items-center justify-between gap-2 text-slate-800 text-xs font-semibold cursor-pointer group/field"
              title="Bấm để chỉnh sửa Tỉnh / Thành phố"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="material-symbols-outlined text-[19px] text-slate-400 group-hover/field:text-crimson-primary transition-colors shrink-0">
                  location_city
                </span>
                <span className={`truncate ${!userData.provinceName ? 'text-slate-400 font-normal italic' : 'text-slate-800'}`}>
                  {userData.provinceName || 'Chưa cập nhật'}
                </span>
              </div>
              <span className="material-symbols-outlined text-[16px] text-slate-400 group-hover/field:text-crimson-primary transition-colors shrink-0">
                edit
              </span>
            </div>
          </div>

          {/* Trường 6: Phường / Xã */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700">
              Phường / Xã
            </label>
            <div 
              onClick={onOpenEditModal}
              className="h-10 px-3.5 rounded-xl border border-slate-200/90 bg-slate-50/60 hover:bg-slate-50 transition-colors flex items-center justify-between gap-2 text-slate-800 text-xs font-semibold cursor-pointer group/field"
              title="Bấm để chỉnh sửa Phường / Xã"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="material-symbols-outlined text-[19px] text-slate-400 group-hover/field:text-crimson-primary transition-colors shrink-0">
                  home_pin
                </span>
                <span className={`truncate ${!userData.wardName ? 'text-slate-400 font-normal italic' : 'text-slate-800'}`}>
                  {userData.wardName || 'Chưa cập nhật'}
                </span>
              </div>
              <span className="material-symbols-outlined text-[16px] text-slate-400 group-hover/field:text-crimson-primary transition-colors shrink-0">
                edit
              </span>
            </div>
          </div>

          {/* Trường 7: Ngày tạo tài khoản */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700">
              Ngày tạo tài khoản
            </label>
            <div className="h-10 px-3.5 rounded-xl border border-slate-200/90 bg-slate-50/60 hover:bg-slate-50 transition-colors flex items-center gap-2.5 text-slate-800 text-xs font-semibold">
              <span className="material-symbols-outlined text-[19px] text-slate-400 shrink-0">
                event_available
              </span>
              <span className="truncate">{formatDate(userData.createdAt)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
