import astronautImg from '@/assets/Chibi_PhiHanhGia_LoginRegister.png';

export default function AuthBanner({
  title = 'LinearVocab LMS',
  description = (
    <>
      Tham gia chương trình học từ vựng tư duy để học hỏi từ các chuyên gia,
      <br />
      rèn luyện kỹ năng thực tế và chuẩn bị vững vàng cho tương lai.
    </>
  ),
  showLogo = false,
  className = '',
  style = {},
}) {
  return (
    <div
      style={style}
      className={`relative w-full h-full min-h-[520px] rounded-[28px] lg:rounded-[36px] bg-gradient-to-b from-[#E31E24] to-[#B91C1C] p-8 lg:p-12 xl:p-14 flex flex-col justify-between overflow-hidden shadow-[0_20px_50px_rgba(227,30,36,0.25)] text-white select-none ${className}`}
    >
      {/* Background Decorative Soft Light */}
      <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-white/10 blur-2xl pointer-events-none" />

      {/* Top Banner Text */}
      <div className="relative z-10 max-w-2xl mx-auto text-center pt-2 px-2">
        {showLogo && (
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 sm:w-[70px] sm:h-[70px] rounded-full bg-white text-crimson-primary flex items-center justify-center shadow-[0_10px_25px_rgba(0,0,0,0.2)] transition-transform hover:scale-105">
              <span className="material-symbols-outlined text-[32px] sm:text-[34px]">menu_book</span>
            </div>
          </div>
        )}
        <h2 className="text-2xl sm:text-3xl lg:text-[34px] xl:text-4xl font-extrabold tracking-tight drop-shadow-sm font-sans leading-tight">
          {title}
        </h2>
        <p className="mt-3.5 text-xs sm:text-sm text-white/90 leading-relaxed font-normal max-w-[620px] mx-auto">
          {description}
        </p>
      </div>

      {/* Center 3D Mascot Character */}
      <div className="relative z-10 my-auto flex items-center justify-center py-6">
        {/* Soft Ambient Glow under mascot */}
        <div className="absolute w-60 h-60 sm:w-72 sm:h-72 lg:w-80 lg:h-80 rounded-full bg-white/20 blur-3xl scale-95 pointer-events-none" />
        
        {/* Tách riêng wrapper transform để tránh lỗi Safari biến drop-shadow thành khối chữ nhật */}
        <div className="relative z-10 transition-transform duration-500 ease-out hover:scale-105 will-change-transform select-none">
          <img
            src={astronautImg}
            alt="LinearVocab Mascot 3D"
            className="w-52 sm:w-64 lg:w-80 xl:w-[340px] max-h-[380px] lg:max-h-[440px] xl:max-h-[480px] object-contain pointer-events-none"
            style={{
              filter: 'drop-shadow(0px 16px 20px rgba(0, 0, 0, 0.42))',
              transform: 'translateZ(0)',
              WebkitTransform: 'translateZ(0)',
              WebkitBackfaceVisibility: 'hidden',
              backfaceVisibility: 'hidden',
            }}
          />
        </div>
      </div>
    </div>
  );
}
