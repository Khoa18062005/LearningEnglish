import { useState, useEffect, useRef } from 'react';
import { authApi } from '../../../api/authApi';
import { locationApi } from '../../../api/locationApi';
import AuthBanner from '../components/AuthBanner';
import DatePicker from '../../../components/DatePicker';
import SearchableSelect from '../../../components/SearchableSelect';

export default function RegisterPage({
  initialData = null,
  onNavigateLogin,
  onNavigateOtp,
}) {
  const [fullName, setFullName] = useState(initialData?.fullName || '');
  const [email, setEmail] = useState(initialData?.email || '');
  const [password, setPassword] = useState(initialData?.password || '');
  const [confirmPassword, setConfirmPassword] = useState(initialData?.password || '');
  const [dateOfBirth, setDateOfBirth] = useState(initialData?.dateOfBirth || '');
  const [gender, setGender] = useState(initialData?.gender || 'MALE'); // 'MALE' | 'FEMALE' | 'OTHER'

  // Địa chỉ theo Provinces Open API v2 (Cấu trúc 2 cấp sau sáp nhập: Tỉnh/Thành -> Phường/Xã)
  const [provinces, setProvinces] = useState([]);
  const [wards, setWards] = useState([]);
  const [selectedProvinceCode, setSelectedProvinceCode] = useState(
    initialData?.provinceCode ? String(initialData.provinceCode) : ''
  );
  const [selectedProvinceName, setSelectedProvinceName] = useState(initialData?.provinceName || '');
  const [selectedWardCode, setSelectedWardCode] = useState(
    initialData?.wardCode ? String(initialData.wardCode) : ''
  );
  const [selectedWardName, setSelectedWardName] = useState(initialData?.wardName || '');
  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingWards, setLoadingWards] = useState(false);

  const [agreeTerms, setAgreeTerms] = useState(true);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [confirmStatus, setConfirmStatus] = useState(null); // null | 'MATCH' | 'MISMATCH'

  // Ref đo chiều cao thực tế của khối form bên trái (từ đỉnh chữ "Đăng ký tài khoản" đến đáy chữ "Đã có tài khoản? Đăng nhập ngay")
  const formContainerRef = useRef(null);
  const [formHeight, setFormHeight] = useState(null);

  useEffect(() => {
    if (!formContainerRef.current) return;

    const updateHeight = () => {
      if (formContainerRef.current) {
        setFormHeight(formContainerRef.current.offsetHeight);
      }
    };

    updateHeight();

    let observer = null;
    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(updateHeight);
      observer.observe(formContainerRef.current);
    }

    window.addEventListener('resize', updateHeight);

    return () => {
      if (observer) observer.disconnect();
      window.removeEventListener('resize', updateHeight);
    };
  }, []);

  // Hiệu ứng kiểm tra khớp mật khẩu khi người dùng dừng nhập
  useEffect(() => {
    if (!confirmPassword) {
      setConfirmStatus(null);
      return;
    }

    const timer = setTimeout(() => {
      if (password && confirmPassword === password) {
        setConfirmStatus('MATCH');
      } else {
        setConfirmStatus('MISMATCH');
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [confirmPassword, password]);

  // Load danh sách 63 Tỉnh/Thành phố từ Provinces Open API v2 khi component mount
  useEffect(() => {
    let isMounted = true;
    const fetchProvinces = async () => {
      setLoadingProvinces(true);
      try {
        const data = await locationApi.getProvinces();
        if (isMounted) {
          setProvinces(data);
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
  }, []);

  // Khi selectedProvinceCode thay đổi, load danh sách Phường/Xã tương ứng (depth=2)
  useEffect(() => {
    if (!selectedProvinceCode) {
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
  }, [selectedProvinceCode]);

  const handleProvinceSelect = (item) => {
    if (!item) {
      setSelectedProvinceCode('');
      setSelectedProvinceName('');
      setSelectedWardCode('');
      setSelectedWardName('');
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

  // Tiêu chí kiểm tra mật khẩu
  const passwordCriteria = [
    {
      id: 'length',
      label: 'Tối thiểu 8 ký tự',
      met: password.length >= 8,
    },
    {
      id: 'uppercase',
      label: 'Chữ cái viết hoa',
      met: /[A-Z]/.test(password),
    },
    {
      id: 'number',
      label: 'Ký tự số',
      met: /[0-9]/.test(password),
    },
    {
      id: 'special',
      label: 'Ký tự đặc biệt',
      met: /[^A-Za-z0-9]/.test(password),
    },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    const trimmedFullName = fullName.trim();
    if (!trimmedFullName) {
      setErrorMessage('Họ và tên là bắt buộc');
      return;
    }

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      setErrorMessage('Email là bắt buộc');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setErrorMessage('Định dạng email không hợp lệ');
      return;
    }

    if (!password) {
      setErrorMessage('Mật khẩu là bắt buộc');
      return;
    }

    if (password.length < 8) {
      setErrorMessage('Mật khẩu phải có tối thiểu 8 ký tự');
      return;
    }

    if (!/[A-Z]/.test(password)) {
      setErrorMessage('Mật khẩu phải chứa ít nhất 1 chữ cái viết hoa (A-Z)');
      return;
    }

    if (!/[0-9]/.test(password)) {
      setErrorMessage('Mật khẩu phải chứa ít nhất 1 ký tự số (0-9)');
      return;
    }

    if (!/[^A-Za-z0-9]/.test(password)) {
      setErrorMessage('Mật khẩu phải chứa ít nhất 1 ký tự đặc biệt (ví dụ: !@#$%^&*)');
      return;
    }

    if (!confirmPassword) {
      setErrorMessage('Vui lòng nhập xác nhận mật khẩu');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Mật khẩu xác nhận không trùng khớp');
      return;
    }

    if (!dateOfBirth) {
      setErrorMessage('Vui lòng chọn ngày tháng năm sinh');
      return;
    }

    if (!selectedProvinceCode) {
      setErrorMessage('Vui lòng chọn Tỉnh / Thành phố');
      return;
    }

    if (!selectedWardCode) {
      setErrorMessage('Vui lòng chọn Phường / Xã');
      return;
    }

    if (!agreeTerms) {
      setErrorMessage('Vui lòng đồng ý với Điều khoản dịch vụ để tiếp tục');
      return;
    }

    setLoading(true);

    try {
      // 1. Gửi yêu cầu sinh và gửi mã OTP qua email (hạn 3 phút)
      await authApi.sendRegistrationOtp(trimmedEmail);

      // 2. Chuyển sang trang nhập mã OTP kèm toàn bộ dữ liệu form đã điền
      const registrationPayload = {
        fullName: trimmedFullName,
        email: trimmedEmail,
        password,
        dateOfBirth,
        gender,
        provinceCode: selectedProvinceCode ? parseInt(selectedProvinceCode, 10) : null,
        provinceName: selectedProvinceName,
        wardCode: selectedWardCode ? parseInt(selectedWardCode, 10) : null,
        wardName: selectedWardName,
      };

      if (onNavigateOtp) {
        onNavigateOtp(registrationPayload);
      }
    } catch (err) {
      console.error('Lỗi khi gửi mã xác thực OTP:', err);
      setErrorMessage(err.message || 'Không thể gửi mã xác thực OTP. Vui lòng kiểm tra lại email.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegisterMock = () => {
    setErrorMessage('Tính năng đăng ký qua Google đang được tích hợp. Vui lòng đăng ký qua form!');
  };

  return (
    <div className="min-h-screen w-full bg-white flex flex-col justify-center py-6 sm:py-8 lg:py-10 selection:bg-surface-crimson-soft selection:text-crimson-dark">
      <div className="w-full max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-8 flex-1 flex flex-col lg:flex-row items-center lg:items-start justify-center gap-8 lg:gap-14 my-auto">
        {/* Left Form Column */}
        <div className="w-full lg:w-1/2 flex items-center justify-center py-4">
          <div
            ref={formContainerRef}
            className="max-w-[460px] w-full lg:-translate-x-7 xl:-translate-x-9"
          >
            {/* Centered Header Section */}
            <div className="text-center mb-6">
              {/* Tiêu đề Đăng ký tài khoản */}
              <h1 className="text-2xl sm:text-3xl font-extrabold text-text-high-contrast tracking-tight font-sans">
                Đăng ký tài khoản
              </h1>

              {/* Dòng chữ chào mừng */}
              <p className="mt-2 text-sm text-text-muted">
                Bắt đầu hành trình nâng tầm vốn từ vựng tiếng Anh tư duy của bạn
              </p>
            </div>

            {/* Error Message Box */}
            {errorMessage && (
              <div className="mb-5 p-3.5 rounded-xl bg-surface-crimson-subtle border border-border-crimson-tint flex items-start gap-2.5 text-xs text-crimson-dark animate-in fade-in duration-200">
                <span className="material-symbols-outlined text-[18px] shrink-0 text-crimson-primary">
                  error
                </span>
                <div className="font-semibold leading-relaxed">{errorMessage}</div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold text-text-body mb-1.5">
                  Họ và tên <span className="text-crimson-primary">*</span>
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted text-[18px]">
                    badge
                  </span>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => {
                      setFullName(e.target.value);
                      if (errorMessage) setErrorMessage('');
                    }}
                    placeholder="Ví dụ: Nguyễn Văn A"
                    className="w-full h-11 pl-10 pr-3.5 rounded-xl border border-slate-200 bg-white text-sm text-text-high-contrast placeholder:text-text-disabled focus:outline-none focus:ring-2 focus:ring-crimson-primary/20 focus:border-crimson-primary transition-all"
                    required
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-bold text-text-body mb-1.5">
                  Email <span className="text-crimson-primary">*</span>
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted text-[18px]">
                    mail
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errorMessage) setErrorMessage('');
                    }}
                    placeholder="username@example.com"
                    className="w-full h-11 pl-10 pr-3.5 rounded-xl border border-slate-200 bg-white text-sm text-text-high-contrast placeholder:text-text-disabled focus:outline-none focus:ring-2 focus:ring-crimson-primary/20 focus:border-crimson-primary transition-all"
                    required
                  />
                </div>
              </div>

              {/* Date of Birth & Gender Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-0.5">
                {/* Date of Birth */}
                <div>
                  <label className="block text-xs font-bold text-text-body mb-1.5">
                    Ngày sinh <span className="text-crimson-primary">*</span>
                  </label>
                  <DatePicker
                    value={dateOfBirth}
                    onChange={(newDate) => {
                      setDateOfBirth(newDate);
                      if (errorMessage) setErrorMessage('');
                    }}
                    placeholder="dd/mm/yyyy"
                    required
                  />
                </div>

                {/* Gender */}
                <div>
                  <label className="block text-xs font-bold text-text-body mb-1.5">
                    Giới tính <span className="text-crimson-primary">*</span>
                  </label>
                  <div className="grid grid-cols-3 gap-1 p-1 bg-canvas-slate rounded-xl border border-slate-200 h-11">
                    {[
                      { id: 'MALE', label: 'Nam' },
                      { id: 'FEMALE', label: 'Nữ' },
                      { id: 'OTHER', label: 'Khác' },
                    ].map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setGender(item.id)}
                        className={`text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                          gender === item.id
                            ? 'bg-crimson-primary text-white shadow-xs font-bold'
                            : 'text-text-muted hover:text-text-high-contrast'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Tỉnh / Thành phố */}
              <div>
                <label className="block text-xs font-bold text-text-body mb-1.5">
                  Tỉnh / Thành phố <span className="text-crimson-primary">*</span>
                </label>
                <SearchableSelect
                  value={selectedProvinceCode}
                  onChange={handleProvinceSelect}
                  options={provinces}
                  placeholder="Gõ hoặc chọn Tỉnh / Thành phố..."
                  icon="location_city"
                  loading={loadingProvinces}
                  emptyText="Không tìm thấy tỉnh / thành phố"
                />
              </div>

              {/* Phường / Xã */}
              <div>
                <label className="block text-xs font-bold text-text-body mb-1.5">
                  Phường / Xã <span className="text-crimson-primary">*</span>
                </label>
                <SearchableSelect
                  value={selectedWardCode}
                  onChange={handleWardSelect}
                  options={wards}
                  placeholder={
                    !selectedProvinceCode
                      ? 'Vui lòng chọn Tỉnh / Thành phố trước'
                      : 'Gõ hoặc chọn Phường / Xã...'
                  }
                  icon="home_pin"
                  disabled={!selectedProvinceCode || loadingWards}
                  loading={loadingWards}
                  emptyText="Không tìm thấy phường / xã"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-bold text-text-body mb-1.5">
                  Mật khẩu <span className="text-crimson-primary">*</span>
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted text-[18px]">
                    lock
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errorMessage) setErrorMessage('');
                    }}
                    placeholder="Tối thiểu 8 ký tự"
                    className="w-full h-11 pl-10 pr-10 rounded-xl border border-slate-200 bg-white text-sm text-text-high-contrast placeholder:text-text-disabled focus:outline-none focus:ring-2 focus:ring-crimson-primary/20 focus:border-crimson-primary transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-high-contrast"
                    tabIndex={-1}
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {showPassword ? 'visibility' : 'visibility_off'}
                    </span>
                  </button>
                </div>

                {/* 4 vòng tròn tiêu chí mật khẩu trên cùng 1 hàng ngang */}
                <div className="flex items-center justify-between gap-1.5 mt-2 px-0.5">
                  {passwordCriteria.map((c) => (
                    <div
                      key={c.id}
                      className={`flex items-center gap-1 text-[11px] transition-colors duration-200 ${
                        c.met ? 'text-emerald-700 font-medium' : 'text-text-muted'
                      }`}
                    >
                      <span
                        className={`material-symbols-outlined text-[15px] shrink-0 transition-all duration-200 ${
                          c.met
                            ? 'text-emerald-500 scale-105'
                            : 'text-slate-300'
                        }`}
                      >
                        {c.met ? 'check_circle' : 'radio_button_unchecked'}
                      </span>
                      <span className="leading-tight select-none whitespace-nowrap">
                        {c.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-text-body">
                    Xác nhận mật khẩu <span className="text-crimson-primary">*</span>
                  </label>

                  {/* Trạng thái Khớp / Không khớp bên phải phía trên khung */}
                  {confirmStatus && (
                    <span
                      className={`text-[11px] font-bold transition-all duration-200 animate-in fade-in ${
                        confirmStatus === 'MATCH'
                          ? 'text-emerald-600'
                          : 'text-rose-500'
                      }`}
                    >
                      {confirmStatus === 'MATCH' ? 'Khớp' : 'Không khớp'}
                    </span>
                  )}
                </div>

                <div className="relative">
                  <span
                    className={`material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[18px] transition-colors ${
                      confirmStatus === 'MATCH'
                        ? 'text-emerald-500'
                        : confirmStatus === 'MISMATCH'
                        ? 'text-rose-500'
                        : 'text-text-muted'
                    }`}
                  >
                    lock_reset
                  </span>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (errorMessage) setErrorMessage('');
                    }}
                    placeholder="Nhập lại mật khẩu"
                    className={`w-full h-11 pl-10 pr-10 rounded-xl text-sm text-text-high-contrast placeholder:text-text-disabled focus:outline-none transition-all ${
                      confirmStatus === 'MATCH'
                        ? 'border border-emerald-500 ring-1 ring-emerald-500 bg-emerald-50/15 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500'
                        : confirmStatus === 'MISMATCH'
                        ? 'border border-rose-500 ring-1 ring-rose-500 bg-rose-50/15 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500'
                        : 'border border-slate-200 bg-white focus:ring-2 focus:ring-crimson-primary/20 focus:border-crimson-primary'
                    }`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-high-contrast"
                    tabIndex={-1}
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {showConfirmPassword ? 'visibility' : 'visibility_off'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Agreement Checkbox */}
              <div className="pt-1">
                <label className="flex items-start gap-2.5 cursor-pointer text-xs text-text-muted select-none">
                  <input
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded border-slate-300 text-crimson-primary focus:ring-crimson-primary/20 accent-crimson-primary cursor-pointer shrink-0"
                  />
                  <span>
                    Tôi đồng ý với{' '}
                    <span className="font-semibold text-text-body">Điều khoản dịch vụ</span> &{' '}
                    <span className="font-semibold text-text-body">Chính sách bảo mật</span>
                  </span>
                </label>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 rounded-xl bg-crimson-primary hover:bg-crimson-dark text-white font-bold text-sm shadow-[0_4px_14px_rgba(227,30,36,0.3)] hover:shadow-[0_6px_20px_rgba(227,30,36,0.4)] active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                >
                  {loading && (
                    <span className="material-symbols-outlined animate-spin text-[18px]">
                      progress_activity
                    </span>
                  )}
                  <span>{loading ? 'Đang gửi mã OTP...' : 'Tiếp tục & Nhận mã OTP'}</span>
                </button>
              </div>

              {/* Divider */}
              <div className="relative flex py-1.5 items-center">
                <div className="flex-grow border-t border-slate-200"></div>
                <span className="flex-shrink mx-4 text-[11px] font-bold text-text-muted uppercase tracking-wider">
                  HOẶC
                </span>
                <div className="flex-grow border-t border-slate-200"></div>
              </div>

              {/* Google Social Button */}
              <button
                type="button"
                onClick={handleGoogleRegisterMock}
                className="w-full h-11 rounded-xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-text-body font-semibold text-xs transition-all flex items-center justify-center gap-3 shadow-xs cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Đăng ký bằng Google</span>
              </button>
            </form>

            {/* Bottom Login Switch Link */}
            <div className="mt-6 text-center text-xs text-text-muted">
              Đã có tài khoản?{' '}
              <button
                type="button"
                onClick={onNavigateLogin}
                className="font-bold text-crimson-primary hover:text-crimson-dark transition-colors ml-1 cursor-pointer"
              >
                Đăng nhập ngay
              </button>
            </div>
          </div>
        </div>

        {/* Right Hero Card Column */}
        <div className="hidden lg:flex lg:w-1/2 justify-center py-4 w-full">
          <div
            className="w-full max-w-[620px] flex flex-col transition-[height] duration-150"
            style={formHeight ? { height: `${formHeight}px` } : { minHeight: '750px' }}
          >
            <AuthBanner
              showLogo={true}
              className="h-full flex-1"
              title="LinearVocab LMS"
              description={
                <>
                  Tham gia chương trình học từ vựng tư duy để học hỏi từ các chuyên gia,
                  <br />
                  rèn luyện kỹ năng thực tế và chuẩn bị vững vàng cho tương lai.
                </>
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}
