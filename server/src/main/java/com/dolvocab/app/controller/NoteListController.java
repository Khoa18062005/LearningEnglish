package com.dolvocab.app.controller;

import com.dolvocab.app.dto.request.NoteListCreateRequest;
import com.dolvocab.app.dto.response.ApiResponse;
import com.dolvocab.app.dto.response.NoteListResponse;
import com.dolvocab.app.service.NoteListService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/note-lists")
@RequiredArgsConstructor
public class NoteListController {

    private final NoteListService noteListService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<NoteListResponse>>> getAllNoteLists() {
        List<NoteListResponse> list = noteListService.getAllNoteLists();
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<NoteListResponse>> getNoteListById(@PathVariable String id) {
        NoteListResponse response = noteListService.getNoteListById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<NoteListResponse>> createNoteList(
            @Valid @RequestBody NoteListCreateRequest request) {
        NoteListResponse created = noteListService.createNoteList(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tạo thẻ ghi chú bài đọc thành công", created));
    }

    @PutMapping("/reorder")
    public ResponseEntity<ApiResponse<Void>> reorderNoteLists(@RequestBody Object body) {
        List<String> ids = parseIds(body);
        noteListService.reorderNoteLists(ids);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật thứ tự danh sách thành công", null));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<NoteListResponse>> updateNoteList(
            @PathVariable String id,
            @Valid @RequestBody NoteListCreateRequest request) {
        NoteListResponse updated = noteListService.updateNoteList(id, request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật danh sách bài đọc thành công", updated));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteNoteList(@PathVariable String id) {
        noteListService.deleteNoteList(id);
        return ResponseEntity.ok(ApiResponse.success("Xóa danh sách bài đọc thành công", null));
    }

    private List<String> parseIds(Object body) {
        List<String> ids = new ArrayList<>();
        if (body instanceof List<?> rawList) {
            for (Object item : rawList) {
                if (item != null) ids.add(item.toString());
            }
        } else if (body instanceof Map<?, ?> map) {
            Object rawIds = map.get("ids");
            if (rawIds == null) rawIds = map.get("listIds");
            if (rawIds instanceof List<?> rawList) {
                for (Object item : rawList) {
                    if (item != null) ids.add(item.toString());
                }
            }
        }
        return ids;
    }
}
