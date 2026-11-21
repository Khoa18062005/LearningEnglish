package com.dolvocab.app.service;

import com.dolvocab.app.dto.request.CategoryCreateRequest;
import com.dolvocab.app.dto.response.CategoryResponse;
import com.dolvocab.app.entity.Category;
import com.dolvocab.app.entity.User;
import com.dolvocab.app.exception.ResourceNotFoundException;
import com.dolvocab.app.repository.CategoryRepository;
import com.dolvocab.app.repository.VocabularyRepository;
import com.dolvocab.app.security.SecurityUtils;
import com.dolvocab.app.service.impl.CategoryServiceImpl;
import org.bson.types.ObjectId;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.mongodb.core.MongoTemplate;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CategoryServiceTest {

    @Mock
    private CategoryRepository categoryRepository;

    @Mock
    private VocabularyRepository vocabularyRepository;

    @Mock
    private SecurityUtils securityUtils;

    @Mock
    private MongoTemplate mongoTemplate;

    @InjectMocks
    private CategoryServiceImpl categoryService;

    private User mockUser;
    private String userId;

    @BeforeEach
    void setUp() {
        userId = new ObjectId().toHexString();
        mockUser = User.builder().id(userId).email("test@example.com").build();
        lenient().when(securityUtils.getCurrentUser()).thenReturn(mockUser);
    }

    @Test
    @DisplayName("Lấy tất cả danh mục kèm theo số từ vựng đếm qua Aggregation")
    void testGetAllCategories() {
        String catId = new ObjectId().toHexString();
        Category cat = Category.builder()
                .id(catId)
                .userId(userId)
                .name("IELTS")
                .nameLower("ielts")
                .colorCode("#FF0000")
                .build();

        when(categoryRepository.findAllByUserIdOrderByNameAsc(userId)).thenReturn(List.of(cat));
        when(vocabularyRepository.countVocabulariesGroupedByCategoryIds(userId)).thenReturn(Map.of(catId, 15L));

        List<CategoryResponse> result = categoryService.getAllCategories();

        assertEquals(1, result.size());
        assertEquals("IELTS", result.get(0).getName());
        assertEquals(15L, result.get(0).getCount());
    }

    @Test
    @DisplayName("Tạo danh mục mới thành công")
    void testCreateCategory() {
        CategoryCreateRequest request = new CategoryCreateRequest();
        request.setName("Business");
        request.setColorCode("#00FF00");

        when(categoryRepository.existsByNameLowerAndUserId("business", userId)).thenReturn(false);
        when(categoryRepository.save(any(Category.class))).thenAnswer(inv -> {
            Category saved = inv.getArgument(0);
            saved.setId(new ObjectId().toHexString());
            return saved;
        });

        CategoryResponse response = categoryService.createCategory(request);

        assertNotNull(response.getId());
        assertEquals("Business", response.getName());
        assertEquals(0L, response.getCount());
    }

    @Test
    @DisplayName("Xóa danh mục gọi cascade pull categoryIds trên vocabularies")
    void testDeleteCategoryCascade() {
        String catId = new ObjectId().toHexString();
        Category cat = Category.builder().id(catId).userId(userId).build();

        when(categoryRepository.findByIdAndUserId(catId, userId)).thenReturn(Optional.of(cat));

        categoryService.deleteCategory(catId);

        verify(mongoTemplate, times(1)).updateMulti(
                any(org.springframework.data.mongodb.core.query.Query.class),
                any(org.springframework.data.mongodb.core.query.Update.class),
                eq(com.dolvocab.app.entity.Vocabulary.class)
        );
        verify(categoryRepository, times(1)).delete(cat);
    }
}
