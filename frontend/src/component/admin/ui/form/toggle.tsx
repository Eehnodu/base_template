import { useState } from "react";

/**
 * Toggle 컴포넌트의 사이즈 타입
 */
type ToggleSize = "sm" | "md" | "lg";

/**
 * Toggle 컴포넌트 Props
 *
 * @property checked          외부에서 제어하는 상태 (Controlled)
 * @property defaultChecked   내부에서만 초기값으로 사용할 상태 (Uncontrolled)
 * @property onChange         상태 변경 시 호출되는 콜백
 * @property size             토글 크기 (sm / md / lg)
 * @property disabled         비활성화 여부
 * @property className        커스텀 클래스
 */
interface ToggleProps {
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (checked: boolean) => void;
  size?: ToggleSize;
  disabled?: boolean;
  className?: string;
}

/**
 * 재사용 가능한 Toggle(스위치) 컴포넌트
 *
 * - Controlled & Uncontrolled 방식 모두 지원
 * - 클릭 시 true/false 전환
 * - 크기 옵션(sm/md/lg)
 *
 * @example 기본 사용
 * ```tsx
 * <Toggle defaultChecked />
 * ```
 *
 * @example Controlled 사용
 * ```tsx
 * <Toggle
 *   checked={enabled}
 *   onChange={(v) => setEnabled(v)}
 * />
 * ```
 *
 * @example 비활성화
 * ```tsx
 * <Toggle disabled />
 * ```
 */
const Toggle = ({
  checked,
  defaultChecked = false,
  onChange,
  size = "md",
  disabled = false,
  className = "",
  ...props
}: ToggleProps) => {
  /**
   * Uncontrolled 모드일 때 내부 상태로 사용
   */
  const [internalChecked, setInternalChecked] = useState(defaultChecked);

  /**
   * Controlled 여부 판단
   */
  const isControlled = checked !== undefined;

  /**
   * 현재 상태 (Controlled 또는 내부 상태 중 하나)
   */
  const isOn = isControlled ? checked : internalChecked;

  /**
   * 전체 토글 크기 스타일
   */
  const sizes: Record<ToggleSize, string> = {
    sm: "w-8 h-4",
    md: "w-10 h-5",
    lg: "w-12 h-6",
  };

  /**
   * 흰색 원(circle) 크기 스타일
   */
  const circleSizes: Record<ToggleSize, string> = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  };

  /**
   * 토글 클릭 핸들러
   *
   * - disabled면 동작하지 않음
   * - Uncontrolled이면 내부 상태 변경
   * - onChange를 통해 상위 컴포넌트에 변경 전달
   */
  const handleClick = () => {
    if (disabled) return;

    if (!isControlled) {
      setInternalChecked(!isOn);
    }

    onChange?.(!isOn);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`
        relative flex items-center rounded-full transition-colors
        ${sizes[size]}
        ${isOn ? "bg-main" : "bg-bg-active"}
        ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
        ${className}
      `}
      {...props}
    >
      <span
        className={`
          absolute bg-bg-card rounded-full transition-transform
          ${circleSizes[size]}
          ${isOn ? "translate-x-full" : "translate-x-0"}
          ml-1
        `}
      />
    </button>
  );
};

export default Toggle;
