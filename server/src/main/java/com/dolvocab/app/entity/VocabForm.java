package com.dolvocab.app.entity;

import com.dolvocab.app.entity.enums.Countability;
import com.dolvocab.app.entity.enums.PartOfSpeech;
import lombok.*;
import org.bson.types.ObjectId;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VocabForm {

    @Builder.Default
    private String id = new ObjectId().toHexString();

    private PartOfSpeech partOfSpeech;

    @Builder.Default
    private Countability countability = Countability.NOT_APPLICABLE;

    @Builder.Default
    private Integer displayOrder = 1;

    @Builder.Default
    private List<VocabSense> senses = new ArrayList<>();

    public void addSense(VocabSense sense) {
        if (senses == null) {
            senses = new ArrayList<>();
        }
        senses.add(sense);
    }

    public void removeSense(VocabSense sense) {
        if (senses != null) {
            senses.remove(sense);
        }
    }
}
