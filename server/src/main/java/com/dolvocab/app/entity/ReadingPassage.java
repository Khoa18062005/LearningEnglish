package com.dolvocab.app.entity;

import lombok.*;
import org.bson.types.ObjectId;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReadingPassage {

    @Builder.Default
    private String id = new ObjectId().toHexString();

    private String title;

    private String content;

    @Builder.Default
    private Integer wordCount = 0;

    @Builder.Default
    private Integer sortOrder = 0;

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();
}
