package com.dolvocab.app.repository;

import com.dolvocab.app.entity.OtpVerification;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface OtpVerificationRepository extends MongoRepository<OtpVerification, String> {

    Optional<OtpVerification> findTopByEmailOrderByCreatedAtDesc(String email);

    Optional<OtpVerification> findByEmailAndOtpCode(String email, String otpCode);

    void deleteByEmail(String email);
}
