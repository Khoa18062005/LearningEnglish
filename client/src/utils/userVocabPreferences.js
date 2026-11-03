const STARRED_KEY = 'learning_english_starred_ids';
const BOOKMARKED_KEY = 'learning_english_bookmarked_ids';

export function getStarredVocabIds() {
  try {
    const raw = localStorage.getItem(STARRED_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

export function isVocabStarred(vocab) {
  if (!vocab) return false;
  if (vocab.isFavorite || vocab.favorite || vocab.isStarred) return true;
  const starredSet = getStarredVocabIds();
  const idStr = vocab.id ? String(vocab.id) : null;
  const wordStr = (vocab.word || '').trim().toLowerCase();
  return Boolean((idStr && starredSet.has(idStr)) || (wordStr && starredSet.has(wordStr)));
}

export function toggleVocabStarred(vocab) {
  if (!vocab) return false;
  const starredSet = getStarredVocabIds();
  const idStr = vocab.id ? String(vocab.id) : null;
  const wordStr = (vocab.word || '').trim().toLowerCase();
  const key = idStr || wordStr;
  if (!key) return false;

  const isCurrent = (idStr && starredSet.has(idStr)) || (wordStr && starredSet.has(wordStr));
  const nextStarred = !isCurrent;

  if (nextStarred) {
    if (idStr) starredSet.add(idStr);
    if (wordStr) starredSet.add(wordStr);
  } else {
    if (idStr) starredSet.delete(idStr);
    if (wordStr) starredSet.delete(wordStr);
  }

  try {
    localStorage.setItem(STARRED_KEY, JSON.stringify(Array.from(starredSet)));
    window.dispatchEvent(
      new CustomEvent('vocab_preference_changed', {
        detail: { type: 'star', word: wordStr, id: idStr, value: nextStarred },
      })
    );
  } catch (err) {
    console.warn('Cannot save starred vocabs to localStorage:', err);
  }
  return nextStarred;
}

export function getBookmarkedVocabIds() {
  try {
    const raw = localStorage.getItem(BOOKMARKED_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

export function isVocabBookmarked(vocab) {
  if (!vocab) return false;
  if (vocab.isBookmarked || vocab.bookmarked) return true;
  const bookmarkedSet = getBookmarkedVocabIds();
  const idStr = vocab.id ? String(vocab.id) : null;
  const wordStr = (vocab.word || '').trim().toLowerCase();
  return Boolean((idStr && bookmarkedSet.has(idStr)) || (wordStr && bookmarkedSet.has(wordStr)));
}

export function toggleVocabBookmarked(vocab) {
  if (!vocab) return false;
  const bookmarkedSet = getBookmarkedVocabIds();
  const idStr = vocab.id ? String(vocab.id) : null;
  const wordStr = (vocab.word || '').trim().toLowerCase();
  const key = idStr || wordStr;
  if (!key) return false;

  const isCurrent = (idStr && bookmarkedSet.has(idStr)) || (wordStr && bookmarkedSet.has(wordStr));
  const nextBookmarked = !isCurrent;

  if (nextBookmarked) {
    if (idStr) bookmarkedSet.add(idStr);
    if (wordStr) bookmarkedSet.add(wordStr);
  } else {
    if (idStr) bookmarkedSet.delete(idStr);
    if (wordStr) bookmarkedSet.delete(wordStr);
  }

  try {
    localStorage.setItem(BOOKMARKED_KEY, JSON.stringify(Array.from(bookmarkedSet)));
    window.dispatchEvent(
      new CustomEvent('vocab_preference_changed', {
        detail: { type: 'bookmark', word: wordStr, id: idStr, value: nextBookmarked },
      })
    );
  } catch (err) {
    console.warn('Cannot save bookmarked vocabs to localStorage:', err);
  }
  return nextBookmarked;
}
