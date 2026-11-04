package com.dolvocab.app.service;

import com.dolvocab.app.dto.request.NoteFolderRequest;
import com.dolvocab.app.dto.response.NoteFolderResponse;

import java.util.List;

public interface NoteFolderService {
    List<NoteFolderResponse> getAllFolders();
    NoteFolderResponse getFolderById(Long id);
    NoteFolderResponse createFolder(NoteFolderRequest request);
    NoteFolderResponse updateFolder(Long id, NoteFolderRequest request);
    void deleteFolder(Long id);
}
