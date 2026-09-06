/**
 * 체크박스 크기 사이즈
 */
type Size = "sm" | "md" | "lg";

/**
 * Checkbox 컴포넌트 Props
 *
 * @property label     체크박스 오른쪽에 표시될 텍스트
 * @property checked   현재 체크 상태 (true/false)
 * @property onChange  체크 상태가 변경될 때 호출되는 콜백
 * @property disabled  비활성화 여부
 * @property size      체크박스 크기 (sm/md/lg)
 * @property className 커스텀 클래스 추가
 */
interface CheckboxProps {
  label?: string;
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  size?: Size;
  className?: string;
}

/**
 * 재사용 가능한 Checkbox 컴포넌트
 *
 * @example 기본 예시
 * ```tsx
 * <Checkbox checked={isChecked} onChange={setIsChecked} label="동의합니다" />
 * ```
 *
 * @example 사이즈 조절
 * ```tsx
 * <Checkbox size="lg" label="Large Checkbox" />
 * ```
 *
 * @example 비활성화
 * ```tsx
 * <Checkbox disabled label="Disabled Checkbox" />
 * ```
 */
const Checkbox = ({
  label = "",
  checked = false,
  onChange,
  disabled = false,
  size = "md",
  className = "",
}: CheckboxProps) => {
  /**
   * 사이즈에 따른 스타일 맵
   */
  const sizeStyles = {
    sm: {
      box: "w-3 h-3",
      text: "text-xs",
      gap: "gap-1.5",
    },
    md: {
      box: "w-4 h-4",
      text: "text-sm",
      gap: "gap-2",
    },
    lg: {
      box: "w-5 h-5",
      text: "text-base",
      gap: "gap-2.5",
    },
  }[size];

  /**
   * 체크박스 상태 변경 핸들러
   *
   * - disabled일 경우 동작하지 않음
   * - onChange 콜백에 반전된 checked 값 전달
   */
  const handleChange = () => {
    if (disabled) return;
    onChange?.(!checked);
  };

  return (
    <label
      className={`
        inline-flex items-center select-none
        ${sizeStyles.gap}
        ${disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}
        ${className}
      `}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={handleChange}
        className={`
          ${sizeStyles.box}
          accent-main
          border-gray-400 rounded
        `}
      />

      {label && <span className={sizeStyles.text}>{label}</span>}
    </label>
  );
};

export default Checkbox;
