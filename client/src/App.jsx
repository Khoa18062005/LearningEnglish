import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import MasterListPage from './features/vocabulary/pages/MasterListPage';
import ReadingListView from './features/reading-lists/pages/ReadingListView';
import ListVocabularyPage from './features/reading-lists/pages/ListVocabularyPage';
import WordFamiliesPage from './features/vocabulary/pages/WordFamiliesPage';
import CategoryView from './features/categories/pages/CategoryView';
import TopicVocabularyPage from './features/categories/pages/TopicVocabularyPage';
import AddVocabModal from './features/vocabulary/components/AddVocabModal';
import VocabDetailModal from './features/vocabulary/components/VocabDetailModal';
import RelatedVocabGroupModal from './features/vocabulary/components/RelatedVocabGroupModal';
import AddReadingListModal from './features/reading-lists/components/AddReadingListModal';
import AddNoteFolderModal from './features/reading-lists/components/AddNoteFolderModal';
import CategoryModal from './components/CategoryModal';
import NotificationModal from './components/NotificationModal';
import Toast from './components/Toast';
import HomePage from './features/home/pages/HomePage';
import LoginPage from './features/auth/pages/LoginPage';
import RegisterPage from './features/auth/pages/RegisterPage';
import VerifyOtpPage from './features/auth/pages/VerifyOtpPage';
import ProfilePage from './features/profile/pages/ProfilePage';

import { vocabApi } from './api/vocabApi';
import { categoryApi } from './api/categoryApi';
import { noteListApi } from './api/noteListApi';
import { noteFolderApi } from './api/noteFolderApi';
import { wordFamilyApi } from './api/wordFamilyApi';
import { authApi } from './api/authApi';

import {
  initialVocabList,
  initialReadingLists,
  initialCategories,
} from './data/mockData';

const applySavedReadingListOrder = (lists) => {
  if (!Array.isArray(lists) || lists.length === 0) return lists;
  try {
    const saved = localStorage.getItem('reading_list_custom_order');
    if (saved) {
      const orderIds = JSON.parse(saved);
      if (Array.isArray(orderIds) && orderIds.length > 0) {
        const map = new Map(orderIds.map((id, idx) => [String(id), idx]));
        return [...lists].sort((a, b) => {
          const oa = map.has(String(a.id)) ? map.get(String(a.id)) : 999999;
          const ob = map.has(String(b.id)) ? map.get(String(b.id)) : 999999;
          return oa - ob;
        });
      }
    }
  } catch {}
  return lists;
};

