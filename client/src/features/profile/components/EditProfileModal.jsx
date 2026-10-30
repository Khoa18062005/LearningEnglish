import React, { useState, useEffect } from 'react';
import DatePicker from '../../../components/DatePicker';

/**
 * EditProfileModal: Modal chỉnh sửa thông tin cá nhân
 * Cho phép học viên cập nhật các trường đăng ký: Họ tên, Ngày sinh, Giới tính, Ảnh đại diện.
 * Thiết kế đồng bộ hoàn hảo với template DOL / LinearVocab và UserProfileCard.
 */
export default function EditProfileModal({
  isOpen,
  currentUser,
  onClose,
  onSave,
}) {
  const [fullName, setFullName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState('MALE');
  const [avatar, setAvatar] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFullName(currentUser?.fullName || 'Nguyễn Quốc Khoa');
      setDateOfBirth(currentUser?.dateOfBirth || '2005-06-18');
      setGender(currentUser?.gender || 'MALE');
      setAvatar(currentUser?.avatar || null);
      setErrorMessage('');
      setIsSubmitting(false);
    }
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  const getUserInitial = () => {
    if (!fullName || !fullName.trim()) return 'K';
    const parts = fullName.trim().split(' ');
    return parts[parts.length - 1].charAt(0).toUpperCase();
  };

  const handleAvatarFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setErrorMessage('Dung lượng ảnh tối đa là 2MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setAvatar(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const cleanName = fullName.trim();
    if (!cleanName) {
      setErrorMessage('Họ và tên không được để trống.');
      return;
    }

    if (!dateOfBirth) {
      setErrorMessage('Vui lòng chọn ngày sinh.');
      return;
    }

    setIsSubmitting(true);

    const updatedUser = {
      ...(currentUser || {}),
      fullName: cleanName,
      dateOfBirth,
      gender,
      avatar,
    };

    // Save to localStorage
    try {
      localStorage.setItem('current_user', JSON.stringify(updatedUser));
    } catch (err) {
      console.error(err);
    }

    if (onSave) {
      onSave(updatedUser);
    }

    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
      <div 
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col my-auto relative animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 rounded-t-3xl">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-crimson-primary text-[22px]">manage_accounts</span>
            <h2 className="font-headline font-bold text-base text-slate-900">
              Chỉnh sửa thông tin cá nhân
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-crimson-primary font-semibold flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px] shrink-0">error</span>
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Avatar Preview & Change */}
          <div className="flex items-center gap-4 p-3 bg-slate-50/80 rounded-2xl border border-slate-100">
            <div className="relative group shrink-0">
              <div className="w-16 h-16 rounded-full p-0.5 bg-gradient-to-tr from-crimson-primary via-rose-500 to-amber-400 shadow-md ring-2 ring-white flex items-center justify-center overflow-hidden">
                {avatar ? (
                  <img
                    src={avatar}
                    alt="Preview"
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-gradient-to-tr from-crimson-primary via-rose-600 to-red-500 text-white font-black text-2xl flex items-center justify-center select-none">
                    {getUserInitial()}
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-1 min-w-0">
              <span className="font-bold text-slate-800 text-xs">Ảnh đại diện</span>
              <span className="text-[11px] text-slate-500">Tải ảnh đại diện mới hoặc dùng chữ cái</span>
              <div className="flex items-center gap-2 mt-1">
                <label className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-slate-300 text-slate-700 text-[11px] font-semibold cursor-pointer shadow-2xs transition-colors flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">upload</span>
                  <span>Đổi ảnh</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarFileChange}
                    className="hidden"
                  />
                </label>
                {avatar && (
                  <button
                    type="button"
                    onClick={() => setAvatar(null)}
                    className="px-2 py-1 rounded-lg text-crimson-primary hover:bg-red-50 text-[11px] font-semibold transition-colors"
                  >
                    Xóa ảnh
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Full Name */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 flex items-center gap-1">
              <span>Họ và tên</span>
              <span className="text-crimson-primary">*</span>
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
                badge
              </span>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ví dụ: Nguyễn Văn A"
                className="w-full h-10 pl-9 pr-3 rounded-xl border border-slate-200 focus:border-crimson-primary focus:ring-2 focus:ring-red-100 outline-none text-slate-900 text-xs transition-all font-medium"
                required
              />
            </div>
          </div>

          {/* Email (Read-only) */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 flex items-center gap-1">
              <span>Email</span>
              <span className="text-crimson-primary">*</span>
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
                mail
              </span>
              <input
                type="email"
                value={currentUser?.email || 'nguyenquockhoa18062005@gmail.com'}
                disabled
                className="w-full h-10 pl-9 pr-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-600 text-xs font-medium cursor-not-allowed"
              />
            </div>
          </div>

          {/* Grid: Date of Birth & Gender */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Ngày sinh */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 flex items-center gap-1">
                <span>Ngày sinh</span>
                <span className="text-crimson-primary">*</span>
              </label>
              <DatePicker
                value={dateOfBirth}
                onChange={(newDate) => setDateOfBirth(newDate)}
                placeholder="dd/mm/yyyy"
                className="!h-10"
                required
              />
            </div>

            {/* Giới tính */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 flex items-center gap-1">
                <span>Giới tính</span>
                <span className="text-crimson-primary">*</span>
              </label>
              <div className="h-10 p-1 bg-slate-100/90 rounded-xl border border-slate-200 grid grid-cols-3 gap-1">
                {[
                  { id: 'MALE', label: 'Nam' },
                  { id: 'FEMALE', label: 'Nữ' },
                  { id: 'OTHER', label: 'Khác' },
                ].map((item) => {
                  const isSelected = gender === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setGender(item.id)}
                      className={`h-full rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-crimson-primary text-white shadow-xs'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Ngày tạo tài khoản (Read-only) */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-500">Ngày tạo tài khoản</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
                event_available
              </span>
              <input
                type="text"
                value={currentUser?.createdAt ? currentUser.createdAt.split('T')[0] : '2026-10-30'}
                disabled
                className="w-full h-10 pl-9 pr-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-600 text-xs font-medium cursor-not-allowed"
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-crimson-primary hover:bg-crimson-dark text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              Lưu thay đổi
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
