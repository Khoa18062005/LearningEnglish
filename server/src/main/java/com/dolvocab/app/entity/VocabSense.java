package com.dolvocab.app.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "vocab_senses")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VocabSense {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vocab_form_id", nullable = false)
    @JsonIgnore
    private VocabForm vocabForm;

    @Column(length = 255)
    private String pattern;

    @Column(length = 255)
    private String collocation;

    @Column(length = 255)
    private String synonyms;

    @Column(name = "vietnamese_meaning", nullable = false, length = 500)
    private String vietnameseMeaning;

    @Column(name = "usage_note", columnDefinition = "TEXT")
    private String usageNote;

    @Column(name = "display_order")
    @Builder.Default
    private Integer displayOrder = 1;

    @OneToMany(mappedBy = "vocabSense", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<VocabExample> examples = new ArrayList<>();

    public void addExample(VocabExample example) {
        examples.add(example);
        example.setVocabSense(this);
    }

    public void removeExample(VocabExample example) {
        examples.remove(example);
        example.setVocabSense(null);
    }
}
