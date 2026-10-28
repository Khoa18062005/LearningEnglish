package com.dolvocab.app.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "vocab_examples")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VocabExample {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vocab_sense_id", nullable = false)
    @JsonIgnore
    private VocabSense vocabSense;

    @Column(name = "example_sentence", columnDefinition = "TEXT", nullable = false)
    private String exampleSentence;

    @Column(name = "example_translation", columnDefinition = "TEXT")
    private String exampleTranslation;
}
