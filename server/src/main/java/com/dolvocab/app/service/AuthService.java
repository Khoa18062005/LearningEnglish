package com.dolvocab.app.service;

import com.dolvocab.app.dto.request.LoginRequest;
import com.dolvocab.app.dto.request.RegisterRequest;
import com.dolvocab.app.dto.request.UpdateProfileRequest;
import com.dolvocab.app.dto.response.AuthResponse;
import com.dolvocab.app.dto.response.UserResponse;

public interface AuthService {

    /**
     * Tạo mã OTP 6 số ngẫu nhiên, lưu vào DB với hạn 3 phút và gửi qua email.
     * Nếu email đã tồn tại trong bảng users, ném ra ngoại lệ.
     * Nếu có mã cũ chưa hết hạn, sẽ xóa và reset lại thời gian 3 phút với mã mới.
     *
     * @param email Email người dùng đăng ký
     */
    void sendRegistrationOtp(String email);

    /**
     * Xác thực mã OTP 6 chữ số gửi qua email.
     *
     * @param email Email
     * @param otpCode Mã OTP 6 chữ số
     */
    void verifyRegistrationOtp(String email, String otpCode);

    AuthResponse register(RegisterRequest request);

    AuthResponse login(LoginRequest request);

    UserResponse getCurrentUser(String email);

    UserResponse updateProfile(String email, UpdateProfileRequest request);
}
