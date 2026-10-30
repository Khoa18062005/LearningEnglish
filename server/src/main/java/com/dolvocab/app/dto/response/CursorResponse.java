package com.dolvocab.app.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CursorResponse<T> {

    @Builder.Default
    private List<T> items = new ArrayList<>();

    private Long nextCursor;
    private boolean hasMore;
    private long totalCount;
}
