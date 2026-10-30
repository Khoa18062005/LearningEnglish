package com.dolvocab.app.service.impl;

import com.dolvocab.app.dto.request.CategoryCreateRequest;
import com.dolvocab.app.dto.response.CategoryResponse;
import com.dolvocab.app.entity.Category;
import com.dolvocab.app.entity.User;
import com.dolvocab.app.entity.Vocabulary;
import com.dolvocab.app.repository.CategoryRepository;
import com.dolvocab.app.security.SecurityUtils;
import com.dolvocab.app.service.CategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class CategoryServiceImpl implements CategoryService {

    private final CategoryRepository categoryRepository;
    private final SecurityUtils securityUtils;

    @Override
    @Transactional(readOnly = true)
    public List<CategoryResponse> getAllCategories() {
        User currentUser = securityUtils.getCurrentUser();
        List<Object[]> rows = categoryRepository.findCategoriesWithVocabCountByUserId(currentUser.getId());
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
        User currentUser = securityUtils.getCurrentUser();
        String trimmedName = request.getName().trim();

        if (categoryRepository.existsByNameIgnoreCaseAndUserId(trimmedName, currentUser.getId())) {
            Category existing = categoryRepository.findByNameIgnoreCaseAndUserId(trimmedName, currentUser.getId()).orElseThrow();
            return CategoryResponse.builder()
                    .id(existing.getId())
                    .name(existing.getName())
                    .colorCode(existing.getColorCode())
                    .description(existing.getDescription())
                    .count(existing.getVocabularies().size())
                    .build();
        }

        Category category = Category.builder()
                .user(currentUser)
                .name(trimmedName)
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
    @Transactional(readOnly = true)
    public CategoryResponse getCategoryById(Long id) {
        User currentUser = securityUtils.getCurrentUser();
        Category category = categoryRepository.findByIdAndUserId(id, currentUser.getId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy danh mục với ID: " + id));

        return CategoryResponse.builder()
                .id(category.getId())
                .name(category.getName())
                .colorCode(category.getColorCode() != null ? category.getColorCode() : "#E31E24")
                .description(category.getDescription())
                .count(category.getVocabularies() != null ? category.getVocabularies().size() : 0)
                .build();
    }

    @Override
    @Transactional
    public CategoryResponse updateCategory(Long id, CategoryCreateRequest request) {
        User currentUser = securityUtils.getCurrentUser();
        Category category = categoryRepository.findByIdAndUserId(id, currentUser.getId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy danh mục với ID: " + id));

        String newName = request.getName().trim();
        Optional<Category> existing = categoryRepository.findByNameIgnoreCaseAndUserId(newName, currentUser.getId());
        if (existing.isPresent() && !existing.get().getId().equals(id)) {
            throw new RuntimeException("Tên danh mục '" + newName + "' đã tồn tại trong tài khoản của bạn!");
        }

        category.setName(newName);
        if (request.getColorCode() != null && !request.getColorCode().trim().isEmpty()) {
            category.setColorCode(request.getColorCode().trim());
        }
        category.setDescription(request.getDescription());

        Category saved = categoryRepository.save(category);
        return CategoryResponse.builder()
                .id(saved.getId())
                .name(saved.getName())
                .colorCode(saved.getColorCode())
                .description(saved.getDescription())
                .count(saved.getVocabularies() != null ? saved.getVocabularies().size() : 0)
                .build();
    }

    @Override
    @Transactional
    public void deleteCategory(Long id) {
        User currentUser = securityUtils.getCurrentUser();
        Category category = categoryRepository.findByIdAndUserId(id, currentUser.getId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy danh mục với ID: " + id));

        // Disconnect many-to-many references from vocabularies
        if (category.getVocabularies() != null) {
            for (Vocabulary v : category.getVocabularies()) {
                v.getCategories().remove(category);
            }
        }

        categoryRepository.delete(category);
    }

    @Override
    @Transactional
    public Category getOrCreateCategory(String name, User user) {
        String trimmedName = name.trim();
        return categoryRepository.findByNameIgnoreCaseAndUserId(trimmedName, user.getId())
                .orElseGet(() -> categoryRepository.save(
                        Category.builder()
                                .user(user)
                                .name(trimmedName)
                                .colorCode("#E31E24")
                                .build()
                ));
    }
}
