package com.dolvocab.app.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "word_families")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WordFamily {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "root_word", nullable = false, length = 100)
    private String rootWord;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "member_order", columnDefinition = "TEXT")
    private String memberOrder;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @OneToMany(mappedBy = "wordFamily", cascade = {CascadeType.PERSIST, CascadeType.MERGE})
    @JsonIgnore
    @Builder.Default
    private List<Vocabulary> vocabularies = new ArrayList<>();
}
