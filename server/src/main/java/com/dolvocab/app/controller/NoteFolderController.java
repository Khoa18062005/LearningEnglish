package com.dolvocab.app.controller;

import com.dolvocab.app.dto.request.NoteFolderRequest;
import com.dolvocab.app.dto.response.ApiResponse;
import com.dolvocab.app.dto.response.NoteFolderResponse;
import com.dolvocab.app.service.NoteFolderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/note-folders")
@RequiredArgsConstructor
public class NoteFolderController {

    private final NoteFolderService noteFolderService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<NoteFolderResponse>>> getAllFolders() {
        List<NoteFolderResponse> list = noteFolderService.getAllFolders();
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<NoteFolderResponse>> getFolderById(@PathVariable Long id) {
        NoteFolderResponse response = noteFolderService.getFolderById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<NoteFolderResponse>> createFolder(
            @Valid @RequestBody NoteFolderRequest request) {
        NoteFolderResponse created = noteFolderService.createFolder(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tạo thư mục danh sách thành công", created));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<NoteFolderResponse>> updateFolder(
            @PathVariable Long id,
            @Valid @RequestBody NoteFolderRequest request) {
        NoteFolderResponse updated = noteFolderService.updateFolder(id, request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật thư mục danh sách thành công", updated));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteFolder(@PathVariable Long id) {
        noteFolderService.deleteFolder(id);
        return ResponseEntity.ok(ApiResponse.success("Xóa thư mục danh sách thành công", null));
    }
}
