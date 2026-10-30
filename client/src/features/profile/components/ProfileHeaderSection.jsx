import React, { useState } from 'react';
import UserProfileCard from './UserProfileCard';
import CompetencyRadarChart from './CompetencyRadarChart';
import CompetencyDetailModal from './CompetencyDetailModal';
import AssessmentQuizModal from './AssessmentQuizModal';
import EditProfileModal from './EditProfileModal';

/**
 * ProfileHeaderSection: Phần Profile & Sơ đồ năng lực
 * Nằm trên thẻ All Vocab (Master List)
 * 
 * Bố cục:
 * - Góc bên trái: Thông tin cá nhân học viên (dùng để đăng ký tài khoản)
 * - Bên phải trên cùng: Bảng sơ đồ năng lực (Radar chart chuẩn hóa, siêu đẹp)
 * - Tích hợp đầy đủ các modal: Chi tiết, Đánh giá đầu vào, Chỉnh sửa hồ sơ
 */
export default function ProfileHeaderSection({
  currentUser,
  onUpdateUser,
}) {
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isAssessmentModalOpen, setIsAssessmentModalOpen] = useState(false);
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <section className="px-6 lg:px-8 pt-5 pb-2">
      {/* Top Banner Control Bar (Header of Profile Section) */}
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-crimson-primary animate-pulse" />
          <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
            Hồ sơ học viên & Ma trận năng lực
          </span>
          <span className="text-[11px] text-slate-400 hidden sm:inline">
            (LinearVocab LMS Standard)
          </span>
        </div>

        {/* Collapse / Expand Toggle Button */}
        <button
          type="button"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold text-slate-600 hover:text-crimson-primary hover:bg-slate-100 transition-all cursor-pointer border border-slate-200/80 bg-white shadow-2xs"
          title={isCollapsed ? 'Mở rộng bảng hồ sơ' : 'Thu gọn bảng hồ sơ'}
        >
          <span className="material-symbols-outlined text-[16px]">
            {isCollapsed ? 'expand_more' : 'expand_less'}
          </span>
          <span>{isCollapsed ? 'Hiện hồ sơ & Năng lực' : 'Thu gọn'}</span>
        </button>
      </div>

      {/* Main Grid: Left = User Info, Right = Radar Competency Chart */}
      {!isCollapsed && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch transition-all duration-300">
          {/* CỘT BÊN TRÁI: THÔNG TIN CÁ NHÂN (Các thông tin dùng để đăng ký tài khoản) */}
          <div className="lg:col-span-4 xl:col-span-4 flex flex-col">
            <UserProfileCard
              currentUser={currentUser}
              onOpenEditModal={() => setIsEditProfileModalOpen(true)}
            />
          </div>

          {/* CỘT BÊN PHẢI: BẢNG SƠ ĐỒ NĂNG LỰC (Hình 2 nhưng thiết kế hiện đại & đẹp mắt hơn) */}
          <div className="lg:col-span-8 xl:col-span-8 flex flex-col">
            <CompetencyRadarChart
              onOpenAssessmentModal={() => setIsAssessmentModalOpen(true)}
              onOpenDetailModal={() => setIsDetailModalOpen(true)}
            />
          </div>
        </div>
      )}

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
    </section>
  );
}
