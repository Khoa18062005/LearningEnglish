package com.dolvocab.app.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReadingPassageRequest {
    private Long id;
    private String title;
    private String content;
    private Integer wordCount;
    private Integer sortOrder;
}
