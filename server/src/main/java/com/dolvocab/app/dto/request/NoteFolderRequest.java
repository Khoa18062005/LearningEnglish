package com.dolvocab.app.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NoteFolderRequest {

    @Size(max = 8, message = "Mã thư mục không quá 8 ký tự")
    @Pattern(regexp = "^[a-zA-Z0-9]*$", message = "Mã thư mục chỉ chấp nhận chữ và số, không chứa khoảng cách hoặc ký tự đặc biệt")
    private String code;

    @NotBlank(message = "Tên danh mục không được để trống")
    @Size(max = 200, message = "Tên danh mục không quá 200 ký tự")
    private String name;

    private String description;
}
