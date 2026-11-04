package com.dolvocab.app.dto.request;

import jakarta.validation.constraints.NotBlank;
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

    @Size(max = 50, message = "Mã danh mục không quá 50 ký tự")
    private String code;

    @NotBlank(message = "Tên danh mục không được để trống")
    @Size(max = 200, message = "Tên danh mục không quá 200 ký tự")
    private String name;

    private String description;
}
