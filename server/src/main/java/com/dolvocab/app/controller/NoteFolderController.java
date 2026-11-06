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

    @PutMapping("/reorder")
    public ResponseEntity<ApiResponse<Void>> reorderFolders(@RequestBody Object body) {
        List<Long> ids = parseIds(body);
        noteFolderService.reorderFolders(ids);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật thứ tự thư mục thành công", null));
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

    @SuppressWarnings("unchecked")
    private List<Long> parseIds(Object body) {
        List<Long> ids = new java.util.ArrayList<>();
        if (body instanceof List<?> rawList) {
            for (Object item : rawList) {
                if (item instanceof Number n) ids.add(n.longValue());
                else if (item != null) {
                    try { ids.add(Long.parseLong(item.toString())); } catch (Exception ignored) {}
                }
            }
        } else if (body instanceof java.util.Map<?, ?> map) {
            Object rawIds = map.get("ids");
            if (rawIds == null) rawIds = map.get("folderIds");
            if (rawIds instanceof List<?> rawList) {
                for (Object item : rawList) {
                    if (item instanceof Number n) ids.add(n.longValue());
                    else if (item != null) {
                        try { ids.add(Long.parseLong(item.toString())); } catch (Exception ignored) {}
                    }
                }
            }
        }
        return ids;
    }
}
