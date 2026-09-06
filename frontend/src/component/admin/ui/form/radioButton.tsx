/**
 * 라디오 버튼 크기 타입
 */
type Size = "sm" | "md" | "lg";

/**
 * RadioButton 컴포넌트 Props
 *
 * @property label      라벨 텍스트
 * @property name       라디오 그룹 이름 (같은 name끼리 그룹)
 * @property value      라디오 버튼 값
 * @property checked    선택 여부
 * @property onChange   값 변경 시 호출되는 콜백
 * @property disabled   비활성화 여부
 * @property size       크기(sm/md/lg)
 * @property className  커스텀 클래스
 */
interface RadioButtonProps {
  label?: string;
  name?: string;
  value: string;
  checked?: boolean;
  onChange?: (value: string) => void;
  disabled?: boolean;
  size?: Size;
  className?: string;
}

/**
 * 재사용 가능한 RadioButton 컴포넌트
 *
 * - 여러 개 묶어서 단일 선택 UI 구성 가능
 * - 크기(size) 옵션 제공 (sm/md/lg)
 * - 이름(name)이 같은 라디오끼리 그룹으로 동작
 *
 * @example 기본 사용
 * ```tsx
 * <RadioButton
 *   name="gender"
 *   value="male"
 *   checked={selected === "male"}
 *   onChange={(v) => setSelected(v)}
 *   label="남성"
 * />
 * ```
 *
 * @example 큰 사이즈
 * ```tsx
 * <RadioButton size="lg" label="Large Option" />
 * ```
 */
const RadioButton = ({
  label = "",
  name,
  value,
  checked = false,
  onChange,
  disabled = false,
  size = "md",
  className = "",
}: RadioButtonProps) => {
  /**
   * 사이즈별 스타일 맵
   */
  const sizeStyles = {
    sm: {
      radio: "w-3 h-3",
      text: "text-xs",
      gap: "gap-1.5",
    },
    md: {
      radio: "w-4 h-4",
      text: "text-sm",
      gap: "gap-2",
    },
    lg: {
      radio: "w-5 h-5",
      text: "text-base",
      gap: "gap-2.5",
    },
  }[size];

  /**
   * 라디오 클릭 시 값 전달
   */
  const handleChange = () => {
    if (disabled) return;
    onChange?.(value);
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
        type="radio"
        name={name}
        value={value}
        checked={checked}
        disabled={disabled}
        onChange={handleChange}
        className={`
          ${sizeStyles.radio}
          accent-main
          border-gray-400
        `}
      />

      {label && <span className={sizeStyles.text}>{label}</span>}
    </label>
  );
};

export default RadioButton;
