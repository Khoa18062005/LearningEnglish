import React, { useState } from 'react';
import UserProfileCard from '../components/UserProfileCard';
import CompetencyRadarChart from '../components/CompetencyRadarChart';
import CompetencyDetailModal from '../components/CompetencyDetailModal';
import AssessmentQuizModal from '../components/AssessmentQuizModal';
import EditProfileModal from '../components/EditProfileModal';
import astronautImg from '../../../assets/Chibi_PhiHanhGia.png';

/**
 * ProfilePage: Trang Profile riêng biệt (Thẻ Profile trong Sidebar)
 * Nằm bên trên thẻ All Vocabulary trong danh mục VIEWS của Sidebar.
 * 
 * Bố cục:
 * - Góc bên trái: Thông tin cá nhân (các thông tin dùng để đăng ký tài khoản)
 * - Bên phải trên cùng: Bảng sơ đồ năng lực (Radar chart chuẩn hóa, siêu đẹp)
 * - Tích hợp thống kê học tập, lộ trình Linearthinking và các modal tương tác
 */
export default function ProfilePage({
  currentUser,
  onUpdateUser,
  vocabList = [],
  readingLists = [],
  categories = [],
  onNavigateVocab,
  onOpenAddModal,
}) {
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isAssessmentModalOpen, setIsAssessmentModalOpen] = useState(false);
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);

  // Quick statistics
  const totalWords = vocabList?.length || 0;
  const totalVocab = totalWords;
  const totalReadingLists = readingLists?.length || 0;
  const totalCategories = categories?.length || 0;

  const totalPatterns = vocabList.reduce(
    (acc, w) => acc + (w.forms?.filter((f) => f.type === 'pattern' || (f.pattern && !f.collocation)).length || 0),
    0
  );
  const totalCollocations = vocabList.reduce(
    (acc, w) => acc + (w.forms?.filter((f) => f.type === 'collocation' || (f.collocation && !f.pattern)).length || 0),
    0
  );

  // User Data & Formatters for Banner
  const userData = {
    fullName: currentUser?.fullName || 'Nguyễn Quốc Khoa',
    email: currentUser?.email || 'nguyenquockhoa18062005@gmail.com',
    dateOfBirth: currentUser?.dateOfBirth || '2005-06-18',
    gender: currentUser?.gender || 'MALE',
    createdAt: currentUser?.createdAt || '2026-10-30',
  };

  // Tính số ngày tham gia kể từ ngày tạo tài khoản
  const calculateDaysJoined = (createdDateStr) => {
    if (!createdDateStr) return 1;
    try {
      const datePart = createdDateStr.toString().split('T')[0];
      const parts = datePart.split('-');
      if (parts.length === 3) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        const createdDate = new Date(year, month, day);
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const diffMs = today.getTime() - createdDate.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        return Math.max(1, diffDays + 1);
      }
      const created = new Date(createdDateStr);
      if (isNaN(created.getTime())) return 1;
      const now = new Date();
      const diffMs = now.getTime() - created.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      return Math.max(1, diffDays + 1);
    } catch {
      return 1;
    }
  };

  const daysJoined = calculateDaysJoined(userData.createdAt);


  return (
    <div className="flex flex-col w-full pb-16">
      {/* ======================================================== */}
      {/* TOP RED HERO CARD (Profile Banner + Mascot + 4 Stat Cards) */}
      {/* ======================================================== */}
      <section className="px-6 lg:px-8 pt-5 pb-3">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#c41b26] via-[#d3212c] to-[#c61e27] shadow-lg border border-red-500/25 px-6 py-5 sm:px-8 sm:py-5 text-white transition-all">
          {/* Decorative glowing halos in background */}
          <div className="absolute -left-12 -top-12 w-80 h-80 bg-white/15 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -right-12 -bottom-12 w-72 h-72 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute left-1/4 -top-12 w-64 h-64 bg-white/10 rounded-full blur-xl pointer-events-none" />

          {/* Decorative Concentric Circular Waves */}
          <svg
            className="absolute -left-10 -top-10 w-96 h-96 text-white/5 pointer-events-none"
            viewBox="0 0 200 200"
          >
            <circle cx="100" cy="100" r="25" fill="none" stroke="currentColor" strokeWidth="1" />
            <circle cx="100" cy="100" r="50" fill="none" stroke="currentColor" strokeWidth="1" />
            <circle cx="100" cy="100" r="75" fill="none" stroke="currentColor" strokeWidth="1" />
            <circle cx="100" cy="100" r="100" fill="none" stroke="currentColor" strokeWidth="1" />
          </svg>

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            {/* Cột trái: Badges + Tiêu đề + Dòng chào mừng + 4 Thẻ thông tin căn giữa đều đối xứng */}
            <div className="flex flex-col gap-3.5 sm:gap-4 flex-1 min-w-0 max-w-3xl lg:max-w-4xl">
              {/* Badges & Title */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md bg-yellow-400/30 text-yellow-200 text-[10px] font-black uppercase tracking-wider border border-yellow-300/60 backdrop-blur-xs select-none shadow-[0_0_12px_rgba(250,204,21,0.25)]">
                    USER PROFILE
                  </span>
                  <span className="text-white/80 text-xs font-semibold">
                    Ma trận năng lực Linearthinking
                  </span>
                </div>

                <h1 className="font-headline text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight drop-shadow-xs leading-tight">
                  Hồ sơ người dùng & Sơ đồ năng lực
                </h1>

                {/* Welcome Greeting */}
                <p className="text-white/90 text-xs sm:text-sm font-medium tracking-wide mt-0.5 drop-shadow-2xs">
                  Hello <span className="font-bold text-white">{userData.fullName || 'Nguyen Quoc Khoa'}</span>, Thanks for using Linear Vocabulary!
                </p>
              </div>

              {/* 4 Thẻ thông tin thu nhỏ gọn gàng, căn lề trên dưới đối xứng tuyệt đối */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {/* Card 1: TOTAL WORDS */}
                <div
                  onClick={onNavigateVocab}
                  className="bg-white/15 hover:bg-white/20 transition-all duration-200 rounded-xl px-2.5 py-2 flex items-center gap-2.5 border border-white/25 backdrop-blur-xs shadow-xs cursor-pointer group/stat"
                  title="View All Vocabulary"
                >
                  <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-white shrink-0 border border-white/20 group-hover/stat:scale-105 transition-transform">
                    <span className="material-symbols-outlined text-[18px]">format_list_bulleted</span>
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-white/80 truncate">
                      TOTAL WORDS
                    </span>
                    <span className="font-headline text-base font-black text-white leading-none mt-0.5">
                      {totalWords}
                    </span>
                  </div>
                </div>

                {/* Card 2: READING LISTS */}
                <div className="bg-white/15 hover:bg-white/20 transition-all duration-200 rounded-xl px-2.5 py-2 flex items-center gap-2.5 border border-white/25 backdrop-blur-xs shadow-xs group/stat">
                  <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-white shrink-0 border border-white/20 group-hover/stat:scale-105 transition-transform">
                    <span className="material-symbols-outlined text-[18px]">auto_stories</span>
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-white/80 truncate">
                      READING LISTS
                    </span>
                    <span className="font-headline text-base font-black text-white leading-none mt-0.5">
                      {totalReadingLists}
                    </span>
                  </div>
                </div>

                {/* Card 3: CATEGORIES */}
                <div className="bg-white/15 hover:bg-white/20 transition-all duration-200 rounded-xl px-2.5 py-2 flex items-center gap-2.5 border border-white/25 backdrop-blur-xs shadow-xs group/stat">
                  <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-white shrink-0 border border-white/20 group-hover/stat:scale-105 transition-transform">
                    <span className="material-symbols-outlined text-[18px]">category</span>
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-white/80 truncate">
                      CATEGORIES
                    </span>
                    <span className="font-headline text-base font-black text-white leading-none mt-0.5">
                      {totalCategories}
                    </span>
                  </div>
                </div>

                {/* Card 4: DAYS JOINED */}
                <div className="bg-white/15 hover:bg-white/20 transition-all duration-200 rounded-xl px-2.5 py-2 flex items-center gap-2.5 border border-white/25 backdrop-blur-xs shadow-xs group/stat">
                  <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-white shrink-0 border border-white/20 group-hover/stat:scale-105 transition-transform">
                    <span className="material-symbols-outlined text-[18px]">calendar_month</span>
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-white/80 truncate">
                      DAYS JOINED
                    </span>
                    <span className="font-headline text-base font-black text-white leading-none mt-0.5">
                      {daysJoined}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Cột phải: Phi hành gia to đẹp nổi bật, xác định chiều cao chuẩn xác */}
            <div className="relative shrink-0 flex items-center justify-center self-center md:self-auto group/mascot pr-1 sm:pr-4">
              <div className="absolute inset-0 bg-white/20 rounded-full blur-2xl scale-90 animate-pulse group-hover/mascot:scale-110 transition-transform duration-300" />
              <img
                src={astronautImg}
                alt="Chibi Astronaut Mascot"
                className="relative z-10 w-auto h-36 sm:h-40 lg:h-44 object-contain select-none drop-shadow-2xl transition-all duration-300 ease-out hover:scale-110"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* MAIN TWO-COLUMN LAYOUT: Left (Info) | Right (Radar)      */}
      {/* ======================================================== */}
      <section className="px-6 lg:px-8 py-2">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          {/* CỘT BÊN TRÁI: THÔNG TIN CÁ NHÂN (Các thông tin dùng để đăng ký tài khoản) */}
          <div className="lg:col-span-4 xl:col-span-4 flex flex-col gap-5">
            <UserProfileCard
              currentUser={currentUser}
              onOpenEditModal={() => setIsEditProfileModalOpen(true)}
            />

            {/* Thống kê học tập bổ trợ */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[17px] text-crimson-primary">monitoring</span>
                  <span>Tiến độ tích lũy từ vựng</span>
                </span>
                <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                  Linear System
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] text-slate-400 block font-medium">Từ đã lưu</span>
                  <span className="text-base font-black text-slate-900 mt-0.5 block">{totalVocab}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-blue-50/60 border border-blue-100">
                  <span className="text-[10px] text-blue-500 block font-medium">Patterns</span>
                  <span className="text-base font-black text-blue-700 mt-0.5 block">{totalPatterns}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-pink-50/60 border border-pink-100">
                  <span className="text-[10px] text-pink-500 block font-medium">Collocation</span>
                  <span className="text-base font-black text-pink-700 mt-0.5 block">{totalCollocations}</span>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-100 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-emerald-600 text-[18px]">workspace_premium</span>
                  <span className="font-bold text-emerald-800 text-[11px]">Cấp độ tương đương:</span>
                </div>
                <span className="px-2 py-0.5 rounded-md bg-emerald-600 text-white font-black text-[11px] shadow-xs">
                  IELTS 6.5 - 7.0 (B2+)
                </span>
              </div>
            </div>
          </div>

          {/* CỘT BÊN PHẢI TRÊN CÙNG: BẢNG SƠ ĐỒ NĂNG LỰC (RADAR CHART) */}
          <div className="lg:col-span-8 xl:col-span-8 flex flex-col gap-5">
            <CompetencyRadarChart
              onOpenAssessmentModal={() => setIsAssessmentModalOpen(true)}
              onOpenDetailModal={() => setIsDetailModalOpen(true)}
            />

            {/* Lộ trình gợi ý & Nhận xét sư phạm */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-4.5 flex flex-col gap-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-amber-500 text-[19px]">lightbulb</span>
                  <h3 className="font-bold text-xs text-slate-800">
                    Phân tích & Lộ trình đề xuất theo phương pháp Linearthinking
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsDetailModalOpen(true)}
                  className="text-xs font-bold text-crimson-primary hover:underline flex items-center gap-0.5 cursor-pointer"
                >
                  <span>Xem báo cáo đầy đủ</span>
                  <span className="material-symbols-outlined text-[15px]">chevron_right</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                {/* Điểm mạnh */}
                <div className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-100/80 flex flex-col gap-1">
                  <span className="font-bold text-emerald-800 flex items-center gap-1.5 text-xs">
                    <span className="material-symbols-outlined text-[15px] text-emerald-600">check_circle</span>
                    <span>Thế mạnh nổi bật</span>
                  </span>
                  <p className="text-slate-600 leading-relaxed text-[11px] mt-0.5">
                    <strong>Cấu trúc & Pattern câu (92/100)</strong> và <strong>Đọc hiểu Linearthinking (90/100)</strong> đạt mức độ xuất sắc. Khả năng liên kết ý và phân tích câu phức rất tốt.
                  </p>
                </div>

                {/* Điểm cần phát triển */}
                <div className="p-3 rounded-xl bg-amber-50/50 border border-amber-100/80 flex flex-col gap-1">
                  <span className="font-bold text-amber-800 flex items-center gap-1.5 text-xs">
                    <span className="material-symbols-outlined text-[15px] text-amber-600">trending_up</span>
                    <span>Mục tiêu cần nâng cao</span>
                  </span>
                  <p className="text-slate-600 leading-relaxed text-[11px] mt-0.5">
                    <strong>Họ từ vựng (Word Families - 70/100)</strong> và <strong>Ứng dụng Viết (72/100)</strong> có biên độ tăng trưởng lớn. Nên tăng cường luyện bài tập biến đổi từ loại và đặt câu ứng dụng.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* MODALS TƯƠNG TÁC                                         */}
      {/* ======================================================== */}
      {/* Modal Báo cáo Chi tiết Sơ đồ năng lực */}
      <CompetencyDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        onOpenAssessment={() => {
          setIsDetailModalOpen(false);
          setIsAssessmentModalOpen(true);
        }}
      />

      {/* Modal Làm bài đánh giá năng lực đầu vào */}
      <AssessmentQuizModal
        isOpen={isAssessmentModalOpen}
        onClose={() => setIsAssessmentModalOpen(false)}
        onComplete={() => {
          setIsAssessmentModalOpen(false);
        }}
      />

      {/* Modal Chỉnh sửa thông tin cá nhân */}
      <EditProfileModal
        isOpen={isEditProfileModalOpen}
        currentUser={currentUser}
        onClose={() => setIsEditProfileModalOpen(false)}
        onSave={(updatedUser) => {
          if (onUpdateUser) onUpdateUser(updatedUser);
        }}
      />
    </div>
  );
}
