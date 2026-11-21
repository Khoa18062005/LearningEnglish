package com.dolvocab.app.entity;

import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;
import org.springframework.data.mongodb.core.mapping.FieldType;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Document(collection = "note_lists")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NoteList {

    @Id
    private String id;

    @Field(targetType = FieldType.OBJECT_ID)
    private String userId;

    @Field(targetType = FieldType.OBJECT_ID)
    private String folderId;

    private String title;

    private String code;

    private String codeLower;

    private String sourceReference;

    private String passage;

    private String note;

    @Builder.Default
    private Integer sortOrder = 0;

    @Builder.Default
    private List<ReadingPassage> passages = new ArrayList<>();

    @CreatedDate
    private LocalDateTime createdAt;
}
