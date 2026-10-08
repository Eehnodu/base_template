---
paths:
  - "frontend/**"
---

# 공통 컴포넌트

새 UI를 만들 때 아래 컴포넌트가 있으면 반드시 쓴다. 같은 역할의 컴포넌트를 새로 만들지 않는다.

## 위치 — admin / client 두 벌

공통 컴포넌트는 `component/admin/ui/`와 `component/client/ui/`에 따로 있다. 이름과 props는 같지만 **스타일이 다르다.** 만드는 화면 쪽 것을 쓴다.

| | admin/ui | client/ui |
| - | -------- | --------- |
| 상태 | 실제로 쓰이고 관리되는 기준본 | 아직 어느 화면에서도 쓰지 않음 |
| Button `main` | `bg-main` (버튼 토큰) | `bg-primary` (브랜드 색) |
| 선택된 항목 | `bg-sub1 text-white` | `bg-primary text-text-inverse` |

두 벌 모두 토큰 기반이라 다크모드에 대응한다. client/ui를 처음 쓰는 화면에서는 한 번 띄워 보고 어색한 곳이 있으면 admin/ui를 기준으로 맞춘다.

아래 import 경로는 admin 기준이다. client 화면이면 `admin`을 `client`로 바꾼다.

## Feedback — `ui/feedback/`

| 컴포넌트 | 주요 props | 주의 |
| -------- | ---------- | ---- |
| `Alert` | `type`("info" \| "success" \| "warning" \| "error"), `size`("sm" \| "md" \| "lg"), `title`, `description`, `closable`, `onClose` | |
| `Modal` | `open`, `onClose`(필수), `title`(필수), `description`(ReactNode), `size`, `buttonCount`(0 \| 1 \| 2, 기본 2), `primaryText`(기본 "확인"), `onPrimary`, `secondaryText`(기본 "취소"), `onSecondary`, `primaryVariant`, `primaryDisabled`, `primaryFull`, `icon`, `closeOnOverlay` | ESC · 버튼에서 `onClose`를 부른다. |
| `FormModal` | `open`, `onClose`, `title`, `description`, `headerType`("center" \| "left" \| "none", 기본 "center"), `footerType`(0 \| 1 \| 2, 기본 2), `footerAlign`, `primaryText`, `onPrimary`, `primaryDisabled`, `secondaryText`, `onSecondary`, `footerLeft`, `size`, `closeOnOverlay`, `showCloseIcon`, `children` | `onPrimary`는 모달을 닫지 않는다. 저장이 끝나면 직접 닫는다. |
| `Toast` | `open`, `onClose`, `type`, `title`, `description`, `duration`(ms, 기본 5000, 0이면 자동으로 닫히지 않음), `closable` | 화면 상단 중앙에 고정. 전역 큐가 없으니 화면마다 `useState`로 연다. |
| `ErrorState` | `title`(기본 "불러오지 못했습니다"), `description`, `error`(useGet의 error — ApiError면 서버 문구를 보여 줌), `onRetry`(보통 `refetch`) | 조회 실패 시 그 영역 자리에. 저장 실패는 Toast |
| `EmptyState` | `title`(필수), `description`, `icon`, `action`(예: 등록 버튼) | 조회 성공 + 데이터 없음. 표는 Table 자체 빈 상태 사용 |

모달 · 토스트는 화면에서 `useState(false)`로 열고 닫는다. 상황별 사용법은 `conventions.md`의 "에러 처리"를 따른다.

```tsx
import Modal from "@/component/admin/ui/feedback/modal";

const [deleteOpen, setDeleteOpen] = useState(false);

<Modal
  open={deleteOpen}
  onClose={() => setDeleteOpen(false)}
  title="삭제할까요?"
  description="삭제한 항목은 되돌릴 수 없습니다."
  primaryText="삭제"
  primaryVariant="danger"
  onPrimary={handleDelete}
  onSecondary={() => setDeleteOpen(false)}
/>;
```

## Form — `ui/form/`

`onChange`는 이벤트가 아니라 값을 넘긴다.

