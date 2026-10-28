package com.dolvocab.app.entity;

import com.dolvocab.app.entity.enums.Countability;
import com.dolvocab.app.entity.enums.PartOfSpeech;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "vocab_forms", indexes = {
    @Index(name = "idx_pos", columnList = "part_of_speech")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VocabForm {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vocab_id", nullable = false)
    @JsonIgnore
    private Vocabulary vocabulary;

    @Enumerated(EnumType.STRING)
    @Column(name = "part_of_speech", nullable = false, length = 30)
    private PartOfSpeech partOfSpeech;

    @Enumerated(EnumType.STRING)
    @Column(length = 30)
    @Builder.Default
    private Countability countability = Countability.NOT_APPLICABLE;

    @Column(name = "display_order")
    @Builder.Default
    private Integer displayOrder = 1;

    @OneToMany(mappedBy = "vocabForm", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("displayOrder ASC")
    @Builder.Default
    private List<VocabSense> senses = new ArrayList<>();

    public void addSense(VocabSense sense) {
        senses.add(sense);
        sense.setVocabForm(this);
    }

    public void removeSense(VocabSense sense) {
        senses.remove(sense);
        sense.setVocabForm(null);
    }
}
