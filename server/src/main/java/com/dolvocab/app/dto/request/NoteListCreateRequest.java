package com.dolvocab.app.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NoteListCreateRequest {

    @NotBlank(message = "Tiêu đề không được để trống")
    private String title;

    private String code;
    private String sourceReference;
    private String passage;
    private String note;
}
