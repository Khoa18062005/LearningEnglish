package com.dolvocab.app.service.impl;

import com.dolvocab.app.dto.request.CategoryCreateRequest;
import com.dolvocab.app.dto.response.CategoryResponse;
import com.dolvocab.app.entity.Category;
import com.dolvocab.app.repository.CategoryRepository;
import com.dolvocab.app.service.CategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CategoryServiceImpl implements CategoryService {

    private final CategoryRepository categoryRepository;

    @Override
    @Transactional(readOnly = true)
    public List<CategoryResponse> getAllCategories() {
        List<Object[]> rows = categoryRepository.findCategoriesWithVocabCount();
        List<CategoryResponse> responses = new ArrayList<>();

        for (Object[] row : rows) {
            Long id = (Long) row[0];
            String name = (String) row[1];
            String colorCode = (String) row[2];
            String description = (String) row[3];
            long count = ((Number) row[4]).longValue();

            responses.add(CategoryResponse.builder()
                    .id(id)
                    .name(name)
                    .colorCode(colorCode != null ? colorCode : "#E31E24")
                    .description(description)
                    .count(count)
                    .build());
        }
        return responses;
    }

    @Override
    @Transactional
    public CategoryResponse createCategory(CategoryCreateRequest request) {
        if (categoryRepository.existsByNameIgnoreCase(request.getName().trim())) {
            Category existing = categoryRepository.findByNameIgnoreCase(request.getName().trim()).orElseThrow();
            return CategoryResponse.builder()
                    .id(existing.getId())
                    .name(existing.getName())
                    .colorCode(existing.getColorCode())
                    .description(existing.getDescription())
                    .count(existing.getVocabularies().size())
                    .build();
        }

        Category category = Category.builder()
                .name(request.getName().trim())
                .colorCode(request.getColorCode() != null ? request.getColorCode() : "#E31E24")
                .description(request.getDescription())
                .build();

        Category saved = categoryRepository.save(category);
        return CategoryResponse.builder()
                .id(saved.getId())
                .name(saved.getName())
                .colorCode(saved.getColorCode())
                .description(saved.getDescription())
                .count(0)
                .build();
    }

    @Override
    @Transactional
    public Category getOrCreateCategory(String name) {
        return categoryRepository.findByNameIgnoreCase(name.trim())
                .orElseGet(() -> categoryRepository.save(
                        Category.builder()
                                .name(name.trim())
                                .colorCode("#E31E24")
                                .build()
                ));
    }
}
