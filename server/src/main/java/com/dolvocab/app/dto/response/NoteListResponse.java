package com.dolvocab.app.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NoteListResponse {
    private Long id;
    private String title;
    private String code;
    private String sourceReference;
    private String passage;
    private String note;
    private long count;
    private LocalDateTime createdAt;
    private String shortTitle;
    private String fullTitle;
}
