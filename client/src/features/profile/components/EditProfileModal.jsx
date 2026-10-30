import React, { useState, useEffect } from 'react';

/**
 * EditProfileModal: Modal chỉnh sửa thông tin cá nhân
 * Cho phép học viên cập nhật các trường đăng ký: Họ tên, Ngày sinh, Giới tính.
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
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFullName(currentUser?.fullName || 'Nguyễn Quốc Khoa');
      setDateOfBirth(currentUser?.dateOfBirth || '2005-06-18');
      setGender(currentUser?.gender || 'MALE');
      setErrorMessage('');
      setIsSubmitting(false);
    }
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

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
    };

    // Save to localStorage
    try {
      localStorage.setItem('current_user', JSON.stringify(updatedUser));
    } catch (e) {
      console.error(e);
    }

    if (onSave) {
      onSave(updatedUser);
    }

    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-crimson-primary text-[22px]">manage_accounts</span>
            <h2 className="font-headline font-bold text-base text-slate-900">
              Chỉnh sửa thông tin cá nhân
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-crimson-primary font-semibold flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px]">error</span>
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Full Name */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 flex items-center gap-1">
              <span>Họ và tên</span>
              <span className="text-crimson-primary">*</span>
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Nhập họ và tên đầy đủ..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-crimson-primary focus:ring-2 focus:ring-red-100 outline-none text-slate-900 text-xs transition-all"
            />
          </div>

          {/* Date of Birth */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 flex items-center gap-1">
              <span>Ngày sinh</span>
              <span className="text-crimson-primary">*</span>
            </label>
            <input
              type="date"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-crimson-primary focus:ring-2 focus:ring-red-100 outline-none text-slate-900 text-xs transition-all"
            />
          </div>

          {/* Gender */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700">Giới tính</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'MALE', label: 'Nam', icon: 'male' },
                { value: 'FEMALE', label: 'Nữ', icon: 'female' },
                { value: 'OTHER', label: 'Khác', icon: 'person' },
              ].map((g) => (
                <button
                  key={g.value}
                  type="button"
                  onClick={() => setGender(g.value)}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    gender === g.value
                      ? 'border-crimson-primary bg-surface-crimson-subtle text-crimson-primary font-bold shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 text-slate-600 bg-white'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">{g.icon}</span>
                  <span>{g.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Email (Read-only) */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-500">Email tài khoản (không đổi)</label>
            <input
              type="email"
              value={currentUser?.email || 'nguyenquockhoa18062005@gmail.com'}
              disabled
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-100 text-slate-500 text-xs cursor-not-allowed"
            />
          </div>

          {/* Buttons */}
          <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
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
