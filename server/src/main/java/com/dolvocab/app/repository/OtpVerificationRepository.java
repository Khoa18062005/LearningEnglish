package com.dolvocab.app.repository;

import com.dolvocab.app.entity.OtpVerification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface OtpVerificationRepository extends JpaRepository<OtpVerification, Long> {

    Optional<OtpVerification> findTopByEmailOrderByCreatedAtDesc(String email);

    Optional<OtpVerification> findByEmailAndOtpCode(String email, String otpCode);

    @Modifying
    @Transactional
    void deleteByEmail(String email);

    @Modifying
    @Transactional
    @Query("DELETE FROM OtpVerification o WHERE o.expiresAt < :now")
    int deleteExpiredOtps(@Param("now") LocalDateTime now);
}
