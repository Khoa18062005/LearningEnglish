import React, { useState, useEffect } from 'react';
import DatePicker from '../../../components/DatePicker';
import SearchableSelect from '../../../components/SearchableSelect';
import { locationApi } from '../../../api/locationApi';
import { authApi } from '../../../api/authApi';

/**
 * EditProfileModal: Modal chỉnh sửa thông tin cá nhân
 * Cho phép học viên cập nhật các trường: Họ tên, Ngày sinh, Giới tính, Tỉnh/Thành phố, Phường/Xã, Ảnh đại diện.
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

  // Thông tin địa chỉ 2 cấp (Provinces Open API v2)
  const [selectedProvinceCode, setSelectedProvinceCode] = useState('');
  const [selectedProvinceName, setSelectedProvinceName] = useState('');
  const [selectedWardCode, setSelectedWardCode] = useState('');
  const [selectedWardName, setSelectedWardName] = useState('');

  const [provinces, setProvinces] = useState([]);
  const [wards, setWards] = useState([]);
  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingWards, setLoadingWards] = useState(false);

  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Đồng bộ thông tin khi mở modal hoặc currentUser thay đổi
  useEffect(() => {
    if (isOpen) {
      setFullName(currentUser?.fullName || 'Nguyễn Quốc Khoa');
      setDateOfBirth(currentUser?.dateOfBirth || '2005-06-18');
      setGender(currentUser?.gender || 'MALE');
      setAvatar(currentUser?.avatar || null);

      setSelectedProvinceCode(currentUser?.provinceCode ? String(currentUser.provinceCode) : '');
      setSelectedProvinceName(currentUser?.provinceName || '');
      setSelectedWardCode(currentUser?.wardCode ? String(currentUser.wardCode) : '');
      setSelectedWardName(currentUser?.wardName || '');

      setErrorMessage('');
      setIsSubmitting(false);
    }
  }, [isOpen, currentUser]);

  // Tải danh sách Tỉnh/Thành phố khi mở Modal
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const fetchProvinces = async () => {
      setLoadingProvinces(true);
      try {
        const data = await locationApi.getProvinces();
        if (isMounted) {
          setProvinces(data);
          // Khớp mã tỉnh nếu user có provinceName nhưng chưa có provinceCode
          if (!currentUser?.provinceCode && currentUser?.provinceName) {
            const match = data.find(
              (p) => p.name.toLowerCase() === currentUser.provinceName.toLowerCase()
            );
            if (match) {
              setSelectedProvinceCode(String(match.code));
              setSelectedProvinceName(match.name);
            }
          }
        }
      } catch (err) {
        console.error('Không thể tải danh sách Tỉnh/Thành phố:', err);
      } finally {
        if (isMounted) setLoadingProvinces(false);
      }
    };

    fetchProvinces();
    return () => {
      isMounted = false;
    };
  }, [isOpen, currentUser]);

  // Tải danh sách Phường/Xã khi selectedProvinceCode thay đổi
  useEffect(() => {
    if (!isOpen || !selectedProvinceCode) {
      setWards([]);
      return;
    }

    let isMounted = true;
    const fetchWards = async () => {
      setLoadingWards(true);
      try {
        const data = await locationApi.getWardsByProvince(selectedProvinceCode);
        if (isMounted) {
          setWards(data);
          // Khớp mã phường xã nếu user có wardName nhưng chưa có wardCode
          if (!selectedWardCode && currentUser?.wardName) {
            const match = data.find(
              (w) => w.name.toLowerCase() === currentUser.wardName.toLowerCase()
            );
            if (match) {
              setSelectedWardCode(String(match.code));
              setSelectedWardName(match.name);
            }
          }
        }
      } catch (err) {
        console.error('Không thể tải danh sách Phường/Xã:', err);
      } finally {
        if (isMounted) setLoadingWards(false);
      }
    };

    fetchWards();
    return () => {
      isMounted = false;
    };
  }, [isOpen, selectedProvinceCode, currentUser]);

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

  const handleProvinceSelect = (item) => {
    if (!item) {
      setSelectedProvinceCode('');
      setSelectedProvinceName('');
      setSelectedWardCode('');
      setSelectedWardName('');
      setWards([]);
      return;
    }
    setSelectedProvinceCode(String(item.code));
    setSelectedProvinceName(item.name);
    // Reset ward khi đổi tỉnh
    setSelectedWardCode('');
    setSelectedWardName('');
    if (errorMessage) setErrorMessage('');
  };

  const handleWardSelect = (item) => {
    if (!item) {
      setSelectedWardCode('');
      setSelectedWardName('');
      return;
    }
    setSelectedWardCode(String(item.code));
    setSelectedWardName(item.name);
    if (errorMessage) setErrorMessage('');
  };

  const handleSubmit = async (e) => {
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

    if (selectedProvinceCode && !selectedWardCode) {
      setErrorMessage('Vui lòng chọn Phường / Xã tương ứng với Tỉnh / Thành phố.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    // Chuẩn hóa định dạng dateOfBirth thành YYYY-MM-DD
    let cleanDob = dateOfBirth;
    if (typeof cleanDob === 'string' && cleanDob.includes('T')) {
      cleanDob = cleanDob.split('T')[0];
    }

    const payload = {
      fullName: cleanName,
      dateOfBirth: cleanDob,
      gender,
      provinceCode: selectedProvinceCode ? Number(selectedProvinceCode) : null,
      provinceName: selectedProvinceName || null,
      wardCode: selectedWardCode ? Number(selectedWardCode) : null,
      wardName: selectedWardName || null,
      addressDetail: currentUser?.addressDetail || null,
    };

    let updatedUser = {
      ...(currentUser || {}),
      ...payload,
      avatar,
    };

    const token = localStorage.getItem('access_token');

    // 1. Nếu người dùng đang đăng nhập (có token), gọi API cập nhật lên Spring Boot Backend
    if (token) {
      try {
        const responseData = await authApi.updateProfile(payload);
        const savedUser = responseData?.data || responseData;
        if (savedUser && savedUser.email) {
          updatedUser = {
            ...updatedUser,
            ...savedUser,
            avatar: avatar || currentUser?.avatar,
          };
        }
      } catch (err) {
        console.error('Lỗi khi cập nhật profile lên Backend:', err);
        setErrorMessage(
          err.message || 'Không thể lưu thông tin lên máy chủ. Vui lòng kiểm tra kết nối Backend hoặc khởi động lại Spring Boot.'
        );
        setIsSubmitting(false);
        return; // Dừng lại, không đóng modal và không giả lập thành công nếu backend lỗi!
      }
    }

    // 2. Lưu vào localStorage để duy trì trạng thái đăng nhập
    try {
      localStorage.setItem('current_user', JSON.stringify(updatedUser));
    } catch (err) {
      console.error('Lỗi lưu current_user vào localStorage:', err);
    }

    // 3. Cập nhật state ở client
    if (onSave) {
      onSave(updatedUser);
    }

    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
      <div 
        className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col my-auto relative animate-in zoom-in-95 duration-200 max-h-[92vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Fixed top */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 shrink-0">
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

        {/* Form Body - Scrollable */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs overflow-y-auto custom-scrollbar flex-1">
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

          {/* Tỉnh / Thành phố */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 flex items-center justify-between">
              <span>Tỉnh / Thành phố</span>
              {loadingProvinces && (
                <span className="text-[11px] text-slate-400 font-normal italic">Đang tải...</span>
              )}
            </label>
            <SearchableSelect
              value={selectedProvinceCode}
              onChange={handleProvinceSelect}
              options={provinces}
              placeholder="Gõ hoặc chọn Tỉnh / Thành phố..."
              icon="location_city"
              loading={loadingProvinces}
              className="w-full"
            />
          </div>

          {/* Phường / Xã */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 flex items-center justify-between">
              <span>Phường / Xã</span>
              {loadingWards && (
                <span className="text-[11px] text-slate-400 font-normal italic">Đang tải...</span>
              )}
            </label>
            <SearchableSelect
              value={selectedWardCode}
              onChange={handleWardSelect}
              options={wards}
              placeholder={
                selectedProvinceCode
                  ? 'Gõ hoặc chọn Phường / Xã...'
                  : 'Vui lòng chọn Tỉnh / Thành phố trước'
              }
              icon="home_pin"
              disabled={!selectedProvinceCode || loadingWards}
              loading={loadingWards}
              className="w-full"
            />
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
