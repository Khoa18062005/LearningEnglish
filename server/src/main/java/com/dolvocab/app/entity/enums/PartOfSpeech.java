package com.dolvocab.app.entity.enums;

public enum PartOfSpeech {
    N("Danh từ"),
    V("Động từ"),
    ADJ("Tính từ"),
    ADV("Trạng từ"),
    PHRASAL_VERB("Cụm động từ"),
    IDIOM("Thành ngữ"),
    COLLOCATION("Cụm từ phối hợp"),
    PREP("Giới từ");

    private final String description;

    PartOfSpeech(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}
