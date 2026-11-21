package com.dolvocab.app.entity;

import lombok.*;
import org.bson.types.ObjectId;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VocabExample {

    @Builder.Default
    private String id = new ObjectId().toHexString();

    private String exampleSentence;

    private String exampleTranslation;
}
