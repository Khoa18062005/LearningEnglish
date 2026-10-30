package com.dolvocab.app.controller;

import com.dolvocab.app.dto.response.ApiResponse;
import com.dolvocab.app.dto.response.WordFamilyResponse;
import com.dolvocab.app.service.WordFamilyService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/word-families")
@RequiredArgsConstructor
public class WordFamilyController {

    private final WordFamilyService wordFamilyService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<WordFamilyResponse>>> getAllWordFamilies(
            @RequestParam(required = false) String keyword
    ) {
        List<WordFamilyResponse> list = wordFamilyService.searchWordFamilies(keyword);
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<WordFamilyResponse>> getWordFamilyById(@PathVariable Long id) {
        WordFamilyResponse res = wordFamilyService.getWordFamilyById(id);
        return ResponseEntity.ok(ApiResponse.success(res));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<WordFamilyResponse>> createWordFamily(@RequestBody Map<String, String> body) {
        String rootWord = body.get("rootWord");
        String description = body.get("description");
        WordFamilyResponse res = wordFamilyService.createWordFamily(rootWord, description);
        return ResponseEntity.ok(ApiResponse.success(res));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<WordFamilyResponse>> updateWordFamily(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body
    ) {
        String rootWord = (String) body.get("rootWord");
        String description = (String) body.get("description");
        @SuppressWarnings("unchecked")
        List<String> memberOrder = (List<String>) body.get("memberOrder");
        WordFamilyResponse res = wordFamilyService.updateWordFamily(id, rootWord, description, memberOrder);
        return ResponseEntity.ok(ApiResponse.success(res));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteWordFamily(@PathVariable Long id) {
        wordFamilyService.deleteWordFamily(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
