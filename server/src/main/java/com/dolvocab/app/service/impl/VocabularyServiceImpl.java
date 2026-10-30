package com.dolvocab.app.service.impl;

import com.dolvocab.app.dto.request.VocabCreateRequest;
import com.dolvocab.app.dto.response.CategoryResponse;
import com.dolvocab.app.dto.response.CursorResponse;
import com.dolvocab.app.dto.response.NoteListResponse;
import com.dolvocab.app.dto.response.VocabDetailResponse;
import com.dolvocab.app.entity.*;
import com.dolvocab.app.entity.enums.Countability;
import com.dolvocab.app.entity.enums.PartOfSpeech;
import com.dolvocab.app.repository.CategoryRepository;
import com.dolvocab.app.repository.NoteListRepository;
import com.dolvocab.app.repository.VocabularyRepository;
import com.dolvocab.app.repository.WordFamilyRepository;
import com.dolvocab.app.repository.specification.VocabularySpecification;
import com.dolvocab.app.security.SecurityUtils;
import com.dolvocab.app.service.CategoryService;
import com.dolvocab.app.service.NoteListService;
import com.dolvocab.app.service.VocabularyService;
import com.dolvocab.app.service.WordFamilyService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

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

    @Override
    @Transactional(readOnly = true)
    public List<VocabDetailResponse> getVocabularies(
            String keyword,
            List<Long> categoryIds,
            String categoryName,
            Long noteListId,
            String posStr,
            Long wordFamilyId) {

        User currentUser = securityUtils.getCurrentUser();
        PartOfSpeech pos = parsePos(posStr);
        Specification<Vocabulary> spec = VocabularySpecification.filterVocabularies(
                currentUser.getId(), keyword, categoryIds, categoryName, noteListId, pos, wordFamilyId
        );

        List<Vocabulary> list = vocabularyRepository.findAll(spec, Sort.by(Sort.Direction.DESC, "createdAt"));
        return list.stream().map(this::mapToDetailResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public CursorResponse<VocabDetailResponse> getVocabulariesCursor(
            Long cursor,
            Integer limit,
            String keyword,
            List<Long> categoryIds,
            String categoryName,
            Long noteListId,
            String posStr,
            Long wordFamilyId) {

        User currentUser = securityUtils.getCurrentUser();
        int pageSize = (limit != null && limit > 0) ? Math.min(limit, 50) : 10;
        PartOfSpeech pos = parsePos(posStr);

        // 1. Specification with cursor (fetch records with id < cursor for infinite scroll)
        Specification<Vocabulary> spec = VocabularySpecification.filterVocabularies(
                currentUser.getId(), cursor, keyword, categoryIds, categoryName, noteListId, pos, wordFamilyId
        );

        // 2. Fetch pageSize + 1 to determine if there is a next page
        Pageable pageable = PageRequest.of(0, pageSize + 1, Sort.by(Sort.Direction.DESC, "id"));
        Page<Vocabulary> page = vocabularyRepository.findAll(spec, pageable);
        List<Vocabulary> list = page.getContent();

        boolean hasMore = list.size() > pageSize;
        List<Vocabulary> actualItems = hasMore ? list.subList(0, pageSize) : list;
        Long nextCursor = null;
        if (hasMore && !actualItems.isEmpty()) {
            nextCursor = actualItems.get(actualItems.size() - 1).getId();
        }

        // 3. Count total items matching filters (without cursor)
        Specification<Vocabulary> totalSpec = VocabularySpecification.filterVocabularies(
                currentUser.getId(), null, keyword, categoryIds, categoryName, noteListId, pos, wordFamilyId
        );
        long totalCount = vocabularyRepository.count(totalSpec);

        List<VocabDetailResponse> itemResponses = actualItems.stream()
                .map(this::mapToDetailResponse)
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
    public VocabDetailResponse getVocabById(Long id) {
        User currentUser = securityUtils.getCurrentUser();
        Vocabulary vocab = vocabularyRepository.findByIdAndUserId(id, currentUser.getId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy từ vựng với ID: " + id));
        return mapToDetailResponse(vocab);
    }

    @Override
    @Transactional
    public VocabDetailResponse createVocabulary(VocabCreateRequest request) {
        User currentUser = securityUtils.getCurrentUser();
        String cleanWord = request.getWord().trim();

        Vocabulary vocab;
        Optional<Vocabulary> existing = vocabularyRepository.findByWordIgnoreCaseAndUserId(cleanWord, currentUser.getId());
        if (existing.isPresent()) {
            vocab = existing.get();
            vocab.getForms().clear();
        } else {
            vocab = Vocabulary.builder()
                    .user(currentUser)
                    .word(cleanWord)
                    .build();
        }

        vocab.setPhonetic(request.getPhonetic());
        vocab.setAudioUrl(request.getAudioUrl());
        vocab.setGeneralNote(request.getGeneralNote());
        vocab.setMeaning(request.getMeaning());

        // 1. Word Family
        handleWordFamily(vocab, request, currentUser);

        // 2. Categories
        handleCategories(vocab, request, currentUser);

        // 3. Reading Note Lists
        handleNoteLists(vocab, request, currentUser);

        // 4. Forms & Senses
        handleFormsAndSenses(vocab, request);

        Vocabulary saved = vocabularyRepository.save(vocab);
        return mapToDetailResponse(saved);
    }

    @Override
    @Transactional
    public VocabDetailResponse updateVocabulary(Long id, VocabCreateRequest request) {
        User currentUser = securityUtils.getCurrentUser();
        Vocabulary vocab = vocabularyRepository.findByIdAndUserId(id, currentUser.getId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy từ vựng với ID: " + id));

        String newWord = request.getWord().trim();
        Optional<Vocabulary> existing = vocabularyRepository.findByWordIgnoreCaseAndUserId(newWord, currentUser.getId());
        if (existing.isPresent() && !existing.get().getId().equals(id)) {
            throw new RuntimeException("Từ vựng '" + newWord + "' đã tồn tại trong danh sách của bạn!");
        }

        vocab.setWord(newWord);
        vocab.setPhonetic(request.getPhonetic());
        vocab.setAudioUrl(request.getAudioUrl());
        vocab.setGeneralNote(request.getGeneralNote());
        vocab.setMeaning(request.getMeaning());

        handleWordFamily(vocab, request, currentUser);
        handleCategories(vocab, request, currentUser);
        handleNoteLists(vocab, request, currentUser);

        vocab.getForms().clear();
        handleFormsAndSenses(vocab, request);

        Vocabulary saved = vocabularyRepository.save(vocab);
        return mapToDetailResponse(saved);
    }

    @Override
    @Transactional
    public void deleteVocabulary(Long id) {
        User currentUser = securityUtils.getCurrentUser();
        Vocabulary vocab = vocabularyRepository.findByIdAndUserId(id, currentUser.getId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy từ vựng với ID: " + id));
        vocabularyRepository.delete(vocab);
    }

    // --- Private Helper Handlers ---

    private void handleWordFamily(Vocabulary vocab, VocabCreateRequest request, User user) {
        if (request.getWordFamilyId() != null) {
            wordFamilyRepository.findByIdAndUserId(request.getWordFamilyId(), user.getId())
                    .ifPresentOrElse(vocab::setWordFamily, () -> vocab.setWordFamily(null));
        } else if (request.getRootWord() != null && !request.getRootWord().trim().isEmpty()) {
            WordFamily wf = wordFamilyService.getOrCreateWordFamily(request.getRootWord().trim(), null, user);
            vocab.setWordFamily(wf);
        } else if (request.getWordFamily() != null && !request.getWordFamily().isEmpty()) {
            String first = request.getWordFamily().get(0).trim();
            if (!first.isEmpty()) {
                WordFamily wf = wordFamilyService.getOrCreateWordFamily(first, null, user);
                vocab.setWordFamily(wf);
            } else {
                vocab.setWordFamily(null);
            }
        } else {
            vocab.setWordFamily(null);
        }
    }

    private void handleCategories(Vocabulary vocab, VocabCreateRequest request, User user) {
        vocab.getCategories().clear();

        if (request.getCategoryIds() != null && !request.getCategoryIds().isEmpty()) {
            for (Long catId : request.getCategoryIds()) {
                categoryRepository.findByIdAndUserId(catId, user.getId())
                        .ifPresent(vocab.getCategories()::add);
            }
        }

        if (request.getCategories() != null && !request.getCategories().isEmpty()) {
            for (String catName : request.getCategories()) {
                if (catName != null && !catName.trim().isEmpty()) {
                    Category cat = categoryService.getOrCreateCategory(catName.trim(), user);
                    vocab.getCategories().add(cat);
                }
            }
        }
    }

    private void handleNoteLists(Vocabulary vocab, VocabCreateRequest request, User user) {
        if (request.getNoteListId() != null) {
            String identifier = request.getNoteListId().toString();
            NoteList list = noteListService.getOrCreateNoteList(identifier, request.getReadingListName(), user);
            if (list != null) {
                vocab.getNoteLists().add(list);
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
                String pattern = item.getPattern();
                String collocation = (item.getCollocation() != null && !item.getCollocation().trim().isEmpty())
                        ? item.getCollocation()
                        : item.getPhrase();
                String synonyms = item.getSynonym() != null ? item.getSynonym() : item.getSynonyms();
                String meaning = item.getMeaning() != null ? item.getMeaning() : "Chưa cập nhật nghĩa";
                String note = item.getNote() != null ? item.getNote() : item.getUsageNote();

                VocabSense sense = VocabSense.builder()
                        .pattern(pattern)
                        .collocation(collocation)
                        .synonyms(synonyms)
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

    private VocabDetailResponse mapToDetailResponse(Vocabulary vocab) {
        String primaryPos = "v";
        String primaryPosLabel = "Verb";
        String primaryCountability = null;

        if (!vocab.getForms().isEmpty()) {
            VocabForm firstForm = vocab.getForms().get(0);
            primaryPos = formatPosBadge(firstForm.getPartOfSpeech());
            primaryPosLabel = formatPosLabel(firstForm.getPartOfSpeech());
            primaryCountability = formatCountability(firstForm.getCountability());
        }

        List<String> categoryNames = new ArrayList<>();
        List<CategoryResponse> catResponses = new ArrayList<>();
        if (vocab.getCategories() != null) {
            for (Category c : vocab.getCategories()) {
                categoryNames.add(c.getName());
                catResponses.add(CategoryResponse.builder()
                        .id(c.getId())
                        .name(c.getName())
                        .colorCode(c.getColorCode())
                        .description(c.getDescription())
                        .build());
            }
        }

        Long readingListId = null;
        String readingListName = null;
        List<NoteListResponse> noteListResponses = new ArrayList<>();
        if (vocab.getNoteLists() != null && !vocab.getNoteLists().isEmpty()) {
            NoteList first = vocab.getNoteLists().iterator().next();
            readingListId = first.getId();
            readingListName = first.getTitle();

            for (NoteList nl : vocab.getNoteLists()) {
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

        Long wfId = null;
        String rootWord = null;
        List<String> wfList = new ArrayList<>();
        if (vocab.getWordFamily() != null) {
            WordFamily wf = vocab.getWordFamily();
            wfId = wf.getId();
            rootWord = wf.getRootWord();
            if (wf.getVocabularies() != null) {
                for (Vocabulary v : wf.getVocabularies()) {
                    wfList.add(v.getWord());
                }
            }
        }

        List<VocabDetailResponse.VocabFormResponse> domainForms = new ArrayList<>();
        List<VocabDetailResponse.FlatFormResponse> flatForms = new ArrayList<>();

        for (VocabForm form : vocab.getForms()) {
            String formPos = formatPosBadge(form.getPartOfSpeech());
            String formPosLabel = formatPosLabel(form.getPartOfSpeech());
            String formCountability = formatCountability(form.getCountability());

            List<VocabDetailResponse.VocabSenseResponse> domainSenses = new ArrayList<>();

            for (VocabSense sense : form.getSenses()) {
                boolean isFormPhrasal = form.getPartOfSpeech() == PartOfSpeech.PHRASAL_VERB;
                String type;
                if (isFormPhrasal) {
                    type = "phrasal_verb";
                } else {
                    type = (sense.getCollocation() != null && !sense.getCollocation().trim().isEmpty())
                            ? "collocation" : "pattern";
                }

                String phrase = isFormPhrasal
                        ? (sense.getCollocation() != null && !sense.getCollocation().trim().isEmpty()
                                ? sense.getCollocation()
                                : sense.getPattern())
                        : null;

                List<String> examples = sense.getExamples().stream()
                        .map(VocabExample::getExampleSentence)
                        .toList();

                String exampleStr = !examples.isEmpty() ? examples.get(0) : "";

                flatForms.add(VocabDetailResponse.FlatFormResponse.builder()
                        .type(type)
                        .pos(formPos)
                        .posLabel(formPosLabel)
                        .countability(formCountability)
                        .pattern(isFormPhrasal ? "" : (sense.getPattern() != null ? sense.getPattern() : ""))
                        .collocation(isFormPhrasal ? "" : (sense.getCollocation() != null ? sense.getCollocation() : ""))
                        .phrase(phrase)
                        .synonym(sense.getSynonyms() != null ? sense.getSynonyms() : "")
                        .meaning(sense.getVietnameseMeaning())
                        .example(exampleStr)
                        .note(sense.getUsageNote() != null ? sense.getUsageNote() : "")
                        .build());

                domainSenses.add(VocabDetailResponse.VocabSenseResponse.builder()
                        .id(sense.getId())
                        .pattern(sense.getPattern())
                        .collocation(sense.getCollocation())
                        .synonyms(sense.getSynonyms())
                        .vietnameseMeaning(sense.getVietnameseMeaning())
                        .usageNote(sense.getUsageNote())
                        .displayOrder(sense.getDisplayOrder())
                        .examples(examples)
                        .build());
            }

            domainForms.add(VocabDetailResponse.VocabFormResponse.builder()
                    .id(form.getId())
                    .partOfSpeech(form.getPartOfSpeech().name())
                    .countability(form.getCountability().name())
                    .displayOrder(form.getDisplayOrder())
                    .senses(domainSenses)
                    .build());
        }

        return VocabDetailResponse.builder()
                .id(vocab.getId())
                .word(vocab.getWord())
                .phonetic(vocab.getPhonetic())
                .audioUrl(vocab.getAudioUrl())
                .generalNote(vocab.getGeneralNote())
                .meaning(vocab.getMeaning())
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
