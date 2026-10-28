import React, { useMemo, useState } from 'react';

export default function WordFamiliesPage({
  vocabList = [],
  wordFamilies = [],
  onPronounce,
  onOpenAddModal,
  onEditVocab,
}) {
  const [searchTerm, setSearchTerm] = useState('');

  // Group and compute unified family cards
  const familiesToDisplay = useMemo(() => {
    const familyMap = new Map();

    // 1. Seed from wordFamilies if provided by backend
    if (Array.isArray(wordFamilies)) {
      wordFamilies.forEach((wf) => {
        if (!wf || !wf.rootWord) return;
        const key = wf.rootWord.toLowerCase();
        familyMap.set(key, {
          id: wf.id,
          rootWord: wf.rootWord,
          description: wf.description || '',
          members: [],
          rawWords: wf.words || [],
          memberVocabs: wf.memberVocabs || [],
        });
      });
    }

    // 2. Add vocabs from vocabList to their respective family
    if (Array.isArray(vocabList)) {
      vocabList.forEach((v) => {
        if (!v) return;
        let familyKey = null;
        let rootWordToUse = null;

        if (v.rootWord && v.rootWord.trim()) {
          familyKey = v.rootWord.trim().toLowerCase();
          rootWordToUse = v.rootWord.trim();
        } else if (v.wordFamilyId) {
          const found = wordFamilies.find((wf) => wf.id === v.wordFamilyId);
          if (found) {
            familyKey = found.rootWord.toLowerCase();
            rootWordToUse = found.rootWord;
          }
        } else if (Array.isArray(v.wordFamily) && v.wordFamily.length > 0 && v.wordFamily[0].trim()) {
          const first = v.wordFamily[0].split(' ')[0].trim();
          if (first && first.toLowerCase() !== v.word.toLowerCase()) {
            familyKey = first.toLowerCase();
            rootWordToUse = first;
          }
        }

        if (familyKey) {
          if (!familyMap.has(familyKey)) {
            familyMap.set(familyKey, {
              id: v.wordFamilyId || null,
              rootWord: rootWordToUse || familyKey,
              description: '',
              members: [],
              rawWords: [],
              memberVocabs: [],
            });
          }
          const family = familyMap.get(familyKey);
          if (!family.members.some((m) => (m.id && m.id === v.id) || m.word?.toLowerCase() === v.word.toLowerCase())) {
            family.members.push(v);
          }
        }
      });
    }

    // Convert map to array
    const list = Array.from(familyMap.values()).map((fam) => {
      const allWords = new Set();
      fam.members.forEach((m) => allWords.add(m.word.toLowerCase()));

      const extraWords = [];
      if (fam.rawWords) {
        fam.rawWords.forEach((rw) => {
          if (rw && !allWords.has(rw.toLowerCase())) {
            allWords.add(rw.toLowerCase());
            extraWords.push({ word: rw, isPlaceholder: true });
          }
        });
      }

      return {
        ...fam,
        totalCount: fam.members.length + extraWords.length,
        extraWords,
      };
    }).filter((fam) => fam.totalCount > 0);

    // Filter by search term if user types
    if (searchTerm.trim()) {
      const q = searchTerm.trim().toLowerCase();
      return list.filter(
        (f) =>
          f.rootWord.toLowerCase().includes(q) ||
          f.members.some((m) => m.word.toLowerCase().includes(q) || m.meaning?.toLowerCase().includes(q)) ||
          f.extraWords.some((ew) => ew.word.toLowerCase().includes(q))
      );
    }

    return list;
  }, [wordFamilies, vocabList, searchTerm]);

  return (
    <div className="flex flex-col w-full pb-16">
      <section className="p-6 lg:p-8 bg-white border-b border-slate-line/80 flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-headline text-2xl font-extrabold text-text-high-contrast tracking-tight flex items-center gap-2.5">
              <span>Gia đình từ (Word Families Tree)</span>
              {familiesToDisplay.length > 0 && (
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-surface-crimson-subtle text-crimson-primary border border-red-200">
                  {familiesToDisplay.length} cụm từ
                </span>
              )}
            </h1>
            <p className="text-xs text-text-muted mt-1">
              Học từ vựng theo cụm gốc từ (Root &amp; Affixes) theo phương pháp Linearthinking giúp mở rộng vốn từ gấp 4 lần.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenAddModal}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-crimson-primary text-white text-xs font-bold shadow-xs hover:bg-crimson-dark transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              <span>Thêm Từ Mới</span>
            </button>
          </div>
        </div>

        {/* Search bar within Word Families page */}
        <div className="relative max-w-md">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
            search
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo gốc từ hoặc từ con (e.g. account, able)..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:bg-white focus:border-crimson-primary focus:ring-2 focus:ring-crimson-primary/10 transition-all text-text-high-contrast placeholder:text-slate-400"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          )}
        </div>
      </section>

      {/* Grid of Word Family Cards */}
      <section className="p-6 lg:p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {familiesToDisplay.length === 0 ? (
          <div className="col-span-full py-20 flex flex-col items-center justify-center text-center">
            <div className="w-14 h-14 rounded-2xl bg-surface-crimson-subtle flex items-center justify-center text-crimson-primary mb-3">
              <span className="material-symbols-outlined text-[32px]">account_tree</span>
            </div>
            <p className="font-bold text-base text-text-high-contrast">Chưa có cây gia đình từ nào</p>
            <p className="text-xs text-text-muted max-w-md mt-1 mb-4 leading-relaxed">
              Cây gia đình từ sẽ tự động xuất hiện khi bạn thêm các từ vựng mới kèm chỉ định Word Family đại diện.
            </p>
            <button
              type="button"
              onClick={onOpenAddModal}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-crimson-primary text-white text-xs font-bold hover:bg-crimson-dark shadow-xs"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              <span>Thêm Từ Đầu Tiên</span>
            </button>
          </div>
        ) : (
          familiesToDisplay.map((family) => {
            const memberCount = family.members.length + family.extraWords.length;
            const readingListNames = Array.from(
              new Set(family.members.map((m) => m.readingListName).filter(Boolean))
            );

            return (
              <div
                key={family.id || family.rootWord}
                className="p-5 rounded-xl bg-white border border-slate-line/80 shadow-xs flex flex-col gap-3.5 hover:shadow-md transition-shadow group"
              >
                {/* Header: Root Word */}
                <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <span className="material-symbols-outlined text-[20px] text-crimson-primary shrink-0">
                      account_tree
                    </span>
                    <span className="font-headline font-extrabold text-lg text-crimson-primary tracking-tight truncate">
                      {family.rootWord}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-text-muted shrink-0">
                      {memberCount} từ
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => onPronounce(family.rootWord)}
                    title={`Phát âm từ gốc: ${family.rootWord}`}
                    className="w-7 h-7 rounded-full bg-surface-crimson-subtle text-crimson-primary flex items-center justify-center hover:bg-surface-crimson-soft transition-colors cursor-pointer shrink-0"
                  >
                    <span className="material-symbols-outlined text-[16px]">volume_up</span>
                  </button>
                </div>

                {/* Subtitle / Label */}
                <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
                  CÁC TỪ TRONG GIA ĐÌNH:
                </span>

                {/* List of Member Words */}
                <div className="flex flex-col gap-2">
                  {family.members.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => onEditVocab && onEditVocab(item)}
                      className="p-2.5 rounded-lg bg-slate-50/80 hover:bg-surface-crimson-subtle/50 border border-slate-200/80 hover:border-red-200 transition-all cursor-pointer flex flex-col gap-1 group/item"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 overflow-hidden">
                          <span className="font-bold text-xs text-text-high-contrast group-hover/item:text-crimson-primary transition-colors truncate">
                            {item.word}
                          </span>
                          <span
                            className={`text-[10px] px-1.5 py-0.2 rounded font-bold uppercase shrink-0 ${
                              item.pos === 'v'
                                ? 'bg-red-50 text-red-600'
                                : item.pos === 'n'
                                ? 'bg-blue-50 text-blue-600'
                                : item.pos === 'adj'
                                ? 'bg-emerald-50 text-emerald-600'
                                : 'bg-purple-50 text-purple-600'
                            }`}
                          >
                            {item.posLabel || item.pos}
                          </span>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onPronounce(item.word, item.audioUrl);
                            }}
                            className="w-5 h-5 rounded flex items-center justify-center text-slate-400 hover:text-crimson-primary"
                            title="Phát âm"
                          >
                            <span className="material-symbols-outlined text-[14px]">volume_up</span>
                          </button>
                          <span className="material-symbols-outlined text-[14px] text-slate-400 opacity-0 group-hover/item:opacity-100 transition-opacity">
                            edit
                          </span>
                        </div>
                      </div>

                      {item.meaning && (
                        <p className="text-[11px] text-text-muted line-clamp-1">
                          {item.meaning}
                        </p>
                      )}
                    </div>
                  ))}

                  {/* Extra placeholder words if family has words not yet detailed */}
                  {family.extraWords.map((ew, idx) => (
                    <div
                      key={`extra-${idx}`}
                      className="p-2 rounded-lg bg-white border border-dashed border-slate-200 text-xs text-text-muted flex items-center justify-between"
                    >
                      <span className="font-medium">{ew.word}</span>
                      <span className="text-[10px] text-slate-400 italic">chưa tạo chi tiết</span>
                    </div>
                  ))}
                </div>

                {/* Footer of Card */}
                <div className="mt-auto pt-3 border-t border-slate-100 text-[11px] text-text-muted flex items-center justify-between">
                  <span>
                    {family.members.reduce((acc, m) => acc + (m.forms?.length || 1), 0)} cấu trúc &amp; collocation
                  </span>
                  <span className="font-semibold text-text-high-contrast truncate max-w-[140px]">
                    {readingListNames.length > 0 ? readingListNames.join(', ') : 'Chung'}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </section>
    </div>
  );
}
