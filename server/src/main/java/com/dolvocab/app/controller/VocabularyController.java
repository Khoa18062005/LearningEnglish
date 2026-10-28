package com.dolvocab.app.controller;

import com.dolvocab.app.dto.request.VocabCreateRequest;
import com.dolvocab.app.dto.response.ApiResponse;
import com.dolvocab.app.dto.response.VocabDetailResponse;
import com.dolvocab.app.service.VocabularyService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/vocabularies")
@RequiredArgsConstructor
public class VocabularyController {

    private final VocabularyService vocabularyService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<VocabDetailResponse>>> getVocabularies(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) List<Long> categoryIds,
            @RequestParam(required = false) String categoryName,
            @RequestParam(required = false) Long noteListId,
            @RequestParam(required = false) String pos,
            @RequestParam(required = false) Long wordFamilyId) {

        List<VocabDetailResponse> list = vocabularyService.getVocabularies(
                keyword, categoryIds, categoryName, noteListId, pos, wordFamilyId
        );
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<VocabDetailResponse>> getVocabById(@PathVariable Long id) {
        VocabDetailResponse detail = vocabularyService.getVocabById(id);
        return ResponseEntity.ok(ApiResponse.success(detail));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<VocabDetailResponse>> createVocabulary(
            @Valid @RequestBody VocabCreateRequest request) {
        VocabDetailResponse created = vocabularyService.createVocabulary(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Thêm từ vựng thành công", created));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<VocabDetailResponse>> updateVocabulary(
            @PathVariable Long id,
            @Valid @RequestBody VocabCreateRequest request) {
        VocabDetailResponse updated = vocabularyService.updateVocabulary(id, request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật từ vựng thành công", updated));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteVocabulary(@PathVariable Long id) {
        vocabularyService.deleteVocabulary(id);
        return ResponseEntity.ok(ApiResponse.success("Xóa từ vựng thành công", null));
    }
}
