/**
 * vocabRelations.js
 * Hệ thống đồ thị hợp nhất quan hệ từ vựng (Transitive Closure / Equivalence Relation)
 * Hỗ trợ tự động xếp nhóm và liên kết bắc cầu (A ⇄ B, B ⇄ C => A ⇄ B ⇄ C) cho:
 * 1. Nét nghĩa tương đương (Close Meanings)
 * 2. Từ đồng nghĩa (Synonyms)
 */

function splitWords(rawList) {
  const out = [];
  if (!Array.isArray(rawList)) {
    rawList = [rawList];
  }

  rawList.forEach((val) => {
    if (!val) return;
    if (typeof val === 'string') {
      val.split(/[,;\n]/).forEach((s) => {
        const trimmed = s.trim();
        if (trimmed) out.push(trimmed);
      });
    } else if (Array.isArray(val)) {
      val.forEach((item) => {
        if (typeof item === 'string') {
          item.split(/[,;\n]/).forEach((s) => {
            const trimmed = s.trim();
            if (trimmed) out.push(trimmed);
          });
        }
      });
    }
  });

  return out;
}

/**
 * Trích xuất toàn bộ các từ được khai báo trực tiếp trong một thẻ từ vựng
 * @param {Object} vocab Thẻ từ vựng
 * @param {'close'|'synonym'} type Loại quan hệ
 * @returns {string[]} Danh sách từ gốc khai báo
 */
export function extractDeclaredWords(vocab, type = 'close') {
  if (!vocab) return [];
  const result = [];

  let md = vocab.meaningDetails;
  if (typeof md === 'string') {
    try {
      md = JSON.parse(md);
    } catch {}
  }
  if ((!md || md.length === 0) && vocab.meaningDetailsJson) {
    try {
      md = JSON.parse(vocab.meaningDetailsJson);
    } catch {}
  }

  if (type === 'close') {
    if (vocab.closeMeanings) result.push(vocab.closeMeanings);
    if (vocab.nearSynonyms) result.push(vocab.nearSynonyms);
    if (vocab.closeMeaningWords) result.push(vocab.closeMeaningWords);

    if (Array.isArray(md)) {
      md.forEach((item) => {
        if (item?.closeMeanings) result.push(item.closeMeanings);
        if (item?.nearSynonyms) result.push(item.nearSynonyms);
      });
    }

    if (Array.isArray(vocab.meanings)) {
      vocab.meanings.forEach((item) => {
        if (typeof item === 'object' && item) {
          if (item.closeMeanings) result.push(item.closeMeanings);
          if (item.nearSynonyms) result.push(item.nearSynonyms);
        }
      });
    }

    if (Array.isArray(vocab.forms)) {
      vocab.forms.forEach((item) => {
        if (item?.closeMeanings) result.push(item.closeMeanings);
        if (item?.nearSynonyms) result.push(item.nearSynonyms);
      });
    }

    if (Array.isArray(vocab.domainForms)) {
      vocab.domainForms.forEach((df) => {
        if (Array.isArray(df?.senses)) {
          df.senses.forEach((s) => {
            if (s?.closeMeanings) result.push(s.closeMeanings);
          });
        }
      });
    }
  } else {
    // type === 'synonym'
    if (vocab.synonyms) result.push(vocab.synonyms);
    if (vocab.synonym) result.push(vocab.synonym);

    if (Array.isArray(md)) {
      md.forEach((item) => {
        if (item?.synonyms) result.push(item.synonyms);
        if (item?.synonym) result.push(item.synonym);
      });
    }

    if (Array.isArray(vocab.meanings)) {
      vocab.meanings.forEach((item) => {
        if (typeof item === 'object' && item) {
          if (item.synonyms) result.push(item.synonyms);
          if (item.synonym) result.push(item.synonym);
        }
      });
    }

    if (Array.isArray(vocab.forms)) {
      vocab.forms.forEach((item) => {
        if (item?.synonym) result.push(item.synonym);
        if (item?.synonyms) result.push(item.synonyms);
      });
    }

    if (Array.isArray(vocab.domainForms)) {
      vocab.domainForms.forEach((df) => {
        if (Array.isArray(df?.senses)) {
          df.senses.forEach((s) => {
            if (s?.synonyms) result.push(s.synonyms);
            if (s?.synonym) result.push(s.synonym);
          });
        }
      });
    }
  }

  return splitWords(result);
}

/**
 * Xây dựng đồ thị vô hướng của các từ vựng từ danh sách vocabList
 * @param {Array} vocabList Danh sách từ vựng hiện tại
 * @param {'close'|'synonym'} type Loại quan hệ
 * @returns {{ graph: Map<string, Set<string>>, displayMap: Map<string, string> }}
 */
