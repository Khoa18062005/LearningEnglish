package com.dolvocab.app.service;

import com.dolvocab.app.dto.request.CategoryCreateRequest;
import com.dolvocab.app.dto.response.CategoryResponse;
import com.dolvocab.app.entity.Category;

import java.util.List;

public interface CategoryService {
    List<CategoryResponse> getAllCategories();
    CategoryResponse createCategory(CategoryCreateRequest request);
    Category getOrCreateCategory(String name);
}
