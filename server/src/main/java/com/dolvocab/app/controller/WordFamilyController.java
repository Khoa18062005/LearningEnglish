package com.dolvocab.app.controller;

import com.dolvocab.app.dto.response.ApiResponse;
import com.dolvocab.app.dto.response.WordFamilyResponse;
import com.dolvocab.app.service.WordFamilyService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/word-families")
@RequiredArgsConstructor
public class WordFamilyController {

    private final WordFamilyService wordFamilyService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<WordFamilyResponse>>> getAllWordFamilies() {
        List<WordFamilyResponse> list = wordFamilyService.getAllWordFamilies();
        return ResponseEntity.ok(ApiResponse.success(list));
    }
}
