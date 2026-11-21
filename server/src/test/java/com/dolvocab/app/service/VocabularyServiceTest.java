package com.dolvocab.app.service;

import com.dolvocab.app.dto.request.VocabCreateRequest;
import com.dolvocab.app.dto.response.VocabDetailResponse;
import com.dolvocab.app.entity.User;
import com.dolvocab.app.entity.VocabForm;
import com.dolvocab.app.entity.VocabSense;
import com.dolvocab.app.entity.Vocabulary;
import com.dolvocab.app.entity.enums.Countability;
import com.dolvocab.app.entity.enums.PartOfSpeech;
import com.dolvocab.app.repository.CategoryRepository;
import com.dolvocab.app.repository.NoteListRepository;
import com.dolvocab.app.repository.VocabularyRepository;
import com.dolvocab.app.repository.WordFamilyRepository;
import com.dolvocab.app.security.SecurityUtils;
import com.dolvocab.app.service.impl.VocabularyServiceImpl;
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
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class VocabularyServiceTest {

    @Mock
    private VocabularyRepository vocabularyRepository;
    @Mock
    private CategoryRepository categoryRepository;
    @Mock
    private NoteListRepository noteListRepository;
    @Mock
    private WordFamilyRepository wordFamilyRepository;
    @Mock
    private CategoryService categoryService;
    @Mock
    private NoteListService noteListService;
    @Mock
    private WordFamilyService wordFamilyService;
    @Mock
    private SecurityUtils securityUtils;
    @Mock
    private MongoTemplate mongoTemplate;

    @InjectMocks
    private VocabularyServiceImpl vocabularyService;

    private User mockUser;
    private String userId;

    @BeforeEach
    void setUp() {
        userId = new ObjectId().toHexString();
        mockUser = User.builder().id(userId).email("user@test.com").build();
        lenient().when(securityUtils.getCurrentUser()).thenReturn(mockUser);
    }

    @Test
    @DisplayName("Tạo từ vựng mới với các tầng nhúng forms, senses và examples")
    void testCreateVocabularyNestedDocument() {
        VocabCreateRequest request = VocabCreateRequest.builder()
                .word("collaborate")
                .pos("v")
                .meaning("hợp tác")
                .forms(List.of(
                        VocabCreateRequest.VocabFormItemRequest.builder()
                                .pos("v")
                                .type("pattern")
                                .pattern("+ with sb")
                                .meaning("hợp tác với ai")
                                .example("We collaborated with researchers.")
                                .build()
                ))
                .build();

        when(vocabularyRepository.findAllByWordLowerAndUserId("collaborate", userId)).thenReturn(Collections.emptyList());
        when(vocabularyRepository.save(any(Vocabulary.class))).thenAnswer(inv -> {
            Vocabulary v = inv.getArgument(0);
            v.setId(new ObjectId().toHexString());
            return v;
        });

        VocabDetailResponse response = vocabularyService.createVocabulary(request);

        assertNotNull(response.getId());
        assertEquals("collaborate", response.getWord());
        assertEquals("v", response.getPos());
        assertFalse(response.getForms().isEmpty());
    }

    @Test
    @DisplayName("Xóa từ vựng gọi cascade pull khỏi word_families.memberOrder")
    void testDeleteVocabularyCascade() {
        String vocabId = new ObjectId().toHexString();
        Vocabulary vocab = Vocabulary.builder().id(vocabId).userId(userId).word("test").build();

        when(vocabularyRepository.findByIdAndUserId(vocabId, userId)).thenReturn(Optional.of(vocab));

        vocabularyService.deleteVocabulary(vocabId);

        verify(mongoTemplate, times(1)).updateMulti(
                any(org.springframework.data.mongodb.core.query.Query.class),
                any(org.springframework.data.mongodb.core.query.Update.class),
                eq(com.dolvocab.app.entity.WordFamily.class)
        );
        verify(vocabularyRepository, times(1)).delete(vocab);
    }
}
