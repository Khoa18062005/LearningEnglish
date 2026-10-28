package com.dolvocab.app.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WordFamilyResponse {
    private Long id;
    private String rootWord;
    private String description;
    @Builder.Default
    private List<String> words = new java.util.ArrayList<>();
    @Builder.Default
    private List<MemberVocabResponse> memberVocabs = new java.util.ArrayList<>();

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MemberVocabResponse {
        private Long id;
        private String word;
        private String pos;
        private String posLabel;
        private String meaning;
        private String phonetic;
    }
}
