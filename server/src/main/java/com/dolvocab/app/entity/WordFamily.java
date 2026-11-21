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

@Document(collection = "word_families")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WordFamily {

    @Id
    private String id;

    @Field(targetType = FieldType.OBJECT_ID)
    private String userId;

    private String rootWord;

    private String rootWordLower;

    private String description;

    @Field(targetType = FieldType.OBJECT_ID)
    @Builder.Default
    private List<String> memberOrder = new ArrayList<>();

    @CreatedDate
    private LocalDateTime createdAt;
}
