package com.dolvocab.app.entity.enums;

public enum Countability {
    COUNTABLE("Đếm được [C]"),
    UNCOUNTABLE("Không đếm được [U]"),
    BOTH("Cả hai [C/U]"),
    NOT_APPLICABLE("Không áp dụng");

    private final String description;

    Countability(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}
