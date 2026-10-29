const ALPHABET_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

export default function HomePage({
  currentUser,
  onNavigateLogin,
  onNavigateRegister,
  onNavigateVocab,
  onLogout,
}) {
  return (
    <div className="min-h-screen bg-white text-[#1E293B] font-sans selection:bg-surface-crimson-soft selection:text-crimson-dark relative flex flex-col justify-between">
      {/* Top Right User Profile (Chỉ hiển thị khi đã đăng nhập) */}
      {currentUser && (
        <div className="absolute top-5 right-5 sm:top-8 sm:right-10 z-30 flex items-center gap-2.5 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-200/90 shadow-xs">
          <div className="w-7 h-7 rounded-full bg-crimson-primary text-white flex items-center justify-center font-bold text-xs shadow-xs">
            {currentUser.fullName ? currentUser.fullName.charAt(0).toUpperCase() : 'U'}
          </div>
          <span className="hidden sm:inline text-xs font-bold text-text-high-contrast max-w-[120px] truncate">
            {currentUser.fullName}
          </span>
          <button
            type="button"
            onClick={onLogout}
            title="Đăng xuất"
            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">logout</span>
          </button>
        </div>
      )}

      {/* HERO SECTION */}
      <section className="relative overflow-hidden flex-1 flex flex-col justify-between items-center pt-16 sm:pt-20 pb-0 bg-gradient-to-b from-[#F8FAFC] via-white to-white">
        {/* Subtle Decorative Background Lines */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[600px] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-red-50/50 via-transparent to-transparent pointer-events-none" />

        {/* GIANT DOL-STYLE ROTATING CLOCK WHEEL (ĐỒNG HỒ KHỔNG LỒ) */}
        <div
          className="absolute top-[230px] sm:top-[250px] left-1/2 -translate-x-1/2 w-[2000px] h-[2000px] pointer-events-none origin-top scale-[0.45] sm:scale-[0.62] md:scale-[0.78] lg:scale-[0.92] xl:scale-100 z-0 select-none"
          style={{
            WebkitMaskImage: 'linear-gradient(to right, black 0%, black 23%, transparent 35%, transparent 65%, black 77%, black 100%)',
            maskImage: 'linear-gradient(to right, black 0%, black 23%, transparent 35%, transparent 65%, black 77%, black 100%)',
          }}
        >
          {/* Rotating Wheel Container (Không ngừng khi hover) */}
          <div className="w-full h-full relative animate-alphabet-spin">
            {/* Giant Clock Face SVG with 72 Radiating Ticks & Concentric Tracks */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none"
              viewBox="0 0 2000 2000"
            >
              {/* Outer Dashed Orbit Track (R=920) */}
              <circle
                cx="1000"
                cy="1000"
                r="920"
                fill="none"
                stroke="rgba(203, 213, 225, 0.85)"
                strokeWidth="2"
                strokeDasharray="6 10"
              />
              {/* Concentric Inner Accent Ring */}
              <circle
                cx="1000"
                cy="1000"
                r="875"
                fill="none"
                stroke="rgba(227, 30, 36, 0.16)"
                strokeWidth="1.5"
                strokeDasharray="4 12"
              />
              {/* Hairline Guide Ring */}
              <circle
                cx="1000"
                cy="1000"
                r="830"
                fill="none"
                stroke="rgba(226, 232, 240, 0.6)"
                strokeWidth="1"
              />

              {/* 72 Clock Dial Radiating Ticks (12 Major Hour Markers + 60 Minute Ticks) */}
              {Array.from({ length: 72 }).map((_, idx) => {
                const angle = (idx * (360 / 72)) * (Math.PI / 180);
                const isHour = idx % 6 === 0;
                const rInner = 932;
                const rOuter = isHour ? 968 : 950;
                const x1 = 1000 + Math.cos(angle) * rInner;
                const y1 = 1000 + Math.sin(angle) * rInner;
                const x2 = 1000 + Math.cos(angle) * rOuter;
                const y2 = 1000 + Math.sin(angle) * rOuter;
                return (
                  <line
                    key={idx}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke={isHour ? 'rgba(227, 30, 36, 0.45)' : 'rgba(203, 213, 225, 0.75)'}
                    strokeWidth={isHour ? '3' : '1.5'}
                  />
                );
              })}
            </svg>

            {/* 26 English Alphabet Cards (TĂNG KÍCH THƯỚC 200%: 96px x 96px) */}
            {ALPHABET_LETTERS.map((char, index) => {
              const angleDeg = (index * 360) / 26 - 90;
              const angleRad = (angleDeg * Math.PI) / 180;
              const radius = 920;
              const x = 1000 + radius * Math.cos(angleRad);
              const y = 1000 + radius * Math.sin(angleRad);

              const isVowel = ['A', 'E', 'I', 'O', 'U'].includes(char);
              const isBrand = ['L', 'V'].includes(char);

              return (
                <div
                  key={char}
                  className="absolute pointer-events-auto"
                  style={{
                    left: `${x}px`,
                    top: `${y}px`,
                    transform: 'translate(-50%, -50%)',
                  }}
                >
                  <div className="animate-alphabet-counter">
                    <div
                      className={`w-20 h-20 sm:w-24 sm:h-24 rounded-3xl flex items-center justify-center font-black text-2xl sm:text-3xl shadow-lg border-2 transition-all duration-300 select-none cursor-pointer ${
                        isVowel
                          ? 'bg-red-50/95 text-crimson-primary border-red-200/90 hover:bg-crimson-primary hover:text-white hover:border-crimson-primary hover:scale-110 hover:shadow-2xl'
                          : isBrand
                          ? 'bg-blue-50/95 text-[#1E62DC] border-blue-200/90 hover:bg-[#1E62DC] hover:text-white hover:border-[#1E62DC] hover:scale-110 hover:shadow-2xl'
                          : 'bg-white/95 text-slate-800 border-slate-200 hover:bg-slate-900 hover:text-white hover:border-slate-900 hover:scale-110 hover:shadow-2xl'
                      }`}
                      title={`Ký tự ${char}`}
                    >
                      {char}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 relative z-10 text-center w-full">
          {/* Top 3 Certification Badges (IELTS - TOEIC - PTE) */}
          <div className="flex items-center justify-center gap-3 sm:gap-4 mb-6 sm:mb-8 flex-wrap">
            {/* IELTS Badge */}
            <div className="inline-flex items-center justify-center px-6 sm:px-8 py-2 sm:py-2.5 rounded-full bg-[#E31E24] text-white font-black text-sm sm:text-base tracking-wider uppercase border-2 sm:border-[3px] border-white shadow-[0_10px_25px_rgba(227,30,36,0.3)] rotate-3 hover:rotate-0 hover:scale-105 transition-all duration-200 select-none cursor-default">
              IELTS
            </div>

            {/* TOEIC Badge */}
            <div className="inline-flex items-center justify-center px-6 sm:px-8 py-2 sm:py-2.5 rounded-full bg-[#11224D] text-white font-black text-sm sm:text-base tracking-wider uppercase border-2 sm:border-[3px] border-white shadow-[0_10px_25px_rgba(17,34,77,0.3)] -rotate-1 hover:rotate-0 hover:scale-105 transition-all duration-200 select-none cursor-default">
              TOEIC
            </div>

            {/* PTE Badge */}
            <div className="inline-flex items-center justify-center px-6 sm:px-8 py-2 sm:py-2.5 rounded-full bg-[#1E62DC] text-white font-black text-sm sm:text-base tracking-wider uppercase border-2 sm:border-[3px] border-white shadow-[0_10px_25px_rgba(30,98,220,0.3)] rotate-3 hover:rotate-0 hover:scale-105 transition-all duration-200 select-none cursor-default">
              PTE
            </div>
          </div>

          {/* Main Hero Headline */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-[#1E293B] tracking-tight leading-tight sm:leading-none">
            Ghi từ vựng thông minh
          </h1>

          <div className="mt-2.5 sm:mt-4 flex items-center justify-center gap-2">
            <span className="text-4xl sm:text-6xl lg:text-7xl font-black text-crimson-primary tracking-tight font-sans">
              Linear Vocab
            </span>
            <span className="text-rose-400 text-2xl sm:text-3xl font-bold select-none animate-pulse">
              ✦
            </span>
          </div>

          {/* Stats Bar (Linearthinking | 4,000+ | 20,000+) - Chuẩn phong cách dolenglish.vn */}
          <div className="mt-8 sm:mt-11 max-w-3xl mx-auto flex items-center justify-center divide-x divide-slate-200 text-center px-4 relative z-10">
            <div className="px-4 sm:px-8">
              <p className="text-lg sm:text-2xl font-black text-[#1E293B] tracking-tight">
                Linearthinking
              </p>
              <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">
                TIẾNG ANH TƯ DUY
              </p>
            </div>

            <div className="px-4 sm:px-8">
              <p className="text-lg sm:text-2xl font-black text-[#1E293B] tracking-tight">
                4,000+
              </p>
              <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">
                HỌC VIÊN ĐẠT 7.0+ IELTS
              </p>
            </div>

            <div className="px-4 sm:px-8">
              <p className="text-lg sm:text-2xl font-black text-[#1E293B] tracking-tight">
                20,000+
              </p>
              <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">
                TÂM TÌNH HỌC VIÊN
              </p>
            </div>
          </div>
        </div>

        {/* TWO AUTH ACTION CARDS (ĐĂNG NHẬP & ĐĂNG KÝ) NẰM TRỰC TIẾP TRÊN FOOTER */}
        <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 mt-12 sm:mt-16 z-10">
          <div className="bg-white rounded-t-[32px] sm:rounded-t-[44px] rounded-b-none border-t border-x border-slate-200/90 shadow-[0_-8px_30px_rgba(15,23,42,0.04)] overflow-hidden">
            <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-150">
              {/* Nút 1: Đăng nhập (Bo tròn góc trên bên trái, hover nền đỏ) */}
              <div
                onClick={currentUser ? onNavigateVocab : onNavigateLogin}
                className="p-8 sm:p-12 flex flex-col items-center text-center cursor-pointer bg-white hover:bg-[#E31E24] transition-all duration-300 ease-out group rounded-tl-[32px] sm:rounded-tl-[44px]"
              >
                <div className="px-7 sm:px-9 py-3 sm:py-3.5 rounded-full border border-slate-200/90 bg-white shadow-xs inline-flex items-center justify-center mb-3.5 group-hover:scale-105 group-hover:border-white group-hover:shadow-md transition-all duration-300">
                  <span className="text-[#E31E24] font-black text-sm sm:text-base tracking-wider uppercase">
                    {currentUser ? 'VÀO HỌC' : 'ĐĂNG NHẬP'}
                  </span>
                </div>
                <p className="text-sm sm:text-base text-slate-600 font-semibold group-hover:text-white transition-colors duration-300">
                  {currentUser
                    ? `Chào ${currentUser.fullName}, tiếp tục học từ vựng`
                    : 'Người dùng đã có tài khoản!'}
                </p>
              </div>

              {/* Nút 2: Đăng ký (Bo tròn góc trên bên phải, hover nền xanh dương PTE) */}
              <div
                onClick={currentUser ? onLogout : onNavigateRegister}
                className="p-8 sm:p-12 flex flex-col items-center text-center cursor-pointer bg-white hover:bg-[#1E62DC] transition-all duration-300 ease-out group rounded-tr-[32px] sm:rounded-tr-[44px]"
              >
                <div className="px-7 sm:px-9 py-3 sm:py-3.5 rounded-full border border-slate-200/90 bg-white shadow-xs inline-flex items-center justify-center mb-3.5 group-hover:scale-105 group-hover:border-white group-hover:shadow-md transition-all duration-300">
                  <span className="text-[#1E62DC] font-black text-sm sm:text-base tracking-wider uppercase transition-colors duration-300">
                    {currentUser ? 'ĐĂNG XUẤT' : 'ĐĂNG KÝ'}
                  </span>
                </div>
                <p className="text-sm sm:text-base text-slate-600 font-semibold group-hover:text-white transition-colors duration-300">
                  {currentUser
                    ? 'Thoát phiên đăng nhập hiện tại'
                    : 'Đăng ký người dùng để khám phá ngay!'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-slate-900 text-slate-400 py-10 border-t border-slate-800 text-xs">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-crimson-primary text-white flex items-center justify-center font-bold text-xs">
              LV
            </div>
            <div>
              <p className="text-white font-bold text-sm">Linear Vocab - Ghi từ vựng thông minh</p>
              <p className="text-slate-500 text-[11px] mt-0.5">Hệ thống Kho từ vựng & Phương pháp tư duy Linear Thinking</p>
            </div>
          </div>

          <p className="text-slate-500 text-center sm:text-right">
            © 2026 Linear Vocab. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
