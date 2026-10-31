package com.dolvocab.app.service.impl;

import com.dolvocab.app.dto.request.LoginRequest;
import com.dolvocab.app.dto.request.RegisterRequest;
import com.dolvocab.app.dto.request.UpdateProfileRequest;
import com.dolvocab.app.dto.response.AuthResponse;
import com.dolvocab.app.dto.response.UserResponse;
import com.dolvocab.app.entity.OtpVerification;
import com.dolvocab.app.entity.User;
import com.dolvocab.app.entity.enums.Role;
import com.dolvocab.app.repository.OtpVerificationRepository;
import com.dolvocab.app.repository.UserRepository;
import com.dolvocab.app.security.jwt.JwtProvider;
import com.dolvocab.app.service.AuthService;
import com.dolvocab.app.service.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final OtpVerificationRepository otpVerificationRepository;
    private final EmailService emailService;
    private final PasswordEncoder passwordEncoder;
    private final JwtProvider jwtProvider;

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    @Override
    @Transactional
    public void sendRegistrationOtp(String rawEmail) {
        String normalizedEmail = rawEmail.trim().toLowerCase();

        // 1. Kiểm tra xem email đã được tài khoản nào đăng ký chưa
        if (userRepository.existsByEmail(normalizedEmail)) {
            throw new IllegalArgumentException("Email '" + normalizedEmail + "' đã được sử dụng. Vui lòng chọn email khác.");
        }

        // 2. Sinh mã ngẫu nhiên gồm 6 chữ số (từ 100000 đến 999999)
        int randomCode = 100000 + SECURE_RANDOM.nextInt(900000);
        String otpCode = String.valueOf(randomCode);

        // 3. Xóa các mã OTP cũ của email này (nếu có) để reset phiên
        otpVerificationRepository.deleteByEmail(normalizedEmail);

        // 4. Lưu mã mới vào DB với thời hạn chính xác 3 phút (180 giây)
        LocalDateTime expiresAt = LocalDateTime.now().plusMinutes(3);
        OtpVerification otp = OtpVerification.builder()
                .email(normalizedEmail)
                .otpCode(otpCode)
                .expiresAt(expiresAt)
                .build();
        otpVerificationRepository.save(otp);

        // 5. Gửi email chứa mã OTP
        emailService.sendOtpEmail(normalizedEmail, otpCode);
    }

    @Override
    @Transactional(readOnly = true)
    public void verifyRegistrationOtp(String rawEmail, String rawOtpCode) {
        String normalizedEmail = rawEmail.trim().toLowerCase();
        String otpCode = rawOtpCode != null ? rawOtpCode.trim() : "";

        OtpVerification otp = otpVerificationRepository.findTopByEmailOrderByCreatedAtDesc(normalizedEmail)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy mã OTP cho email này. Vui lòng yêu cầu gửi mã mới."));

        if (otp.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("Mã OTP đã hết hiệu lực (quá thời hạn 3 phút). Vui lòng nhấn 'Gửi lại mã' để nhận mã mới.");
        }

        if (!otp.getOtpCode().equals(otpCode)) {
            throw new IllegalArgumentException("Mã OTP không chính xác. Vui lòng kiểm tra lại email.");
        }
    }

    @Override
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String normalizedEmail = request.getEmail().trim().toLowerCase();

        // 1. Kiểm tra email trùng
        if (userRepository.existsByEmail(normalizedEmail)) {
            throw new IllegalArgumentException("Email '" + normalizedEmail + "' đã được sử dụng. Vui lòng chọn email khác.");
        }

        // 2. Xác thực mã OTP 6 số
        OtpVerification otp = otpVerificationRepository.findTopByEmailOrderByCreatedAtDesc(normalizedEmail)
                .orElseThrow(() -> new IllegalArgumentException("Vui lòng xác thực mã OTP trước khi đăng ký tài khoản."));

        if (otp.getExpiresAt().isBefore(LocalDateTime.now())) {
            otpVerificationRepository.delete(otp);
            throw new IllegalArgumentException("Mã OTP đã hết hiệu lực (quá thời hạn 3 phút). Vui lòng yêu cầu gửi lại mã mới.");
        }

        if (!otp.getOtpCode().equals(request.getOtpCode().trim())) {
            throw new IllegalArgumentException("Mã OTP không chính xác. Vui lòng kiểm tra lại.");
        }

        // 3. Kiểm tra định dạng mật khẩu
        if (request.getPassword() == null || request.getPassword().length() < 8
                || !request.getPassword().matches(".*[A-Z].*")
                || !request.getPassword().matches(".*[0-9].*")
                || !request.getPassword().matches(".*[^a-zA-Z0-9].*")) {
            throw new IllegalArgumentException("Mật khẩu phải có tối thiểu 8 ký tự, bao gồm chữ cái viết hoa, chữ số và ký tự đặc biệt.");
        }

        // 4. Tạo User kèm địa chỉ (cấu trúc 2 cấp sau sáp nhập)
        User user = User.builder()
                .email(normalizedEmail)
                .password(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName().trim())
                .dateOfBirth(request.getDateOfBirth())
                .gender(request.getGender())
                .provinceCode(request.getProvinceCode())
                .provinceName(request.getProvinceName() != null ? request.getProvinceName().trim() : null)
                .wardCode(request.getWardCode())
                .wardName(request.getWardName() != null ? request.getWardName().trim() : null)
                .addressDetail(request.getAddressDetail() != null ? request.getAddressDetail().trim() : null)
                .role(Role.ROLE_USER)
                .build();

        User savedUser = userRepository.save(user);

        // 5. Xóa OTP sau khi đăng ký thành công
        otpVerificationRepository.deleteByEmail(normalizedEmail);

        // 6. Phát sinh JWT Access Token
        String token = jwtProvider.generateToken(savedUser.getEmail());

        return AuthResponse.builder()
                .accessToken(token)
                .tokenType("Bearer")
                .user(UserResponse.fromEntity(savedUser))
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        String normalizedEmail = request.getEmail().trim().toLowerCase();

        User user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new BadCredentialsException("Email hoặc mật khẩu không chính xác"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new BadCredentialsException("Email hoặc mật khẩu không chính xác");
        }

        String token = jwtProvider.generateToken(user.getEmail());

        return AuthResponse.builder()
                .accessToken(token)
                .tokenType("Bearer")
                .user(UserResponse.fromEntity(user))
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public UserResponse getCurrentUser(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("Không tìm thấy người dùng với email: " + email));

        return UserResponse.fromEntity(user);
    }

    @Override
    @Transactional
    public UserResponse updateProfile(String email, UpdateProfileRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("Không tìm thấy người dùng với email: " + email));

        if (request.getFullName() != null && !request.getFullName().trim().isEmpty()) {
            user.setFullName(request.getFullName().trim());
        }
        if (request.getDateOfBirth() != null) {
            user.setDateOfBirth(request.getDateOfBirth());
        }
        if (request.getGender() != null) {
            user.setGender(request.getGender());
        }

        user.setProvinceCode(request.getProvinceCode());
        user.setProvinceName(request.getProvinceName() != null ? request.getProvinceName().trim() : null);
        user.setWardCode(request.getWardCode());
        user.setWardName(request.getWardName() != null ? request.getWardName().trim() : null);
        if (request.getAddressDetail() != null) {
            user.setAddressDetail(request.getAddressDetail().trim());
        }

        User updatedUser = userRepository.save(user);
        return UserResponse.fromEntity(updatedUser);
    }
}
