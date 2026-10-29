import astronautImg from '@/assets/Chibi_PhiHanhGia_LoginRegister.png';

export default function AuthBanner({
  title = 'LinearVocab LMS',
  description = 'Tham gia chương trình học từ vựng tư duy để học hỏi từ các chuyên gia, rèn luyện kỹ năng thực tế và chuẩn bị vững vàng cho tương lai.',
  showLogo = false,
}) {
  return (
    <div className="relative w-full h-full min-h-[500px] lg:min-h-[620px] rounded-[28px] lg:rounded-[36px] bg-gradient-to-b from-[#E31E24] to-[#B91C1C] p-8 lg:p-12 flex flex-col justify-between overflow-hidden shadow-[0_20px_50px_rgba(227,30,36,0.25)] text-white select-none">
      {/* Background Decorative Soft Light */}
      <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-white/10 blur-2xl pointer-events-none" />

      {/* Top Banner Text */}
      <div className="relative z-10 max-w-xl mx-auto text-center pt-2 px-2">
        {showLogo && (
          <div className="flex justify-center mb-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white text-crimson-primary flex items-center justify-center font-black shadow-[0_8px_20px_rgba(0,0,0,0.2)]">
              <span className="material-symbols-outlined text-[26px]">menu_book</span>
            </div>
          </div>
        )}
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight drop-shadow-sm font-sans">
          {title}
        </h2>
        <p className="mt-3 text-xs sm:text-sm text-white/90 leading-relaxed font-normal max-w-[560px] mx-auto">
          {description}
        </p>
      </div>

      {/* Center 3D Mascot Character */}
      <div className="relative z-10 my-auto flex items-center justify-center py-6">
        {/* Soft Ambient Glow under mascot */}
        <div className="absolute w-52 h-52 sm:w-64 sm:h-64 rounded-full bg-white/20 blur-3xl scale-95" />
        
        <img
          src={astronautImg}
          alt="LinearVocab Mascot 3D"
          className="relative z-10 w-48 sm:w-60 lg:w-72 max-h-[340px] object-contain drop-shadow-[0_25px_40px_rgba(0,0,0,0.4)] transition-transform duration-500 hover:scale-105"
        />
      </div>
    </div>
  );
}