| 컴포넌트 | 주요 props | 주의 |
| -------- | ---------- | ---- |
| `Button` | `variant`("main" \| "sub1" \| "sub2" \| "danger"), `size`, `leftIcon`, `rightIcon`, `full` + 기본 button 속성 | |
| `InputBox` | `value`, `onChange(value)`, `type`, `placeholder`, `size`, `disabled`, `error`, `errorMessage`, `success`, `leftIcon`, `rightIcon`, `onLeftIconClick`, `onRightIconClick`, `full`(기본 true), `width`, `onBlur`, `className` | `error`이면 `rightIcon` 자리에 경고 아이콘이 대신 나온다. |
| `SelectBox` | `value`, `onChange(value)`, `options`({ label, value }[]), `placeholder`, `size`, `position`("top" \| "bottom"), `disabled`, `listMaxHeight` | |
| `ComboBox` | `value`, `onChange(value)`, `options`(string[]), `placeholder`, `disabled` | 입력하면서 고르는 선택창 |
| `TextareaBox` | `value`, `onChange(value)`, `rows`, `placeholder`, `size`, `disabled`, `error`, `success` | |
| `Checkbox` | `label`, `checked`, `onChange(checked)`, `size`, `disabled` | |
| `RadioButton` | `name`, `label`, `value`, `checked`, `onChange(value)`, `size`, `disabled` | |
| `Toggle` | `checked`, `defaultChecked`, `onChange(checked)`, `size`, `disabled` | |
| `Calendar` | `value`({ start: Date \| null, end: Date \| null }), `onChange`, `position`("top" \| "bottom" \| "left" \| "right"), `size`, `showIcon`, `disabled` | `onChange`는 "확인"을 눌렀을 때만 호출된다. "취소"는 `{ start: null, end: null }`로 호출된다. 타입 `RangeValue`는 `calendar.tsx`에서 export한다. |

```tsx
import Button from "@/component/admin/ui/form/button";
import InputBox from "@/component/admin/ui/form/inputbox";

<InputBox value={name} onChange={setName} placeholder="이름" error={!!err} errorMessage={err} />
<Button variant="main" size="md" leftIcon={<Plus />} onClick={handleAdd}>추가</Button>
```

## Data Display

| 컴포넌트 | 파일 | 주요 props | 주의 |
| -------- | ---- | ---------- | ---- |
| `Table` | `ui/table/table.tsx` | `columns`({ key, header, width?, align?, render?, icon? }[]), `data`(`TableRow[]`), `size`, `striped`, `onRowClick`, `rowCount` | 데이터가 없으면 "데이터가 없습니다."를 보여 준다. `rowCount`만큼 빈 행을 채운다. |
| `Pagination` | `ui/pagination.tsx` | `page`, `total`, `onChange(page)`, `pageSize`, `visibleCount`, `size`, `variant`("overlay" \| "flow") | 기본 `"overlay"`는 부모 하단에 absolute로 뜬다. 부모에 `relative`가 없으면 `variant="flow"`를 쓴다. `total`이 0이면 아무것도 그리지 않는다. |

```tsx
import Table from "@/component/admin/ui/table/table";

<Table
  columns={[
    { key: "name", header: "이름", width: "150px" },
    { key: "status", header: "상태", render: (row) => <StatusBadge status={row.status} /> },
  ]}
  data={rows}
  striped
  onRowClick={(row) => navigate(`/admin/user/${row.id}`)}
/>;
```

## 로딩 상태

언제 무엇을 쓸지(대기 시간별 기준 · 깜빡임 · 타임아웃)는 `loading.md`. 여기는 컴포넌트 위치만 적는다.

| 상황 | 쓸 것 |
| ---- | ----- |
| 첫 조회(`isLoading`) | `PageSkeleton` 또는 `Skeleton`. 화면 구조가 먼저 보여서 데이터가 와도 레이아웃이 튀지 않는다. |
| 저장 · 삭제처럼 조작을 막아야 하는 대기 | `Loading` 오버레이 |

| 컴포넌트 | 파일 | props |
| -------- | ---- | ----- |
| `PageSkeleton` | `ui/pageSkeleton.tsx` | `variant`("table" \| "form" \| "cards"), `rows` |
| `Skeleton` | `ui/skeleton.tsx` | `className` — 크기를 지정한 회색 블록 |
| `Loading` | `layout/loading.tsx` | 없음 |

```tsx
import PageSkeleton from "@/component/admin/ui/pageSkeleton";

if (isLoading) return <PageSkeleton variant="table" />;
```

화면 전용 골격이 필요하면 `Skeleton` 블록을 실제 컴포넌트와 같은 크기 · 간격으로 조립해 `xxxSkeleton.tsx`로 둔다. 색과 반짝임은 `index.css`의 `.skeleton`과 `skeleton-base`, `skeleton-shine` 토큰이 맡는다.

## 포맷 헬퍼 — `src/utils/format/`

날짜 · 숫자 · 시간 표시는 직접 만들지 말고 이것을 쓴다.

| 파일 | 함수 |
| ---- | ---- |
| `date.ts` | `formatYear`, `formatYearMonth(dt, sep)`, `formatDate(dt, "-" \| ".")`, `formatDateTime`, `formatDateTimeWithSeconds`, `formatClock` — 잘못된 날짜를 넣으면 throw한다 |
| `number.ts` | `formatCurrencyKRW` · `USD`, `formatNumberKRW` · `USD`, `formatNumberPointEN` · `KR`, `formatFixed`, `formatLatencyMs` |
| `time.ts` (인자는 초) | `formatTimeFull`, `formatTimeShort`, `formatTimeKorean`, `formatTimeEnglish`, `formatTimeAuto` |
