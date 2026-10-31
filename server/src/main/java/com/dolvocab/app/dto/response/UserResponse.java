package com.dolvocab.app.dto.response;

import com.dolvocab.app.entity.User;
import com.dolvocab.app.entity.enums.Gender;
import com.dolvocab.app.entity.enums.Role;
import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserResponse {

    private Long id;
    private String email;
    private String fullName;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate dateOfBirth;

    private Gender gender;
    private Integer provinceCode;
    private String provinceName;
    private Integer wardCode;
    private String wardName;
    private String addressDetail;
    private Role role;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime createdAt;

    public static UserResponse fromEntity(User user) {
        if (user == null) {
            return null;
        }
        return UserResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .dateOfBirth(user.getDateOfBirth())
                .gender(user.getGender())
                .provinceCode(user.getProvinceCode())
                .provinceName(user.getProvinceName())
                .wardCode(user.getWardCode())
                .wardName(user.getWardName())
                .addressDetail(user.getAddressDetail())
                .role(user.getRole())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