const applySavedNoteFolderOrder = (folders) => {
  if (!Array.isArray(folders) || folders.length === 0) return folders;
  try {
    const saved = localStorage.getItem('note_folder_custom_order');
    if (saved) {
      const orderIds = JSON.parse(saved);
      if (Array.isArray(orderIds) && orderIds.length > 0) {
        const map = new Map(orderIds.map((id, idx) => [String(id), idx]));
        return [...folders].sort((a, b) => {
          const oa = map.has(String(a.id)) ? map.get(String(a.id)) : 999999;
          const ob = map.has(String(b.id)) ? map.get(String(b.id)) : 999999;
          return oa - ob;
        });
      }
    }
  } catch {}
  return folders;
};

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
  const [readingLists, setReadingLists] = useState(() => applySavedReadingListOrder(initialReadingLists));
  const [noteFolders, setNoteFolders] = useState([]);
  const [categories, setCategories] = useState(initialCategories);
  const [wordFamilies, setWordFamilies] = useState([]);
  const [isBackendConnected, setIsBackendConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lastMutation, setLastMutation] = useState(null);
  const [pendingRegistrationData, setPendingRegistrationData] = useState(() => {
    try {
      const saved = sessionStorage.getItem('pending_registration');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Phân tích trạng thái điều hướng từ URL hoặc sessionStorage để giữ tab khi F5
  const parseNavState = () => {
    if (typeof window === 'undefined') return { view: 'home', listId: null, category: null };
    const path = window.location.pathname;
    const params = new URLSearchParams(window.location.search);

    if (path === '/login') return { view: 'login', listId: null, category: null };
    if (path === '/register') return { view: 'register', listId: null, category: null };
    if (path === '/verify-otp') return { view: 'verify-otp', listId: null, category: null };
    if (path === '/profile') return { view: 'profile', listId: null, category: null };
    if (path === '/' || path === '') return { view: 'home', listId: null, category: null };

    if (path === '/vocab' || path === '/lms') {
      const tab = params.get('tab') || params.get('view');
      const listParam = params.get('list') || params.get('listId');
      const catParam = params.get('category') || params.get('cat');

      if (listParam) {
        const parsedListId = !isNaN(Number(listParam)) ? Number(listParam) : listParam;
        return { view: 'reading-list', listId: parsedListId, category: null };
      }
      if (catParam) {
        return { view: 'category', listId: null, category: decodeURIComponent(catParam) };
      }
      if (tab === 'profile') {
        return { view: 'profile', listId: null, category: null };
      }
      if (tab === 'word-families' || tab === 'families') {
        return { view: 'word-families', listId: null, category: null };
      }
      if (tab === 'list-vocabulary' || tab === 'list vocabulary' || tab === 'lists' || tab === 'reading-lists') {
        return { view: 'list-vocabulary', listId: null, category: null };
      }
      if (tab === 'topic-vocabulary' || tab === 'topic vocabulary' || tab === 'topics' || tab === 'categories') {
        return { view: 'topic-vocabulary', listId: null, category: null };
      }

      // Fallback từ sessionStorage nếu người dùng F5 trên URL /vocab
      try {
        const savedView = sessionStorage.getItem('last_vocab_view');
        const savedListId = sessionStorage.getItem('last_vocab_list_id');
        const savedCat = sessionStorage.getItem('last_vocab_category');

        if (savedView === 'reading-list' && savedListId) {
          const parsedSavedId = !isNaN(Number(savedListId)) ? Number(savedListId) : savedListId;
          return { view: 'reading-list', listId: parsedSavedId, category: null };
        }
        if (savedView === 'category' && savedCat) {
          return { view: 'category', listId: null, category: savedCat };
        }
        if (savedView === 'profile') {
          return { view: 'profile', listId: null, category: null };
        }
        if (savedView === 'word-families') {
          return { view: 'word-families', listId: null, category: null };
        }
        if (savedView === 'list-vocabulary') {
          return { view: 'list-vocabulary', listId: null, category: null };
        }
        if (savedView === 'topic-vocabulary') {
          return { view: 'topic-vocabulary', listId: null, category: null };
        }
      } catch (e) {}

      return { view: 'master', listId: null, category: null };
    }

    return { view: 'home', listId: null, category: null };
  };

  const initialNav = parseNavState();
  const [currentView, setCurrentView] = useState(initialNav.view);
  const [selectedReadingListId, setSelectedReadingListId] = useState(initialNav.listId);
  const [selectedCategory, setSelectedCategory] = useState(initialNav.category);
  const [selectedPos, setSelectedPos] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');

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

  // State cho Modal xem nhanh thẻ từ vựng liên quan riêng lẻ (từ đồng nghĩa / nét nghĩa tương đương)
  const [selectedDetailVocab, setSelectedDetailVocab] = useState(null);
  const [detailSourceWord, setDetailSourceWord] = useState(null);

  // State cho Hộp thoại cuộn xem toàn bộ danh sách các từ đồng nghĩa / nét nghĩa tương đương
  const [relatedGroupModalData, setRelatedGroupModalData] = useState(null);

  const handleOpenRelatedGroup = (words, sourceWord, type = 'close') => {
    if (!Array.isArray(words) || words.length === 0) return;
    setRelatedGroupModalData({ words, sourceWord, type });
  };

  const handleSelectRelatedWord = (wordStr, fromWord = null) => {
    if (!wordStr) return;
    const cleanWord = wordStr.trim().toLowerCase();
    const found = (vocabList || []).find(
      (v) => (v.word || '').trim().toLowerCase() === cleanWord
    );

    if (found) {
      setSelectedDetailVocab(found);
      if (fromWord) setDetailSourceWord(fromWord);
    } else {
      showNotification({
        title: `Chưa có từ "${wordStr}"`,
        message: `Từ vựng "${wordStr}" chưa có trong danh sách của bạn. Bạn có muốn tạo thẻ từ mới cho "${wordStr}" không?`,
        type: 'confirm',
        confirmText: 'Tạo thẻ từ này',
        cancelText: 'Để sau',
        onConfirm: () => {
          setEditingVocab({ word: wordStr.trim() });
          setIsAddModalOpen(true);
        },
      });
    }
  };

  const handleScrollToCard = (targetVocab) => {
    if (!targetVocab?.id) return;
    const cardEl = document.getElementById(`vocab-card-${targetVocab.id}`);
    if (cardEl) {
      cardEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      cardEl.classList.add('ring-4', 'ring-crimson-primary/70', 'transition-all');
      setTimeout(() => {
        cardEl.classList.remove('ring-4', 'ring-crimson-primary/70');
      }, 2500);
    }
  };
  const [isAddReadingListModalOpen, setIsAddReadingListModalOpen] = useState(false);
  const [editingReadingList, setEditingReadingList] = useState(null);
  const [defaultFolderForNewList, setDefaultFolderForNewList] = useState(null);
  const [isNoteFolderModalOpen, setIsNoteFolderModalOpen] = useState(false);
  const [editingNoteFolder, setEditingNoteFolder] = useState(null);

  const handleOpenAddFolderModal = () => {
    setEditingNoteFolder(null);
    setIsNoteFolderModalOpen(true);
  };

  const handleEditFolder = (folder) => {
    setEditingNoteFolder(folder);
    setIsNoteFolderModalOpen(true);
  };

  const handleOpenAddReadingListModal = (options = null) => {
    setDefaultFolderForNewList(options?.defaultFolderId || null);
    setEditingReadingList(null);
    setIsAddReadingListModalOpen(true);
  };

  const handleEditReadingList = (list) => {
    setDefaultFolderForNewList(list?.folderId || null);
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

  // Toast Notification state (Góc trên cùng bên phải)
  const [toast, setToast] = useState(null);

  const showToast = (toastInput) => {
    if (typeof toastInput === 'string') {
      setToast({ title: 'Thành công', message: toastInput, type: 'success', duration: 3000 });
    } else if (toastInput && typeof toastInput === 'object') {
      setToast({
        title: toastInput.title || 'Thông báo',
        message: toastInput.message || '',
        type: toastInput.type || 'success',
        duration: toastInput.duration || 3000,
      });
    }
  };

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, toast.duration || 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Fetch initial data from Spring Boot Backend with fallback to local state
  const loadBackendData = useCallback(async () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      setIsBackendConnected(false);
      return;
    }
    try {
      setLoading(true);
      const [vocabsData, listsData, catsData, familiesData, foldersData] = await Promise.all([
        vocabApi.getAll(),
        noteListApi.getAll(),
        categoryApi.getAll(),
        wordFamilyApi.getAll(),
        noteFolderApi.getAll().catch(() => []),
      ]);

      if (Array.isArray(vocabsData)) {
        const seen = new Set();
        const unique = vocabsData.filter((v) => {
          const key = v.id || v.word?.toLowerCase();
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
        setVocabList((prev) => {
          const prevMap = new Map();
          (prev || []).forEach((v) => {
            if (v.id) prevMap.set(String(v.id), v);
            if (v.word) prevMap.set(v.word.toLowerCase(), v);
          });
          return unique.map((serverItem) => {
            const localItem =
              prevMap.get(String(serverItem.id)) ||
              prevMap.get((serverItem.word || '').toLowerCase());
            if (!localItem) return serverItem;
            return {
              ...localItem,
              ...serverItem,
              closeMeanings: serverItem.closeMeanings || localItem.closeMeanings || '',
              synonyms: serverItem.synonyms || localItem.synonyms || '',
              meaningDetails:
                Array.isArray(serverItem.meaningDetails) && serverItem.meaningDetails.length > 0
                  ? serverItem.meaningDetails
                  : (localItem.meaningDetails || []),
              meaningDetailsJson: serverItem.meaningDetailsJson || localItem.meaningDetailsJson || '',
            };
          });
        });
      }
      if (Array.isArray(listsData)) {
        setReadingLists(applySavedReadingListOrder(listsData));
      }
      if (Array.isArray(catsData)) {
        setCategories(catsData);
      }
      if (Array.isArray(familiesData)) {
        setWordFamilies(familiesData);
      }
      if (Array.isArray(foldersData)) {
        setNoteFolders(applySavedNoteFolderOrder(foldersData));
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
          setVocabList([]);
          setReadingLists([]);
          setNoteFolders([]);
          setCategories([]);
          setWordFamilies([]);
          setIsBackendConnected(false);
        }
      }
    };

    checkAuthSession();
  }, []);

  // Điều hướng trang
  const navigateTo = (view) => {
    setCurrentView(view);
    if (view === 'master' || view === 'vocab' || view === 'profile' || view === 'list-vocabulary' || view === 'topic-vocabulary') {
      setSelectedReadingListId(null);
      setSelectedCategory(null);
    }
  };

  // Tự động đồng bộ URL trình duyệt và lưu vào sessionStorage khi chuyển đổi Tab/View
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let targetPath = '/';
    const params = new URLSearchParams();

    if (currentView === 'home') {
      targetPath = '/';
      try {
        sessionStorage.removeItem('last_vocab_view');
        sessionStorage.removeItem('last_vocab_list_id');
        sessionStorage.removeItem('last_vocab_category');
      } catch (e) {}
    } else if (currentView === 'login') {
      targetPath = '/login';
    } else if (currentView === 'register') {
      targetPath = '/register';
    } else if (currentView === 'verify-otp') {
      targetPath = '/verify-otp';
    } else if (currentView === 'profile') {
      targetPath = '/vocab';
      params.set('tab', 'profile');
      try {
        sessionStorage.setItem('last_vocab_view', 'profile');
        sessionStorage.removeItem('last_vocab_list_id');
        sessionStorage.removeItem('last_vocab_category');
      } catch (e) {}
    } else if (currentView === 'word-families') {
      targetPath = '/vocab';
      params.set('tab', 'word-families');
      try {
        sessionStorage.setItem('last_vocab_view', 'word-families');
        sessionStorage.removeItem('last_vocab_list_id');
        sessionStorage.removeItem('last_vocab_category');
      } catch (e) {}
    } else if (currentView === 'list-vocabulary') {
      targetPath = '/vocab';
      params.set('tab', 'list-vocabulary');
      try {
        sessionStorage.setItem('last_vocab_view', 'list-vocabulary');
        sessionStorage.removeItem('last_vocab_list_id');
        sessionStorage.removeItem('last_vocab_category');
      } catch (e) {}
    } else if (currentView === 'topic-vocabulary') {
      targetPath = '/vocab';
      params.set('tab', 'topic-vocabulary');
      try {
        sessionStorage.setItem('last_vocab_view', 'topic-vocabulary');
        sessionStorage.removeItem('last_vocab_list_id');
        sessionStorage.removeItem('last_vocab_category');
      } catch (e) {}
    } else if (currentView === 'reading-list' && selectedReadingListId) {
      targetPath = '/vocab';
      params.set('list', selectedReadingListId);
      try {
        sessionStorage.setItem('last_vocab_view', 'reading-list');
        sessionStorage.setItem('last_vocab_list_id', selectedReadingListId);
        sessionStorage.removeItem('last_vocab_category');
      } catch (e) {}
    } else if (currentView === 'category' && selectedCategory) {
      targetPath = '/vocab';
      params.set('category', selectedCategory);
      try {
        sessionStorage.setItem('last_vocab_view', 'category');
        sessionStorage.setItem('last_vocab_category', selectedCategory);
        sessionStorage.removeItem('last_vocab_list_id');
      } catch (e) {}
    } else if (currentView === 'master') {
      targetPath = '/vocab';
      try {
        sessionStorage.setItem('last_vocab_view', 'master');
        sessionStorage.removeItem('last_vocab_list_id');
        sessionStorage.removeItem('last_vocab_category');
      } catch (e) {}
    }

    const queryString = params.toString();
    const fullTarget = targetPath + (queryString ? '?' + queryString : '');
    const currentFull = window.location.pathname + window.location.search;

    if (currentFull !== fullTarget) {
      window.history.pushState(
        { currentView, selectedReadingListId, selectedCategory },
        '',
        fullTarget
      );
    }
  }, [currentView, selectedReadingListId, selectedCategory]);

  useEffect(() => {
    const handlePopState = () => {
      if (currentView === 'verify-otp') {
        // Chặn hoàn toàn việc dùng nút Back của trình duyệt để quay lại trang đăng ký
        window.history.pushState({ currentView: 'verify-otp' }, '', '/verify-otp');
        return;
      }
      const nav = parseNavState();
      setCurrentView(nav.view);
      setSelectedReadingListId(nav.listId);
      setSelectedCategory(nav.category);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [currentView]);

  const handleOpenAuthModal = (mode = 'login') => {
    navigateTo(mode);
  };

  const handleAuthSuccess = (user, message) => {
    setCurrentUser(user);
    navigateTo('profile');
    loadBackendData();
    showToast({
      title: 'Đăng nhập thành công',
      message: message || `Chào mừng ${user?.fullName || 'bạn'} quay lại hệ thống!`,
      type: 'success',
      duration: 3000,
    });
  };

  const handleLogout = () => {
    // 1. Kill phiên làm việc người dùng (Token, Cache, Session)
    authApi.logout();
    setCurrentUser(null);
    setSelectedReadingListId(null);
    setSelectedCategory(null);
    setSearchTerm('');
    setSelectedPos('all');

    // 2. Dọn dẹp toàn bộ dữ liệu người dùng của phiên làm việc cũ
    setVocabList([]);
    setReadingLists([]);
    setNoteFolders([]);
    setCategories([]);
    setWordFamilies([]);
    setIsBackendConnected(false);

    // 3. Trở về trang Home ngay lập tức và đồng bộ URL về '/'
    setCurrentView('home');
    if (typeof window !== 'undefined') {
      window.history.pushState({ currentView: 'home' }, '', '/');
    }

    // 4. Thông báo Toast góc trên cùng bên phải màu xanh lá
    showToast({
      title: 'Đăng xuất thành công',
      message: 'Bạn đã đăng xuất tài khoản an toàn.',
      type: 'success',
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

  // Helper to safely merge updated server response without wiping out local rich meaning details
  const safeMergeVocab = (local, remote) => {
    if (!remote) return local;
    if (!local) return remote;
    return {
      ...local,
      ...remote,
      closeMeanings: remote.closeMeanings || local.closeMeanings || '',
      synonyms: remote.synonyms || local.synonyms || '',
      meaningDetails:
        Array.isArray(remote.meaningDetails) && remote.meaningDetails.length > 0
          ? remote.meaningDetails
          : (local.meaningDetails || []),
      meaningDetailsJson: remote.meaningDetailsJson || local.meaningDetailsJson || '',
    };
  };

  // Add or update vocabulary (syncs to Spring Boot if available)
  const handleSaveVocab = async (vocabData, editId) => {
    const targetId = editId || editingVocab?.id || (vocabList.find((v) => v.word.toLowerCase() === vocabData.word.toLowerCase())?.id);

    try {
      if (targetId && isBackendConnected) {
        const updated = await vocabApi.update(targetId, vocabData);
        const mergedUpdated = safeMergeVocab(vocabData, updated);
        setLastMutation({ type: 'update', data: mergedUpdated, timestamp: Date.now() });
        setVocabList((prev) =>
          prev.map((v) => (v.id === targetId || v.word.toLowerCase() === vocabData.word.toLowerCase() ? mergedUpdated : v))
        );
        setSelectedDetailVocab((prev) => {
          if (!prev) return null;
          const isMatch = (targetId && prev.id === targetId) ||
            ((prev.word || '').trim().toLowerCase() === (vocabData.word || '').trim().toLowerCase());
          return isMatch ? { ...prev, ...mergedUpdated } : prev;
        });
        loadBackendData();
        setIsAddModalOpen(false);
        setEditingVocab(null);
        return;
      }

      if (isBackendConnected) {
        const created = await vocabApi.create(vocabData);
        const mergedCreated = safeMergeVocab(vocabData, created);
        setLastMutation({ type: 'create', data: mergedCreated, timestamp: Date.now() });
        if (selectedPos !== 'all' && created.pos && created.pos !== selectedPos) {
          setSelectedPos('all');
        }
        const assignedListId = created.readingListId || vocabData.readingListId;
        if (assignedListId) {
          setReadingLists((prev) =>
            prev.map((r) =>
              (String(r.id) === String(assignedListId))
                ? { ...r, count: (r.count || 0) + 1 }
                : r
            )
          );
        }
        setVocabList((prev) => {
          const exists = prev.some((v) => v.id === created.id || v.word.toLowerCase() === created.word.toLowerCase());
          if (exists) {
            return prev.map((v) => (v.id === created.id || v.word.toLowerCase() === created.word.toLowerCase() ? mergedCreated : v));
          }
          return [mergedCreated, ...prev];
        });
        setSelectedDetailVocab((prev) => {
          if (!prev) return null;
          const isMatch = (created.id && prev.id === created.id) ||
            ((prev.word || '').trim().toLowerCase() === (created.word || '').trim().toLowerCase());
          return isMatch ? { ...prev, ...mergedCreated } : prev;
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

    setSelectedDetailVocab((prev) => {
      if (!prev) return null;
      const isMatch = (targetId && prev.id === targetId) ||
        ((prev.word || '').trim().toLowerCase() === (vocabData.word || '').trim().toLowerCase());
      return isMatch ? { ...prev, ...vocabData } : prev;
    });

    if (vocabData.readingListId && !targetId) {
      setReadingLists((prev) =>
        prev.map((r) =>
          String(r.id) === String(vocabData.readingListId) ? { ...r, count: (r.count || 0) + 1 } : r
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
        setLastMutation({ type: 'delete', data: id, timestamp: Date.now() });
        setSelectedDetailVocab((prev) => (prev?.id === id ? null : prev));
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

    // Kiểm tra trùng mã danh sách trước khi tạo mới
    const targetCode = (newListPayload.code || '').trim().toUpperCase();
    if (targetCode && readingLists.some((r) => (r.code || r.shortTitle || '').trim().toUpperCase() === targetCode)) {
      showNotification({
        title: 'Trùng mã danh sách',
        message: `Mã danh sách "${newListPayload.code}" đã được sử dụng. Vui lòng chọn một mã khác!`,
        type: 'danger',
        isAlertOnly: true,
        confirmText: 'Đã hiểu',
      });
      return;
    }

    const folder = newListPayload.folderId
      ? noteFolders.find((f) => String(f.id) === String(newListPayload.folderId))
      : null;

    try {
      if (isBackendConnected) {
        const created = await noteListApi.create(newListPayload);
        const enriched = {
          ...created,
          folderId: created.folderId || (folder ? folder.id : null),
          folderCode: created.folderCode || (folder ? folder.code : null),
          folderName: created.folderName || (folder ? folder.name : null),
        };
        setReadingLists((prev) => [...prev, enriched]);
        setSelectedReadingListId(created.id);
        setCurrentView('reading-list');
        setIsAddReadingListModalOpen(false);
        setEditingReadingList(null);
        showToast('Tạo danh sách từ vựng thành công!');
        return enriched;
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
      folderId: folder ? folder.id : null,
      folderCode: folder ? folder.code : null,
      folderName: folder ? folder.name : null,
      count: 0,
      createdAt: new Date().toISOString(),
    };

    setReadingLists((prev) => [...prev, localNewList]);
    setSelectedReadingListId(localNewList.id);
    setCurrentView('reading-list');
    setIsAddReadingListModalOpen(false);
    setEditingReadingList(null);
    showToast('Tạo danh sách từ vựng thành công!');
    return localNewList;
  };

  // Quản lý Thư Mục (Folder / Danh mục Cấp 2)
  const handleSaveNoteFolder = async (folderPayload) => {
    if (folderPayload.id) {
      try {
        if (isBackendConnected) {
          const updated = await noteFolderApi.update(folderPayload.id, folderPayload);
          setNoteFolders((prev) =>
            prev.map((f) => (f.id === folderPayload.id ? { ...f, ...updated } : f))
          );
          setReadingLists((prev) =>
            prev.map((l) =>
              l.folderId === folderPayload.id
                ? { ...l, folderCode: updated.code, folderName: updated.name }
                : l
            )
          );
          showToast('Cập nhật thư mục thành công!');
          return updated;
        }
      } catch (err) {
        console.error('Lỗi khi cập nhật thư mục lên Backend:', err);
        throw err;
      }

      setNoteFolders((prev) =>
        prev.map((f) => (f.id === folderPayload.id ? { ...f, ...folderPayload } : f))
      );
      setReadingLists((prev) =>
        prev.map((l) =>
          l.folderId === folderPayload.id
            ? { ...l, folderCode: folderPayload.code, folderName: folderPayload.name }
            : l
        )
      );
      showToast('Cập nhật thư mục thành công!');
      return folderPayload;
    }

    try {
      if (isBackendConnected) {
        const created = await noteFolderApi.create(folderPayload);
        setNoteFolders((prev) => [...prev, created]);
        showToast('Tạo thư mục mới thành công!');
        return created;
      }
    } catch (err) {
      console.error('Lỗi khi tạo thư mục lên Backend:', err);
      throw err;
    }

    const localFolder = {
      id: Date.now(),
      code: folderPayload.code,
      name: folderPayload.name,
      description: folderPayload.description || null,
      createdAt: new Date().toISOString(),
      totalLists: 0,
      totalWords: 0,
    };
    setNoteFolders((prev) => [...prev, localFolder]);
    showToast('Tạo thư mục mới thành công!');
    return localFolder;
  };

  const handleDeleteFolder = (folderId) => {
    showNotification({
      title: 'Xóa thư mục',
      message: 'Bạn có chắc chắn muốn xóa thư mục này? Các bài đọc bên trong sẽ được giữ lại dưới dạng danh sách riêng lẻ.',
      type: 'danger',
      confirmText: 'Xóa thư mục',
      onConfirm: async () => {
        try {
          if (isBackendConnected) {
            await noteFolderApi.delete(folderId);
          }
        } catch (err) {
          console.error('Lỗi khi xóa thư mục trên Backend:', err);
        }
        setNoteFolders((prev) => {
          const next = prev.filter((f) => f.id !== folderId);
          try {
            localStorage.setItem('note_folder_custom_order', JSON.stringify(next.map((f) => f.id)));
          } catch {}
          return next;
        });
        setReadingLists((prev) =>
          prev.map((l) =>
            l.folderId === folderId
              ? { ...l, folderId: null, folderCode: null, folderName: null }
              : l
          )
        );
        showToast('Đã xóa thư mục thành công!');
      },
    });
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
        try {
          const saved = localStorage.getItem('reading_list_custom_order');
          if (saved) {
            const orderIds = JSON.parse(saved).filter((item) => String(item) !== String(id));
            localStorage.setItem('reading_list_custom_order', JSON.stringify(orderIds));
          }
        } catch {}
        if (selectedReadingListId === id) {
          setSelectedReadingListId(null);
          setCurrentView('master');
        }
      },
    });
  };

  // Reorder Reading Lists (Drag and drop)
  const handleReorderReadingLists = async (reorderedLists) => {
    setReadingLists(reorderedLists);
    try {
      const orderIds = reorderedLists.map((l) => l.id);
      localStorage.setItem('reading_list_custom_order', JSON.stringify(orderIds));
      if (isBackendConnected) {
        await noteListApi.reorder(orderIds);
      }
    } catch (e) {
      console.warn('Lỗi khi lưu thứ tự reading list vào backend/localStorage:', e);
    }
  };

  // Reorder Note Folders (Drag and drop thư mục bên menu trái)
  const handleReorderNoteFolders = async (reorderedFolders) => {
    setNoteFolders(reorderedFolders);
    try {
      const orderIds = reorderedFolders.map((f) => f.id);
      localStorage.setItem('note_folder_custom_order', JSON.stringify(orderIds));
      if (isBackendConnected) {
        await noteFolderApi.reorder(orderIds);
      }
    } catch (e) {
      console.warn('Lỗi khi lưu thứ tự noteFolders vào backend/localStorage:', e);
    }
  };

  // Di chuyển danh sách từ vựng sang thư mục khác (hoặc ra ngoài danh sách riêng lẻ)
  const handleMoveReadingListToFolder = async ({
    listId,
    targetFolderId,
    targetListId = null,
    dropPosition = 'after',
  }) => {
    const list = readingLists.find((l) => String(l.id) === String(listId));
    if (!list) return;

    const targetFolder = targetFolderId
      ? noteFolders.find((f) => String(f.id) === String(targetFolderId))
      : null;

    const updatedPayload = {
      ...list,
      folderId: targetFolder ? targetFolder.id : null,
      folderCode: targetFolder ? targetFolder.code : null,
      folderName: targetFolder ? targetFolder.name : null,
    };

    try {
      if (isBackendConnected) {
        await noteListApi.update(list.id, updatedPayload);
      }
    } catch (err) {
      console.error('Lỗi khi cập nhật thư mục cho danh sách trên backend:', err);
    }

    setReadingLists((prev) => {
      let nextLists = prev.map((l) =>
        String(l.id) === String(listId)
          ? {
              ...l,
              folderId: targetFolder ? targetFolder.id : null,
              folderCode: targetFolder ? targetFolder.code : null,
              folderName: targetFolder ? targetFolder.name : null,
            }
          : l
      );

      // Nếu có thả trước/sau một danh sách cụ thể ở thư mục đích
      if (targetListId && String(targetListId) !== String(listId)) {
        const movedItem = nextLists.find((l) => String(l.id) === String(listId));
        if (movedItem) {
          nextLists = nextLists.filter((l) => String(l.id) !== String(listId));
          const targetIdx = nextLists.findIndex((l) => String(l.id) === String(targetListId));
          if (targetIdx !== -1) {
            const insertIdx = dropPosition === 'before' ? targetIdx : targetIdx + 1;
            nextLists.splice(insertIdx, 0, movedItem);
          } else {
            nextLists.push(movedItem);
          }
        }
      }

      try {
        const orderIds = nextLists.map((l) => l.id);
        localStorage.setItem('reading_list_custom_order', JSON.stringify(orderIds));
        if (isBackendConnected) {
          noteListApi.reorder(orderIds).catch((err) => console.warn('Lỗi đồng bộ thứ tự list sau khi di chuyển:', err));
        }
      } catch {}

      return nextLists;
    });

    const targetName = targetFolder ? targetFolder.name : 'Danh sách riêng lẻ';
    showToast({
      title: 'Chuyển thư mục thành công',
      message: `Đã chuyển danh sách "${list.title || list.code || 'LIST'}" sang "${targetName}"`,
      type: 'success',
    });
  };

  // Update Reading List (syncs to Spring Boot if available)
  const handleUpdateReadingList = async (id, updatedPayload, options = {}) => {
    // Kiểm tra trùng mã danh sách khi cập nhật (ngoại trừ chính nó)
    if (updatedPayload.code !== undefined && updatedPayload.code !== null) {
      const targetCode = String(updatedPayload.code).trim().toUpperCase();
      if (
        targetCode &&
        readingLists.some(
          (r) =>
            String(r.id) !== String(id) &&
            (r.code || r.shortTitle || '').trim().toUpperCase() === targetCode
        )
      ) {
        showNotification({
          title: 'Trùng mã danh sách',
          message: `Mã danh sách "${updatedPayload.code}" đã được sử dụng bởi danh sách khác. Vui lòng chọn một mã khác!`,
          type: 'danger',
          isAlertOnly: true,
          confirmText: 'Đã hiểu',
        });
        return;
      }
    }

    try {
      if (isBackendConnected) {
        const updated = await noteListApi.update(id, updatedPayload);
        if (updated) {
          const folder = updatedPayload.folderId
            ? noteFolders.find((f) => String(f.id) === String(updatedPayload.folderId))
            : null;
          const enriched = {
            ...updated,
            folderId: updated.folderId !== undefined ? updated.folderId : (folder ? folder.id : null),
            folderCode: updated.folderCode !== undefined ? updated.folderCode : (folder ? folder.code : null),
            folderName: updated.folderName !== undefined ? updated.folderName : (folder ? folder.name : null),
          };
          setReadingLists((prev) =>
            prev.map((r) => (r.id === id ? { ...r, ...enriched } : r))
          );
          if (!options?.silent) {
            showToast('Cập nhật bài đọc thành công!');
          }
          return enriched;
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
        const folder = updatedPayload.folderId
          ? noteFolders.find((f) => String(f.id) === String(updatedPayload.folderId))
          : null;
        return {
          ...r,
          ...updatedPayload,
          code,
          title,
          shortTitle: code || r.shortTitle,
          fullTitle: code ? `${code}: ${title}` : title,
          folderId: updatedPayload.folderId !== undefined ? (folder ? folder.id : null) : r.folderId,
          folderCode: updatedPayload.folderId !== undefined ? (folder ? folder.code : null) : r.folderCode,
          folderName: updatedPayload.folderId !== undefined ? (folder ? folder.name : null) : r.folderName,
        };
      })
    );
    if (!options?.silent) {
      showToast('Cập nhật bài đọc thành công!');
    }
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

  // Delete Category (Topic Vocabulary)
  const handleDeleteCategory = (cat) => {
    showNotification({
      title: 'Xóa chủ đề từ vựng',
      message: `Bạn có chắc chắn muốn xóa chủ đề "${cat.name}" khỏi hệ thống Topic Vocabulary? Các từ vựng sẽ không bị xóa mà chỉ được gỡ bỏ khỏi chủ đề này.`,
      type: 'danger',
      confirmText: 'Xóa chủ đề',
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

  // Delete Word Family
  const handleDeleteWordFamily = (family) => {
    if (!family) return;
    const { id, rootWord } = family;
    showNotification({
      title: 'Xóa gia đình từ (Word Family)',
      message: `Bạn có chắc chắn muốn xóa gia đình từ "${rootWord}"? Các từ vựng thuộc cụm này sẽ được gỡ liên kết (vẫn được lưu an toàn trong kho từ vựng).`,
      type: 'danger',
      confirmText: 'Xóa gia đình từ',
      onConfirm: async () => {
        try {
          if (id && isBackendConnected) {
            await wordFamilyApi.delete(id);
          }
        } catch (err) {
          console.warn('Lỗi khi xóa Word Family trên Backend, xóa cục bộ:', err);
        }

        // 1. Remove from wordFamilies
        setWordFamilies((prev) =>
          prev.filter(
            (wf) => !((id && wf.id === id) || (rootWord && wf.rootWord?.toLowerCase() === rootWord.toLowerCase()))
          )
        );

        // 2. Unlink vocabularies that belonged to this family
        setVocabList((prev) =>
          prev.map((v) => {
            const matchesFamily =
              (id && v.wordFamilyId === id) ||
              (rootWord && v.rootWord?.toLowerCase() === rootWord.toLowerCase()) ||
              (Array.isArray(v.wordFamily) && v.wordFamily.some((w) => w?.toLowerCase() === rootWord.toLowerCase()));

            if (matchesFamily) {
              return {
                ...v,
                wordFamilyId: null,
                rootWord: null,
                wordFamily: [],
              };
            }
            return v;
          })
        );

        // 3. Clean up localStorage
        try {
          const STORAGE_KEY = 'linearvocab_family_config';
          const raw = localStorage.getItem(STORAGE_KEY);
          if (raw) {
            const cfg = JSON.parse(raw);
            if (id) delete cfg[String(id)];
            if (rootWord) delete cfg[rootWord.toLowerCase()];
            localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
          }
        } catch (e) {
          console.error('Cannot clean up family config in localStorage', e);
        }

        showToast({
          title: 'Đã xóa gia đình từ',
          message: `Gia đình từ "${rootWord}" đã được gỡ bỏ thành công!`,
          type: 'success',
        });
      },
    });
  };

  // Active reading list object (hỗ trợ so khớp id dạng số hoặc chuỗi, hoặc code)
  const activeReadingList = readingLists.find(
    (r) => String(r.id) === String(selectedReadingListId) || r.code === selectedReadingListId
  );

  // Active category object
  const activeCategory = categories.find(
    (c) => String(c.id) === String(selectedCategory) || c.name === selectedCategory
  );

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
          onNavigateProfile={() => {
            setCurrentView('profile');
            setSelectedReadingListId(null);
            setSelectedCategory(null);
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
        <Toast toast={toast} onClose={() => setToast(null)} />
      </div>
    );
  }

  // Trang riêng: Đăng nhập
  if (currentView === 'login') {
    return (
      <div className="min-h-screen bg-white">
        <LoginPage
          onNavigateRegister={() => navigateTo('register')}
          onNavigateHome={() => navigateTo('home')}
          onLoginSuccess={(user, message) => {
            handleAuthSuccess(user, message);
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
        <Toast toast={toast} onClose={() => setToast(null)} />
      </div>
    );
  }

  // Trang riêng: Đăng ký
  if (currentView === 'register') {
    return (
      <div className="min-h-screen bg-white">
        <RegisterPage
          initialData={pendingRegistrationData}
          onNavigateLogin={() => navigateTo('login')}
          onNavigateHome={() => navigateTo('home')}
          onNavigateOtp={(data) => {
            setPendingRegistrationData(data);
            try {
              sessionStorage.setItem('pending_registration', JSON.stringify(data));
            } catch (e) {}
            setCurrentView('verify-otp');
          }}
          onRegisterSuccess={(user, message) => {
            setPendingRegistrationData(null);
            try {
              sessionStorage.removeItem('pending_registration');
            } catch (e) {}
            handleAuthSuccess(user, message);
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
        <Toast toast={toast} onClose={() => setToast(null)} />
      </div>
    );
  }

  // Trang riêng: Xác thực OTP 6 số
  if (currentView === 'verify-otp') {
    return (
      <div className="min-h-screen bg-white">
        <VerifyOtpPage
          registrationData={pendingRegistrationData}
          onNavigateHome={() => navigateTo('home')}
          onRegisterSuccess={(user, message) => {
            setPendingRegistrationData(null);
            try {
              sessionStorage.removeItem('pending_registration');
            } catch (e) {}
            handleAuthSuccess(user, message);
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
        <Toast toast={toast} onClose={() => setToast(null)} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas-slate text-text-body font-body antialiased">
      {/* Nút Floating Action Button (FAB) thêm từ vựng mới */}
      <button
        type="button"
        onClick={handleOpenAddModal}
        title="Thêm từ vựng mới"
        aria-label="Thêm từ vựng mới"
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-crimson-primary hover:bg-crimson-dark text-white flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer group focus:outline-none focus:ring-4 focus:ring-red-300/50"
      >
        <svg
          className="w-7 h-7 text-white transition-transform duration-200 group-hover:rotate-90"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>

      {/* Sidebar Navigation */}
      <Sidebar
        currentView={currentView}
        setCurrentView={setCurrentView}
        selectedReadingListId={selectedReadingListId}
        setSelectedReadingListId={setSelectedReadingListId}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        readingLists={readingLists}
        noteFolders={noteFolders}
        categories={categories}
        vocabList={vocabList}
        onOpenAddModal={handleOpenAddModal}
        onOpenAddReadingListModal={handleOpenAddReadingListModal}
        onOpenAddFolderModal={handleOpenAddFolderModal}
        onEditFolder={handleEditFolder}
        onDeleteFolder={handleDeleteFolder}
        onOpenAddCategoryModal={handleOpenAddCategoryModal}
        onEditCategory={handleEditCategory}
        onDeleteCategory={handleDeleteCategory}
        onEditReadingList={handleEditReadingList}
        onDeleteReadingList={handleDeleteReadingList}
        onReorderReadingLists={handleReorderReadingLists}
        onReorderNoteFolders={handleReorderNoteFolders}
        onMoveReadingListToFolder={handleMoveReadingListToFolder}
        showNotification={showNotification}
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
          onNavigateProfile={() => {
            setCurrentView('profile');
            setSelectedReadingListId(null);
            setSelectedCategory(null);
          }}
        />

        {/* Dynamic Page Views */}
        <main className="pt-16 min-h-screen">
          {currentView === 'profile' && (
            <ProfilePage
              currentUser={currentUser}
              onUpdateUser={setCurrentUser}
              vocabList={vocabList || []}
              readingLists={readingLists || []}
              categories={categories || []}
              wordFamilies={wordFamilies || []}
              onNavigateVocab={() => {
                setCurrentView('master');
                setSelectedReadingListId(null);
                setSelectedCategory(null);
              }}
              onOpenAddModal={handleOpenAddModal}
            />
          )}

          {currentView === 'master' && (
            <MasterListPage
              vocabList={vocabList}
              onOpenAddModal={handleOpenAddModal}
              onEditVocab={handleEditVocab}
              onDeleteVocab={handleDeleteVocab}
              onPronounce={handlePronounce}
              onSelectRelatedWord={handleSelectRelatedWord}
              onOpenRelatedGroup={handleOpenRelatedGroup}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              selectedPos={selectedPos}
              setSelectedPos={setSelectedPos}
              selectedCategory={selectedCategory}
              lastMutation={lastMutation}
              sortBy={sortBy}
              setSortBy={setSortBy}
            />
          )}

          {currentView === 'reading-list' && (
            activeReadingList ? (
              <ReadingListView
                readingList={activeReadingList}
                vocabList={vocabList}
                existingLists={readingLists}
                noteFolders={noteFolders}
                onOpenAddModal={handleOpenAddModal}
                onEditVocab={handleEditVocab}
                onPronounce={handlePronounce}
                onDeleteVocab={handleDeleteVocab}
                onDeleteReadingList={handleDeleteReadingList}
                onUpdateReadingList={handleUpdateReadingList}
                onEditReadingList={handleEditReadingList}
                showNotification={showNotification}
                onSelectRelatedWord={handleSelectRelatedWord}
                onOpenRelatedGroup={handleOpenRelatedGroup}
                onBackToListVocabulary={() => {
                  setCurrentView('list-vocabulary');
                  setSelectedReadingListId(null);
                  setSelectedCategory(null);
                }}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                selectedPos={selectedPos}
                setSelectedPos={setSelectedPos}
                sortBy={sortBy}
                setSortBy={setSortBy}
              />
            ) : loading ? (
              <div className="p-16 max-w-lg mx-auto text-center flex flex-col items-center justify-center gap-3">
                <span className="material-symbols-outlined text-4xl text-crimson-primary animate-spin">progress_activity</span>
                <p className="font-bold text-base text-text-high-contrast">Đang tải danh sách bài đọc...</p>
                <p className="text-xs text-text-muted">Hệ thống đang đồng bộ dữ liệu từ máy chủ...</p>
              </div>
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
                    onClick={() => {
                      setCurrentView('list-vocabulary');
                      setSelectedReadingListId(null);
                      setSelectedCategory(null);
                    }}
                    className="px-4 py-2 rounded-lg bg-red-50 text-crimson-primary text-xs font-bold hover:bg-red-100"
                  >
                    Xem List Vocabulary
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
                onSelectRelatedWord={handleSelectRelatedWord}
                onOpenRelatedGroup={handleOpenRelatedGroup}
                onEditCategory={handleEditCategory}
                onDeleteCategory={handleDeleteCategory}
                onBackToTopicVocabulary={() => {
                  setCurrentView('topic-vocabulary');
                  setSelectedCategory(null);
                  setSelectedReadingListId(null);
                }}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                selectedPos={selectedPos}
                setSelectedPos={setSelectedPos}
                sortBy={sortBy}
                setSortBy={setSortBy}
              />
            ) : loading ? (
              <div className="p-16 max-w-lg mx-auto text-center flex flex-col items-center justify-center gap-3">
                <span className="material-symbols-outlined text-4xl text-crimson-primary animate-spin">progress_activity</span>
                <p className="font-bold text-base text-text-high-contrast">Đang tải chủ đề...</p>
                <p className="text-xs text-text-muted">Hệ thống đang đồng bộ dữ liệu từ máy chủ...</p>
              </div>
            ) : (
              <div className="p-12 max-w-lg mx-auto text-center flex flex-col items-center justify-center gap-3">
                <span className="material-symbols-outlined text-4xl text-text-disabled">category</span>
                <p className="font-bold text-base text-text-high-contrast">Chưa chọn chủ đề từ vựng</p>
                <p className="text-xs text-text-muted">
                  Vui lòng chọn một chủ đề từ menu bên trái hoặc tạo một chủ đề mới.
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <button
                    type="button"
                    onClick={handleOpenAddCategoryModal}
                    className="px-4 py-2 rounded-lg bg-crimson-primary text-white text-xs font-bold hover:bg-crimson-dark shadow-xs"
                  >
                    + Tạo chủ đề mới
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentView('topic-vocabulary');
                      setSelectedReadingListId(null);
                      setSelectedCategory(null);
                    }}
                    className="px-4 py-2 rounded-lg bg-red-50 text-crimson-primary text-xs font-bold hover:bg-red-100"
                  >
                    Xem Topic Vocabulary
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

          {currentView === 'topic-vocabulary' && (
            <div className="px-6 lg:px-8 pt-5 pb-8 max-w-[1600px] mx-auto w-full">
              <TopicVocabularyPage
                categories={categories}
                vocabList={vocabList}
                onSelectCategory={(catName) => {
                  setSelectedCategory(catName);
                  setSelectedReadingListId(null);
                  setCurrentView('category');
                }}
                onOpenAddCategoryModal={handleOpenAddCategoryModal}
                onOpenAddModal={handleOpenAddModal}
                onEditCategory={handleEditCategory}
                onDeleteCategory={handleDeleteCategory}
              />
            </div>
          )}

          {currentView === 'word-families' && (
            <WordFamiliesPage
              vocabList={vocabList}
              wordFamilies={wordFamilies}
              onPronounce={handlePronounce}
              onOpenAddModal={() => setIsAddModalOpen(true)}
              onEditVocab={handleEditVocab}
              onUpdateWordFamily={handleUpdateWordFamily}
              onDeleteWordFamily={handleDeleteWordFamily}
            />
          )}

          {currentView === 'list-vocabulary' && (
            <div className="px-6 lg:px-8 pt-5 pb-8 max-w-[1600px] mx-auto w-full">
              <ListVocabularyPage
                readingLists={readingLists}
                noteFolders={noteFolders}
                vocabList={vocabList}
                onSelectList={(listId) => {
                  setSelectedReadingListId(listId);
                  setSelectedCategory(null);
                  setCurrentView('reading-list');
                }}
                onOpenAddReadingListModal={handleOpenAddReadingListModal}
                onOpenAddFolderModal={handleOpenAddFolderModal}
                onOpenAddModal={handleOpenAddModal}
                onEditReadingList={handleEditReadingList}
                onDeleteReadingList={handleDeleteReadingList}
                onEditFolder={handleEditFolder}
                onDeleteFolder={handleDeleteFolder}
                onReorderReadingLists={handleReorderReadingLists}
                onMoveReadingListToFolder={handleMoveReadingListToFolder}
                showNotification={showNotification}
              />
            </div>
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
        defaultReadingList={currentView === 'reading-list' ? selectedReadingListId : null}
        onOpenAddReadingListModal={handleOpenAddReadingListModal}
        onOpenAddCategoryModal={handleOpenAddCategoryModal}
      />

      {/* Modal Chi Tiết Thẻ Từ Vựng Liên Quan Riêng Lẻ (mở khi click vào từng từ riêng lẻ) */}
      <VocabDetailModal
        isOpen={Boolean(selectedDetailVocab)}
        vocab={selectedDetailVocab}
        vocabList={vocabList}
        sourceWord={detailSourceWord}
        onClose={() => {
          setSelectedDetailVocab(null);
          setDetailSourceWord(null);
        }}
        onPronounce={handlePronounce}
        onEdit={(vocabToEdit) => {
          handleEditVocab(vocabToEdit);
        }}
        onDelete={handleDeleteVocab}
        onSelectRelatedWord={handleSelectRelatedWord}
        onOpenRelatedGroup={handleOpenRelatedGroup}
        onScrollToCard={handleScrollToCard}
      />

      {/* Hộp Thoại Cuộn Toàn Bộ Nhóm Từ Liên Quan (mở khi click vào nút Nét nghĩa tương đương / Đồng nghĩa) */}
      <RelatedVocabGroupModal
        isOpen={Boolean(relatedGroupModalData)}
        data={relatedGroupModalData}
        vocabList={vocabList}
        onClose={() => setRelatedGroupModalData(null)}
        onPronounce={handlePronounce}
        onEdit={(vocabToEdit) => {
          handleEditVocab(vocabToEdit);
        }}
        onDelete={handleDeleteVocab}
        onSelectRelatedWord={handleSelectRelatedWord}
        onOpenRelatedGroup={handleOpenRelatedGroup}
        onScrollToCard={handleScrollToCard}
        onCreateVocab={(newWord) => {
          setEditingVocab({ word: newWord });
          setIsAddModalOpen(true);
        }}
      />

      {/* Modal Thêm / Chỉnh Sửa Danh Sách Bài Đọc (Cấp 3) */}
      <AddReadingListModal
        isOpen={isAddReadingListModalOpen}
        initialData={editingReadingList}
        onClose={() => {
          setIsAddReadingListModalOpen(false);
          setEditingReadingList(null);
          setDefaultFolderForNewList(null);
        }}
        onSave={handleSaveReadingList}
        existingLists={readingLists}
        existingFolders={noteFolders}
        defaultFolderId={defaultFolderForNewList}
        onOpenCreateFolder={() => {
          setIsNoteFolderModalOpen(true);
        }}
      />

      {/* Modal Thêm / Chỉnh Sửa Thư Mục / Bộ Đề (Cấp 2) */}
      <AddNoteFolderModal
        isOpen={isNoteFolderModalOpen}
        initialData={editingNoteFolder}
        onClose={() => {
          setIsNoteFolderModalOpen(false);
          setEditingNoteFolder(null);
        }}
        onSave={handleSaveNoteFolder}
        existingFolders={noteFolders}
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

      {/* Toast Notification (Góc trên cùng bên phải) */}
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
