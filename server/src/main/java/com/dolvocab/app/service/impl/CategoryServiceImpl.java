package com.dolvocab.app.service.impl;

import com.dolvocab.app.dto.request.CategoryCreateRequest;
import com.dolvocab.app.dto.response.CategoryResponse;
import com.dolvocab.app.entity.Category;
import com.dolvocab.app.entity.User;
import com.dolvocab.app.entity.Vocabulary;
import com.dolvocab.app.exception.ConflictException;
import com.dolvocab.app.exception.ResourceNotFoundException;
import com.dolvocab.app.repository.CategoryRepository;
import com.dolvocab.app.repository.VocabularyRepository;
import com.dolvocab.app.security.SecurityUtils;
import com.dolvocab.app.service.CategoryService;
import com.dolvocab.app.utils.ObjectIdValidator;
import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class CategoryServiceImpl implements CategoryService {

    private final CategoryRepository categoryRepository;
    private final VocabularyRepository vocabularyRepository;
    private final SecurityUtils securityUtils;
    private final MongoTemplate mongoTemplate;

    @Override
    @Transactional(readOnly = true)
    public List<CategoryResponse> getAllCategories() {
        User currentUser = securityUtils.getCurrentUser();
        List<Category> categories = categoryRepository.findAllByUserIdOrderByNameAsc(currentUser.getId());
        Map<String, Long> countMap = vocabularyRepository.countVocabulariesGroupedByCategoryIds(currentUser.getId());

        List<CategoryResponse> responses = new ArrayList<>();
        for (Category cat : categories) {
            long count = countMap.getOrDefault(cat.getId(), 0L);
            responses.add(CategoryResponse.builder()
                    .id(cat.getId())
                    .name(cat.getName())
                    .colorCode(cat.getColorCode() != null ? cat.getColorCode() : "#E31E24")
                    .description(cat.getDescription())
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
        String nameLower = trimmedName.toLowerCase();

        if (categoryRepository.existsByNameLowerAndUserId(nameLower, currentUser.getId())) {
            Category existing = categoryRepository.findByNameLowerAndUserId(nameLower, currentUser.getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Danh mục không tồn tại"));
            Map<String, Long> countMap = vocabularyRepository.countVocabulariesGroupedByCategoryIds(currentUser.getId());
            return CategoryResponse.builder()
                    .id(existing.getId())
                    .name(existing.getName())
                    .colorCode(existing.getColorCode())
                    .description(existing.getDescription())
                    .count(countMap.getOrDefault(existing.getId(), 0L))
                    .build();
        }

        Category category = Category.builder()
                .userId(currentUser.getId())
                .name(trimmedName)
                .nameLower(nameLower)
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
    public CategoryResponse getCategoryById(String id) {
        ObjectIdValidator.validate(id, "danh mục");
        User currentUser = securityUtils.getCurrentUser();
        Category category = categoryRepository.findByIdAndUserId(id, currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy danh mục với ID: " + id));

        Map<String, Long> countMap = vocabularyRepository.countVocabulariesGroupedByCategoryIds(currentUser.getId());
        long count = countMap.getOrDefault(category.getId(), 0L);

        return CategoryResponse.builder()
                .id(category.getId())
                .name(category.getName())
                .colorCode(category.getColorCode() != null ? category.getColorCode() : "#E31E24")
                .description(category.getDescription())
                .count(count)
                .build();
    }

    @Override
    @Transactional
    public CategoryResponse updateCategory(String id, CategoryCreateRequest request) {
        ObjectIdValidator.validate(id, "danh mục");
        User currentUser = securityUtils.getCurrentUser();
        Category category = categoryRepository.findByIdAndUserId(id, currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy danh mục với ID: " + id));

        String newName = request.getName().trim();
        String nameLower = newName.toLowerCase();
        Optional<Category> existing = categoryRepository.findByNameLowerAndUserId(nameLower, currentUser.getId());
        if (existing.isPresent() && !existing.get().getId().equals(id)) {
            throw new ConflictException("Tên danh mục '" + newName + "' đã tồn tại trong tài khoản của bạn!");
        }

        category.setName(newName);
        category.setNameLower(nameLower);
        if (request.getColorCode() != null && !request.getColorCode().trim().isEmpty()) {
            category.setColorCode(request.getColorCode().trim());
        }
        category.setDescription(request.getDescription());

        Category saved = categoryRepository.save(category);
        Map<String, Long> countMap = vocabularyRepository.countVocabulariesGroupedByCategoryIds(currentUser.getId());

        return CategoryResponse.builder()
                .id(saved.getId())
                .name(saved.getName())
                .colorCode(saved.getColorCode())
                .description(saved.getDescription())
                .count(countMap.getOrDefault(saved.getId(), 0L))
                .build();
    }

    @Override
    @Transactional
    public void deleteCategory(String id) {
        ObjectIdValidator.validate(id, "danh mục");
        User currentUser = securityUtils.getCurrentUser();
        Category category = categoryRepository.findByIdAndUserId(id, currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy danh mục với ID: " + id));

        // M4-05: Cascade pull category ID from vocabularies
        Query pullQuery = Query.query(Criteria.where("userId").is(new ObjectId(currentUser.getId())));
        Update pullUpdate = new Update()
                .pull("categoryIds", new ObjectId(id));
        mongoTemplate.updateMulti(pullQuery, pullUpdate, Vocabulary.class);

        categoryRepository.delete(category);
    }

    @Override
    @Transactional
    public Category getOrCreateCategory(String name, User user) {
        String trimmedName = name.trim();
        String nameLower = trimmedName.toLowerCase();
        return categoryRepository.findByNameLowerAndUserId(nameLower, user.getId())
                .orElseGet(() -> categoryRepository.save(
                        Category.builder()
                                .userId(user.getId())
                                .name(trimmedName)
                                .nameLower(nameLower)
                                .colorCode("#E31E24")
                                .build()
                ));
    }
}
