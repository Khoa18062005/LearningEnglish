import React, { useState, useEffect, useMemo } from 'react';

export default function VocabCard({ vocab, onPronounce, onEdit, onDelete, showReadingList = true }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const posLower = (vocab?.pos || vocab?.forms?.[0]?.pos || '').toLowerCase();
  const isPhrasePos = posLower === 'idiom' || posLower === 'idioms' || posLower === 'phrasal_verb' || posLower === 'phrasal verb';

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

  // General Vietnamese meaning
  // General Vietnamese meanings list (supports vocab.meanings array or semicolon-separated string)
  const displayMeanings = useMemo(() => {
    if (Array.isArray(vocab?.meanings) && vocab.meanings.length > 0) {
      const filtered = vocab.meanings.map((m) => (typeof m === 'string' ? m.trim() : m)).filter(Boolean);
      if (filtered.length > 0) return filtered;
    }
    const rawMeaning = vocab?.meaning || vocab?.forms?.[0]?.meaning || '';
    if (rawMeaning && rawMeaning.includes(';')) {
      const parts = rawMeaning.split(';').map((s) => s.trim()).filter(Boolean);
      if (parts.length > 0) return parts;
    }
    return rawMeaning ? [rawMeaning] : ['Chưa cập nhật nghĩa'];
  }, [vocab?.meanings, vocab?.meaning, vocab?.forms]);

  const generalMeaning = displayMeanings[0] || 'Chưa cập nhật nghĩa';

  // Synonyms if present
  const synonyms = vocab.forms?.find((f) => f.synonym)?.synonym || '';

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
      default:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full bg-slate-100 text-slate-700 font-bold text-xs border border-slate-200">
            {vocab.posLabel || pos}
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.04)] hover:shadow-[0_10px_30px_-4px_rgba(0,0,0,0.08)] transition-all overflow-hidden p-5 sm:p-7 flex flex-col md:flex-row gap-6 group">
      
      {/* ======================================================== */}
      {/* CỘT TRÁI: TỪ VỰNG, PHÁT ÂM, PHIÊN ÂM, TỪ LOẠI, TAGS      */}
      {/* ======================================================== */}
      <div className="w-full md:w-[240px] lg:w-[260px] shrink-0 flex flex-col justify-between md:border-r md:border-slate-100 md:pr-6 gap-4">
        
        {/* Top: Word & Speaker button */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex flex-col gap-1">
              <h3 className="font-headline text-2xl lg:text-[26px] font-extrabold text-slate-900 tracking-tight leading-none">
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
                className="w-9 h-9 rounded-full bg-slate-100 hover:bg-surface-crimson-subtle text-slate-500 hover:text-crimson-primary flex items-center justify-center transition-colors shadow-2xs"
                title="Phát âm từ vựng"
              >
                <span className="material-symbols-outlined text-[19px]">volume_up</span>
              </button>
            )}
          </div>
        </div>

        {/* Bottom: POS Badge, Reading List & Categories */}
        <div className="flex flex-col gap-2 pt-2">
          <div className="flex items-center gap-2 flex-wrap">
            {getPosBadge()}
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {showReadingList && vocab.readingListName && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-surface-crimson-subtle text-crimson-primary border border-border-crimson-tint text-[10px] font-bold">
                <span className="material-symbols-outlined text-[12px]">folder</span>
                <span>{vocab.readingListName}</span>
              </span>
            )}

            {vocab.categories &&
              vocab.categories.map((cat, cIdx) => (
                <span
                  key={cIdx}
                  className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-semibold border border-slate-200/60"
                >
                  {cat}
                </span>
              ))}
          </div>
        </div>

      </div>

      {/* ======================================================== */}
      {/* CỘT PHẢI: NGHĨA [VI], PATTERNS, COLLOCATIONS, VÍ DỤ/NOTE */}
      {/* ======================================================== */}
      <div className="flex-1 flex flex-col gap-4 justify-between">
        
        {/* HÀNG 1: NGHĨA TIẾNG VIỆT CHUNG VỚI ICON [VI] & ACTIONS */}
        <div className="flex items-start justify-between gap-4 pb-3 border-b border-slate-100">
          <div className="flex flex-col gap-2.5 flex-1">
            {displayMeanings.map((m, mIdx) => (
              <div key={mIdx} className="flex items-start gap-2.5">
                <span className="inline-flex items-center justify-center px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-xs font-bold border border-slate-300/80 shrink-0 mt-0.5 font-mono shadow-2xs">
                  VI
                </span>
                <span className="font-bold text-base sm:text-lg text-slate-900 leading-snug">
                  {m}
                </span>
              </div>
            ))}

            {/* Synonyms if available */}
            {synonyms && (
              <div className="flex items-center gap-2 pl-9 text-xs text-slate-500">
                <span className="font-semibold text-slate-400">Đồng nghĩa:</span>
                <span className="font-medium text-slate-700 bg-slate-50 px-2 py-0.5 rounded border border-slate-200/60">
                  {synonyms}
                </span>
              </div>
            )}
          </div>

          {/* Action Buttons: Star, Ribbon, Delete */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => setIsFavorite(!isFavorite)}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                isFavorite
                  ? 'text-amber-500 hover:text-amber-600 bg-amber-50'
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
              onClick={() => setIsBookmarked(!isBookmarked)}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                isBookmarked
                  ? 'text-crimson-primary hover:text-crimson-dark bg-surface-crimson-subtle'
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
                      <div className="flex items-start gap-2 text-slate-700 pl-2.5 border-l-2 border-crimson-primary">
                        <span className="font-semibold text-slate-400 text-[11px] not-italic shrink-0">Ví dụ:</span>
                        <span className="italic leading-relaxed">&ldquo;{pat.example}&rdquo;</span>
                      </div>
                    )}
                    {pat.note && (
                      <div className="flex items-start gap-2 text-slate-600 pl-2.5 border-l-2 border-amber-400">
                        <span className="font-semibold text-amber-700 text-[11px] shrink-0">Ghi chú:</span>
                        <span className="leading-relaxed">{pat.note.replace(/^Ghi chú:\s*/i, '')}</span>
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
                      <div className="flex items-start gap-2 text-slate-700 pl-2.5 border-l-2 border-collocation-indigo">
                        <span className="font-semibold text-slate-400 text-[11px] not-italic shrink-0">Ví dụ:</span>
                        <span className="italic leading-relaxed">&ldquo;{col.example}&rdquo;</span>
                      </div>
                    )}
                    {col.note && (
                      <div className="flex items-start gap-2 text-slate-600 pl-2.5 border-l-2 border-indigo-300">
                        <span className="font-semibold text-indigo-700 text-[11px] shrink-0">Ghi chú:</span>
                        <span className="leading-relaxed">{col.note.replace(/^Ghi chú:\s*/i, '')}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
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
                        <div className="flex items-start gap-2 text-slate-700 pl-2.5 border-l-2 border-teal-600">
                          <span className="font-semibold text-slate-400 text-[11px] not-italic shrink-0">Ví dụ:</span>
                          <span className="italic leading-relaxed">&ldquo;{pv.example}&rdquo;</span>
                        </div>
                      )}
                      {pv.note && (
                        <div className="flex items-start gap-2 text-slate-600 pl-2.5 border-l-2 border-teal-400">
                          <span className="font-semibold text-teal-700 text-[11px] shrink-0">Ghi chú:</span>
                          <span className="leading-relaxed">{pv.note.replace(/^Ghi chú:\s*/i, '')}</span>
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
        {patterns.length === 0 && collocations.length === 0 && phrasalVerbs.length === 0 && baseSenses.length > 0 && (
          <div className="flex flex-col gap-2">
            {baseSenses.map((base, bIdx) => (
              (base.example || base.note) && (
                <div key={`b-${bIdx}`} className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-200/60 flex flex-col gap-1.5 text-xs">
                  {base.example && (
                    <div className="flex items-start gap-2 text-slate-700 pl-2.5 border-l-2 border-crimson-primary">
                      <span className="font-semibold text-slate-400 text-[11px] not-italic shrink-0">Ví dụ:</span>
                      <span className="italic leading-relaxed">&ldquo;{base.example}&rdquo;</span>
                    </div>
                  )}
                  {base.note && (
                    <div className="flex items-start gap-2 text-slate-600 pl-2.5 border-l-2 border-amber-400">
                      <span className="font-semibold text-amber-700 text-[11px] shrink-0">Ghi chú:</span>
                      <span className="leading-relaxed">{base.note.replace(/^Ghi chú:\s*/i, '')}</span>
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
