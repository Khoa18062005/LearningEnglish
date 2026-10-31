package com.dolvocab.app.service;

public interface EmailService {

    /**
     * Gửi mã OTP xác thực đăng ký tài khoản qua email.
     *
     * @param toEmail Email người nhận
     * @param otpCode Mã OTP 6 chữ số
     */
    void sendOtpEmail(String toEmail, String otpCode);
}
