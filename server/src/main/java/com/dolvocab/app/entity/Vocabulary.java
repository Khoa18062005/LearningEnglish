package com.dolvocab.app.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Entity
@Table(name = "vocabularies", indexes = {
    @Index(name = "idx_vocab_word", columnList = "word")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Vocabulary {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 150)
    private String word;

    @Column(length = 100)
    private String phonetic;

    @Column(name = "audio_url", length = 500)
    private String audioUrl;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "word_family_id")
    private WordFamily wordFamily;

    @Column(name = "general_note", columnDefinition = "TEXT")
    private String generalNote;

    @Column(columnDefinition = "TEXT")
    private String meaning;

    @ManyToMany
    @JoinTable(
        name = "vocab_categories",
        joinColumns = @JoinColumn(name = "vocab_id"),
        inverseJoinColumns = @JoinColumn(name = "category_id")
    )
    @Builder.Default
    private Set<Category> categories = new HashSet<>();

    @ManyToMany
    @JoinTable(
        name = "note_list_vocabs",
        joinColumns = @JoinColumn(name = "vocab_id"),
        inverseJoinColumns = @JoinColumn(name = "note_list_id")
    )
    @Builder.Default
    private Set<NoteList> noteLists = new HashSet<>();

    @OneToMany(mappedBy = "vocabulary", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("displayOrder ASC")
    @Builder.Default
    private List<VocabForm> forms = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public void addForm(VocabForm form) {
        forms.add(form);
        form.setVocabulary(this);
    }

    public void removeForm(VocabForm form) {
        forms.remove(form);
        form.setVocabulary(null);
    }
}
