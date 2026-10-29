import { useState } from 'react';
import { authApi } from '../../../api/authApi';
import AuthBanner from '../components/AuthBanner';

export default function LoginPage({
  onNavigateRegister,
  onLoginSuccess,
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

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

    setLoading(true);

    try {
      const res = await authApi.login({
        email: trimmedEmail,
        password,
      });

      if (res && res.accessToken) {
        localStorage.setItem('access_token', res.accessToken);
        localStorage.setItem('current_user', JSON.stringify(res.user));
        if (rememberMe) {
          localStorage.setItem('remembered_email', trimmedEmail);
        } else {
          localStorage.removeItem('remembered_email');
        }

        onLoginSuccess(res.user, 'Đăng nhập thành công! Chào mừng bạn quay lại.');
      }
    } catch (err) {
      console.error('Lỗi đăng nhập:', err);
      setErrorMessage(err.message || 'Email hoặc mật khẩu không chính xác.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLoginMock = () => {
    setErrorMessage('Tính năng đăng nhập Google đang được tích hợp. Vui lòng đăng nhập bằng Email!');
  };

  return (
    <div className="min-h-screen w-full bg-white flex flex-col justify-between selection:bg-surface-crimson-soft selection:text-crimson-dark">
      <div className="w-full flex-1 flex flex-col lg:flex-row p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto">
        {/* Left Form Column */}
        <div className="w-full lg:w-1/2 flex flex-col justify-center px-4 sm:px-10 lg:px-16 py-6 lg:py-10">
          <div className="max-w-[420px] w-full mx-auto my-auto">
            {/* Centered Brand & Header Section */}
            <div className="text-center mb-7">
              {/* Logo Cuốn Sách vô giữa */}
              <div className="flex justify-center mb-3">
                <div className="w-12 h-12 rounded-2xl bg-crimson-primary text-white flex items-center justify-center font-black shadow-[0_6px_18px_rgba(227,30,36,0.25)] transition-transform hover:scale-105">
                  <span className="material-symbols-outlined text-[26px]">menu_book</span>
                </div>
              </div>

              {/* Chữ Linear Vocab LMS màu đỏ */}
              <h2 className="text-crimson-primary font-black text-xl sm:text-2xl tracking-tight uppercase font-sans">
                Linear Vocab LMS
              </h2>

              {/* Tiêu đề Đăng nhập căn center */}
              <h1 className="text-2xl sm:text-3xl font-extrabold text-text-high-contrast tracking-tight font-sans mt-3.5">
                Đăng nhập
              </h1>

              {/* Dòng chữ chào mừng căn center */}
              <p className="mt-2 text-sm text-text-muted">
                Chào mừng quay trở lại! Hãy nhập thông tin đăng nhập của bạn
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

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email Input */}
              <div>
                <label className="block text-xs font-bold text-text-body mb-1.5">
                  Email <span className="text-crimson-primary">*</span>
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errorMessage) setErrorMessage('');
                    }}
                    placeholder="username@example.com"
                    className={`w-full h-11 px-3.5 rounded-xl border text-sm text-text-high-contrast placeholder:text-text-disabled focus:outline-none focus:ring-2 focus:ring-crimson-primary/20 transition-all ${
                      errorMessage && (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
                        ? 'border-crimson-primary bg-surface-crimson-subtle/30'
                        : 'border-slate-200 bg-white focus:border-crimson-primary'
                    }`}
                    required
                  />
                  {errorMessage && (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) && (
                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-crimson-primary text-[18px]">
                      info
                    </span>
                  )}
                </div>
              </div>

              {/* Password Input */}
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
                    placeholder="••••••"
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
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Remember Me & Forgot Password Row */}
              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-text-body font-medium select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-crimson-primary focus:ring-crimson-primary/20 accent-crimson-primary cursor-pointer"
                  />
                  <span>Ghi nhớ đăng nhập</span>
                </label>

                <button
                  type="button"
                  onClick={() => alert('Vui lòng liên hệ quản trị viên để thiết lập lại mật khẩu.')}
                  className="font-bold text-crimson-primary hover:text-crimson-dark transition-colors"
                >
                  Quên mật khẩu?
                </button>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 rounded-xl bg-crimson-primary hover:bg-crimson-dark text-white font-bold text-sm shadow-[0_4px_14px_rgba(227,30,36,0.3)] hover:shadow-[0_6px_20px_rgba(227,30,36,0.4)] active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading && (
                    <span className="material-symbols-outlined animate-spin text-[18px]">
                      progress_activity
                    </span>
                  )}
                  <span>Đăng nhập</span>
                </button>
              </div>

              {/* Divider */}
              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-slate-200"></div>
                <span className="flex-shrink mx-4 text-[11px] font-bold text-text-muted uppercase tracking-wider">
                  HOẶC
                </span>
                <div className="flex-grow border-t border-slate-200"></div>
              </div>

              {/* Google Social Button */}
              <button
                type="button"
                onClick={handleGoogleLoginMock}
                className="w-full h-11 rounded-xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-text-body font-semibold text-xs transition-all flex items-center justify-center gap-3 shadow-xs"
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
                <span>Đăng nhập bằng Google</span>
              </button>
            </form>

            {/* Bottom Register Switch Link */}
            <div className="mt-8 text-center text-xs text-text-muted">
              Chưa có tài khoản?{' '}
              <button
                type="button"
                onClick={onNavigateRegister}
                className="font-bold text-crimson-primary hover:text-crimson-dark transition-colors ml-1"
              >
                Đăng ký ngay
              </button>
            </div>
          </div>
        </div>

        {/* Right Hero Card Column */}
        <div className="hidden lg:block lg:w-1/2 p-2">
          <AuthBanner
            title="LinearVocab LMS"
            description={
              <>
                Tham gia chương trình học từ vựng tư duy để học hỏi từ các chuyên gia,
                <br className="hidden sm:inline" />
                {' '}rèn luyện kỹ năng thực tế và chuẩn bị vững vàng cho tương lai.
              </>
            }
          />
        </div>
      </div>
    </div>
  );
}
