package com.dolvocab.app.controller;

import com.dolvocab.app.dto.request.VocabCreateRequest;
import com.dolvocab.app.dto.response.ApiResponse;
import com.dolvocab.app.dto.response.CursorResponse;
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

    @GetMapping("/cursor")
    public ResponseEntity<ApiResponse<CursorResponse<VocabDetailResponse>>> getVocabulariesCursor(
            @RequestParam(required = false) String cursor,
            @RequestParam(required = false, defaultValue = "10") Integer limit,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) List<String> categoryIds,
            @RequestParam(required = false) String categoryName,
            @RequestParam(required = false) String noteListId,
            @RequestParam(required = false) String pos,
            @RequestParam(required = false) String wordFamilyId) {

        CursorResponse<VocabDetailResponse> result = vocabularyService.getVocabulariesCursor(
                cursor, limit, keyword, categoryIds, categoryName, noteListId, pos, wordFamilyId
        );
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<VocabDetailResponse>>> getVocabularies(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) List<String> categoryIds,
            @RequestParam(required = false) String categoryName,
            @RequestParam(required = false) String noteListId,
            @RequestParam(required = false) String pos,
            @RequestParam(required = false) String wordFamilyId) {

        List<VocabDetailResponse> list = vocabularyService.getVocabularies(
                keyword, categoryIds, categoryName, noteListId, pos, wordFamilyId
        );
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<VocabDetailResponse>> getVocabById(@PathVariable String id) {
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
            @PathVariable String id,
            @Valid @RequestBody VocabCreateRequest request) {
        VocabDetailResponse updated = vocabularyService.updateVocabulary(id, request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật từ vựng thành công", updated));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteVocabulary(@PathVariable String id) {
        vocabularyService.deleteVocabulary(id);
        return ResponseEntity.ok(ApiResponse.success("Xóa từ vựng thành công", null));
    }
}
