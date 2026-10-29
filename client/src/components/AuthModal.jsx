import { useState, useEffect } from 'react';
import { authApi } from '../api/authApi';

export default function AuthModal({
  isOpen,
  initialMode = 'login', // 'login' | 'register'
  onClose,
  onAuthSuccess,
}) {
  const [mode, setMode] = useState(initialMode);

  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState('MALE'); // 'MALE' | 'FEMALE' | 'OTHER'

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSwitchMode = (targetMode) => {
    setMode(targetMode);
    setErrorMessage('');
    setShowPassword(false);
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    // Validation
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      setErrorMessage('Vui lòng nhập địa chỉ email.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setErrorMessage('Địa chỉ email không đúng định dạng.');
      return;
    }

    if (!password) {
      setErrorMessage('Vui lòng nhập mật khẩu.');
      return;
    }

    if (mode === 'register') {
      if (password.length < 6) {
        setErrorMessage('Mật khẩu phải có độ dài từ 6 ký tự trở lên.');
        return;
      }
      if (!fullName.trim()) {
        setErrorMessage('Vui lòng nhập đầy đủ họ và tên.');
        return;
      }
      if (!dateOfBirth) {
        setErrorMessage('Vui lòng chọn ngày tháng năm sinh.');
        return;
      }
    }

    setLoading(true);

    try {
      if (mode === 'login') {
        const res = await authApi.login({
          email: trimmedEmail,
          password,
        });

        if (res && res.accessToken) {
          localStorage.setItem('access_token', res.accessToken);
          localStorage.setItem('current_user', JSON.stringify(res.user));
          onAuthSuccess(res.user, 'Đăng nhập thành công! Chào mừng bạn quay lại.');
          onClose();
        }
      } else {
        const payload = {
          email: trimmedEmail,
          password,
          fullName: fullName.trim(),
          dateOfBirth,
          gender,
        };

        const res = await authApi.register(payload);

        if (res && res.accessToken) {
          localStorage.setItem('access_token', res.accessToken);
          localStorage.setItem('current_user', JSON.stringify(res.user));
          onAuthSuccess(res.user, 'Đăng ký tài khoản thành công! Bạn đã đăng nhập vào hệ thống.');
          onClose();
        }
      }
    } catch (err) {
      console.error('Auth error:', err);
      setErrorMessage(err.message || 'Thao tác thất bại. Vui lòng kiểm tra lại thông tin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-[480px] bg-white rounded-3xl shadow-[0_25px_60px_-15px_rgba(15,23,42,0.3)] flex flex-col my-auto overflow-hidden border border-slate-200/90 ring-1 ring-black/5 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Brand Crimson Accent */}
        <div className="h-1.5 w-full bg-gradient-to-r from-crimson-dark via-crimson-primary to-rose-400 shrink-0" />

        {/* Modal Header */}
        <div className="px-6 sm:px-8 pt-6 pb-4 flex items-center justify-between border-b border-slate-100 bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-surface-crimson-soft text-crimson-primary border border-border-crimson-tint/50 flex items-center justify-center shadow-xs">
              <span className="material-symbols-outlined text-[24px]">
                {mode === 'login' ? 'lock_open' : 'person_add'}
              </span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-text-high-contrast tracking-tight">
                {mode === 'login' ? 'Đăng Nhập Tài Khoản' : 'Tạo Tài Khoản Mới'}
              </h2>
              <p className="text-xs text-text-muted mt-0.5">
                {mode === 'login' 
                  ? 'Chào mừng bạn quay lại hệ thống LinearVocab' 
                  : 'Tham gia học tập và đồng bộ từ vựng cá nhân'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-text-muted hover:text-text-high-contrast hover:bg-slate-100 transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Mode Switch Tabs */}
        <div className="px-6 sm:px-8 pt-4 pb-1">
          <div className="grid grid-cols-2 p-1 bg-canvas-slate rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => handleSwitchMode('login')}
              className={`py-2 text-xs sm:text-sm font-bold rounded-lg transition-all ${
                mode === 'login'
                  ? 'bg-white text-crimson-primary shadow-[0_2px_4px_rgba(0,0,0,0.06)]'
                  : 'text-text-muted hover:text-text-high-contrast'
              }`}
            >
              Đăng Nhập
            </button>
            <button
              type="button"
              onClick={() => handleSwitchMode('register')}
              className={`py-2 text-xs sm:text-sm font-bold rounded-lg transition-all ${
                mode === 'register'
                  ? 'bg-white text-crimson-primary shadow-[0_2px_4px_rgba(0,0,0,0.06)]'
                  : 'text-text-muted hover:text-text-high-contrast'
              }`}
            >
              Đăng Ký
            </button>
          </div>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="px-6 sm:px-8 py-4 space-y-4">
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-surface-crimson-subtle border border-border-crimson-tint flex items-start gap-2.5 text-xs text-crimson-dark animate-in fade-in duration-150">
              <span className="material-symbols-outlined text-[18px] shrink-0 text-crimson-primary">
                error
              </span>
              <div className="font-medium leading-relaxed">{errorMessage}</div>
            </div>
          )}

          {/* Form Fields: Register Extra Fields */}
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-bold text-text-body mb-1.5">
                Họ và tên <span className="text-crimson-primary">*</span>
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-[18px]">
                  badge
                </span>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ví dụ: Nguyễn Văn A"
                  className="w-full h-10 pl-9 pr-3 rounded-xl border border-slate-200 bg-white text-sm text-text-high-contrast placeholder:text-text-disabled focus:outline-none focus:ring-2 focus:ring-crimson-primary/20 focus:border-crimson-primary transition-all"
                  required
                />
              </div>
            </div>
          )}

          {/* Email */}
          <div>
            <label className="block text-xs font-bold text-text-body mb-1.5">
              Email <span className="text-crimson-primary">*</span>
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-[18px]">
                mail
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
                className="w-full h-10 pl-9 pr-3 rounded-xl border border-slate-200 bg-white text-sm text-text-high-contrast placeholder:text-text-disabled focus:outline-none focus:ring-2 focus:ring-crimson-primary/20 focus:border-crimson-primary transition-all"
                required
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-bold text-text-body mb-1.5">
              Mật khẩu <span className="text-crimson-primary">*</span>
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-[18px]">
                lock
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === 'register' ? 'Tối thiểu 6 ký tự' : 'Nhập mật khẩu'}
                className="w-full h-10 pl-9 pr-10 rounded-xl border border-slate-200 bg-white text-sm text-text-high-contrast placeholder:text-text-disabled focus:outline-none focus:ring-2 focus:ring-crimson-primary/20 focus:border-crimson-primary transition-all"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-high-contrast"
                tabIndex={-1}
              >
                <span className="material-symbols-outlined text-[18px]">
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
          </div>

          {/* Extra Fields for Registration: Date of Birth & Gender */}
          {mode === 'register' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-xs font-bold text-text-body mb-1.5">
                  Ngày sinh <span className="text-crimson-primary">*</span>
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    max={new Date().toISOString().split('T')[0]}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-sm text-text-high-contrast focus:outline-none focus:ring-2 focus:ring-crimson-primary/20 focus:border-crimson-primary transition-all"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-text-body mb-1.5">
                  Giới tính <span className="text-crimson-primary">*</span>
                </label>
                <div className="grid grid-cols-3 gap-1 p-1 bg-canvas-slate rounded-xl border border-slate-200 h-10">
                  {[
                    { id: 'MALE', label: 'Nam' },
                    { id: 'FEMALE', label: 'Nữ' },
                    { id: 'OTHER', label: 'Khác' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setGender(item.id)}
                      className={`text-xs font-semibold rounded-lg transition-all ${
                        gender === item.id
                          ? 'bg-crimson-primary text-white shadow-xs'
                          : 'text-text-muted hover:text-text-high-contrast'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-xl bg-crimson-primary hover:bg-crimson-dark text-white font-bold text-sm shadow-[0_4px_12px_rgba(227,30,36,0.25)] hover:shadow-[0_6px_16px_rgba(227,30,36,0.35)] active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading && (
                <span className="material-symbols-outlined animate-spin text-[18px]">
                  progress_activity
                </span>
              )}
              <span>{mode === 'login' ? 'Đăng Nhập Ngay' : 'Hoàn Tất Đăng Ký'}</span>
            </button>
          </div>
        </form>

        {/* Modal Footer */}
        <div className="px-6 sm:px-8 py-3 bg-canvas-slate/80 border-t border-slate-100 flex items-center justify-center text-xs text-text-muted">
          {mode === 'login' ? (
            <div>
              Chưa có tài khoản?{' '}
              <button
                type="button"
                onClick={() => handleSwitchMode('register')}
                className="font-bold text-crimson-primary hover:underline ml-1"
              >
                Đăng ký ngay
              </button>
            </div>
          ) : (
            <div>
              Đã có tài khoản?{' '}
              <button
                type="button"
                onClick={() => handleSwitchMode('login')}
                className="font-bold text-crimson-primary hover:underline ml-1"
              >
                Đăng nhập ngay
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
