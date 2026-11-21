package com.dolvocab.app.service;

import com.dolvocab.app.dto.request.NoteListCreateRequest;
import com.dolvocab.app.dto.response.NoteListResponse;
import com.dolvocab.app.entity.NoteList;
import com.dolvocab.app.entity.User;

import java.util.List;

public interface NoteListService {
    List<NoteListResponse> getAllNoteLists();
    NoteListResponse getNoteListById(String id);
    NoteListResponse createNoteList(NoteListCreateRequest request);
    NoteListResponse updateNoteList(String id, NoteListCreateRequest request);
    void deleteNoteList(String id);
    void reorderNoteLists(List<String> listIds);
    NoteList getOrCreateNoteList(String identifier, String title, User user);
}
