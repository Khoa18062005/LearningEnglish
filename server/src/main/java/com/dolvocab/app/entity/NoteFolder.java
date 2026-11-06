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
    name = "note_folders",
    indexes = {
        @Index(name = "idx_note_folder_user", columnList = "user_id"),
        @Index(name = "idx_note_folder_code_user", columnList = "user_id, code")
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NoteFolder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = true, length = 50)
    private String code; // Mã danh sách / Mã thư mục (Tùy chọn)

    @Column(nullable = false, length = 200)
    private String name; // Tên danh sách / Tên thư mục (VD: ETS TOEIC 2024 Test 1)

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "sort_order")
    @Builder.Default
    private Integer sortOrder = 0;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @OneToMany(mappedBy = "folder")
    @JsonIgnore
    @Builder.Default
    private List<NoteList> noteLists = new ArrayList<>();
}
