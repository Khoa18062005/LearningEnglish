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
    name = "categories",
    indexes = {
        @Index(name = "idx_category_user", columnList = "user_id")
    },
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_user_category", columnNames = {"user_id", "name"})
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Category {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(name = "color_code", length = 20)
    @Builder.Default
    private String colorCode = "#E31E24";

    @Column(length = 255)
    private String description;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @ManyToMany(mappedBy = "categories")
    @JsonIgnore
    @Builder.Default
    private List<Vocabulary> vocabularies = new ArrayList<>();
}
