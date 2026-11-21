package com.dolvocab.app.entity;

import com.dolvocab.app.entity.enums.Gender;
import com.dolvocab.app.entity.enums.Role;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Document(collection = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    private String id;

    @Indexed(unique = true)
    private String email;

    private String password;

    private String fullName;

    private LocalDate dateOfBirth;

    @Builder.Default
    private Gender gender = Gender.OTHER;

    @Builder.Default
    private Address address = new Address();

    @Builder.Default
    private Role role = Role.ROLE_USER;

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Address {
        private Integer provinceCode;
        private String provinceName;
        private Integer wardCode;
        private String wardName;
        private String detail;
    }

    // Helper methods tương thích ngược với code cũ
    public Integer getProvinceCode() {
        return address != null ? address.getProvinceCode() : null;
    }

    public void setProvinceCode(Integer provinceCode) {
        ensureAddress().setProvinceCode(provinceCode);
    }

    public String getProvinceName() {
        return address != null ? address.getProvinceName() : null;
    }

    public void setProvinceName(String provinceName) {
        ensureAddress().setProvinceName(provinceName);
    }

    public Integer getWardCode() {
        return address != null ? address.getWardCode() : null;
    }

    public void setWardCode(Integer wardCode) {
        ensureAddress().setWardCode(wardCode);
    }

    public String getWardName() {
        return address != null ? address.getWardName() : null;
    }

    public void setWardName(String wardName) {
        ensureAddress().setWardName(wardName);
    }

    public String getAddressDetail() {
        return address != null ? address.getDetail() : null;
    }

    public void setAddressDetail(String addressDetail) {
        ensureAddress().setDetail(addressDetail);
    }

    private Address ensureAddress() {
        if (this.address == null) {
            this.address = new Address();
        }
        return this.address;
    }
}
