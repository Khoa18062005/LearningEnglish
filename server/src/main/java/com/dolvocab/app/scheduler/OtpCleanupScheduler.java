package com.dolvocab.app.scheduler;

import com.dolvocab.app.repository.OtpVerificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Slf4j
@Component
@RequiredArgsConstructor
public class OtpCleanupScheduler {

    private final OtpVerificationRepository otpVerificationRepository;

    /**
     * Tự động quét và xóa các mã OTP đã hết hạn sau 3 phút khỏi database.
     * Chạy định kỳ mỗi 60 giây (1 phút).
     */
    @Scheduled(fixedRate = 60000)
    public void cleanupExpiredOtps() {
        LocalDateTime now = LocalDateTime.now();
        int deletedCount = otpVerificationRepository.deleteExpiredOtps(now);
        if (deletedCount > 0) {
            log.info("[OTP CLEANUP] Đã tự động dọn dẹp {} mã OTP hết hạn khỏi database.", deletedCount);
        }
    }
}
