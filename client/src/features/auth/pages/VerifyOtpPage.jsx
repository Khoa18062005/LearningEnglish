import { useState, useEffect, useRef } from 'react';
import { authApi } from '../../../api/authApi';
import AuthBanner from '../components/AuthBanner';

export default function VerifyOtpPage({
  registrationData,
  onNavigateRegister,
  onRegisterSuccess,
}) {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timeLeft, setTimeLeft] = useState(180); // 3 phút = 180 giây
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successNotice, setSuccessNotice] = useState('Mã xác thực 6 số đã được gửi tới email của bạn. Vui lòng kiểm tra hộp thư!');

  const inputRefs = useRef([]);

  const email = registrationData?.email || '';

  // Đếm ngược 3 phút
  useEffect(() => {
    if (timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  // Focus ô đầu tiên khi mở trang
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  // Định dạng thời gian mm:ss
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Xử lý thay đổi từng ô ký tự
  const handleChange = (index, value) => {
    // Chỉ cho phép nhập số
    const cleanValue = value.replace(/\D/g, '');
    if (!cleanValue && value !== '') return;

    const newOtp = [...otp];

    if (cleanValue.length > 1) {
      // Trường hợp người dùng paste hoặc gõ nhanh chuỗi
      const pastedChars = cleanValue.slice(0, 6).split('');
      for (let i = 0; i < 6; i++) {
        newOtp[i] = pastedChars[i] || '';
      }
      setOtp(newOtp);
      const nextIndex = Math.min(pastedChars.length, 5);
      if (inputRefs.current[nextIndex]) {
        inputRefs.current[nextIndex].focus();
      }
      return;
    }

    newOtp[index] = cleanValue;
    setOtp(newOtp);
    if (errorMessage) setErrorMessage('');

    // Tự động nhảy sang ô tiếp theo
    if (cleanValue && index < 5 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1].focus();
    }
  };

  // Xử lý phím lùi Backspace & di chuyển mũi tên
  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0 && inputRefs.current[index - 1]) {
        inputRefs.current[index - 1].focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1].focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  // Hỗ trợ sự kiện Paste từ clipboard
  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').trim();
    const digitsOnly = pasteData.replace(/\D/g, '').slice(0, 6);
    if (!digitsOnly) return;

    const newOtp = [...otp];
    for (let i = 0; i < 6; i++) {
      newOtp[i] = digitsOnly[i] || '';
    }
    setOtp(newOtp);
    if (errorMessage) setErrorMessage('');

    const targetFocus = Math.min(digitsOnly.length, 5);
    if (inputRefs.current[targetFocus]) {
      inputRefs.current[targetFocus].focus();
    }
  };

  // Gửi lại mã OTP mới và reset thời gian 3 phút
  const handleResendOtp = async () => {
    if (!email) {
      setErrorMessage('Không tìm thấy thông tin email. Vui lòng quay lại trang đăng ký.');
      return;
    }

    setResending(true);
    setErrorMessage('');
    setSuccessNotice('');

    try {
      await authApi.sendRegistrationOtp(email);

      // Reset OTP inputs & reset timer về đúng 180 giây (3 phút)
      setOtp(['', '', '', '', '', '']);
      setTimeLeft(180);
      setSuccessNotice('Đã gửi mã OTP mới! Thời gian hiệu lực 3 phút đã được làm mới.');

      if (inputRefs.current[0]) {
        inputRefs.current[0].focus();
      }
    } catch (err) {
      console.error('Lỗi khi gửi lại OTP:', err);
      setErrorMessage(err.message || 'Không thể gửi lại mã OTP. Vui lòng thử lại sau.');
    } finally {
      setResending(false);
    }
  };

  // Xác nhận OTP và hoàn tất đăng ký
  const handleVerify = async (e) => {
    if (e) e.preventDefault();
    setErrorMessage('');

    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      setErrorMessage('Vui lòng nhập đầy đủ 6 chữ số mã xác thực.');
      return;
    }

    if (timeLeft <= 0) {
      setErrorMessage('Mã OTP đã hết thời gian hiệu lực (3 phút). Vui lòng nhấn "Gửi lại mã" để nhận mã mới.');
      return;
    }

    if (!registrationData) {
      setErrorMessage('Thiếu thông tin đăng ký. Vui lòng quay lại trang đăng ký và thử lại.');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        fullName: registrationData.fullName,
        email: registrationData.email,
        password: registrationData.password,
        dateOfBirth: registrationData.dateOfBirth,
        gender: registrationData.gender,
        provinceCode: registrationData.provinceCode,
        provinceName: registrationData.provinceName,
        wardCode: registrationData.wardCode,
        wardName: registrationData.wardName,
        addressDetail: registrationData.addressDetail,
        otpCode,
      };

      const res = await authApi.register(payload);

      if (res && res.accessToken) {
        localStorage.setItem('access_token', res.accessToken);
        localStorage.setItem('current_user', JSON.stringify(res.user));
        onRegisterSuccess(res.user, 'Xác thực OTP và đăng ký tài khoản thành công! Chào mừng bạn đến với LinearVocab LMS.');
      }
    } catch (err) {
      console.error('Lỗi xác thực đăng ký:', err);
      setErrorMessage(err.message || 'Xác thực thất bại. Vui lòng kiểm tra lại mã OTP.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-white flex flex-col justify-center py-6 sm:py-8 lg:py-10 selection:bg-surface-crimson-soft selection:text-crimson-dark">
      <div className="w-full max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-8 flex-1 flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-14">
        
        {/* Left Form Column */}
        <div className="w-full lg:w-1/2 flex items-center justify-center py-4">
          <div className="max-w-[460px] w-full lg:-translate-x-7 xl:-translate-x-9">
            
            {/* Back Button */}
            <button
              type="button"
              onClick={onNavigateRegister}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-muted hover:text-crimson-primary mb-6 transition-colors group cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px] group-hover:-translate-x-0.5 transition-transform">
                arrow_back
              </span>
              <span>Quay lại chỉnh sửa thông tin</span>
            </button>

            {/* Header Section */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-surface-crimson-soft text-crimson-primary mb-3 shadow-xs border border-border-crimson-tint">
                <span className="material-symbols-outlined text-[30px]">
                  mark_email_read
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-text-high-contrast tracking-tight font-sans">
                Xác thực mã OTP
              </h1>
              <p className="mt-2 text-xs sm:text-sm text-text-muted leading-relaxed">
                Chúng tôi đã gửi mã xác thực 6 số đến địa chỉ email:
                <br />
                <span className="font-bold text-text-high-contrast text-sm mt-0.5 inline-block">
                  {email || 'email_cua_ban@example.com'}
                </span>
              </p>
            </div>

            {/* Success Notification Box */}
            {successNotice && !errorMessage && (
              <div className="mb-5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-2.5 text-xs text-emerald-800 animate-in fade-in duration-200">
                <span className="material-symbols-outlined text-[18px] shrink-0 text-emerald-600">
                  check_circle
                </span>
                <div className="font-semibold leading-relaxed">{successNotice}</div>
              </div>
            )}

            {/* Error Message Box */}
            {errorMessage && (
              <div className="mb-5 p-3.5 rounded-xl bg-surface-crimson-subtle border border-border-crimson-tint flex items-start gap-2.5 text-xs text-crimson-dark animate-in fade-in duration-200">
                <span className="material-symbols-outlined text-[18px] shrink-0 text-crimson-primary">
                  error
                </span>
                <div className="font-semibold leading-relaxed">{errorMessage}</div>
              </div>
            )}

            {/* OTP Form */}
            <form onSubmit={handleVerify} className="space-y-6">
              
              {/* 6 OTP Input Boxes */}
              <div>
                <label className="block text-center text-xs font-bold text-text-body mb-3 uppercase tracking-wider">
                  Nhập mã 6 chữ số
                </label>
                <div className="flex items-center justify-center gap-2 sm:gap-3 on-paste" onPaste={handlePaste}>
                  {otp.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => (inputRefs.current[idx] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleChange(idx, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(idx, e)}
                      className={`w-11 h-13 sm:w-13 sm:h-15 text-center text-xl sm:text-2xl font-black rounded-xl border bg-white text-text-high-contrast focus:outline-none transition-all shadow-xs ${
                        digit
                          ? 'border-crimson-primary ring-2 ring-crimson-primary/20 bg-rose-50/10'
                          : 'border-slate-200 focus:border-crimson-primary focus:ring-2 focus:ring-crimson-primary/20'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Countdown Timer Display */}
              <div className="flex items-center justify-center gap-2 text-xs font-medium">
                <span className="material-symbols-outlined text-[18px] text-crimson-primary animate-pulse">
                  timer
                </span>
                <span className="text-text-muted">Mã hiệu lực trong:</span>
                <span
                  className={`font-mono font-bold text-sm ${
                    timeLeft <= 30 ? 'text-rose-600 animate-pulse' : 'text-crimson-primary'
                  }`}
                >
                  {formatTime(timeLeft)}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 pt-2">
                <button
                  type="submit"
                  disabled={loading || otp.join('').length !== 6 || timeLeft <= 0}
                  className="w-full h-11 rounded-xl bg-crimson-primary hover:bg-crimson-dark text-white font-bold text-sm shadow-[0_4px_14px_rgba(227,30,36,0.3)] hover:shadow-[0_6px_20px_rgba(227,30,36,0.4)] active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {loading && (
                    <span className="material-symbols-outlined animate-spin text-[18px]">
                      progress_activity
                    </span>
                  )}
                  <span>Xác nhận & Hoàn tất đăng ký</span>
                </button>

                {/* Resend OTP Button */}
                <div className="text-center pt-2">
                  <span className="text-xs text-text-muted">Chưa nhận được mã OTP?</span>{' '}
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={resending}
                    className="text-xs font-bold text-crimson-primary hover:text-crimson-dark transition-colors inline-flex items-center gap-1 disabled:opacity-60 cursor-pointer ml-1"
                  >
                    {resending && (
                      <span className="material-symbols-outlined animate-spin text-[14px]">
                        progress_activity
                      </span>
                    )}
                    <span>Gửi lại mã mới</span>
                  </button>
                </div>
              </div>
            </form>

            {/* Note / Tip */}
            <div className="mt-8 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] text-text-muted leading-relaxed text-center">
              💡 Mẹo: Nếu bạn không thấy email trong Hộp thư đến, vui lòng kiểm tra thêm mục <strong>Thư rác (Spam)</strong> hoặc <strong>Quảng cáo</strong>.
            </div>
          </div>
        </div>

        {/* Right Hero Card Column */}
        <div className="hidden lg:flex lg:w-1/2 items-center justify-center py-4 w-full h-full min-h-[680px]">
          <div className="w-full max-w-[620px] h-full flex">
            <AuthBanner
              showLogo={true}
              title="LinearVocab LMS"
              description={
                <>
                  Bảo vệ tài khoản an toàn với xác thực OTP 2 lớp.
                  <br />
                  Chỉ còn một bước nữa để bắt đầu hành trình nâng tầm vốn từ vựng tư duy!
                </>
              }
            />
          </div>
        </div>

      </div>
    </div>
  );
}
