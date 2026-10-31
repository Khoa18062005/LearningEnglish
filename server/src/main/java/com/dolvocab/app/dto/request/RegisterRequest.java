package com.dolvocab.app.dto.request;

import com.dolvocab.app.entity.enums.Gender;
import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RegisterRequest {

    @NotBlank(message = "Email không được để trống")
    @Email(message = "Định dạng email không hợp lệ")
    private String email;

    @NotBlank(message = "Mật khẩu không được để trống")
    @Size(min = 8, message = "Mật khẩu phải có ít nhất 8 ký tự")
    @Pattern(
        regexp = "^(?=.*[A-Z])(?=.*[0-9])(?=.*[^a-zA-Z0-9]).{8,}$",
        message = "Mật khẩu phải có tối thiểu 8 ký tự, bao gồm chữ cái viết hoa, chữ số và ký tự đặc biệt"
    )
    private String password;

    @NotBlank(message = "Họ và tên không được để trống")
    private String fullName;

    @NotNull(message = "Ngày sinh không được để trống")
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate dateOfBirth;

    @NotNull(message = "Giới tính không được để trống")
    private Gender gender;

    // Địa chỉ theo cấu trúc 2 cấp sáp nhập mới nhất (Provinces Open API v2)
    private Integer provinceCode;
    private String provinceName;
    private Integer wardCode;
    private String wardName;
    private String addressDetail;

    @NotBlank(message = "Mã OTP không được để trống")
    @Pattern(regexp = "^[0-9]{6}$", message = "Mã OTP phải gồm đúng 6 chữ số")
    private String otpCode;
}
