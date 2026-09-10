// 역할: 전체 화면 로딩 오버레이
import { useEffect } from "react";

const Loading = () => {
  // 로딩 중 뒤 화면 스크롤을 막고, 언마운트 시 원복
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const NEEDLES = 10; // 막대 수 (12개면 표준 로딩 느낌)
  const SIZE = 72;
  const THICK = 8; // 막대 두께
  const LEN = 32; // 막대 길이
  const INNER_OFFSET = 58; // 이 값이 '간격'에 가장 큰 영향 줌 (낮출수록 간격 커짐)

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
      <div className="relative" style={{ width: SIZE, height: SIZE }}>
        {Array.from({ length: NEEDLES }).map((_, i) => (
          <span
            key={i}
            className="
              absolute left-1/2 top-1/2
              rounded-full origin-bottom
              bg-gray-400
              animate-needle-fade
            "
            style={{
              width: THICK,
              height: `${LEN}%`,
              transform: `rotate(${(360 / NEEDLES) * i}deg) translateY(-${INNER_OFFSET}%)`,
              animationDelay: `${(i * 1.2) / NEEDLES}s`,
              background:
                "linear-gradient(to bottom, rgba(255,255,255,0.9), #9ca3af)",
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default Loading;
