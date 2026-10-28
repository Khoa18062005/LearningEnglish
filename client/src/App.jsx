import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import MasterListPage from './features/vocabulary/pages/MasterListPage';
import ReadingListView from './features/reading-lists/pages/ReadingListView';
import WordFamiliesPage from './features/vocabulary/pages/WordFamiliesPage';
import AddVocabModal from './features/vocabulary/components/AddVocabModal';
import AddReadingListModal from './features/reading-lists/components/AddReadingListModal';

import { vocabApi } from './api/vocabApi';
import { categoryApi } from './api/categoryApi';
import { noteListApi } from './api/noteListApi';

import {
  initialVocabList,
  initialReadingLists,
  initialCategories,
} from './data/mockData';

export default function App() {
  const [vocabList, setVocabList] = useState(initialVocabList);
  const [readingLists, setReadingLists] = useState(initialReadingLists);
  const [categories, setCategories] = useState(initialCategories);
  const [isBackendConnected, setIsBackendConnected] = useState(false);
  const [loading, setLoading] = useState(false);

  // Navigation & Filter state
  const [currentView, setCurrentView] = useState('master'); // 'master' | 'reading-list' | 'word-families'
  const [selectedReadingListId, setSelectedReadingListId] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedPos, setSelectedPos] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAddReadingListModalOpen, setIsAddReadingListModalOpen] = useState(false);

  // Fetch initial data from Spring Boot Backend with fallback to local state
  const loadBackendData = useCallback(async () => {
    try {
      setLoading(true);
      const [vocabsData, listsData, catsData] = await Promise.all([
        vocabApi.getAll(),
        noteListApi.getAll(),
        categoryApi.getAll(),
      ]);

      if (Array.isArray(vocabsData)) {
        setVocabList(vocabsData);
      }
      if (Array.isArray(listsData)) {
        setReadingLists(listsData);
      }
      if (Array.isArray(catsData)) {
        setCategories(catsData);
      }
      setIsBackendConnected(true);
    } catch (err) {
      console.warn('Backend chưa khởi động hoặc chưa kết nối DB, sử dụng dữ liệu cục bộ:', err.message);
      setIsBackendConnected(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBackendData();
  }, [loadBackendData]);

  // Audio Pronunciation via Web Speech API
  const handlePronounce = (word) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.lang = 'en-US';
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    } else {
      alert(`Phát âm cho từ: ${word}`);
    }
  };

  // Add new vocabulary (syncs to Spring Boot if available)
  const handleSaveVocab = async (newVocab) => {
    try {
      if (isBackendConnected) {
        const created = await vocabApi.create(newVocab);
        setVocabList((prev) => [created, ...prev]);
        // Reload categories & reading lists to refresh counts
        loadBackendData();
        return;
      }
    } catch (err) {
      console.error('Lỗi khi lưu từ lên Backend:', err);
    }

    // Local fallback
    setVocabList([newVocab, ...vocabList]);

    if (newVocab.readingListId) {
      setReadingLists((prev) =>
        prev.map((r) =>
          r.id === newVocab.readingListId ? { ...r, count: (r.count || 0) + 1 } : r
        )
      );
    }

    if (newVocab.categories && newVocab.categories.length > 0) {
      setCategories((prev) =>
        prev.map((c) =>
          newVocab.categories.includes(c.name) ? { ...c, count: (c.count || 0) + 1 } : c
        )
      );
    }
  };

  // Delete vocabulary
  const handleDeleteVocab = async (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa từ vựng này khỏi hệ thống?')) {
      try {
        if (isBackendConnected) {
          await vocabApi.delete(id);
        }
      } catch (err) {
        console.error('Lỗi khi xóa từ trên Backend:', err);
      }
      setVocabList((prev) => prev.filter((v) => v.id !== id));
    }
  };

  // Add new Reading List (syncs to Spring Boot if available)
  const handleSaveReadingList = async (newListPayload) => {
    try {
      if (isBackendConnected) {
        const created = await noteListApi.create(newListPayload);
        setReadingLists((prev) => [...prev, created]);
        setSelectedReadingListId(created.id);
        setCurrentView('reading-list');
        return created;
      }
    } catch (err) {
      console.error('Lỗi khi lưu Reading List lên Backend:', err);
    }

    // Local fallback
    const localNewList = {
      id: Date.now(),
      code: newListPayload.code || `LIST ${readingLists.length + 1}`,
      title: newListPayload.title,
      shortTitle: newListPayload.code || newListPayload.title,
      fullTitle: newListPayload.code ? `${newListPayload.code}: ${newListPayload.title}` : newListPayload.title,
      sourceReference: newListPayload.sourceReference || '',
      passage: newListPayload.passage || '',
      note: newListPayload.note || '',
      count: 0,
      createdAt: new Date().toISOString(),
    };

    setReadingLists((prev) => [...prev, localNewList]);
    setSelectedReadingListId(localNewList.id);
    setCurrentView('reading-list');
    return localNewList;
  };

  // Delete Reading List
  const handleDeleteReadingList = async (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa danh sách bài đọc này? Các từ vựng vẫn được lưu an toàn trong kho từ vựng chính.')) {
      try {
        if (isBackendConnected) {
          await noteListApi.delete(id);
        }
      } catch (err) {
        console.error('Lỗi khi xóa Reading List trên Backend:', err);
      }
      setReadingLists((prev) => prev.filter((r) => r.id !== id));
      if (selectedReadingListId === id) {
        setSelectedReadingListId(null);
        setCurrentView('master');
      }
    }
  };

  // Active reading list object
  const activeReadingList = readingLists.find((r) => r.id === selectedReadingListId);

  return (
    <div className="min-h-screen bg-canvas-slate text-text-body font-body antialiased">
      {/* Backend Connection Status Badge */}
      <div className="fixed bottom-3 right-3 z-50 flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg backdrop-blur-md bg-white/95 border border-slate-200">
        <span
          className={`w-2 h-2 rounded-full ${
            isBackendConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
          }`}
        />
        <span className="text-slate-700">
          {isBackendConnected ? 'Spring Boot: Online (:8080)' : 'Dữ liệu cục bộ (Chưa bật Backend)'}
        </span>
        {!isBackendConnected && (
          <button
            onClick={loadBackendData}
            title="Thử kết nối lại"
            className="text-[11px] text-crimson-primary hover:underline font-bold ml-1"
          >
            Kết nối lại
          </button>
        )}
      </div>

      {/* Sidebar Navigation */}
      <Sidebar
        currentView={currentView}
        setCurrentView={setCurrentView}
        selectedReadingListId={selectedReadingListId}
        setSelectedReadingListId={setSelectedReadingListId}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        readingLists={readingLists}
        categories={categories}
        onOpenAddModal={() => setIsAddModalOpen(true)}
        onOpenAddReadingListModal={() => setIsAddReadingListModalOpen(true)}
      />

      {/* Main Content Area */}
      <div className="pl-[260px]">
        {/* Top Header */}
        <Header
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          selectedPos={selectedPos}
          setSelectedPos={setSelectedPos}
          onOpenAddModal={() => setIsAddModalOpen(true)}
        />

        {/* Dynamic Page Views */}
        <main className="pt-16 min-h-screen">
          {currentView === 'master' && (
            <MasterListPage
              vocabList={vocabList}
              onOpenAddModal={() => setIsAddModalOpen(true)}
              onDeleteVocab={handleDeleteVocab}
              onPronounce={handlePronounce}
              searchTerm={searchTerm}
              selectedPos={selectedPos}
              selectedCategory={selectedCategory}
            />
          )}

          {currentView === 'reading-list' && (
            activeReadingList ? (
              <ReadingListView
                readingList={activeReadingList}
                vocabList={vocabList}
                onOpenAddModal={() => setIsAddModalOpen(true)}
                onPronounce={handlePronounce}
                onDeleteVocab={handleDeleteVocab}
                onDeleteReadingList={handleDeleteReadingList}
                searchTerm={searchTerm}
                selectedPos={selectedPos}
              />
            ) : (
              <div className="p-12 max-w-lg mx-auto text-center flex flex-col items-center justify-center gap-3">
                <span className="material-symbols-outlined text-4xl text-text-disabled">menu_book</span>
                <p className="font-bold text-base text-text-high-contrast">Chưa chọn danh sách bài đọc</p>
                <p className="text-xs text-text-muted">
                  Vui lòng chọn một danh sách bài đọc từ menu bên trái hoặc tạo một danh sách bài đọc mới.
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddReadingListModalOpen(true)}
                    className="px-4 py-2 rounded-lg bg-crimson-primary text-white text-xs font-bold hover:bg-crimson-dark shadow-xs"
                  >
                    + Tạo danh sách mới
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentView('master')}
                    className="px-4 py-2 rounded-lg bg-slate-100 text-text-body text-xs font-semibold hover:bg-slate-200"
                  >
                    Quay lại Tất cả từ vựng
                  </button>
                </div>
              </div>
            )
          )}

          {currentView === 'word-families' && (
            <WordFamiliesPage
              vocabList={vocabList}
              onPronounce={handlePronounce}
              onOpenAddModal={() => setIsAddModalOpen(true)}
            />
          )}
        </main>
      </div>

      {/* Modal Thêm Từ Vựng Mới (Google Stitch Form đa tầng) */}
      <AddVocabModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleSaveVocab}
        readingLists={readingLists}
        categories={categories}
        vocabList={vocabList}
        onOpenAddReadingListModal={() => setIsAddReadingListModalOpen(true)}
      />

      {/* Modal Thêm Danh Sách Bài Đọc Mới */}
      <AddReadingListModal
        isOpen={isAddReadingListModalOpen}
        onClose={() => setIsAddReadingListModalOpen(false)}
        onSave={handleSaveReadingList}
        existingLists={readingLists}
      />
    </div>
  );
}
