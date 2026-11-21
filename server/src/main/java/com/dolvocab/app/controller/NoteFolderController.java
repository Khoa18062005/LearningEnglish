package com.dolvocab.app.controller;

import com.dolvocab.app.dto.request.NoteFolderRequest;
import com.dolvocab.app.dto.request.ReorderRequest;
import com.dolvocab.app.dto.response.ApiResponse;
import com.dolvocab.app.dto.response.NoteFolderResponse;
import com.dolvocab.app.service.NoteFolderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

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
    public ResponseEntity<ApiResponse<NoteFolderResponse>> getFolderById(@PathVariable String id) {
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

    @PutMapping("/reorder")
    public ResponseEntity<ApiResponse<Void>> reorderFolders(@RequestBody Object body) {
        List<String> ids = parseIds(body);
        noteFolderService.reorderFolders(ids);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật thứ tự thư mục thành công", null));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<NoteFolderResponse>> updateFolder(
            @PathVariable String id,
            @Valid @RequestBody NoteFolderRequest request) {
        NoteFolderResponse updated = noteFolderService.updateFolder(id, request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật thư mục danh sách thành công", updated));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteFolder(@PathVariable String id) {
        noteFolderService.deleteFolder(id);
        return ResponseEntity.ok(ApiResponse.success("Xóa thư mục danh sách thành công", null));
    }

    private List<String> parseIds(Object body) {
        List<String> ids = new ArrayList<>();
        if (body instanceof List<?> rawList) {
            for (Object item : rawList) {
                if (item != null) ids.add(item.toString());
            }
        } else if (body instanceof Map<?, ?> map) {
            Object rawIds = map.get("ids");
            if (rawIds == null) rawIds = map.get("folderIds");
            if (rawIds instanceof List<?> rawList) {
                for (Object item : rawList) {
                    if (item != null) ids.add(item.toString());
                }
            }
        }
        return ids;
    }
}
