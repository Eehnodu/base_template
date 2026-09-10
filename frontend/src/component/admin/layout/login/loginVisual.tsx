import Logo from "@/assets/profile.png";

const LoginVisual = () => {
  return (
    // 항상 어두운 패널 — 테마 토큰 대신 고정 zinc 사용
    <div className="hidden lg:flex lg:w-3/5 xl:w-2/3 bg-zinc-900 relative p-20 flex-col justify-between items-start">
      <div className="absolute inset-0 bg-gradient-to-br from-zinc-900/60 to-zinc-100/50" />

      {/* 배경 장식 */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1/2 h-1/2 bg-zinc-300/20 rounded-full blur-3xl" />
      <div className="absolute -bottom-20 right-20 w-80 h-80 bg-zinc-700/10 rounded-full blur-3xl" />

      <div className="relative z-10 flex flex-col gap-10">
        <div className="flex items-center gap-3">
          <img src={Logo} alt="Logo" className="w-10 h-10 rounded-lg object-contain shadow-2xl" />
          <h1 className="text-2xl font-bold tracking-tight text-white/95">Admin</h1>
        </div>
        <div className="mt-16">
          <h2 className="text-7xl font-bold tracking-tighter text-white leading-[1.2]">
            관리자<br />운영 관리.
          </h2>
          <p className="mt-8 text-xl text-white/80 max-w-lg leading-relaxed font-light">
            서비스 운영과 데이터 관리를 위한 전용 페이지입니다.<br />
            관리자 계정으로 로그인하여 업무를 시작해 주세요.
          </p>
        </div>
      </div>

      <div className="relative z-10 flex flex-col gap-4">
        <p className="text-xs font-medium text-white/40 tracking-widest uppercase">Console v.1.0.0</p>
      </div>
    </div>
  );
};

export default LoginVisual;