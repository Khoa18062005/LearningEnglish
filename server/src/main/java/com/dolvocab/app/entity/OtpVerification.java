package com.dolvocab.app.entity;

import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "otp_verifications")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OtpVerification {

    @Id
    private String id;

    private String email;

    private String otpCode;

    @Builder.Default
    private Integer attempts = 0;

    private LocalDateTime expiresAt;

    @CreatedDate
    private LocalDateTime createdAt;
}
