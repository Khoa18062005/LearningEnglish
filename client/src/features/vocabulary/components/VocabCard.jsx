import React, { useState, useEffect, useMemo } from 'react';
import { resolveVocabRelations } from '../../../utils/vocabRelations';
import {
  isVocabStarred,
  isVocabBookmarked,
  toggleVocabStarred,
  toggleVocabBookmarked,
} from '../../../utils/userVocabPreferences';

export default function VocabCard({
  vocab,
  vocabList = [],
  onPronounce,
  onEdit,
  onDelete,
  showReadingList = true,
  onSelectRelatedWord,
  onOpenRelatedGroup,
}) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isFavorite, setIsFavorite] = useState(() => isVocabStarred(vocab));
  const [isBookmarked, setIsBookmarked] = useState(() => isVocabBookmarked(vocab));

  // Sync state when vocab changes
  useEffect(() => {
    setIsFavorite(isVocabStarred(vocab));
    setIsBookmarked(isVocabBookmarked(vocab));
  }, [vocab]);

  // Sync state when star/bookmark preferences are updated elsewhere
  useEffect(() => {
    const handlePrefChange = (e) => {
      const detail = e.detail;
      if (!detail) return;
      const idMatch = vocab?.id && detail?.id && String(vocab.id) === String(detail.id);
      const wordMatch =
        vocab?.word &&
        detail?.word &&
        (vocab.word || '').trim().toLowerCase() === (detail.word || '').trim().toLowerCase();
      if (idMatch || wordMatch) {
        if (detail.type === 'star') {
          setIsFavorite(detail.value);
        } else if (detail.type === 'bookmark') {
          setIsBookmarked(detail.value);
        }
      }
    };
    window.addEventListener('vocab_preference_changed', handlePrefChange);
    return () => window.removeEventListener('vocab_preference_changed', handlePrefChange);
  }, [vocab]);
  const posLower = (vocab?.pos || vocab?.forms?.[0]?.pos || '').toLowerCase();
  const isCollocation = posLower === 'collocation' || posLower === 'collocations';
  const isPhrasePos = posLower === 'idiom' || posLower === 'idioms' || posLower === 'phrasal_verb' || posLower === 'phrasal verb' || isCollocation;

  const collocationForm = isCollocation ? (vocab.forms?.[0] || {}) : null;
  const anchorWord = isCollocation ? (vocab?.anchorWord || collocationForm?.anchorWord || '') : '';
  const collocationKeywords = useMemo(() => {
    if (!isCollocation) return [];
    const raw = collocationForm?.keywords || collocationForm?.collocation || '';
    if (!raw || raw.toLowerCase() === (vocab.word || '').toLowerCase()) return [];
    return raw.split(',').map((s) => s.trim()).filter(Boolean);
  }, [isCollocation, collocationForm, vocab.word]);

  // Toàn bộ từ gốc liên kết của Collocation (anchorWord và các keywords)
  const allCollocationRootWords = useMemo(() => {
    if (!isCollocation) return [];
    const list = [];
    const cleanWord = (vocab.word || '').trim().toLowerCase();
    if (anchorWord && anchorWord.trim().toLowerCase() !== cleanWord) {
      list.push(anchorWord.trim());
    }
    (collocationKeywords || []).forEach((k) => {
      const cleanK = (k || '').trim();
      if (cleanK && cleanK.toLowerCase() !== cleanWord && !list.some((w) => w.toLowerCase() === cleanK.toLowerCase())) {
        list.push(cleanK);
      }
    });
    return list;
  }, [isCollocation, anchorWord, collocationKeywords, vocab.word]);

  // Tìm các Collocation trong kho từ vựng có liên quan đến từ này (dưới dạng anchorWord hoặc nằm trong cụm từ / keywords)
  const relatedCollocationVocabs = useMemo(() => {
    if (isCollocation) return [];
    const cleanWord = (vocab?.word || '').trim().toLowerCase();
    if (!cleanWord) return [];

    return (vocabList || []).filter((v) => {
      const vPos = (v.pos || v.forms?.[0]?.pos || '').toLowerCase();
      if (vPos !== 'collocation' && vPos !== 'collocations') return false;

      const f = v.forms?.[0] || {};
      const fAnchor = (v.anchorWord || f.anchorWord || '').toLowerCase();
      const fKeywords = (f.keywords || f.collocation || '').toLowerCase();
      const tokensInWord = (v.word || '').toLowerCase().replace(/[^a-zA-Z\s'-]/g, ' ').split(/\s+/);

      return fAnchor === cleanWord || fKeywords.includes(cleanWord) || tokensInWord.includes(cleanWord);
    });
  }, [vocab?.word, vocabList, isCollocation]);

  const [phonetic, setPhonetic] = useState(
    isPhrasePos ? '' : (vocab?.phonetic || (vocab?.word ? `/${vocab.word}/` : ''))
  );
  const [audioUrl, setAudioUrl] = useState(isPhrasePos ? '' : (vocab?.audioUrl || ''));

  // Auto-resolve real phonetic IPA and audio if missing or dummy (skip for idioms & phrasal verbs)
  useEffect(() => {
    if (!vocab?.word) return;

    if (isPhrasePos) {
      setPhonetic('');
      setAudioUrl('');
      return;
    }

    const currentPhonetic = vocab.phonetic || '';
    const isDummy = !currentPhonetic || currentPhonetic === `/${vocab.word}/` || currentPhonetic === `/${vocab.word.toLowerCase()}/`;

    if (isDummy) {
      fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(vocab.word.trim())}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (Array.isArray(data) && data.length > 0) {
            const entry = data[0];
            let foundPhonetic = entry.phonetic || '';
            if (!foundPhonetic && entry.phonetics?.length) {
              const withText = entry.phonetics.find((p) => p.text && p.text.trim());
              if (withText) foundPhonetic = withText.text;
            }
            if (foundPhonetic) setPhonetic(foundPhonetic.trim());

            if (!vocab.audioUrl) {
              const preferred = entry.phonetics?.find(
                (p) => p.audio && (p.audio.includes('-us.mp3') || p.audio.includes('-uk.mp3'))
              );
              const anyAudio = preferred?.audio || entry.phonetics?.find((p) => p.audio?.endsWith('.mp3'))?.audio;
              if (anyAudio) setAudioUrl(anyAudio);
            }
          }
        })
        .catch(() => {});
    } else {
      setPhonetic(currentPhonetic);
    }

    if (vocab.audioUrl) {
      setAudioUrl(vocab.audioUrl);
    }
  }, [vocab?.word, vocab?.phonetic, vocab?.audioUrl, isPhrasePos]);

  if (!vocab) return null;

  const isPhrasal = posLower === 'phrasal_verb' || posLower === 'phrasal verb';

  // Extract patterns and collocations (Phrasal verb never has patterns or collocations)
  const patterns = isPhrasePos ? [] : (vocab.forms || []).filter(
    (f) => Boolean(f.pattern && f.pattern.trim() && f.type !== 'phrasal_verb' && f.pos !== 'phrasal_verb')
  );

  const collocations = (isPhrasePos || isPhrasal) ? [] : (vocab.forms || []).filter(
    (f) => Boolean(
      f.collocation &&
      f.collocation.trim() &&
      f.type !== 'phrasal_verb' &&
      f.pos !== 'phrasal_verb' &&
      !f.type?.includes('phrasal')
    )
  );

  const phrasalVerbs = (vocab.forms || []).filter(
    (f) => f.type === 'phrasal_verb' || f.pos === 'phrasal_verb' || Boolean(f.phrase) || (isPhrasal && (f.collocation || f.pattern))
  );

  // Senses without pattern, collocation or phrasal_verb
  const baseSenses = (vocab.forms || []).filter(
    (f) => !f.pattern && !f.collocation && f.type !== 'phrasal_verb' && f.pos !== 'phrasal_verb' && !isPhrasePos
  );

  // General Vietnamese meanings list (supports meaningDetails, meanings array, or semicolon-separated string)
  const parsedMeanings = useMemo(() => {
    let details = vocab?.meaningDetails;
    if (typeof details === 'string') {
      try {
        details = JSON.parse(details);
      } catch {}
    }
    if ((!details || details.length === 0) && vocab?.meaningDetailsJson) {
      try {
        details = JSON.parse(vocab.meaningDetailsJson);
      } catch {}
    }

    if (Array.isArray(details) && details.length > 0) {
      return details.map((md) => ({
        text: (md.text || md.meaning || '').trim(),
        example: (md.example || '').trim(),
        note: (md.note || md.notes || '').trim(),
        closeMeanings: (typeof md.closeMeanings === 'string' ? md.closeMeanings.split(/[,;\n]/).map((s) => s.trim()).filter(Boolean) : Array.isArray(md.closeMeanings) ? md.closeMeanings : []) || [],
        synonyms: (typeof md.synonyms === 'string' ? md.synonyms.split(/[,;\n]/).map((s) => s.trim()).filter(Boolean) : Array.isArray(md.synonyms) ? md.synonyms : []) || [],
      })).filter((m) => m.text);
    }

    if (Array.isArray(vocab?.meanings) && vocab.meanings.length > 0) {
      return vocab.meanings.map((m) => {
        if (typeof m === 'string') {
          return {
            text: m.trim(),
            example: '',
            note: '',
            closeMeanings: [],
            synonyms: [],
          };
        }
        return {
          text: (m.text || m.meaning || '').trim(),
          example: (m.example || '').trim(),
          note: (m.note || m.notes || '').trim(),
          closeMeanings: (typeof m.closeMeanings === 'string' ? m.closeMeanings.split(/[,;\n]/).map((s) => s.trim()).filter(Boolean) : Array.isArray(m.closeMeanings) ? m.closeMeanings : []) || [],
          synonyms: (typeof m.synonyms === 'string' ? m.synonyms.split(/[,;\n]/).map((s) => s.trim()).filter(Boolean) : Array.isArray(m.synonyms) ? m.synonyms : []) || [],
        };
      }).filter((m) => m.text);
    }

    const rawMeaning = vocab?.meaning || vocab?.forms?.[0]?.meaning || '';
    if (rawMeaning && rawMeaning.includes(';')) {
      const parts = rawMeaning.split(';').map((s) => s.trim()).filter(Boolean);
      if (parts.length > 0) {
        return parts.map((p) => ({ text: p, closeMeanings: [], synonyms: [] }));
      }
    }
    return [{ text: rawMeaning || 'Chưa cập nhật nghĩa', closeMeanings: [], synonyms: [] }];
  }, [vocab?.meaningDetails, vocab?.meaningDetailsJson, vocab?.meanings, vocab?.meaning, vocab?.forms]);

  const displayMeanings = useMemo(() => parsedMeanings.map((m) => m.text), [parsedMeanings]);
  const generalMeaning = displayMeanings[0] || 'Chưa cập nhật nghĩa';

  // Giải quyết quan hệ bắc cầu đồ thị (Transitive Closure: lease ⇄ hire, hire ⇄ rent => lease ⇄ hire ⇄ rent)
  const relations = useMemo(() => {
    return resolveVocabRelations(vocab, vocabList);
  }, [vocab, vocabList]);

  // Extract all close meanings (Nét nghĩa tương đương) across all potential paths in vocab
  const rawGlobalCloseMeanings = useMemo(() => {
    const list = [];
    if (vocab?.closeMeanings) list.push(vocab.closeMeanings);
    if (vocab?.nearSynonyms) list.push(vocab.nearSynonyms);
    if (vocab?.closeMeaningWords) list.push(vocab.closeMeaningWords);

    let mdList = vocab?.meaningDetails;
    if (typeof mdList === 'string') {
      try {
        mdList = JSON.parse(mdList);
      } catch {}
    }
    if ((!mdList || mdList.length === 0) && vocab?.meaningDetailsJson) {
      try {
        mdList = JSON.parse(vocab.meaningDetailsJson);
      } catch {}
    }

    if (Array.isArray(mdList)) {
      mdList.forEach((md) => {
        if (md.closeMeanings) list.push(md.closeMeanings);
        if (md.nearSynonyms) list.push(md.nearSynonyms);
      });
    }

    if (Array.isArray(vocab?.meanings)) {
      vocab.meanings.forEach((m) => {
        if (typeof m === 'object' && m) {
          if (m.closeMeanings) list.push(m.closeMeanings);
          if (m.nearSynonyms) list.push(m.nearSynonyms);
        }
      });
    }

    if (Array.isArray(vocab?.forms)) {
      vocab.forms.forEach((f) => {
        if (f.closeMeanings) list.push(f.closeMeanings);
        if (f.nearSynonyms) list.push(f.nearSynonyms);
      });
    }

    if (Array.isArray(vocab?.domainForms)) {
      vocab.domainForms.forEach((df) => {
        if (Array.isArray(df.senses)) {
          df.senses.forEach((s) => {
            if (s.closeMeanings) list.push(s.closeMeanings);
          });
        }
      });
    }

    const allWords = list
      .flatMap((item) => (typeof item === 'string' ? item.split(/[,;\n]/) : Array.isArray(item) ? item : []))
      .map((w) => (typeof w === 'string' ? w.trim() : ''))
      .filter(Boolean);

    return Array.from(new Set(allWords));
  }, [vocab]);

  // Hợp nhất quan hệ bắc cầu cho Nét nghĩa tương đương toàn cục
  const globalCloseMeanings = useMemo(() => {
    const cleanCurrent = (vocab?.word || '').trim().toLowerCase();
    const combined = [...rawGlobalCloseMeanings, ...(relations.closeMeanings || [])];
    const seen = new Set();
    return combined.filter((w) => {
      const c = (w || '').trim().toLowerCase();
      if (!c || c === cleanCurrent || seen.has(c)) return false;
      seen.add(c);
      return true;
    });
  }, [rawGlobalCloseMeanings, relations.closeMeanings, vocab?.word]);

  // Extract all synonyms (Từ đồng nghĩa) across all potential paths in vocab
  const rawGlobalSynonyms = useMemo(() => {
    const list = [];
    if (vocab?.synonyms) list.push(vocab.synonyms);
    if (vocab?.synonym) list.push(vocab.synonym);

    let mdSynList = vocab?.meaningDetails;
    if (typeof mdSynList === 'string') {
      try {
        mdSynList = JSON.parse(mdSynList);
      } catch {}
    }
    if ((!mdSynList || mdSynList.length === 0) && vocab?.meaningDetailsJson) {
      try {
        mdSynList = JSON.parse(vocab.meaningDetailsJson);
      } catch {}
    }

    if (Array.isArray(mdSynList)) {
      mdSynList.forEach((md) => {
        if (md.synonyms) list.push(md.synonyms);
        if (md.synonym) list.push(md.synonym);
      });
    }

    if (Array.isArray(vocab?.meanings)) {
      vocab.meanings.forEach((m) => {
        if (typeof m === 'object' && m) {
          if (m.synonyms) list.push(m.synonyms);
          if (m.synonym) list.push(m.synonym);
        }
      });
    }

    if (Array.isArray(vocab?.forms)) {
      vocab.forms.forEach((f) => {
        if (f.synonym) list.push(f.synonym);
        if (f.synonyms) list.push(f.synonyms);
      });
    }

    if (Array.isArray(vocab?.domainForms)) {
      vocab.domainForms.forEach((df) => {
        if (Array.isArray(df.senses)) {
          df.senses.forEach((s) => {
            if (s.synonyms) list.push(s.synonyms);
            if (s.synonym) list.push(s.synonym);
          });
        }
      });
    }

    const allWords = list
      .flatMap((item) => (typeof item === 'string' ? item.split(/[,;\n]/) : Array.isArray(item) ? item : []))
      .map((w) => (typeof w === 'string' ? w.trim() : ''))
      .filter(Boolean);

    return Array.from(new Set(allWords));
  }, [vocab]);

  // Hợp nhất quan hệ bắc cầu cho Từ đồng nghĩa toàn cục
  const globalSynonyms = useMemo(() => {
    const cleanCurrent = (vocab?.word || '').trim().toLowerCase();
    const combined = [...rawGlobalSynonyms, ...(relations.synonyms || [])];
    const seen = new Set();
    return combined.filter((w) => {
      const c = (w || '').trim().toLowerCase();
      if (!c || c === cleanCurrent || seen.has(c)) return false;
      seen.add(c);
      return true;
    });
  }, [rawGlobalSynonyms, relations.synonyms, vocab?.word]);

  // Nét nghĩa hiển thị đã được mở rộng bắc cầu (tự động phân bổ cho từng nét nghĩa hoặc nét nghĩa duy nhất)
  const displayParsedMeanings = useMemo(() => {
    if (!parsedMeanings || parsedMeanings.length === 0) return [];
    const cleanCurrent = (vocab?.word || '').trim().toLowerCase();

    return parsedMeanings.map((m) => {
      const combinedClose = [
        ...(m.closeMeanings || []),
        ...(parsedMeanings.length === 1 || m.closeMeanings?.length > 0 ? (relations.closeMeanings || []) : []),
      ];
      const seenClose = new Set();
      const uniqueClose = combinedClose.filter((w) => {
        const c = (w || '').trim().toLowerCase();
        if (!c || c === cleanCurrent || seenClose.has(c)) return false;
        seenClose.add(c);
        return true;
      });

      const combinedSyn = [
        ...(m.synonyms || []),
        ...(parsedMeanings.length === 1 || m.synonyms?.length > 0 ? (relations.synonyms || []) : []),
      ];
      const seenSyn = new Set();
      const uniqueSyn = combinedSyn.filter((w) => {
        const c = (w || '').trim().toLowerCase();
        if (!c || c === cleanCurrent || seenSyn.has(c)) return false;
        seenSyn.add(c);
        return true;
      });

      const cleanEx = (m.example || '').trim();
      const cleanNt = (m.note || '').trim();
      const isDupEx = cleanEx && (
        patterns.some((p) => (p.example || '').trim().toLowerCase() === cleanEx.toLowerCase()) ||
        collocations.some((c) => (c.example || '').trim().toLowerCase() === cleanEx.toLowerCase()) ||
        phrasalVerbs.some((pv) => (pv.example || '').trim().toLowerCase() === cleanEx.toLowerCase())
      );
      const isDupNt = cleanNt && (
        patterns.some((p) => (p.note || '').trim().toLowerCase() === cleanNt.toLowerCase()) ||
        collocations.some((c) => (c.note || '').trim().toLowerCase() === cleanNt.toLowerCase()) ||
        phrasalVerbs.some((pv) => (pv.note || '').trim().toLowerCase() === cleanNt.toLowerCase())
      );

      return {
        ...m,
        example: isDupEx ? '' : cleanEx,
        note: isDupNt ? '' : cleanNt,
        closeMeanings: uniqueClose,
        synonyms: uniqueSyn,
      };
    });
  }, [parsedMeanings, relations, vocab?.word, patterns, collocations, phrasalVerbs]);

  const hasItemLevelDetails = displayParsedMeanings.some(
    (m) => m.closeMeanings.length > 0 || m.synonyms.length > 0
  );

  const hasItemLevelExampleOrNote = displayParsedMeanings.some(
    (m) => m.example || m.note
  );

  // POS badge styling
  const getPosBadge = () => {
    const pos = (vocab.pos || vocab.forms?.[0]?.pos || 'v').toLowerCase();
    const countability = vocab.countability || vocab.forms?.[0]?.countability;

    switch (pos) {
      case 'n':
      case 'noun':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-pos-noun-bg text-pos-noun-text font-bold text-xs border border-blue-200">
            <span>Noun (n)</span>
            {countability && <span className="opacity-80 text-[11px] font-semibold">{countability}</span>}
          </span>
        );
      case 'v':
      case 'verb':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full bg-pos-verb-bg text-pos-verb-text font-bold text-xs border border-red-200">
            Verb (v)
          </span>
        );
      case 'adj':
      case 'adjective':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full bg-pos-adj-bg text-pos-adj-text font-bold text-xs border border-emerald-200">
            Adjective
          </span>
        );
      case 'adv':
      case 'adverb':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full bg-pos-adv-bg text-pos-adv-text font-bold text-xs border border-purple-200">
            Adverb
          </span>
        );
      case 'phrasal_verb':
      case 'phrasal verb':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full bg-teal-50 text-teal-800 font-bold text-xs border border-teal-300">
            Phrasal Verb
          </span>
        );
      case 'idiom':
      case 'idioms':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full bg-amber-100 text-amber-800 font-bold text-xs border border-amber-300">
            Idioms / Cụm từ
          </span>
        );
      case 'collocation':
      case 'collocations':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full bg-indigo-50 text-indigo-800 font-bold text-xs border border-indigo-300">
            Collocation
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full bg-slate-100 text-slate-700 font-bold text-xs border border-slate-200">
            {vocab.posLabel || pos}
          </span>
        );
    }
  };

  return (
    <div
      id={vocab?.id ? `vocab-card-${vocab.id}` : undefined}
      data-word={(vocab?.word || '').toLowerCase()}
      className="bg-white rounded-3xl border border-slate-200/90 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.04)] hover:shadow-[0_10px_30px_-4px_rgba(0,0,0,0.08)] transition-all overflow-hidden p-5 sm:p-7 flex flex-col md:flex-row gap-6 group"
    >
      
      {/* ======================================================== */}
      {/* CỘT TRÁI: TỪ VỰNG, PHÁT ÂM, PHIÊN ÂM, TỪ LOẠI, TAGS      */}
      {/* ======================================================== */}
      <div className="w-full md:w-[240px] lg:w-[260px] shrink-0 flex flex-col justify-between md:border-r md:border-slate-100 md:pr-6 gap-4">
        
        {/* Top: Word & Speaker button */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-start justify-between gap-2">
            <div className="flex flex-col gap-1 flex-1 min-w-0">
              <h3 className="font-headline text-2xl lg:text-[26px] font-extrabold text-slate-900 tracking-tight leading-snug break-words">
                {vocab.word}
              </h3>
              {!isPhrasePos && (phonetic || vocab.phonetic) && (
                <div className="text-xs font-mono text-slate-400 font-medium">
                  {phonetic || vocab.phonetic}
                </div>
              )}
            </div>
            
            {onPronounce && (
              <button
                type="button"
                onClick={() => onPronounce(vocab.word, audioUrl || vocab.audioUrl)}
                className="w-9 h-9 rounded-full bg-slate-100 hover:bg-surface-crimson-subtle text-slate-500 hover:text-crimson-primary flex items-center justify-center transition-colors shadow-2xs shrink-0 mt-0.5"
                title="Phát âm từ vựng"
              >
                <span className="material-symbols-outlined text-[19px]">volume_up</span>
              </button>
            )}
          </div>
        </div>

        {/* Bottom: POS Badge & Reading List */}
        <div className="flex flex-col gap-2 pt-2">
          <div className="flex items-center gap-2 flex-wrap">
            {getPosBadge()}
          </div>

          {showReadingList && vocab.readingListName && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-surface-crimson-subtle text-crimson-primary border border-border-crimson-tint text-[10px] font-bold">
                <span className="material-symbols-outlined text-[12px]">folder</span>
                <span>{vocab.readingListName}</span>
              </span>
            </div>
          )}
        </div>

      </div>

      {/* ======================================================== */}
      {/* CỘT PHẢI: NGHĨA [VI], PATTERNS, COLLOCATIONS, VÍ DỤ/NOTE */}
      {/* ======================================================== */}
      <div className="flex-1 flex flex-col gap-4 justify-between">
        
        {/* HÀNG 1: NGHĨA TIẾNG VIỆT CHUNG VỚI ICON [VI] & ACTIONS */}
        <div className="flex items-start justify-between gap-4 pb-3 border-b border-slate-100">
          <div className="flex flex-col gap-3 flex-1">
            {displayParsedMeanings.map((mItem, mIdx) => (
              <div key={mIdx} className="flex flex-col gap-2">
                <div className="flex items-start gap-2.5">
                  <span className="inline-flex items-center justify-center px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-xs font-bold border border-slate-300/80 shrink-0 mt-0.5 font-mono shadow-2xs">
                    VI
                  </span>
                  <span className="font-bold text-base sm:text-lg text-slate-900 leading-snug">
                    {mItem.text}
                  </span>
                </div>

                {/* Ví dụ & Ghi chú riêng của từng nét nghĩa chung */}
                {isExpanded && (mItem.example || mItem.note) && (
                  <div className="flex flex-col gap-1.5 pt-0.5 pb-1 text-xs">
                    {mItem.example && (
                      <div className="flex items-start gap-2 text-slate-700 pl-2.5 border-l-2 border-slate-700">
                        <span className="font-semibold text-slate-700 text-[11px] not-italic shrink-0">Ví dụ:</span>
                        <span className="italic leading-relaxed text-slate-700">&ldquo;{mItem.example}&rdquo;</span>
                      </div>
                    )}
                    {mItem.note && (
                      <div className="flex items-start gap-2 text-slate-700 pl-2.5 border-l-2 border-slate-700">
                        <span className="font-semibold text-slate-700 text-[11px] shrink-0">Ghi chú:</span>
                        <span className="leading-relaxed text-slate-700">{mItem.note.replace(/^Ghi chú:\s*/i, '')}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Nét nghĩa tương đương riêng của từng nét nghĩa */}
                {mItem.closeMeanings.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 text-xs">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onOpenRelatedGroup) {
                          onOpenRelatedGroup(mItem.closeMeanings, vocab.word, 'close');
                        } else if (onSelectRelatedWord) {
                          onSelectRelatedWord(mItem.closeMeanings[0], vocab.word);
                        }
                      }}
                      className="px-2.5 py-0.5 rounded-md font-bold text-[11px] bg-amber-50 text-amber-800 border border-amber-200/80 hover:bg-amber-100 hover:border-amber-300 hover:text-amber-900 flex items-center gap-1 shadow-2xs shrink-0 cursor-pointer transition-all active:scale-95 group/lbl"
                      title={`Bấm để mở hộp thoại xem toàn bộ các từ có nét nghĩa tương đương (${mItem.closeMeanings.join(', ')})`}
                    >
                      <span className="material-symbols-outlined text-[13px] text-amber-600 group-hover/lbl:scale-110 transition-transform">
                        compare_arrows
                      </span>
                      <span>Nét nghĩa tương đương</span>
                      <span className="material-symbols-outlined text-[12px] text-amber-500 opacity-70 group-hover/lbl:opacity-100 transition-opacity">
                        open_in_new
                      </span>
                    </button>
                    {mItem.closeMeanings.map((word, wIdx) => (
                      <button
                        key={wIdx}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onSelectRelatedWord) {
                            onSelectRelatedWord(word, vocab.word);
                          }
                        }}
                        className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-white text-slate-800 border border-amber-300 hover:bg-amber-50/60 hover:border-amber-400 hover:text-amber-900 shadow-2xs active:scale-95 transition-all cursor-pointer group/word"
                        title={`Bấm để mở nhanh thẻ từ vựng: "${word}"`}
                      >
                        <span>{word}</span>
                        <span className="material-symbols-outlined text-[13px] text-amber-500 opacity-70 group-hover/word:opacity-100 group-hover/word:text-amber-700 group-hover/word:translate-x-0.5 transition-all">
                          open_in_new
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Từ đồng nghĩa riêng của từng nét nghĩa */}
                {mItem.synonyms.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 text-xs">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onOpenRelatedGroup) {
                          onOpenRelatedGroup(mItem.synonyms, vocab.word, 'synonym');
                        } else if (onSelectRelatedWord) {
                          onSelectRelatedWord(mItem.synonyms[0], vocab.word);
                        }
                      }}
                      className="px-2.5 py-0.5 rounded-md font-bold text-[11px] bg-teal-50 text-teal-800 border border-teal-200/80 hover:bg-teal-100 hover:border-teal-300 hover:text-teal-900 flex items-center gap-1 shadow-2xs shrink-0 cursor-pointer transition-all active:scale-95 group/lbl"
                      title={`Bấm để mở hộp thoại xem toàn bộ các từ đồng nghĩa (${mItem.synonyms.join(', ')})`}
                    >
                      <span className="material-symbols-outlined text-[13px] text-teal-600 group-hover/lbl:scale-110 transition-transform">
                        sync_alt
                      </span>
                      <span>Đồng nghĩa</span>
                      <span className="material-symbols-outlined text-[12px] text-teal-500 opacity-70 group-hover/lbl:opacity-100 transition-opacity">
                        open_in_new
                      </span>
                    </button>
                    {mItem.synonyms.map((word, wIdx) => (
                      <button
                        key={wIdx}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onSelectRelatedWord) {
                            onSelectRelatedWord(word, vocab.word);
                          }
                        }}
                        className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-white text-slate-800 border border-teal-300 hover:bg-teal-50/60 hover:border-teal-400 hover:text-teal-900 shadow-2xs active:scale-95 transition-all cursor-pointer group/word"
                        title={`Bấm để mở nhanh thẻ từ vựng: "${word}"`}
                      >
                        <span>{word}</span>
                        <span className="material-symbols-outlined text-[13px] text-teal-600 opacity-70 group-hover/word:opacity-100 group-hover/word:text-teal-800 group-hover/word:translate-x-0.5 transition-all">
                          open_in_new
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Hiển thị Nét nghĩa tương đương chung nếu chưa hiển thị ở từng nét nghĩa */}
            {!hasItemLevelDetails && globalCloseMeanings.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onOpenRelatedGroup) {
                      onOpenRelatedGroup(globalCloseMeanings, vocab.word, 'close');
                    } else if (onSelectRelatedWord) {
                      onSelectRelatedWord(globalCloseMeanings[0], vocab.word);
                    }
                  }}
                  className="px-2.5 py-0.5 rounded-md font-bold text-[11px] bg-amber-50 text-amber-800 border border-amber-200/80 hover:bg-amber-100 hover:border-amber-300 hover:text-amber-900 flex items-center gap-1 shadow-2xs shrink-0 cursor-pointer transition-all active:scale-95 group/lbl"
                  title={`Bấm để mở hộp thoại xem toàn bộ các từ có nét nghĩa tương đương (${globalCloseMeanings.join(', ')})`}
                >
                  <span className="material-symbols-outlined text-[13px] text-amber-600 group-hover/lbl:scale-110 transition-transform">
                    compare_arrows
                  </span>
                  <span>Nét nghĩa tương đương</span>
                  <span className="material-symbols-outlined text-[12px] text-amber-500 opacity-70 group-hover/lbl:opacity-100 transition-opacity">
                    open_in_new
                  </span>
                </button>
                {globalCloseMeanings.map((word, wIdx) => (
                  <button
                    key={wIdx}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onSelectRelatedWord) {
                        onSelectRelatedWord(word, vocab.word);
                      }
                    }}
                    className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-white text-slate-800 border border-amber-300 hover:bg-amber-50/60 hover:border-amber-400 hover:text-amber-900 shadow-2xs active:scale-95 transition-all cursor-pointer group/word"
                    title={`Bấm để mở nhanh thẻ từ vựng: "${word}"`}
                  >
                    <span>{word}</span>
                    <span className="material-symbols-outlined text-[13px] text-amber-500 opacity-70 group-hover/word:opacity-100 group-hover/word:text-amber-700 group-hover/word:translate-x-0.5 transition-all">
                      open_in_new
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* Hiển thị Từ đồng nghĩa chung nếu chưa hiển thị ở từng nét nghĩa */}
            {!hasItemLevelDetails && globalSynonyms.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onOpenRelatedGroup) {
                      onOpenRelatedGroup(globalSynonyms, vocab.word, 'synonym');
                    } else if (onSelectRelatedWord) {
                      onSelectRelatedWord(globalSynonyms[0], vocab.word);
                    }
                  }}
                  className="px-2.5 py-0.5 rounded-md font-bold text-[11px] bg-teal-50 text-teal-800 border border-teal-200/80 hover:bg-teal-100 hover:border-teal-300 hover:text-teal-900 flex items-center gap-1 shadow-2xs shrink-0 cursor-pointer transition-all active:scale-95 group/lbl"
                  title={`Bấm để mở hộp thoại xem toàn bộ các từ đồng nghĩa (${globalSynonyms.join(', ')})`}
                >
                  <span className="material-symbols-outlined text-[13px] text-teal-600 group-hover/lbl:scale-110 transition-transform">
                    sync_alt
                  </span>
                  <span>Đồng nghĩa</span>
                  <span className="material-symbols-outlined text-[12px] text-teal-500 opacity-70 group-hover/lbl:opacity-100 transition-opacity">
                    open_in_new
                  </span>
                </button>
                {globalSynonyms.map((word, wIdx) => (
                  <button
                    key={wIdx}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onSelectRelatedWord) {
                        onSelectRelatedWord(word, vocab.word);
                      }
                    }}
                    className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-white text-slate-800 border border-teal-300 hover:bg-teal-50/60 hover:border-teal-400 hover:text-teal-900 shadow-2xs active:scale-95 transition-all cursor-pointer group/word"
                    title={`Bấm để mở nhanh thẻ từ vựng: "${word}"`}
                  >
                    <span>{word}</span>
                    <span className="material-symbols-outlined text-[13px] text-teal-600 opacity-70 group-hover/word:opacity-100 group-hover/word:text-teal-800 group-hover/word:translate-x-0.5 transition-all">
                      open_in_new
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons: Star, Ribbon, Delete */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => {
                const next = toggleVocabStarred(vocab);
                setIsFavorite(next);
              }}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                isFavorite
                  ? 'text-amber-500 hover:text-amber-600 bg-amber-50 shadow-2xs'
                  : 'text-slate-400 hover:text-amber-500 hover:bg-slate-50'
              }`}
              title={isFavorite ? 'Bỏ đánh dấu sao' : 'Đánh dấu sao (quan trọng)'}
            >
              <span className="material-symbols-outlined text-[19px]">
                {isFavorite ? 'star' : 'star_outline'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                const next = toggleVocabBookmarked(vocab);
                setIsBookmarked(next);
              }}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                isBookmarked
                  ? 'text-crimson-primary hover:text-crimson-dark bg-surface-crimson-subtle shadow-2xs'
                  : 'text-slate-400 hover:text-crimson-primary hover:bg-slate-50'
              }`}
              title={isBookmarked ? 'Bỏ lưu danh sách học' : 'Lưu vào danh sách cần ôn'}
            >
              <span className="material-symbols-outlined text-[19px]">
                {isBookmarked ? 'bookmark' : 'bookmark_border'}
              </span>
            </button>

            {onEdit && (
              <button
                type="button"
                onClick={() => onEdit(vocab)}
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 flex items-center justify-center transition-colors cursor-pointer"
                title="Chỉnh sửa từ vựng này"
              >
                <span className="material-symbols-outlined text-[18px]">edit</span>
              </button>
            )}

            {onDelete && (
              <button
                type="button"
                onClick={() => onDelete(vocab.id)}
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-colors"
                title="Xóa từ vựng này"
              >
                <span className="material-symbols-outlined text-[18px]">delete</span>
              </button>
            )}
          </div>
        </div>

        {/* HÀNG 1.5: TỪ GỐC LIÊN KẾT CỦA COLLOCATION (BÊN DƯỚI ĐƯỜNG KẺ BORDER-B) */}
        {isCollocation && allCollocationRootWords.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="px-2.5 py-0.5 rounded-md font-bold text-[11px] bg-indigo-50 text-indigo-800 border border-indigo-200/90 flex items-center gap-1 shadow-2xs shrink-0">
              <span className="material-symbols-outlined text-[13px] text-indigo-600">
                link
              </span>
              <span>Từ gốc liên kết</span>
            </span>
            {allCollocationRootWords.map((word, wIdx) => (
              <button
                key={wIdx}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onSelectRelatedWord) {
                    onSelectRelatedWord(word, vocab.word);
                  }
                }}
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-white text-slate-800 border border-indigo-300 hover:bg-indigo-50/60 hover:border-indigo-400 hover:text-indigo-900 shadow-2xs active:scale-95 transition-all cursor-pointer group/word"
                title={`Bấm để mở nhanh thẻ từ vựng gốc: "${word}"`}
              >
                <span>{word}</span>
                <span className="material-symbols-outlined text-[13px] text-indigo-500 opacity-70 group-hover/word:opacity-100 group-hover/word:text-indigo-700 group-hover/word:translate-x-0.5 transition-all">
                  open_in_new
                </span>
              </button>
            ))}
          </div>
        )}

        {/* HÀNG 2: MẪU PATTERN CẤU TRÚC (Pattern thẳng hàng Nghĩa, bên dưới là Ví dụ / Ghi chú) */}
        {patterns.length > 0 && (
          <div className="flex flex-col gap-2.5">
            {patterns.map((pat, pIdx) => (
              <div
                key={`p-${pIdx}`}
                className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/70 flex flex-col gap-2 hover:border-slate-300 transition-colors"
              >
                {/* Pattern thẳng hàng với Nghĩa */}
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-surface-crimson-subtle text-crimson-primary border border-border-crimson-tint/80 shrink-0">
                    <span className="material-symbols-outlined text-[12px]">account_tree</span>
                    Pattern
                  </span>
                  <span className="font-mono text-xs sm:text-sm font-bold text-crimson-primary bg-white px-2.5 py-0.5 rounded-lg border border-red-200/70 shadow-2xs">
                    {pat.pattern}
                  </span>
                  <span className="text-slate-300 font-bold">—</span>
                  <span className="text-xs sm:text-sm font-semibold text-slate-800">
                    {pat.meaning || generalMeaning}
                  </span>
                </div>

                {/* Bên dưới: Ví dụ hoặc Ghi chú */}
                {isExpanded && (pat.example || pat.note) && (
                  <div className="flex flex-col gap-1.5 pt-1.5 border-t border-slate-200/60 text-xs">
                    {pat.example && (
                      <div className="flex items-start gap-2 text-slate-700 pl-2.5 border-l-2 border-slate-700">
                        <span className="font-semibold text-slate-700 text-[11px] not-italic shrink-0">Ví dụ:</span>
                        <span className="italic leading-relaxed text-slate-700">&ldquo;{pat.example}&rdquo;</span>
                      </div>
                    )}
                    {pat.note && (
                      <div className="flex items-start gap-2 text-slate-700 pl-2.5 border-l-2 border-slate-700">
                        <span className="font-semibold text-slate-700 text-[11px] shrink-0">Ghi chú:</span>
                        <span className="leading-relaxed text-slate-700">{pat.note.replace(/^Ghi chú:\s*/i, '')}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* HÀNG 3: COLLOCATIONS (Collocation thẳng hàng Nghĩa, bên dưới là Ví dụ / Ghi chú) */}
        {collocations.length > 0 && (
          <div className="flex flex-col gap-2.5">
            {collocations.map((col, cIdx) => (
              <div
                key={`c-${cIdx}`}
                className="p-3.5 rounded-2xl bg-indigo-50/40 border border-indigo-100/90 flex flex-col gap-2 hover:border-indigo-200 transition-colors"
              >
                {/* Collocation thẳng hàng với Nghĩa */}
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-collocation-indigo border border-indigo-200/80 shrink-0">
                    <span className="material-symbols-outlined text-[12px]">link</span>
                    Collocation
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-collocation-indigo bg-white px-2.5 py-0.5 rounded-lg border border-indigo-200/70 shadow-2xs">
                    {col.collocation}
                  </span>
                  <span className="text-slate-300 font-bold">—</span>
                  <span className="text-xs sm:text-sm font-semibold text-slate-800">
                    {col.meaning || generalMeaning}
                  </span>
                </div>

                {/* Bên dưới: Ví dụ hoặc Ghi chú */}
                {isExpanded && (col.example || col.note) && (
                  <div className="flex flex-col gap-1.5 pt-1.5 border-t border-indigo-100/70 text-xs">
                    {col.example && (
                      <div className="flex items-start gap-2 text-slate-700 pl-2.5 border-l-2 border-slate-700">
                        <span className="font-semibold text-slate-700 text-[11px] not-italic shrink-0">Ví dụ:</span>
                        <span className="italic leading-relaxed text-slate-700">&ldquo;{col.example}&rdquo;</span>
                      </div>
                    )}
                    {col.note && (
                      <div className="flex items-start gap-2 text-slate-700 pl-2.5 border-l-2 border-slate-700">
                        <span className="font-semibold text-slate-700 text-[11px] shrink-0">Ghi chú:</span>
                        <span className="leading-relaxed text-slate-700">{col.note.replace(/^Ghi chú:\s*/i, '')}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* HÀNG 3.2: CỤM COLLOCATION ĐỘC LẬP TỪ KHO LIÊN KẾT TỚI TỪ NÀY */}
        {relatedCollocationVocabs.length > 0 && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[15px] text-indigo-600">link</span>
                <span>Cụm Collocation liên kết trong kho ({relatedCollocationVocabs.length}):</span>
              </span>
            </div>
            <div className="flex flex-col gap-2">
              {relatedCollocationVocabs.map((rc) => {
                const rcPattern = rc.forms?.[0]?.pattern;
                const rcMeaning = rc.meaning || rc.meanings?.[0] || rc.forms?.[0]?.meaning || '';
                return (
                  <div
                    key={rc.id || rc.word}
                    onClick={() => onSelectRelatedWord && onSelectRelatedWord(rc.word, vocab.word)}
                    className="p-3 rounded-xl bg-indigo-50/40 hover:bg-indigo-50/80 border border-indigo-100 hover:border-indigo-300 flex items-center justify-between gap-3 cursor-pointer transition-all group/rc shadow-2xs"
                    title={`Bấm để mở thẻ Collocation: "${rc.word}"`}
                  >
                    <div className="flex items-center gap-2 flex-wrap min-w-0">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800 text-[10px] font-bold uppercase tracking-wider border border-indigo-200">
                        Collocation
                      </span>
                      <span className="text-xs sm:text-sm font-bold text-slate-900 group-hover/rc:text-indigo-900 transition-colors">
                        {rc.word}
                      </span>
                      {rcMeaning && (
                        <>
                          <span className="text-slate-300 font-bold">—</span>
                          <span className="text-xs text-slate-600 truncate max-w-xs">{rcMeaning}</span>
                        </>
                      )}
                    </div>
                    <span className="material-symbols-outlined text-[16px] text-indigo-500 opacity-60 group-hover/rc:opacity-100 group-hover/rc:translate-x-0.5 transition-all">
                      open_in_new
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* HÀNG 3.5: NHÓM PHRASAL VERBS (Cụm động từ) */}
        {phrasalVerbs.length > 0 && (
          <div className="flex flex-col gap-2.5">
            {phrasalVerbs.map((pv, pvIdx) => {
              const phraseText = pv.phrase || pv.collocation || pv.pattern || vocab.word;
              return (
                <div
                  key={`pv-${pvIdx}`}
                  className="p-3.5 rounded-2xl bg-teal-50/40 border border-teal-100/90 flex flex-col gap-2 hover:border-teal-200 transition-colors"
                >
                  {/* Phrasal Verb thẳng hàng với Nghĩa */}
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-teal-50 text-teal-700 border border-teal-200/80 shrink-0">
                      <span className="material-symbols-outlined text-[12px]">extension</span>
                      Phrasal Verb
                    </span>
                    <span className="text-xs sm:text-sm font-bold font-mono text-teal-900 bg-white px-2.5 py-0.5 rounded-lg border border-teal-200/70 shadow-2xs">
                      {phraseText}
                    </span>
                    <span className="text-slate-300 font-bold">—</span>
                    <span className="text-xs sm:text-sm font-semibold text-slate-800">
                      {pv.meaning || generalMeaning}
                    </span>
                  </div>

                  {/* Bên dưới: Ví dụ hoặc Ghi chú */}
                  {isExpanded && (pv.example || pv.note) && (
                    <div className="flex flex-col gap-1.5 pt-1.5 border-t border-teal-100/70 text-xs">
                      {pv.example && (
                        <div className="flex items-start gap-2 text-slate-700 pl-2.5 border-l-2 border-slate-700">
                          <span className="font-semibold text-slate-700 text-[11px] not-italic shrink-0">Ví dụ:</span>
                          <span className="italic leading-relaxed text-slate-700">&ldquo;{pv.example}&rdquo;</span>
                        </div>
                      )}
                      {pv.note && (
                        <div className="flex items-start gap-2 text-slate-700 pl-2.5 border-l-2 border-slate-700">
                          <span className="font-semibold text-slate-700 text-[11px] shrink-0">Ghi chú:</span>
                          <span className="leading-relaxed text-slate-700">{pv.note.replace(/^Ghi chú:\s*/i, '')}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* HÀNG 4: NẾU LÀ BASE HOẶC IDIOM KHÔNG CÓ PATTERN/COLLOCATION */}
        {patterns.length === 0 && collocations.length === 0 && phrasalVerbs.length === 0 && !hasItemLevelExampleOrNote && baseSenses.length > 0 && (
          <div className="flex flex-col gap-2">
            {baseSenses.map((base, bIdx) => (
              isExpanded && (base.example || base.note) && (
                <div key={`b-${bIdx}`} className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-200/60 flex flex-col gap-1.5 text-xs">
                  {base.example && (
                    <div className="flex items-start gap-2 text-slate-700 pl-2.5 border-l-2 border-slate-700">
                      <span className="font-semibold text-slate-700 text-[11px] not-italic shrink-0">Ví dụ:</span>
                      <span className="italic leading-relaxed text-slate-700">&ldquo;{base.example}&rdquo;</span>
                    </div>
                  )}
                  {base.note && (
                    <div className="flex items-start gap-2 text-slate-700 pl-2.5 border-l-2 border-slate-700">
                      <span className="font-semibold text-slate-700 text-[11px] shrink-0">Ghi chú:</span>
                      <span className="leading-relaxed text-slate-700">{base.note.replace(/^Ghi chú:\s*/i, '')}</span>
                    </div>
                  )}
                </div>
              )
            ))}
          </div>
        )}

        {/* NÚT XEM THÊM / THU GỌN (Giống hình 2 mẫu của người dùng) */}
        {(patterns.some((p) => p.example || p.note) ||
          collocations.some((c) => c.example || c.note) ||
          phrasalVerbs.some((pv) => pv.example || pv.note) ||
          hasItemLevelExampleOrNote ||
          baseSenses.some((b) => b.example || b.note)) && (
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-crimson-primary transition-colors cursor-pointer select-none"
            >
              <span>{isExpanded ? 'Thu gọn' : 'Xem thêm'}</span>
              <span className="material-symbols-outlined text-[16px]">
                {isExpanded ? 'expand_less' : 'expand_more'}
              </span>
            </button>
          </div>
        )}

        {/* FOOTER CỦA CARD: WORD FAMILY (GIA ĐÌNH TỪ NẾU CÓ) */}
        {vocab.wordFamily && vocab.wordFamily.length > 1 && (
          <div className="flex items-center gap-2 pt-2 border-t border-slate-100 flex-wrap text-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <span className="material-symbols-outlined text-[13px]">hub</span>
              Word Family:
            </span>
            {vocab.wordFamily.map((wf, wIdx) => (
              <span
                key={wIdx}
                className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-medium border border-slate-200/60"
              >
                {wf}
              </span>
            ))}
          </div>
        )}

      </div>

    </div>
  );
}
