package com.dolvocab.app.entity;

import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;
import org.springframework.data.mongodb.core.mapping.FieldType;

import java.time.LocalDateTime;

@Document(collection = "note_folders")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NoteFolder {

    @Id
    private String id;

    @Field(targetType = FieldType.OBJECT_ID)
    private String userId;

    private String code;

    private String name;

    private String description;

    @Builder.Default
    private Integer sortOrder = 0;

    @CreatedDate
    private LocalDateTime createdAt;
}
