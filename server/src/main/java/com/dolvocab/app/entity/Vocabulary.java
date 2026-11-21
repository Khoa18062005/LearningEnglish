package com.dolvocab.app.entity;

import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;
import org.springframework.data.mongodb.core.mapping.FieldType;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Document(collection = "vocabularies")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Vocabulary {

    @Id
    private String id;

    @Field(targetType = FieldType.OBJECT_ID)
    private String userId;

    private String word;

    private String wordLower;

    private String pos;

    private String phonetic;

    private String audioUrl;

    @Field(targetType = FieldType.OBJECT_ID)
    private String wordFamilyId;

    private String generalNote;

    private String meaning;

    private String closeMeanings;

    private String synonyms;

    private String meaningDetailsJson;

    @Builder.Default
    private List<Object> meaningDetails = new ArrayList<>();

    @Field(targetType = FieldType.OBJECT_ID)
    @Builder.Default
    private List<String> categoryIds = new ArrayList<>();

    @Field(targetType = FieldType.OBJECT_ID)
    @Builder.Default
    private List<String> noteListIds = new ArrayList<>();

    @Builder.Default
    private List<VocabForm> forms = new ArrayList<>();

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;

    public void addForm(VocabForm form) {
        if (forms == null) {
            forms = new ArrayList<>();
        }
        forms.add(form);
    }

    public void removeForm(VocabForm form) {
        if (forms != null) {
            forms.remove(form);
        }
    }
}
