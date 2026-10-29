import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import MasterListPage from './features/vocabulary/pages/MasterListPage';
import ReadingListView from './features/reading-lists/pages/ReadingListView';
import WordFamiliesPage from './features/vocabulary/pages/WordFamiliesPage';
import CategoryView from './features/categories/pages/CategoryView';
import AddVocabModal from './features/vocabulary/components/AddVocabModal';
import AddReadingListModal from './features/reading-lists/components/AddReadingListModal';
import CategoryModal from './components/CategoryModal';
import NotificationModal from './components/NotificationModal';
import HomePage from './features/home/pages/HomePage';
import LoginPage from './features/auth/pages/LoginPage';
import RegisterPage from './features/auth/pages/RegisterPage';

import { vocabApi } from './api/vocabApi';
import { categoryApi } from './api/categoryApi';
import { noteListApi } from './api/noteListApi';
import { wordFamilyApi } from './api/wordFamilyApi';
import { authApi } from './api/authApi';

import {
  initialVocabList,
  initialReadingLists,
  initialCategories,
} from './data/mockData';

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('current_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [vocabList, setVocabList] = useState(initialVocabList);
  const [readingLists, setReadingLists] = useState(initialReadingLists);
  const [categories, setCategories] = useState(initialCategories);
  const [wordFamilies, setWordFamilies] = useState([]);
  const [isBackendConnected, setIsBackendConnected] = useState(false);
  const [loading, setLoading] = useState(false);

  // Navigation & Filter state (Hỗ trợ URL trực tiếp /login, /register, /vocab, /)
  const [currentView, setCurrentView] = useState(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      if (path === '/login') return 'login';
      if (path === '/register') return 'register';
      if (path === '/vocab' || path === '/lms') return 'master';
      if (path === '/' || path === '') return 'home';
    }
    return 'home';
  });
  const [selectedReadingListId, setSelectedReadingListId] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedPos, setSelectedPos] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingVocab, setEditingVocab] = useState(null);

  const handleOpenAddModal = () => {
    setEditingVocab(null);
    setIsAddModalOpen(true);
  };

  const handleEditVocab = (vocab) => {
    setEditingVocab(vocab);
    setIsAddModalOpen(true);
  };
  const [isAddReadingListModalOpen, setIsAddReadingListModalOpen] = useState(false);
  const [editingReadingList, setEditingReadingList] = useState(null);

  const handleOpenAddReadingListModal = () => {
    setEditingReadingList(null);
    setIsAddReadingListModalOpen(true);
  };

  const handleEditReadingList = (list) => {
    setEditingReadingList(list);
    setIsAddReadingListModalOpen(true);
  };
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  const handleOpenAddCategoryModal = () => {
    setEditingCategory(null);
    setIsCategoryModalOpen(true);
  };

  const handleEditCategory = (cat) => {
    setEditingCategory(cat);
    setIsCategoryModalOpen(true);
  };
  // Global Notification / Confirm Modal state (Popup center dùng chung)
  const [notification, setNotification] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'danger',
    confirmText: 'Xác nhận xóa',
    cancelText: 'Hủy bỏ',
    isAlertOnly: false,
    onConfirm: null,
  });

  const showNotification = ({
    title,
    message,
    type = 'danger',
    confirmText,
    cancelText = 'Hủy bỏ',
    isAlertOnly = false,
    onConfirm,
  }) => {
    setNotification({
      isOpen: true,
      title,
      message,
      type,
      confirmText,
      cancelText,
      isAlertOnly,
      onConfirm: async () => {
        if (onConfirm) await onConfirm();
        setNotification((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  const closeNotification = () => {
    setNotification((prev) => ({ ...prev, isOpen: false }));
  };

  // Fetch initial data from Spring Boot Backend with fallback to local state
  const loadBackendData = useCallback(async () => {
    try {
      setLoading(true);
      const [vocabsData, listsData, catsData, familiesData] = await Promise.all([
        vocabApi.getAll(),
        noteListApi.getAll(),
        categoryApi.getAll(),
        wordFamilyApi.getAll(),
      ]);

      if (Array.isArray(vocabsData)) {
        const seen = new Set();
        const unique = vocabsData.filter((v) => {
          const key = v.id || v.word.toLowerCase();
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
        setVocabList(unique);
      }
      if (Array.isArray(listsData)) {
        setReadingLists(listsData);
      }
      if (Array.isArray(catsData)) {
        setCategories(catsData);
      }
      if (Array.isArray(familiesData)) {
        setWordFamilies(familiesData);
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

  // Kiểm tra phiên đăng nhập hiện tại từ JWT token
  useEffect(() => {
    const checkAuthSession = async () => {
      const token = localStorage.getItem('access_token');
      if (token) {
        try {
          const user = await authApi.getMe();
          if (user) {
            setCurrentUser(user);
            localStorage.setItem('current_user', JSON.stringify(user));
          }
        } catch (err) {
          console.warn('Phiên đăng nhập hết hạn hoặc token không hợp lệ:', err.message);
          authApi.logout();
          setCurrentUser(null);
        }
      }
    };

    checkAuthSession();
  }, []);

  // Điều hướng trang và đồng bộ URL trên trình duyệt
  const navigateTo = (view) => {
    setCurrentView(view);
    let targetPath = '/';
    if (view === 'login') targetPath = '/login';
    else if (view === 'register') targetPath = '/register';
    else if (view === 'vocab' || view === 'master') targetPath = '/vocab';
    else if (view === 'home') targetPath = '/';

    if (typeof window !== 'undefined' && window.location.pathname !== targetPath) {
      window.history.pushState({ view }, '', targetPath);
    }
  };

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      if (path === '/login') setCurrentView('login');
      else if (path === '/register') setCurrentView('register');
      else if (path === '/vocab' || path === '/lms') setCurrentView('master');
      else setCurrentView('home');
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleOpenAuthModal = (mode = 'login') => {
    navigateTo(mode);
  };

  const handleAuthSuccess = (user, message) => {
    setCurrentUser(user);
    showNotification({
      title: 'Xác Thực Thành Công',
      message: message || `Xin chào, ${user.fullName}!`,
      type: 'info',
      confirmText: 'Đóng',
      isAlertOnly: true,
    });
  };

  const handleLogout = () => {
    authApi.logout();
    setCurrentUser(null);
    showNotification({
      title: 'Đã Đăng Xuất',
      message: 'Bạn đã đăng xuất tài khoản thành công.',
      type: 'info',
      confirmText: 'Đóng',
      isAlertOnly: true,
    });
  };

  // Audio Pronunciation: Native Human Audio (.mp3) with Web Speech API fallback
  const handlePronounce = (word, audioUrl) => {
    if (audioUrl) {
      try {
        const audio = new Audio(audioUrl);
        audio.play().catch((err) => {
          console.warn('Audio MP3 không phát được, chuyển sang Web Speech API:', err);
          fallbackSpeech(word);
        });
        return;
      } catch (e) {
        fallbackSpeech(word);
        return;
      }
    }
    fallbackSpeech(word);
  };

  const fallbackSpeech = (word) => {
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

  // Add or update vocabulary (syncs to Spring Boot if available)
  const handleSaveVocab = async (vocabData, editId) => {
    const targetId = editId || editingVocab?.id || (vocabList.find((v) => v.word.toLowerCase() === vocabData.word.toLowerCase())?.id);

    try {
      if (targetId && isBackendConnected) {
        const updated = await vocabApi.update(targetId, vocabData);
        setVocabList((prev) =>
          prev.map((v) => (v.id === targetId || v.word.toLowerCase() === vocabData.word.toLowerCase() ? updated : v))
        );
        loadBackendData();
        setIsAddModalOpen(false);
        setEditingVocab(null);
        return;
      }

      if (isBackendConnected) {
        const created = await vocabApi.create(vocabData);
        setVocabList((prev) => {
          const exists = prev.some((v) => v.id === created.id || v.word.toLowerCase() === created.word.toLowerCase());
          if (exists) {
            return prev.map((v) => (v.id === created.id || v.word.toLowerCase() === created.word.toLowerCase() ? created : v));
          }
          return [created, ...prev];
        });
        loadBackendData();
        setIsAddModalOpen(false);
        setEditingVocab(null);
        return;
      }
    } catch (err) {
      console.error('Lỗi khi lưu/cập nhật từ lên Backend:', err);
    }

    // Local fallback (when offline or backend not running)
    setVocabList((prev) => {
      const exists = prev.some((v) => (targetId && v.id === targetId) || v.id === vocabData.id || v.word.toLowerCase() === vocabData.word.toLowerCase());
      if (exists) {
        return prev.map((v) =>
          ((targetId && v.id === targetId) || v.id === vocabData.id || v.word.toLowerCase() === vocabData.word.toLowerCase())
            ? { ...v, ...vocabData, id: v.id }
            : v
        );
      }
      return [vocabData, ...prev];
    });

    if (vocabData.readingListId && !targetId) {
      setReadingLists((prev) =>
        prev.map((r) =>
          r.id === vocabData.readingListId ? { ...r, count: (r.count || 0) + 1 } : r
        )
      );
    }

    if (vocabData.categories && vocabData.categories.length > 0 && !targetId) {
      setCategories((prev) =>
        prev.map((c) =>
          vocabData.categories.includes(c.name) ? { ...c, count: (c.count || 0) + 1 } : c
        )
      );
    }

    setIsAddModalOpen(false);
    setEditingVocab(null);
  };

  const handleDeleteVocab = (id) => {
    showNotification({
      title: 'Xóa từ vựng',
      message: 'Bạn có chắc chắn muốn xóa từ vựng này khỏi hệ thống? Hành động này không thể hoàn tác.',
      type: 'danger',
      confirmText: 'Xóa từ vựng',
      onConfirm: async () => {
        try {
          if (isBackendConnected) {
            await vocabApi.delete(id);
          }
        } catch (err) {
          console.error('Lỗi khi xóa từ trên Backend:', err);
        }
        setVocabList((prev) => prev.filter((v) => v.id !== id));
      },
    });
  };

  // Add or update Reading List (syncs to Spring Boot if available)
  const handleSaveReadingList = async (newListPayload, editId) => {
    const targetId = editId || editingReadingList?.id;
    if (targetId) {
      await handleUpdateReadingList(targetId, newListPayload);
      setIsAddReadingListModalOpen(false);
      setEditingReadingList(null);
      return;
    }

    try {
      if (isBackendConnected) {
        const created = await noteListApi.create(newListPayload);
        setReadingLists((prev) => [...prev, created]);
        setSelectedReadingListId(created.id);
        setCurrentView('reading-list');
        setIsAddReadingListModalOpen(false);
        setEditingReadingList(null);
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
    setIsAddReadingListModalOpen(false);
    setEditingReadingList(null);
    return localNewList;
  };

  // Delete Reading List
  const handleDeleteReadingList = (id) => {
    showNotification({
      title: 'Xóa danh sách bài đọc',
      message: 'Bạn có chắc chắn muốn xóa danh sách bài đọc này? Các từ vựng vẫn được lưu an toàn trong kho từ vựng chính.',
      type: 'danger',
      confirmText: 'Xóa danh sách',
      onConfirm: async () => {
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
      },
    });
  };

  // Update Reading List (syncs to Spring Boot if available)
  const handleUpdateReadingList = async (id, updatedPayload) => {
    try {
      if (isBackendConnected) {
        const updated = await noteListApi.update(id, updatedPayload);
        if (updated) {
          setReadingLists((prev) =>
            prev.map((r) => (r.id === id ? { ...r, ...updated } : r))
          );
          return updated;
        }
      }
    } catch (err) {
      console.error('Lỗi khi cập nhật Reading List lên Backend:', err);
    }

    // Local fallback
    setReadingLists((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        const code = updatedPayload.code !== undefined ? updatedPayload.code : r.code;
        const title = updatedPayload.title !== undefined ? updatedPayload.title : r.title;
        return {
          ...r,
          ...updatedPayload,
          code,
          title,
          shortTitle: code || r.shortTitle,
          fullTitle: code ? `${code}: ${title}` : title,
        };
      })
    );
  };

  // Add or update Category (syncs to Spring Boot if available)
  const handleSaveCategory = async (categoryPayload, editId) => {
    const targetId = editId || editingCategory?.id;

    try {
      if (targetId && isBackendConnected) {
        const updated = await categoryApi.update(targetId, categoryPayload);
        setCategories((prev) =>
          prev.map((c) => (c.id === targetId ? { ...c, ...updated } : c))
        );
        if (editingCategory && selectedCategory === editingCategory.name) {
          setSelectedCategory(categoryPayload.name);
        }
        if (editingCategory && editingCategory.name !== categoryPayload.name) {
          setVocabList((prev) =>
            prev.map((v) => ({
              ...v,
              categories: (v.categories || []).map((catName) =>
                catName === editingCategory.name ? categoryPayload.name : catName
              ),
            }))
          );
        }
        setIsCategoryModalOpen(false);
        setEditingCategory(null);
        return updated;
      }

      if (isBackendConnected) {
        const created = await categoryApi.create(categoryPayload);
        setCategories((prev) => [...prev, created]);
        setIsCategoryModalOpen(false);
        setEditingCategory(null);
        return created;
      }
    } catch (err) {
      console.error('Lỗi khi lưu/cập nhật danh mục lên Backend:', err);
    }

    // Local fallback
    if (targetId) {
      setCategories((prev) =>
        prev.map((c) =>
          c.id === targetId ? { ...c, ...categoryPayload } : c
        )
      );
      if (editingCategory && selectedCategory === editingCategory.name) {
        setSelectedCategory(categoryPayload.name);
      }
      if (editingCategory && editingCategory.name !== categoryPayload.name) {
        setVocabList((prev) =>
          prev.map((v) => ({
            ...v,
            categories: (v.categories || []).map((catName) =>
              catName === editingCategory.name ? categoryPayload.name : catName
            ),
          }))
        );
      }
    } else {
      const localNewCat = {
        id: Date.now(),
        name: categoryPayload.name,
        colorCode: categoryPayload.colorCode || '#E31E24',
        description: categoryPayload.description || '',
        count: 0,
      };
      setCategories((prev) => [...prev, localNewCat]);
    }

    setIsCategoryModalOpen(false);
    setEditingCategory(null);
  };

  // Delete Category
  const handleDeleteCategory = (cat) => {
    showNotification({
      title: 'Xóa danh mục',
      message: `Bạn có chắc chắn muốn xóa danh mục "${cat.name}"? Các từ vựng sẽ không bị xóa mà chỉ được gỡ bỏ khỏi danh mục này.`,
      type: 'danger',
      confirmText: 'Xóa danh mục',
      onConfirm: async () => {
        try {
          if (isBackendConnected) {
            await categoryApi.delete(cat.id);
          }
        } catch (err) {
          console.error('Lỗi khi xóa danh mục trên Backend:', err);
        }
        setCategories((prev) => prev.filter((c) => c.id !== cat.id));
        if (selectedCategory === cat.name) {
          setSelectedCategory(null);
        }
        // Remove category from vocabs locally
        setVocabList((prev) =>
          prev.map((v) => ({
            ...v,
            categories: (v.categories || []).filter((catName) => catName !== cat.name),
          }))
        );
      },
    });
  };

  // Update Word Family (representative root word & member ordering)
  const handleUpdateWordFamily = async ({ id, rootWord, oldRootWord, memberOrder }) => {
    try {
      if (id && isBackendConnected) {
        await wordFamilyApi.update(id, { rootWord, memberOrder });
      }
    } catch (err) {
      console.warn('Lưu Word Family lên Backend thất bại, lưu cục bộ:', err);
    }

    // Update wordFamilies list
    setWordFamilies((prev) => {
      const idx = prev.findIndex(
        (wf) => (id && wf.id === id) || (oldRootWord && wf.rootWord?.toLowerCase() === oldRootWord.toLowerCase())
      );
      if (idx !== -1) {
        const next = [...prev];
        next[idx] = {
          ...next[idx],
          rootWord: rootWord || next[idx].rootWord,
          memberOrder: Array.isArray(memberOrder) ? memberOrder.join(',') : (memberOrder || next[idx].memberOrder),
        };
        return next;
      }
      return prev;
    });

    // Update vocabularies belonging to this word family so their rootWord matches
    setVocabList((prev) =>
      prev.map((v) => {
        const matchesFamily =
          (id && v.wordFamilyId === id) ||
          (oldRootWord && v.rootWord?.toLowerCase() === oldRootWord.toLowerCase()) ||
          (memberOrder && memberOrder.some((w) => w?.toLowerCase() === v.word?.toLowerCase()));

        if (matchesFamily) {
          return {
            ...v,
            rootWord: rootWord || v.rootWord,
            wordFamilyId: id || v.wordFamilyId,
          };
        }
        return v;
      })
    );
  };

  // Active reading list object
  const activeReadingList = readingLists.find((r) => r.id === selectedReadingListId);

  // Active category object
  const activeCategory = categories.find((c) => c.name === selectedCategory);

  // Trang chủ: DOL English
  if (currentView === 'home') {
    return (
      <div className="min-h-screen bg-white">
        <HomePage
          currentUser={currentUser}
          onNavigateLogin={() => navigateTo('login')}
          onNavigateRegister={() => navigateTo('register')}
          onNavigateVocab={() => navigateTo('vocab')}
          onLogout={handleLogout}
        />
        <NotificationModal
          isOpen={notification.isOpen}
          onClose={closeNotification}
          onConfirm={notification.onConfirm}
          title={notification.title}
          message={notification.message}
          type={notification.type}
          confirmText={notification.confirmText}
          cancelText={notification.cancelText}
          isAlertOnly={notification.isAlertOnly}
        />
      </div>
    );
  }

  // Trang riêng: Đăng nhập
  if (currentView === 'login') {
    return (
      <div className="min-h-screen bg-white">
        <LoginPage
          onNavigateRegister={() => navigateTo('register')}
          onLoginSuccess={(user, message) => {
            handleAuthSuccess(user, message);
            navigateTo('master');
          }}
        />
        <NotificationModal
          isOpen={notification.isOpen}
          onClose={closeNotification}
          onConfirm={notification.onConfirm}
          title={notification.title}
          message={notification.message}
          type={notification.type}
          confirmText={notification.confirmText}
          cancelText={notification.cancelText}
          isAlertOnly={notification.isAlertOnly}
        />
      </div>
    );
  }

  // Trang riêng: Đăng ký
  if (currentView === 'register') {
    return (
      <div className="min-h-screen bg-white">
        <RegisterPage
          onNavigateLogin={() => navigateTo('login')}
          onRegisterSuccess={(user, message) => {
            handleAuthSuccess(user, message);
            navigateTo('master');
          }}
        />
        <NotificationModal
          isOpen={notification.isOpen}
          onClose={closeNotification}
          onConfirm={notification.onConfirm}
          title={notification.title}
          message={notification.message}
          type={notification.type}
          confirmText={notification.confirmText}
          cancelText={notification.cancelText}
          isAlertOnly={notification.isAlertOnly}
        />
      </div>
    );
  }

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
        onOpenAddModal={handleOpenAddModal}
        onOpenAddReadingListModal={handleOpenAddReadingListModal}
        onOpenAddCategoryModal={handleOpenAddCategoryModal}
        onEditCategory={handleEditCategory}
        onDeleteCategory={handleDeleteCategory}
        onEditReadingList={handleEditReadingList}
        onDeleteReadingList={handleDeleteReadingList}
        onNavigateHome={() => navigateTo('home')}
      />

      {/* Main Content Area */}
      <div className="pl-[260px]">
        {/* Top Header */}
        <Header
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          selectedPos={selectedPos}
          setSelectedPos={setSelectedPos}
          onOpenAddModal={handleOpenAddModal}
          currentView={currentView}
          currentUser={currentUser}
          onOpenAuthModal={handleOpenAuthModal}
          onLogout={handleLogout}
        />

        {/* Dynamic Page Views */}
        <main className="pt-16 min-h-screen">
          {currentView === 'master' && (
            <MasterListPage
              vocabList={vocabList}
              onOpenAddModal={handleOpenAddModal}
              onEditVocab={handleEditVocab}
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
                onOpenAddModal={handleOpenAddModal}
                onEditVocab={handleEditVocab}
                onPronounce={handlePronounce}
                onDeleteVocab={handleDeleteVocab}
                onDeleteReadingList={handleDeleteReadingList}
                onUpdateReadingList={handleUpdateReadingList}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                selectedPos={selectedPos}
                setSelectedPos={setSelectedPos}
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
                    onClick={handleOpenAddReadingListModal}
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

          {currentView === 'category' && (
            activeCategory ? (
              <CategoryView
                category={activeCategory}
                vocabList={vocabList}
                onOpenAddModal={handleOpenAddModal}
                onPronounce={handlePronounce}
                onEditVocab={handleEditVocab}
                onDeleteVocab={handleDeleteVocab}
                onEditCategory={handleEditCategory}
                onDeleteCategory={handleDeleteCategory}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                selectedPos={selectedPos}
                setSelectedPos={setSelectedPos}
              />
            ) : (
              <div className="p-12 max-w-lg mx-auto text-center flex flex-col items-center justify-center gap-3">
                <span className="material-symbols-outlined text-4xl text-text-disabled">label</span>
                <p className="font-bold text-base text-text-high-contrast">Chưa chọn danh mục</p>
                <p className="text-xs text-text-muted">
                  Vui lòng chọn một danh mục từ menu bên trái hoặc tạo một danh mục mới.
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <button
                    type="button"
                    onClick={handleOpenAddCategoryModal}
                    className="px-4 py-2 rounded-lg bg-crimson-primary text-white text-xs font-bold hover:bg-crimson-dark shadow-xs"
                  >
                    + Tạo danh mục mới
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
              wordFamilies={wordFamilies}
              onPronounce={handlePronounce}
              onOpenAddModal={() => setIsAddModalOpen(true)}
              onEditVocab={handleEditVocab}
              onUpdateWordFamily={handleUpdateWordFamily}
            />
          )}
        </main>
      </div>

      {/* Modal Thêm Từ Vựng Mới (Google Stitch Form đa tầng) */}
      <AddVocabModal
        isOpen={isAddModalOpen}
        initialVocab={editingVocab}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingVocab(null);
        }}
        onSave={handleSaveVocab}
        readingLists={readingLists}
        categories={categories}
        vocabList={vocabList}
        wordFamilies={wordFamilies}
        defaultCategory={currentView === 'category' ? selectedCategory : null}
        onOpenAddReadingListModal={handleOpenAddReadingListModal}
        onOpenAddCategoryModal={handleOpenAddCategoryModal}
      />

      {/* Modal Thêm / Chỉnh Sửa Danh Sách Bài Đọc */}
      <AddReadingListModal
        isOpen={isAddReadingListModalOpen}
        initialData={editingReadingList}
        onClose={() => {
          setIsAddReadingListModalOpen(false);
          setEditingReadingList(null);
        }}
        onSave={handleSaveReadingList}
        existingLists={readingLists}
      />

      {/* Modal Thêm / Chỉnh Sửa Danh Mục (Categories) */}
      <CategoryModal
        isOpen={isCategoryModalOpen}
        initialCategory={editingCategory}
        onClose={() => {
          setIsCategoryModalOpen(false);
          setEditingCategory(null);
        }}
        onSave={handleSaveCategory}
        existingCategories={categories}
      />

      {/* Modal Thông Báo / Xác Nhận Chung (Popup Center) */}
      <NotificationModal
        isOpen={notification.isOpen}
        onClose={closeNotification}
        onConfirm={notification.onConfirm}
        title={notification.title}
        message={notification.message}
        type={notification.type}
        confirmText={notification.confirmText}
        cancelText={notification.cancelText}
        isAlertOnly={notification.isAlertOnly}
      />
    </div>
  );
}
