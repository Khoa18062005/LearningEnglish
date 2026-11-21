package com.dolvocab.app.service.impl;

import com.dolvocab.app.dto.request.VocabCreateRequest;
import com.dolvocab.app.dto.response.CategoryResponse;
import com.dolvocab.app.dto.response.CursorResponse;
import com.dolvocab.app.dto.response.NoteListResponse;
import com.dolvocab.app.dto.response.VocabDetailResponse;
import com.dolvocab.app.entity.*;
import com.dolvocab.app.entity.enums.Countability;
import com.dolvocab.app.entity.enums.PartOfSpeech;
import com.dolvocab.app.exception.ConflictException;
import com.dolvocab.app.exception.ResourceNotFoundException;
import com.dolvocab.app.repository.CategoryRepository;
import com.dolvocab.app.repository.NoteListRepository;
import com.dolvocab.app.repository.VocabularyRepository;
import com.dolvocab.app.repository.WordFamilyRepository;
import com.dolvocab.app.security.SecurityUtils;
import com.dolvocab.app.service.CategoryService;
import com.dolvocab.app.service.NoteListService;
import com.dolvocab.app.service.VocabularyService;
import com.dolvocab.app.service.WordFamilyService;
import com.dolvocab.app.utils.ObjectIdValidator;
import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class VocabularyServiceImpl implements VocabularyService {

    private final VocabularyRepository vocabularyRepository;
    private final CategoryRepository categoryRepository;
    private final NoteListRepository noteListRepository;
    private final WordFamilyRepository wordFamilyRepository;

    private final CategoryService categoryService;
    private final NoteListService noteListService;
    private final WordFamilyService wordFamilyService;

    private final SecurityUtils securityUtils;
    private final MongoTemplate mongoTemplate;
    private final com.fasterxml.jackson.databind.ObjectMapper objectMapper = new com.fasterxml.jackson.databind.ObjectMapper();

    private String serializeMeaningDetails(VocabCreateRequest request) {
        if (request.getMeaningDetailsJson() != null && !request.getMeaningDetailsJson().trim().isEmpty()) {
            return request.getMeaningDetailsJson().trim();
        }
        if (request.getMeaningDetails() != null && !request.getMeaningDetails().isEmpty()) {
            try {
                return objectMapper.writeValueAsString(request.getMeaningDetails());
            } catch (Exception e) {
                return null;
            }
        }
        return null;
    }

    @Override
    @Transactional(readOnly = true)
    public List<VocabDetailResponse> getVocabularies(
            String keyword,
            List<String> categoryIds,
            String categoryName,
            String noteListId,
            String posStr,
            String wordFamilyId) {

        User currentUser = securityUtils.getCurrentUser();
        PartOfSpeech pos = parsePos(posStr);

        List<Vocabulary> list = vocabularyRepository.findVocabulariesWithFilter(
                currentUser.getId(), null, keyword, categoryIds, categoryName, noteListId, pos, wordFamilyId, 0
        );

        return list.stream().map(v -> mapToDetailResponse(v, currentUser.getId())).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public CursorResponse<VocabDetailResponse> getVocabulariesCursor(
            String cursor,
            Integer limit,
            String keyword,
            List<String> categoryIds,
            String categoryName,
            String noteListId,
            String posStr,
            String wordFamilyId) {

        User currentUser = securityUtils.getCurrentUser();
        int pageSize = (limit != null && limit > 0) ? Math.min(limit, 50) : 10;
        PartOfSpeech pos = parsePos(posStr);

        // Fetch pageSize + 1 to determine if there is a next page
        List<Vocabulary> list = vocabularyRepository.findVocabulariesWithFilter(
                currentUser.getId(), cursor, keyword, categoryIds, categoryName, noteListId, pos, wordFamilyId, pageSize + 1
        );

        boolean hasMore = list.size() > pageSize;
        List<Vocabulary> actualItems = hasMore ? list.subList(0, pageSize) : list;
        String nextCursor = null;
        if (hasMore && !actualItems.isEmpty()) {
            nextCursor = actualItems.get(actualItems.size() - 1).getId();
        }

        // Count total matching items
        List<Vocabulary> allMatching = vocabularyRepository.findVocabulariesWithFilter(
                currentUser.getId(), null, keyword, categoryIds, categoryName, noteListId, pos, wordFamilyId, 0
        );
        long totalCount = allMatching.size();

        List<VocabDetailResponse> itemResponses = actualItems.stream()
                .map(v -> mapToDetailResponse(v, currentUser.getId()))
                .toList();

        return CursorResponse.<VocabDetailResponse>builder()
                .items(itemResponses)
                .nextCursor(nextCursor)
                .hasMore(hasMore)
                .totalCount(totalCount)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public VocabDetailResponse getVocabById(String id) {
        ObjectIdValidator.validate(id, "từ vựng");
        User currentUser = securityUtils.getCurrentUser();
        Vocabulary vocab = vocabularyRepository.findByIdAndUserId(id, currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy từ vựng với ID: " + id));
        return mapToDetailResponse(vocab, currentUser.getId());
    }

    @Override
    @Transactional
    public VocabDetailResponse createVocabulary(VocabCreateRequest request) {
        User currentUser = securityUtils.getCurrentUser();
        String cleanWord = request.getWord().trim();

        String requestPos = request.getPos();
        if ((requestPos == null || requestPos.trim().isEmpty()) && request.getForms() != null && !request.getForms().isEmpty()) {
            requestPos = request.getForms().get(0).getPos();
        }
        PartOfSpeech parsed = parsePos(requestPos);
        final PartOfSpeech targetPos = (parsed != null) ? parsed : PartOfSpeech.V;
        String posBadge = formatPosBadge(targetPos);

        Vocabulary vocab;
        List<Vocabulary> existingList = vocabularyRepository.findAllByWordLowerAndUserId(cleanWord.toLowerCase(), currentUser.getId());
        Optional<Vocabulary> existingSamePos = existingList.stream()
                .filter(v -> {
                    if (v.getPos() != null && !v.getPos().trim().isEmpty()) {
                        return v.getPos().equalsIgnoreCase(posBadge);
                    }
                    if (v.getForms() != null && !v.getForms().isEmpty()) {
                        return v.getForms().get(0).getPartOfSpeech() == targetPos;
                    }
                    return false;
                })
                .findFirst();

        if (existingSamePos.isPresent()) {
            vocab = existingSamePos.get();
            vocab.getForms().clear();
        } else {
            vocab = Vocabulary.builder()
                    .userId(currentUser.getId())
                    .word(cleanWord)
                    .wordLower(cleanWord.toLowerCase())
                    .pos(posBadge)
                    .build();
        }

        vocab.setWord(cleanWord);
        vocab.setWordLower(cleanWord.toLowerCase());
        vocab.setPos(posBadge);
        vocab.setPhonetic(request.getPhonetic());
        vocab.setAudioUrl(request.getAudioUrl());
        vocab.setGeneralNote(request.getGeneralNote());
        vocab.setMeaning(request.getMeaning());
        vocab.setCloseMeanings(request.getCloseMeanings());
        vocab.setSynonyms(request.getSynonyms());
        vocab.setMeaningDetailsJson(serializeMeaningDetails(request));

        // 1. Word Family
        handleWordFamily(vocab, request, currentUser);

        // 2. Categories
        handleCategories(vocab, request, currentUser);

        // 3. Reading Note Lists
        handleNoteLists(vocab, request, currentUser);

        // 4. Forms & Senses
        handleFormsAndSenses(vocab, request);

        Vocabulary saved = vocabularyRepository.save(vocab);
        return mapToDetailResponse(saved, currentUser.getId());
    }

    @Override
    @Transactional
    public VocabDetailResponse updateVocabulary(String id, VocabCreateRequest request) {
        ObjectIdValidator.validate(id, "từ vựng");
        User currentUser = securityUtils.getCurrentUser();
        Vocabulary vocab = vocabularyRepository.findByIdAndUserId(id, currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy từ vựng với ID: " + id));

        String newWord = request.getWord().trim();

        String requestPos = request.getPos();
        if ((requestPos == null || requestPos.trim().isEmpty()) && request.getForms() != null && !request.getForms().isEmpty()) {
            requestPos = request.getForms().get(0).getPos();
        }
        PartOfSpeech parsedUpdatePos = parsePos(requestPos);
        final PartOfSpeech targetPos = (parsedUpdatePos != null) ? parsedUpdatePos : PartOfSpeech.V;
        String posBadge = formatPosBadge(targetPos);

        List<Vocabulary> existingList = vocabularyRepository.findAllByWordLowerAndUserId(newWord.toLowerCase(), currentUser.getId());
        boolean duplicateExists = existingList.stream()
                .filter(v -> !v.getId().equals(id))
                .anyMatch(v -> {
                    if (v.getPos() != null && !v.getPos().trim().isEmpty()) {
                        return v.getPos().equalsIgnoreCase(posBadge);
                    }
                    if (v.getForms() != null && !v.getForms().isEmpty()) {
                        return v.getForms().get(0).getPartOfSpeech() == targetPos;
                    }
                    return false;
                });

        if (duplicateExists) {
            throw new ConflictException("Từ vựng '" + newWord + "' với dạng từ này đã tồn tại trong danh sách của bạn!");
        }

        vocab.setWord(newWord);
        vocab.setWordLower(newWord.toLowerCase());
        vocab.setPos(posBadge);
        vocab.setPhonetic(request.getPhonetic());
        vocab.setAudioUrl(request.getAudioUrl());
        vocab.setGeneralNote(request.getGeneralNote());
        vocab.setMeaning(request.getMeaning());
        vocab.setCloseMeanings(request.getCloseMeanings());
        vocab.setSynonyms(request.getSynonyms());
        vocab.setMeaningDetailsJson(serializeMeaningDetails(request));

        handleWordFamily(vocab, request, currentUser);
        handleCategories(vocab, request, currentUser);
        handleNoteLists(vocab, request, currentUser);

        vocab.getForms().clear();
        handleFormsAndSenses(vocab, request);

        Vocabulary saved = vocabularyRepository.save(vocab);
        return mapToDetailResponse(saved, currentUser.getId());
    }

    @Override
    @Transactional
    public void deleteVocabulary(String id) {
        ObjectIdValidator.validate(id, "từ vựng");
        User currentUser = securityUtils.getCurrentUser();
        Vocabulary vocab = vocabularyRepository.findByIdAndUserId(id, currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy từ vựng với ID: " + id));

        // M4-05: Cascade pull vocab id from word_families memberOrder
        Query pullQuery = Query.query(Criteria.where("userId").is(new ObjectId(currentUser.getId())));
        Update pullUpdate = new Update()
                .pull("memberOrder", new ObjectId(id));
        mongoTemplate.updateMulti(pullQuery, pullUpdate, WordFamily.class);

        vocabularyRepository.delete(vocab);
    }

    // --- Private Helper Handlers ---

    private void handleWordFamily(Vocabulary vocab, VocabCreateRequest request, User user) {
        if (request.getWordFamilyId() != null && !request.getWordFamilyId().isBlank()) {
            if (ObjectId.isValid(request.getWordFamilyId())) {
                wordFamilyRepository.findByIdAndUserId(request.getWordFamilyId(), user.getId())
                        .ifPresentOrElse(wf -> vocab.setWordFamilyId(wf.getId()), () -> vocab.setWordFamilyId(null));
            } else {
                vocab.setWordFamilyId(null);
            }
        } else if (request.getRootWord() != null && !request.getRootWord().trim().isEmpty()) {
            WordFamily wf = wordFamilyService.getOrCreateWordFamily(request.getRootWord().trim(), null, user);
            vocab.setWordFamilyId(wf != null ? wf.getId() : null);
        } else if (request.getWordFamily() != null && !request.getWordFamily().isEmpty()) {
            String first = request.getWordFamily().get(0).trim();
            if (!first.isEmpty()) {
                WordFamily wf = wordFamilyService.getOrCreateWordFamily(first, null, user);
                vocab.setWordFamilyId(wf != null ? wf.getId() : null);
            } else {
                vocab.setWordFamilyId(null);
            }
        } else {
            vocab.setWordFamilyId(null);
        }
    }

    private void handleCategories(Vocabulary vocab, VocabCreateRequest request, User user) {
        vocab.getCategoryIds().clear();

        if (request.getCategoryIds() != null && !request.getCategoryIds().isEmpty()) {
            for (String catId : request.getCategoryIds()) {
                if (catId != null && ObjectId.isValid(catId)) {
                    categoryRepository.findByIdAndUserId(catId, user.getId())
                            .ifPresent(c -> vocab.getCategoryIds().add(c.getId()));
                }
            }
        }

        if (request.getCategories() != null && !request.getCategories().isEmpty()) {
            for (String catName : request.getCategories()) {
                if (catName != null && !catName.trim().isEmpty()) {
                    Category cat = categoryService.getOrCreateCategory(catName.trim(), user);
                    if (cat != null && !vocab.getCategoryIds().contains(cat.getId())) {
                        vocab.getCategoryIds().add(cat.getId());
                    }
                }
            }
        }
    }

    private void handleNoteLists(Vocabulary vocab, VocabCreateRequest request, User user) {
        vocab.getNoteListIds().clear();
        if (request.getNoteListId() != null) {
            String identifier = request.getNoteListId().toString().trim();
            if (!identifier.isEmpty() && !identifier.equalsIgnoreCase("null")) {
                NoteList list = noteListService.getOrCreateNoteList(identifier, request.getReadingListName(), user);
                if (list != null) {
                    vocab.getNoteListIds().add(list.getId());
                }
            }
        }
    }

    private void handleFormsAndSenses(Vocabulary vocab, VocabCreateRequest request) {
        if (request.getForms() == null || request.getForms().isEmpty()) {
            if (request.getPos() != null || request.getMeaning() != null) {
                PartOfSpeech pos = parsePos(request.getPos());
                if (pos == null) pos = PartOfSpeech.V;
                Countability countability = parseCountability(request.getCountability());
                VocabForm vocabForm = VocabForm.builder()
                        .partOfSpeech(pos)
                        .countability(countability)
                        .displayOrder(1)
                        .build();
                vocab.addForm(vocabForm);
                VocabSense sense = VocabSense.builder()
                        .vietnameseMeaning(request.getMeaning() != null ? request.getMeaning() : "Chưa cập nhật nghĩa")
                        .displayOrder(1)
                        .build();
                vocabForm.addSense(sense);
            }
            return;
        }

        Map<PartOfSpeech, VocabForm> formMap = new LinkedHashMap<>();

        int formOrder = 1;
        int senseOrder = 1;

        for (VocabCreateRequest.VocabFormItemRequest item : request.getForms()) {
            String posString = item.getPos() != null ? item.getPos() : request.getPos();
            PartOfSpeech pos = parsePos(posString);
            if (pos == null) pos = PartOfSpeech.V;

            String countabilityString = item.getCountability() != null ? item.getCountability() : request.getCountability();
            Countability countability = parseCountability(countabilityString);

            VocabForm currentForm = formMap.get(pos);
            if (currentForm == null) {
                currentForm = VocabForm.builder()
                        .partOfSpeech(pos)
                        .countability(countability)
                        .displayOrder(formOrder++)
                        .build();
                vocab.addForm(currentForm);
                formMap.put(pos, currentForm);
                senseOrder = 1;
            } else if (countability != Countability.NOT_APPLICABLE && currentForm.getCountability() == Countability.NOT_APPLICABLE) {
                currentForm.setCountability(countability);
            }

            // Check if senses are provided nested
            if (item.getSenses() != null && !item.getSenses().isEmpty()) {
                for (VocabCreateRequest.VocabSenseItemRequest senseReq : item.getSenses()) {
                    VocabSense sense = VocabSense.builder()
                            .pattern(senseReq.getPattern())
                            .collocation(senseReq.getCollocation())
                            .synonyms(senseReq.getSynonyms())
                            .closeMeanings(senseReq.getCloseMeanings())
                            .vietnameseMeaning(senseReq.getVietnameseMeaning() != null ? senseReq.getVietnameseMeaning() : "Chưa cập nhật nghĩa")
                            .usageNote(senseReq.getUsageNote())
                            .displayOrder(senseOrder++)
                            .build();

                    if (senseReq.getExamples() != null) {
                        for (String ex : senseReq.getExamples()) {
                            if (ex != null && !ex.trim().isEmpty()) {
                                sense.addExample(VocabExample.builder().exampleSentence(ex.trim()).build());
                            }
                        }
                    }
                    currentForm.addSense(sense);
                }
            } else {
                // Flat form item (pattern or collocation)
                boolean isCollocation = pos == PartOfSpeech.COLLOCATION
                        || "collocation".equalsIgnoreCase(item.getType())
                        || "collocation".equalsIgnoreCase(item.getPos());

                String pattern = isCollocation ? "" : item.getPattern();
                String collocation = (item.getCollocation() != null && !item.getCollocation().trim().isEmpty())
                        ? item.getCollocation()
                        : item.getPhrase();
                String synonyms = item.getSynonym() != null ? item.getSynonym() : item.getSynonyms();
                String closeMeanings = item.getCloseMeanings();
                String meaning = item.getMeaning() != null ? item.getMeaning() : "Chưa cập nhật nghĩa";
                String note = item.getNote() != null ? item.getNote() : item.getUsageNote();

                VocabSense sense = VocabSense.builder()
                        .pattern(pattern)
                        .collocation(collocation)
                        .synonyms(synonyms)
                        .closeMeanings(closeMeanings)
                        .vietnameseMeaning(meaning)
                        .usageNote(note)
                        .displayOrder(senseOrder++)
                        .build();

                if (item.getExample() != null && !item.getExample().trim().isEmpty()) {
                    sense.addExample(VocabExample.builder().exampleSentence(item.getExample().trim()).build());
                }

                currentForm.addSense(sense);
            }
        }
    }

    private VocabDetailResponse mapToDetailResponse(Vocabulary vocab, String userId) {
        String primaryPos = vocab.getPos();
        if (primaryPos == null || primaryPos.trim().isEmpty()) {
            if (vocab.getForms() != null && !vocab.getForms().isEmpty()) {
                VocabForm firstForm = vocab.getForms().get(0);
                primaryPos = formatPosBadge(firstForm.getPartOfSpeech());
            } else {
                primaryPos = "v";
            }
        }
        PartOfSpeech mappedPosEnum = parsePos(primaryPos);
        String primaryPosLabel = formatPosLabel(mappedPosEnum);
        String primaryCountability = null;

        if (vocab.getForms() != null && !vocab.getForms().isEmpty()) {
            VocabForm firstForm = vocab.getForms().get(0);
            primaryCountability = formatCountability(firstForm.getCountability());
        }

        // Categories
        List<String> categoryNames = new ArrayList<>();
        List<CategoryResponse> catResponses = new ArrayList<>();
        if (vocab.getCategoryIds() != null && !vocab.getCategoryIds().isEmpty()) {
            Iterable<Category> cats = categoryRepository.findAllById(vocab.getCategoryIds());
            for (Category c : cats) {
                categoryNames.add(c.getName());
                catResponses.add(CategoryResponse.builder()
                        .id(c.getId())
                        .name(c.getName())
                        .colorCode(c.getColorCode())
                        .description(c.getDescription())
                        .build());
            }
        }

        // Reading Note Lists
        String readingListId = null;
        String readingListName = null;
        List<NoteListResponse> noteListResponses = new ArrayList<>();
        if (vocab.getNoteListIds() != null && !vocab.getNoteListIds().isEmpty()) {
            Iterable<NoteList> lists = noteListRepository.findAllById(vocab.getNoteListIds());
            Iterator<NoteList> it = lists.iterator();
            if (it.hasNext()) {
                NoteList first = it.next();
                readingListId = first.getId();
                readingListName = first.getTitle();
                noteListResponses.add(NoteListResponse.builder()
                        .id(first.getId())
                        .title(first.getTitle())
                        .code(first.getCode())
                        .shortTitle(first.getCode() != null ? first.getCode() : first.getTitle())
                        .fullTitle(first.getTitle())
                        .sourceReference(first.getSourceReference())
                        .build());
            }
            while (it.hasNext()) {
                NoteList nl = it.next();
                noteListResponses.add(NoteListResponse.builder()
                        .id(nl.getId())
                        .title(nl.getTitle())
                        .code(nl.getCode())
                        .shortTitle(nl.getCode() != null ? nl.getCode() : nl.getTitle())
                        .fullTitle(nl.getTitle())
                        .sourceReference(nl.getSourceReference())
                        .build());
            }
        }

        // Word Family
        String wfId = null;
        String rootWord = null;
        List<String> wfList = new ArrayList<>();
        if (vocab.getWordFamilyId() != null && ObjectId.isValid(vocab.getWordFamilyId())) {
            Optional<WordFamily> wfOpt = wordFamilyRepository.findByIdAndUserId(vocab.getWordFamilyId(), userId);
            if (wfOpt.isPresent()) {
                WordFamily wf = wfOpt.get();
                wfId = wf.getId();
                rootWord = wf.getRootWord();

                // Find words in same word family
                Query wfQuery = Query.query(Criteria.where("userId").is(new ObjectId(userId))
                        .and("wordFamilyId").is(new ObjectId(wf.getId())));
                List<Vocabulary> familyVocabs = mongoTemplate.find(wfQuery, Vocabulary.class);
                for (Vocabulary fv : familyVocabs) {
                    wfList.add(fv.getWord());
                }
            }
        }

        List<VocabDetailResponse.VocabFormResponse> domainForms = new ArrayList<>();
        List<VocabDetailResponse.FlatFormResponse> flatForms = new ArrayList<>();

        if (vocab.getForms() != null) {
            for (VocabForm form : vocab.getForms()) {
                String formPos = formatPosBadge(form.getPartOfSpeech());
                String formPosLabel = formatPosLabel(form.getPartOfSpeech());
                String formCountability = formatCountability(form.getCountability());

                List<VocabDetailResponse.VocabSenseResponse> domainSenses = new ArrayList<>();

                if (form.getSenses() != null) {
                    for (VocabSense sense : form.getSenses()) {
                        boolean isFormPhrasal = form.getPartOfSpeech() == PartOfSpeech.PHRASAL_VERB;
                        boolean isFormCollocation = form.getPartOfSpeech() == PartOfSpeech.COLLOCATION;
                        String type;
                        if (isFormPhrasal) {
                            type = "phrasal_verb";
                        } else if (isFormCollocation) {
                            type = "collocation";
                        } else {
                            type = (sense.getCollocation() != null && !sense.getCollocation().trim().isEmpty())
                                    ? "collocation" : "pattern";
                        }

                        String phrase = isFormPhrasal
                                ? (sense.getCollocation() != null && !sense.getCollocation().trim().isEmpty()
                                        ? sense.getCollocation()
                                        : sense.getPattern())
                                : null;

                        List<String> examples = new ArrayList<>();
                        if (sense.getExamples() != null) {
                            for (VocabExample ve : sense.getExamples()) {
                                if (ve.getExampleSentence() != null) {
                                    examples.add(ve.getExampleSentence());
                                }
                            }
                        }

                        String exampleStr = !examples.isEmpty() ? examples.get(0) : "";

                        flatForms.add(VocabDetailResponse.FlatFormResponse.builder()
                                .type(type)
                                .pos(formPos)
                                .posLabel(formPosLabel)
                                .countability(formCountability)
                                .pattern((isFormPhrasal || isFormCollocation) ? "" : (sense.getPattern() != null ? sense.getPattern() : ""))
                                .collocation(isFormPhrasal ? "" : (sense.getCollocation() != null ? sense.getCollocation() : ""))
                                .phrase(phrase)
                                .synonym(sense.getSynonyms() != null ? sense.getSynonyms() : "")
                                .closeMeanings(sense.getCloseMeanings() != null ? sense.getCloseMeanings() : "")
                                .meaning(sense.getVietnameseMeaning())
                                .example(exampleStr)
                                .note(sense.getUsageNote() != null ? sense.getUsageNote() : "")
                                .build());

                        domainSenses.add(VocabDetailResponse.VocabSenseResponse.builder()
                                .id(sense.getId())
                                .pattern(isFormCollocation ? "" : sense.getPattern())
                                .collocation(sense.getCollocation())
                                .synonyms(sense.getSynonyms())
                                .closeMeanings(sense.getCloseMeanings())
                                .vietnameseMeaning(sense.getVietnameseMeaning())
                                .usageNote(sense.getUsageNote())
                                .displayOrder(sense.getDisplayOrder())
                                .examples(examples)
                                .build());
                    }
                }

                domainForms.add(VocabDetailResponse.VocabFormResponse.builder()
                        .id(form.getId())
                        .partOfSpeech(form.getPartOfSpeech() != null ? form.getPartOfSpeech().name() : null)
                        .countability(form.getCountability() != null ? form.getCountability().name() : null)
                        .displayOrder(form.getDisplayOrder())
                        .senses(domainSenses)
                        .build());
            }
        }

        List<String> meaningList = new ArrayList<>();
        if (vocab.getMeaning() != null && !vocab.getMeaning().trim().isEmpty()) {
            String[] parts = vocab.getMeaning().split(";");
            for (String p : parts) {
                if (!p.trim().isEmpty()) meaningList.add(p.trim());
            }
        }

        List<VocabDetailResponse.MeaningDetailResponse> meaningDetailResponses = new ArrayList<>();
        if (vocab.getMeaningDetailsJson() != null && !vocab.getMeaningDetailsJson().trim().isEmpty()) {
            try {
                List<VocabDetailResponse.MeaningDetailResponse> parsed = objectMapper.readValue(
                        vocab.getMeaningDetailsJson(),
                        new com.fasterxml.jackson.core.type.TypeReference<List<VocabDetailResponse.MeaningDetailResponse>>() {}
                );
                if (parsed != null) {
                    meaningDetailResponses.addAll(parsed);
                }
            } catch (Exception ignored) {}
        }

        return VocabDetailResponse.builder()
                .id(vocab.getId())
                .word(vocab.getWord())
                .phonetic(vocab.getPhonetic())
                .audioUrl(vocab.getAudioUrl())
                .generalNote(vocab.getGeneralNote())
                .meaning(vocab.getMeaning())
                .closeMeanings(vocab.getCloseMeanings())
                .synonyms(vocab.getSynonyms())
                .meanings(meaningList)
                .meaningDetails(meaningDetailResponses)
                .meaningDetailsJson(vocab.getMeaningDetailsJson())
                .wordFamilyId(wfId)
                .rootWord(rootWord)
                .wordFamily(wfList)
                .pos(primaryPos)
                .posLabel(primaryPosLabel)
                .countability(primaryCountability)
                .categories(categoryNames)
                .categoryObjects(catResponses)
                .readingListId(readingListId)
                .readingListName(readingListName)
                .noteLists(noteListResponses)
                .domainForms(domainForms)
                .forms(flatForms)
                .createdAt(vocab.getCreatedAt())
                .updatedAt(vocab.getUpdatedAt())
                .build();
    }

    private PartOfSpeech parsePos(String pos) {
        if (pos == null || pos.trim().isEmpty() || pos.equalsIgnoreCase("all")) return null;
        String p = pos.trim().toLowerCase();
        return switch (p) {
            case "n", "noun" -> PartOfSpeech.N;
            case "v", "verb" -> PartOfSpeech.V;
            case "adj", "adjective" -> PartOfSpeech.ADJ;
            case "adv", "adverb" -> PartOfSpeech.ADV;
            case "phrasal_verb", "phrasal-verb", "phrasal verb", "phrv", "phv" -> PartOfSpeech.PHRASAL_VERB;
            case "idiom", "idioms" -> PartOfSpeech.IDIOM;
            case "collocation", "collocations", "coll" -> PartOfSpeech.COLLOCATION;
            case "prep" -> PartOfSpeech.PREP;
            default -> {
                try {
                    yield PartOfSpeech.valueOf(pos.toUpperCase());
                } catch (IllegalArgumentException e) {
                    yield null;
                }
            }
        };
    }

    private Countability parseCountability(String c) {
        if (c == null || c.trim().isEmpty()) return Countability.NOT_APPLICABLE;
        String s = c.trim().toLowerCase();
        return switch (s) {
            case "[c]", "c", "countable" -> Countability.COUNTABLE;
            case "[u]", "u", "uncountable" -> Countability.UNCOUNTABLE;
            case "[c/u]", "both" -> Countability.BOTH;
            default -> Countability.NOT_APPLICABLE;
        };
    }

    private String formatPosBadge(PartOfSpeech pos) {
        if (pos == null) return "v";
        return switch (pos) {
            case N -> "n";
            case V -> "v";
            case ADJ -> "adj";
            case ADV -> "adv";
            case PHRASAL_VERB -> "phrasal_verb";
            case IDIOM -> "idiom";
            case COLLOCATION -> "collocation";
            default -> pos.name().toLowerCase();
        };
    }

    private String formatPosLabel(PartOfSpeech pos) {
        if (pos == null) return "Verb";
        return switch (pos) {
            case N -> "Noun";
            case V -> "Verb";
            case ADJ -> "Adjective";
            case ADV -> "Adverb";
            case PHRASAL_VERB -> "Phrasal Verb";
            case IDIOM -> "Idioms";
            case COLLOCATION -> "Collocation";
            default -> pos.getDescription();
        };
    }

    private String formatCountability(Countability c) {
        if (c == null) return null;
        return switch (c) {
            case COUNTABLE -> "[C]";
            case UNCOUNTABLE -> "[U]";
            case BOTH -> "[C/U]";
            default -> null;
        };
    }
}
