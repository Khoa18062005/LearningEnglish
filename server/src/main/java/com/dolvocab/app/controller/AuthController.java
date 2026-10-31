package com.dolvocab.app.controller;

import com.dolvocab.app.dto.request.LoginRequest;
import com.dolvocab.app.dto.request.RegisterRequest;
import com.dolvocab.app.dto.request.SendOtpRequest;
import com.dolvocab.app.dto.request.UpdateProfileRequest;
import com.dolvocab.app.dto.request.VerifyOtpRequest;
import com.dolvocab.app.dto.response.ApiResponse;
import com.dolvocab.app.dto.response.AuthResponse;
import com.dolvocab.app.dto.response.UserResponse;
import com.dolvocab.app.entity.User;
import com.dolvocab.app.security.SecurityUtils;
import com.dolvocab.app.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final SecurityUtils securityUtils;

    @PostMapping("/send-registration-otp")
    public ResponseEntity<ApiResponse<Void>> sendRegistrationOtp(@Valid @RequestBody SendOtpRequest request) {
        authService.sendRegistrationOtp(request.getEmail());
        return ResponseEntity.ok(ApiResponse.success("Mã xác thực OTP đã được gửi về email của bạn. Vui lòng kiểm tra hộp thư (hiệu lực 3 phút).", null));
    }

    @PostMapping("/verify-registration-otp")
    public ResponseEntity<ApiResponse<Void>> verifyRegistrationOtp(@Valid @RequestBody VerifyOtpRequest request) {
        authService.verifyRegistrationOtp(request.getEmail(), request.getOtpCode());
        return ResponseEntity.ok(ApiResponse.success("Mã OTP hợp lệ.", null));
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(@Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Đăng ký tài khoản thành công", response));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.success("Đăng nhập thành công", response));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserResponse>> getCurrentUser() {
        User currentUser = securityUtils.getCurrentUser();
        UserResponse response = authService.getCurrentUser(currentUser.getEmail());
        return ResponseEntity.ok(ApiResponse.success("Lấy thông tin người dùng thành công", response));
    }

    @PutMapping("/profile")
    public ResponseEntity<ApiResponse<UserResponse>> updateProfile(@Valid @RequestBody UpdateProfileRequest request) {
        User currentUser = securityUtils.getCurrentUser();
        UserResponse response = authService.updateProfile(currentUser.getEmail(), request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật thông tin cá nhân thành công", response));
    }
}