export function buildRelationGraph(vocabList = [], type = 'close') {
  const graph = new Map();
  const displayMap = new Map();

  const addEdge = (u, v) => {
    if (!graph.has(u)) graph.set(u, new Set());
    if (!graph.has(v)) graph.set(v, new Set());
    graph.get(u).add(v);
    graph.get(v).add(u);
  };

  (vocabList || []).forEach((v) => {
    const rawWord = (v?.word || '').trim();
    if (!rawWord) return;
    const cleanWord = rawWord.toLowerCase();
    if (!displayMap.has(cleanWord)) {
      displayMap.set(cleanWord, rawWord);
    }

    const declaredTargets = extractDeclaredWords(v, type);
    declaredTargets.forEach((target) => {
      const rawTarget = target.trim();
      if (!rawTarget) return;
      const cleanTarget = rawTarget.toLowerCase();
      if (!displayMap.has(cleanTarget)) {
        displayMap.set(cleanTarget, rawTarget);
      }

      if (cleanWord !== cleanTarget) {
        addEdge(cleanWord, cleanTarget);
      }
    });
  });

  return { graph, displayMap };
}

/**
 * Tìm kiếm toàn bộ cụm từ liên kết bắc cầu (Connected Component) của một từ
 * @param {string} startWord Từ bắt đầu
 * @param {Map<string, Set<string>>} graph Đồ thị
 * @param {Map<string, string>} displayMap Map chữ hoa/thường hiển thị
 * @param {boolean} includeSelf Có bao gồm chính từ bắt đầu hay không (mặc định false)
 * @returns {string[]} Danh sách các từ trong cụm liên kết bắc cầu
 */
export function getConnectedCluster(startWord, graph, displayMap, includeSelf = false) {
  const rawStart = (startWord || '').trim();
  if (!rawStart) return [];
  const cleanStart = rawStart.toLowerCase();

  if (!graph || !graph.has(cleanStart)) {
    return includeSelf ? [displayMap?.get(cleanStart) || rawStart] : [];
  }

  const visited = new Set([cleanStart]);
  const queue = [cleanStart];

  while (queue.length > 0) {
    const current = queue.shift();
    const neighbors = graph.get(current);
    if (neighbors) {
      neighbors.forEach((nbr) => {
        if (!visited.has(nbr)) {
          visited.add(nbr);
          queue.push(nbr);
        }
      });
    }
  }

  const result = [];
  visited.forEach((item) => {
    if (includeSelf || item !== cleanStart) {
      result.push(displayMap?.get(item) || item);
    }
  });

  return result;
}

/**
 * Giải quyết liên kết bắc cầu tự động cho một thẻ từ vựng dựa trên vocabList
 * @param {Object} vocab Thẻ từ vựng cần kiểm tra
 * @param {Array} vocabList Danh sách toàn bộ từ vựng
 * @returns {{
 *   closeMeanings: string[],
 *   synonyms: string[],
 *   fullCloseCluster: string[],
 *   fullSynonymCluster: string[]
 * }}
 */
export function resolveVocabRelations(vocab, vocabList = []) {
  const word = (vocab?.word || '').trim();
  if (!word) {
    return {
      closeMeanings: [],
      synonyms: [],
      fullCloseCluster: [],
      fullSynonymCluster: [],
    };
  }

  // 1. Đồ thị Nét nghĩa tương đương
  const { graph: closeGraph, displayMap: closeDisplay } = buildRelationGraph(vocabList, 'close');
  // Kết hợp cả khai báo trực tiếp của thẻ từ hiện tại nếu thẻ từ chưa nằm trong vocabList
  const declaredClose = extractDeclaredWords(vocab, 'close');
  declaredClose.forEach((target) => {
    const cleanW = word.toLowerCase();
    const cleanT = target.trim().toLowerCase();
    if (cleanT && cleanW !== cleanT) {
      if (!closeGraph.has(cleanW)) closeGraph.set(cleanW, new Set());
      if (!closeGraph.has(cleanT)) closeGraph.set(cleanT, new Set());
      closeGraph.get(cleanW).add(cleanT);
      closeGraph.get(cleanT).add(cleanW);
      if (!closeDisplay.has(cleanT)) closeDisplay.set(cleanT, target.trim());
      if (!closeDisplay.has(cleanW)) closeDisplay.set(cleanW, word);
    }
  });

  const closeMeanings = getConnectedCluster(word, closeGraph, closeDisplay, false);
  const fullCloseCluster = getConnectedCluster(word, closeGraph, closeDisplay, true);

  // 2. Đồ thị Từ đồng nghĩa
  const { graph: synGraph, displayMap: synDisplay } = buildRelationGraph(vocabList, 'synonym');
  const declaredSyn = extractDeclaredWords(vocab, 'synonym');
  declaredSyn.forEach((target) => {
    const cleanW = word.toLowerCase();
    const cleanT = target.trim().toLowerCase();
    if (cleanT && cleanW !== cleanT) {
      if (!synGraph.has(cleanW)) synGraph.set(cleanW, new Set());
      if (!synGraph.has(cleanT)) synGraph.set(cleanT, new Set());
      synGraph.get(cleanW).add(cleanT);
      synGraph.get(cleanT).add(cleanW);
      if (!synDisplay.has(cleanT)) synDisplay.set(cleanT, target.trim());
      if (!synDisplay.has(cleanW)) synDisplay.set(cleanW, word);
    }
  });

  const synonyms = getConnectedCluster(word, synGraph, synDisplay, false);
  const fullSynonymCluster = getConnectedCluster(word, synGraph, synDisplay, true);

  return {
    closeMeanings,
    synonyms,
    fullCloseCluster,
    fullSynonymCluster,
  };
}
