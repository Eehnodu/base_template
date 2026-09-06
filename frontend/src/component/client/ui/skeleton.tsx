// 역할: 스켈레톤 기본 블록. 모양은 className 으로, 색과 반짝임은 index.css 의 .skeleton 이 맡는다

interface SkeletonProps {
  className?: string;
}

/**
 * 데이터를 기다리는 동안 실제 콘텐츠와 같은 자리를 잡아 두는 블록.
 *
 * 스피너와 달리 화면 구조가 먼저 보이므로 무엇을 기다리는지 알 수 있고,
 * 데이터가 오면 같은 자리에 내용이 채워져 레이아웃이 튀지 않는다.
 * 보조기기에는 의미가 없으므로 aria-hidden 으로 감춘다.
 */
const Skeleton = ({ className = "" }: SkeletonProps) => (
  <span aria-hidden className={`skeleton block rounded-lg ${className}`} />
);

export default Skeleton;
