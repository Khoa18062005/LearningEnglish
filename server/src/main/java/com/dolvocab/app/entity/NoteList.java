package com.dolvocab.app.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(
    name = "note_lists",
    indexes = {
        @Index(name = "idx_note_list_user", columnList = "user_id"),
        @Index(name = "idx_note_list_folder", columnList = "folder_id")
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NoteList {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "folder_id")
    private NoteFolder folder;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(length = 50)
    private String code;

    @Column(name = "source_reference", length = 255)
    private String sourceReference;

    @Column(columnDefinition = "LONGTEXT")
    private String passage;

    @Column(columnDefinition = "TEXT")
    private String note;

    @Column(name = "sort_order")
    @Builder.Default
    private Integer sortOrder = 0;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @OneToMany(mappedBy = "noteList", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("sortOrder ASC, id ASC")
    @Builder.Default
    private List<ReadingPassage> passages = new ArrayList<>();

    @ManyToMany(mappedBy = "noteLists")
    @JsonIgnore
    @Builder.Default
    private List<Vocabulary> vocabularies = new ArrayList<>();
}
