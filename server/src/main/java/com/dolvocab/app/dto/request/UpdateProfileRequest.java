package com.dolvocab.app.dto.request;

import com.dolvocab.app.entity.enums.Gender;
import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateProfileRequest {

    @NotBlank(message = "Họ và tên không được để trống")
    private String fullName;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate dateOfBirth;

    private Gender gender;

    // Địa chỉ theo cấu trúc 2 cấp sáp nhập mới nhất (Provinces Open API v2)
    private Integer provinceCode;
    private String provinceName;
    private Integer wardCode;
    private String wardName;
    private String addressDetail;
}
