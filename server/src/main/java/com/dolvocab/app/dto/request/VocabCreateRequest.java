package com.dolvocab.app.dto.request;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VocabCreateRequest {

    @NotBlank(message = "Từ vựng không được để trống")
    private String word;

    private String phonetic;
    private String audioUrl;
    private String generalNote;

    // Word Family
    private Long wordFamilyId;
    private String rootWord;
    @Builder.Default
    private List<String> wordFamily = new ArrayList<>();

    // Primary POS & countability
    private String pos;
    private String posLabel;
    private String countability;

    // Categories
    @Builder.Default
    private List<Long> categoryIds = new ArrayList<>();
    @Builder.Default
    private List<String> categories = new ArrayList<>();

    // Reading Note list
    @JsonAlias({"readingListId", "noteListId"})
    private Object noteListId; // Can be Long or String (e.g. 'reading-list-cambridge-18')

    private String readingListName;

    // Forms list (accepts both dynamic compiled forms or nested forms)
    @Builder.Default
    private List<VocabFormItemRequest> forms = new ArrayList<>();

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class VocabFormItemRequest {
        private String type; // 'pattern' or 'collocation'
        private String pos; // 'n', 'v', 'adj', 'adv'
        private String posLabel;
        private String countability;
        private String pattern;
        private String collocation;
        private String synonym;
        private String synonyms;

        @JsonAlias({"meaning", "vietnameseMeaning"})
        private String meaning;

        private String example;
        private String note;
        private String usageNote;

        // Nested senses support
        @Builder.Default
        private List<VocabSenseItemRequest> senses = new ArrayList<>();
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class VocabSenseItemRequest {
        private String pattern;
        private String collocation;
        private String synonyms;
        private String vietnameseMeaning;
        private String usageNote;
        @Builder.Default
        private List<String> examples = new ArrayList<>();
    }
}
