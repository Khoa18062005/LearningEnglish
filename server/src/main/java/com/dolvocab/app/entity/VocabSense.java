package com.dolvocab.app.entity;

import lombok.*;
import org.bson.types.ObjectId;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VocabSense {

    @Builder.Default
    private String id = new ObjectId().toHexString();

    private String pattern;

    private String collocation;

    private String synonyms;

    private String closeMeanings;

    private String vietnameseMeaning;

    private String usageNote;

    @Builder.Default
    private Integer displayOrder = 1;

    @Builder.Default
    private List<VocabExample> examples = new ArrayList<>();

    public void addExample(VocabExample example) {
        if (examples == null) {
            examples = new ArrayList<>();
        }
        examples.add(example);
    }

    public void removeExample(VocabExample example) {
        if (examples != null) {
            examples.remove(example);
        }
    }
}
