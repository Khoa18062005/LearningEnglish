package com.dolvocab.app.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VocabDetailResponse {

    private Long id;
    private String word;
    private String phonetic;
    private String audioUrl;
    private String generalNote;

    // Word family information
    private Long wordFamilyId;
    private String rootWord;
    @Builder.Default
    private List<String> wordFamily = new ArrayList<>();

    // Primary pos and countability for badge rendering
    private String pos;
    private String posLabel;
    private String countability;

    // Categories
    @Builder.Default
    private List<String> categories = new ArrayList<>();
    @Builder.Default
    private List<CategoryResponse> categoryObjects = new ArrayList<>();

    // Reading lists
    private Long readingListId;
    private String readingListName;
    @Builder.Default
    private List<NoteListResponse> noteLists = new ArrayList<>();

    // Domain forms hierarchy
    @Builder.Default
    private List<VocabFormResponse> domainForms = new ArrayList<>();

    // Flattened forms for table rendering (rowspan compatibility)
    @Builder.Default
    private List<FlatFormResponse> forms = new ArrayList<>();

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class VocabFormResponse {
        private Long id;
        private String partOfSpeech;
        private String countability;
        private Integer displayOrder;
        @Builder.Default
        private List<VocabSenseResponse> senses = new ArrayList<>();
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class VocabSenseResponse {
        private Long id;
        private String pattern;
        private String collocation;
        private String synonyms;
        private String vietnameseMeaning;
        private String usageNote;
        private Integer displayOrder;
        @Builder.Default
        private List<String> examples = new ArrayList<>();
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FlatFormResponse {
        private String type; // 'pattern' or 'collocation'
        private String pos; // 'n', 'v', 'adj', 'adv'
        private String posLabel;
        private String countability;
        private String pattern;
        private String collocation;
        private String synonym;
        private String meaning;
        private String example;
        private String note;
    }
}
