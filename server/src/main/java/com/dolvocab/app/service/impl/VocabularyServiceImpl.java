package com.dolvocab.app.service.impl;

import com.dolvocab.app.dto.request.VocabCreateRequest;
import com.dolvocab.app.dto.response.CategoryResponse;
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
import com.dolvocab.app.service.CategoryService;
import com.dolvocab.app.service.NoteListService;
import com.dolvocab.app.service.VocabularyService;
import com.dolvocab.app.service.WordFamilyService;
import lombok.RequiredArgsConstructor;
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

    @Override
    @Transactional(readOnly = true)
    public List<VocabDetailResponse> getVocabularies(
            String keyword,
            List<Long> categoryIds,
            String categoryName,
            Long noteListId,
            String posStr,
            Long wordFamilyId) {

        PartOfSpeech pos = parsePos(posStr);
        Specification<Vocabulary> spec = VocabularySpecification.filterVocabularies(
                keyword, categoryIds, categoryName, noteListId, pos, wordFamilyId
        );

        List<Vocabulary> list = vocabularyRepository.findAll(spec, Sort.by(Sort.Direction.DESC, "createdAt"));
        return list.stream().map(this::mapToDetailResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public VocabDetailResponse getVocabById(Long id) {
        Vocabulary vocab = vocabularyRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy từ vựng với ID: " + id));
        return mapToDetailResponse(vocab);
    }

    @Override
    @Transactional
    public VocabDetailResponse createVocabulary(VocabCreateRequest request) {
        String cleanWord = request.getWord().trim();

        Vocabulary vocab;
        Optional<Vocabulary> existing = vocabularyRepository.findByWordIgnoreCase(cleanWord);
        if (existing.isPresent()) {
            vocab = existing.get();
            // Clear old forms to replace with updated structure
            vocab.getForms().clear();
        } else {
            vocab = Vocabulary.builder()
                    .word(cleanWord)
                    .build();
        }

        vocab.setPhonetic(request.getPhonetic());
        vocab.setAudioUrl(request.getAudioUrl());
        vocab.setGeneralNote(request.getGeneralNote());

        // 1. Word Family
        handleWordFamily(vocab, request);

        // 2. Categories
        handleCategories(vocab, request);

        // 3. Reading Note Lists
        handleNoteLists(vocab, request);

        // 4. Forms & Senses
        handleFormsAndSenses(vocab, request);

        Vocabulary saved = vocabularyRepository.save(vocab);
        return mapToDetailResponse(saved);
    }

    @Override
    @Transactional
    public VocabDetailResponse updateVocabulary(Long id, VocabCreateRequest request) {
        Vocabulary vocab = vocabularyRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy từ vựng với ID: " + id));

        vocab.setWord(request.getWord().trim());
        vocab.setPhonetic(request.getPhonetic());
        vocab.setAudioUrl(request.getAudioUrl());
        vocab.setGeneralNote(request.getGeneralNote());

        handleWordFamily(vocab, request);
        handleCategories(vocab, request);
        handleNoteLists(vocab, request);

        vocab.getForms().clear();
        handleFormsAndSenses(vocab, request);

        Vocabulary saved = vocabularyRepository.save(vocab);
        return mapToDetailResponse(saved);
    }

    @Override
    @Transactional
    public void deleteVocabulary(Long id) {
        if (!vocabularyRepository.existsById(id)) {
            throw new RuntimeException("Không tìm thấy từ vựng với ID: " + id);
        }
        vocabularyRepository.deleteById(id);
    }

    // --- Private Helper Handlers ---

    private void handleWordFamily(Vocabulary vocab, VocabCreateRequest request) {
        if (request.getWordFamilyId() != null) {
            wordFamilyRepository.findById(request.getWordFamilyId()).ifPresent(vocab::setWordFamily);
        } else if (request.getRootWord() != null && !request.getRootWord().trim().isEmpty()) {
            WordFamily wf = wordFamilyService.getOrCreateWordFamily(request.getRootWord().trim(), null);
            vocab.setWordFamily(wf);
        } else if (request.getWordFamily() != null && !request.getWordFamily().isEmpty()) {
            // First item as representative root word
            String first = request.getWordFamily().get(0).split(" ")[0].trim();
            WordFamily wf = wordFamilyService.getOrCreateWordFamily(first, null);
            vocab.setWordFamily(wf);
        }
    }

    private void handleCategories(Vocabulary vocab, VocabCreateRequest request) {
        vocab.getCategories().clear();

        if (request.getCategoryIds() != null && !request.getCategoryIds().isEmpty()) {
            List<Category> found = categoryRepository.findAllById(request.getCategoryIds());
            vocab.getCategories().addAll(found);
        }

        if (request.getCategories() != null && !request.getCategories().isEmpty()) {
            for (String catName : request.getCategories()) {
                if (catName != null && !catName.trim().isEmpty()) {
                    Category cat = categoryService.getOrCreateCategory(catName.trim());
                    vocab.getCategories().add(cat);
                }
            }
        }
    }

    private void handleNoteLists(Vocabulary vocab, VocabCreateRequest request) {
        if (request.getNoteListId() != null) {
            String identifier = request.getNoteListId().toString();
            NoteList list = noteListService.getOrCreateNoteList(identifier, request.getReadingListName());
            if (list != null) {
                vocab.getNoteLists().add(list);
            }
        }
    }

    private void handleFormsAndSenses(Vocabulary vocab, VocabCreateRequest request) {
        if (request.getForms() == null || request.getForms().isEmpty()) {
            return;
        }

        // Group by partOfSpeech so that multiple patterns/collocations under the same POS attach to the same VocabForm
        Map<PartOfSpeech, VocabForm> formMap = new LinkedHashMap<>();

        int formOrder = 1;
        int senseOrder = 1;

        for (VocabCreateRequest.VocabFormItemRequest item : request.getForms()) {
            String posString = item.getPos() != null ? item.getPos() : request.getPos();
            PartOfSpeech pos = parsePos(posString);
            if (pos == null) pos = PartOfSpeech.V;

            String countabilityString = item.getCountability() != null ? item.getCountability() : request.getCountability();
            Countability countability = parseCountability(countabilityString);

            VocabForm vocabForm = formMap.get(pos);
            if (vocabForm == null) {
                vocabForm = VocabForm.builder()
                        .partOfSpeech(pos)
                        .countability(countability)
                        .displayOrder(formOrder++)
                        .build();
                vocab.addForm(vocabForm);
                formMap.put(pos, vocabForm);
            } else if (countability != Countability.NOT_APPLICABLE && vocabForm.getCountability() == Countability.NOT_APPLICABLE) {
                vocabForm.setCountability(countability);
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
                    vocabForm.addSense(sense);
                }
            } else {
                // Flat form item (pattern or collocation)
                String pattern = item.getPattern();
                String collocation = item.getCollocation();
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
                vocabForm.addSense(sense);
            }
        }
    }

    private VocabDetailResponse mapToDetailResponse(Vocabulary vocab) {
        List<String> categoryNames = vocab.getCategories().stream().map(Category::getName).toList();
        List<CategoryResponse> catResponses = vocab.getCategories().stream().map(c ->
                CategoryResponse.builder().id(c.getId()).name(c.getName()).colorCode(c.getColorCode()).build()
        ).toList();

        List<NoteListResponse> noteListResponses = vocab.getNoteLists().stream().map(n ->
                NoteListResponse.builder().id(n.getId()).title(n.getTitle()).code(n.getCode()).build()
        ).toList();

        Long readingListId = !noteListResponses.isEmpty() ? noteListResponses.get(0).getId() : null;
        String readingListName = !noteListResponses.isEmpty() ? noteListResponses.get(0).getTitle() : null;

        // Word family
        List<String> wfList = new ArrayList<>();
        Long wfId = null;
        String rootWord = null;
        if (vocab.getWordFamily() != null) {
            wfId = vocab.getWordFamily().getId();
            rootWord = vocab.getWordFamily().getRootWord();
            if (vocab.getWordFamily().getVocabularies() != null) {
                wfList = new ArrayList<>(vocab.getWordFamily().getVocabularies().stream().map(Vocabulary::getWord).toList());
            }
        }
        if (wfList.isEmpty() || !wfList.contains(vocab.getWord())) {
            wfList.add(vocab.getWord());
        }

        // Primary POS & countability from first form
        String primaryPos = "v";
        String primaryPosLabel = "Verb";
        String primaryCountability = null;

        if (!vocab.getForms().isEmpty()) {
            VocabForm firstForm = vocab.getForms().get(0);
            primaryPos = formatPosBadge(firstForm.getPartOfSpeech());
            primaryPosLabel = formatPosLabel(firstForm.getPartOfSpeech());
            primaryCountability = formatCountability(firstForm.getCountability());
        }

        // Build flat forms and domain forms
        List<VocabDetailResponse.FlatFormResponse> flatForms = new ArrayList<>();
        List<VocabDetailResponse.VocabFormResponse> domainForms = new ArrayList<>();

        for (VocabForm form : vocab.getForms()) {
            String formPos = formatPosBadge(form.getPartOfSpeech());
            String formPosLabel = formatPosLabel(form.getPartOfSpeech());
            String formCountability = formatCountability(form.getCountability());

            List<VocabDetailResponse.VocabSenseResponse> domainSenses = new ArrayList<>();

            for (VocabSense sense : form.getSenses()) {
                String type = (sense.getCollocation() != null && !sense.getCollocation().trim().isEmpty())
                        ? "collocation" : "pattern";

                List<String> examples = sense.getExamples().stream()
                        .map(VocabExample::getExampleSentence)
                        .toList();

                String exampleStr = !examples.isEmpty() ? examples.get(0) : "";

                flatForms.add(VocabDetailResponse.FlatFormResponse.builder()
                        .type(type)
                        .pos(formPos)
                        .posLabel(formPosLabel)
                        .countability(formCountability)
                        .pattern(sense.getPattern() != null ? sense.getPattern() : "")
                        .collocation(sense.getCollocation() != null ? sense.getCollocation() : "")
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
            case "phrasal_verb" -> PartOfSpeech.PHRASAL_VERB;
            case "idiom" -> PartOfSpeech.IDIOM;
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
