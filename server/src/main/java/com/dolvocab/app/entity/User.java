package com.dolvocab.app.entity;

import com.dolvocab.app.entity.enums.Gender;
import com.dolvocab.app.entity.enums.Role;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 100)
    private String email;

    @Column(nullable = false)
    private String password;

    @Column(name = "full_name", nullable = false, length = 100)
    private String fullName;

    @Column(name = "date_of_birth")
    private LocalDate dateOfBirth;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    @Builder.Default
    private Gender gender = Gender.OTHER;

    // Địa chỉ theo cấu trúc 2 cấp (Provinces Open API v2 sau sáp nhập)
    @Column(name = "province_code")
    private Integer provinceCode;

    @Column(name = "province_name", length = 100)
    private String provinceName;

    @Column(name = "ward_code")
    private Integer wardCode;

    @Column(name = "ward_name", length = 100)
    private String wardName;

    @Column(name = "address_detail", length = 255)
    private String addressDetail;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    @Builder.Default
    private Role role = Role.ROLE_USER;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
