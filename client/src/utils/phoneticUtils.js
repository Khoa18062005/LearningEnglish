const phoneticCache = new Map();

/**
 * Tra cứu phiên âm IPA và link audio cho một từ đơn lẻ qua Free Dictionary API (fallback sang Datamuse).
 */
export async function fetchSingleWordPhonetic(word) {
  const clean = (word || '').trim().toLowerCase();
  if (!clean) return { phonetic: '', audio: '' };

  if (phoneticCache.has(clean)) {
    return phoneticCache.get(clean);
  }

  let foundPhonetic = '';
  let foundAudio = '';

  // 1. Thử Free Dictionary API
  try {
    const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(clean)}`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        for (const item of data) {
          if (item.phonetic && item.phonetic.trim()) {
            foundPhonetic = item.phonetic.trim();
            break;
          }
          if (item.phonetics && item.phonetics.length > 0) {
            const withText = item.phonetics.find((p) => p.text && p.text.trim());
            if (withText) {
              foundPhonetic = withText.text.trim();
              break;
            }
          }
        }

        for (const item of data) {
          if (item.phonetics && item.phonetics.length > 0) {
            const preferred = item.phonetics.find(
              (p) => p.audio && (p.audio.includes('-us.mp3') || p.audio.includes('-uk.mp3'))
            );
            if (preferred) {
              foundAudio = preferred.audio;
              break;
            }
            if (!foundAudio) {
              const anyAudio = item.phonetics.find((p) => p.audio && p.audio.trim().endsWith('.mp3'));
              if (anyAudio) foundAudio = anyAudio.audio;
            }
          }
        }
      }
    }
  } catch {
    // tiếp tục fallback nếu lỗi mạng
  }

  // 2. Fallback sang Datamuse API nếu chưa tìm được IPA
  if (!foundPhonetic) {
    try {
      const dmRes = await fetch(`https://api.datamuse.com/words?sp=${encodeURIComponent(clean)}&qe=sp&md=r&ipa=1`);
      if (dmRes.ok) {
        const dmData = await dmRes.json();
        if (Array.isArray(dmData) && dmData.length > 0) {
          const matched = dmData.find((d) => d.word.toLowerCase() === clean) || dmData[0];
          if (matched && matched.tags) {
            const ipaTag = matched.tags.find((t) => t.startsWith('ipa_pron:'));
            if (ipaTag) {
              const rawIpa = ipaTag.replace('ipa_pron:', '').trim();
              if (rawIpa) {
                foundPhonetic = `/${rawIpa}/`;
              }
            }
          }
        }
      }
    } catch {
      // bỏ qua fallback
    }
  }

  const result = { phonetic: foundPhonetic, audio: foundAudio };
  phoneticCache.set(clean, result);
  return result;
}

/**
 * Tra cứu phiên âm IPA và audio cho từ đơn hoặc cụm từ nhiều từ (có dấu cách như "sewing machine").
 * Tự động nhận diện dấu cách (space), tra cứu phiên âm cho từng từ riêng biệt và ghép lại có dấu cách:
 * ví dụ: "sewing machine" -> "/ˈsoʊ.ɪŋ məˈʃiːn/"
 */
export async function fetchPhoneticAndAudio(phrase) {
  const query = (phrase || '').trim();
  if (!query) return { phonetic: '', audio: '' };

  const tokens = query.split(/\s+/).filter(Boolean);

  // Nếu là từ đơn lẻ không chứa dấu cách
  if (tokens.length <= 1) {
    const single = await fetchSingleWordPhonetic(tokens[0] || query);
    let finalAudio = single.audio;
    if (!finalAudio && query) {
      finalAudio = `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(query)}&type=2`;
    }
    return {
      phonetic: single.phonetic,
      audio: finalAudio,
    };
  }

  // Nếu là cụm từ gồm nhiều từ cách nhau bởi dấu cách (như "sewing machine")
  const tokenResults = await Promise.all(
    tokens.map((token) => fetchSingleWordPhonetic(token))
  );

  const cleanedIpaTokens = tokenResults.map((r) => {
    if (r && r.phonetic) {
      return r.phonetic.replace(/^[\/\[]+|[\/\]]+$/g, '').trim();
    }
    return '';
  });

  let combinedPhonetic = '';
  const hasAnyPhonetic = cleanedIpaTokens.some(Boolean);
  if (hasAnyPhonetic) {
    // Ghép các từ phiên âm lại cách nhau bằng khoảng trắng (space)
    const finalTokens = cleanedIpaTokens.map((ipa, idx) => ipa || tokens[idx]);
    combinedPhonetic = `/${finalTokens.join(' ')}/`;
  }

  // Audio phát âm toàn bộ cụm từ chuẩn bản xứ
  const phraseAudio = `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(query)}&type=2`;

  return {
    phonetic: combinedPhonetic,
    audio: phraseAudio,
  };
}
