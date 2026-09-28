---
paths:
  - "frontend/**"
---

# 프론트엔드 컨벤션

## 폴더 역할

| 폴더 | 역할 |
| ---- | ---- |
| `container/{admin,client}/` | 라우터가 가리키는 페이지. 데이터 조회 · 상태 · 핸들러를 조합한다. |
| `component/{admin,client}/` | 재사용 UI 조각. props만 받아서 그린다. |
| `component/{admin,client}/ui/` | 공통 컴포넌트 (`components.md` 참고) |
| `component/{admin,client}/layout/` | 헤더 · 사이드바 · 로그인 폼 · `Loading` |
| `hooks/common/` | 여러 곳에서 쓰는 훅만 둔다. 한 화면에서만 쓰는 로직은 그 컨테이너 안에 둔다. |
| `component/client/auth/` | Google · Kakao 로그인 버튼, OAuth 콜백 처리, `PublicRoute`(로그인한 사용자를 로그인 페이지에서 내보내는 가드) |
| `constants/` | 프로젝트 상수. `APP_NAME`(사이드바 상단 프로젝트명) — 새 프로젝트로 복제하면 바꾼다. |
| `types/` | 타입 정의. 화면 전용 API 타입은 `types/{admin,client}/`에 둔다. |
| `utils/format/` | 날짜 · 숫자 · 시간 포맷 헬퍼 |

## 페이지 추가

### admin 페이지

두 곳을 고친다.

1. `App.tsx` — `AdminLayout` 안에 `<Route path="/admin/xxx" element={<AdminXxx />} />` 추가
2. `container/admin/layout.tsx`의 `adminMenu` 배열 — 사이드바 메뉴 항목 추가. 타입은 `types/admin/sidebar.ts`의 `AdminMenuItem`.

```ts
{ type: "link", label: "회원 관리", to: "/admin/user", icon: <Users className="h-4 w-4" /> }
{ type: "group", title: "설정", icon: <Settings className="h-4 w-4" />, children: [{ label: "그룹", to: "/admin/group" }] }
```

- 페이지 제목은 헤더가 `adminMenu`에서 찾아 자동으로 보여 준다. 페이지 안에서 제목을 또 그리지 않는다.
- 로그인 확인은 `AdminLayout`이 한다. 페이지마다 따로 하지 않는다.
- 본문은 레이아웃이 주는 스크롤 영역 안에 들어간다. 카드는 `rounded-xl border border-line bg-bg-card p-5`, 카드 사이 간격은 `gap-4`, 카드 격자는 `grid grid-cols-1 sm:grid-cols-2 gap-3`.

### client 페이지

`App.tsx`의 `ClientLayOut`(대문자 O) 안에 라우트를 추가한다. client에는 로그인 가드가 없다.

## 네이밍

| 대상 | 규칙 | 예시 |
| ---- | ---- | ---- |
| 컴포넌트 | PascalCase | `UserCard` |
| Props 인터페이스 | PascalCase + `Props` | `UserCardProps` |
| 타입 · 인터페이스 | PascalCase | `UserInfo` |
| 함수 · 변수 · 훅 | camelCase | `useAuth`, `isLoading` |
| 이벤트 핸들러 | `handle` 접두사 | `handleSubmit` |
| 폴더 · 파일 | camelCase | `sideBar/`, `radioButton.tsx`, `useAPI.ts` |

## 작성 스타일

```tsx
// 컴포넌트 — 화살표 함수 + default export
const UserCard = ({ name }: UserCardProps) => {
  return <div>{name}</div>;
};
export default UserCard;

// 훅 — 화살표 함수 + named export
export const useUserFilter = () => { ... };

// 이벤트 핸들러 — 화살표 함수
const handleClick = () => { ... };
```

- `function` 키워드 컴포넌트는 쓰지 않는다 (`App.tsx` 제외).
- import는 `@/`(→ `src/`) alias를 쓴다. 상대 경로(`../../`)로 멀리 올라가지 않는다.
- TypeScript `strict` 모드다. `any`, 빈 `catch {}`, 바뀌지 않는 `let`을 쓰지 않는다 (타입 · lint 에러). `catch (err)`의 `err`는 `unknown`이므로 좁혀서 쓴다.
- 전역 CSS가 모든 요소에 `user-select: none`을 건다. 사용자가 복사해야 하는 텍스트에는 `select-text`를 붙인다.

## API 호출 — `@/hooks/common/useAPI`

URL은 앞에 `/` 없이 `"api/..."`로 쓴다 (`baseURL/` 뒤에 붙는다).

| 훅 | 시그니처 | 용도 |
| -- | -------- | ---- |
| `useGet` | `useGet<T>(url, key, enabled = true, fallback?)` | 조회 |
| `usePost` | `usePost<TRequest, TResponse>(url, fallback?)` | 생성 · 조회성 POST. FormData도 된다. |
| `usePatch` | `usePatch<TResponse, TRequest>(url, fallback?)` — **제네릭 순서가 usePost와 반대** | 수정 |
| `useDelete` | `useDelete<TResponse>(url, fallback?)` — `mutate()`에 본문이 없으므로 id는 URL에 넣는다 | 삭제 |
| `useChatStream` | `useChatStream<TRequest>(url)` → `{ sendMessage(body, onChunk), abort }` | 스트리밍 응답 |

```tsx
import { useGet, usePost } from "@/hooks/common/useAPI";

const { data, isLoading } = useGet<UserDetail>("api/user/me", ["me"], !!user);

const loginMutation = usePost<LoginRequest, LoginResponse>("api/auth/login");
loginMutation.mutate(payload, {
  onSuccess: () => navigate("/admin"),
  onError: () => setErrorOpen(true),
});
```

### 401과 세션 만료

- 401이 나면 토큰 갱신 후 다시 요청한다. 갱신 대상(admin · user)은 현재 경로가 `/admin`으로 시작하는지로 정해진다.
- 갱신도 실패하면 `fallback` 주소로 강제 이동한다. 기본값은 admin 화면이면 `"/admin/login"`, 그 외는 `"/"`라서 보통은 넘기지 않는다.

### 응답과 에러 형태

- 응답 형식: `BaseResponse<T> = { success, message, data, errorCode }`
- 실패하면 **모든 훅이 `ApiError`를 던진다** (`@/hooks/common/useAPI`에서 export).
  - `error.status`: HTTP 상태 코드 (세션 만료는 401)
  - `error.message`: 서버가 보낸 한국어 문구 — 그대로 사용자에게 보여 줘도 된다
  - `error.errorCode`: 서버가 보낸 코드 (예: `"NOTICE_NOT_FOUND"`) — 에러 종류별로 다르게 처리할 때 쓴다
- `useGet` 기본값: `staleTime` 5분, 창 포커스 시 재조회 안 함, 이전 데이터 유지(`keepPreviousData`).

## 에러 처리

상황별로 보여 주는 방법을 정해 두고 따른다.

| 상황 | 보여 주는 방법 |
| ---- | -------------- |
| **조회 실패** (`useGet`의 `error`) | 그 영역 자리에 `ErrorState` + "다시 시도"(`refetch`). 화면 전체를 비우지 않는다 |
| **조회 성공, 데이터 없음** | `EmptyState` (표는 Table 자체 빈 상태) |
| **저장 · 수정 · 삭제 실패** (`onError`) | `Toast`(type "error")로 `error.message`. 사용자가 꼭 읽고 결정해야 하면 `Modal` |
| **입력값 오류** (서버 400 · 프론트 검증) | 해당 입력칸 `error` + `errorMessage`. 요청 전에 막을 수 있는 건 프론트에서 먼저 막는다 |
| **특정 errorCode** (중복 409, 권한 403 등) | `error.errorCode`로 분기해 알맞은 문구 · 동작 (예: 중복이면 입력칸 에러) |
| **세션 만료** (401) | 훅이 자동으로 로그인 화면으로 보낸다. 따로 처리하지 않는다 |

```tsx
import { ApiError, useGet, usePost } from "@/hooks/common/useAPI";
import ErrorState from "@/component/admin/ui/feedback/errorState";
import EmptyState from "@/component/admin/ui/feedback/emptyState";

const { data, isLoading, error, refetch } = useGet<Notice[]>("api/notice", ["notice"]);

if (isLoading) return <PageSkeleton variant="table" />;
if (error) return <ErrorState error={error} onRetry={refetch} />;
if (!data?.length) return <EmptyState title="등록된 공지가 없습니다" />;

// 저장 실패
createMutation.mutate(payload, {
  onSuccess: () => { setToast({ type: "success", title: "저장했습니다" }); },
  onError: (err: ApiError) => {
    if (err.errorCode === "NOTICE_TITLE_DUPLICATED") setTitleError(err.message);
    else setToast({ type: "error", title: "저장하지 못했습니다", description: err.message });
  },
});
```

- 에러를 `console.log`로만 남기고 사용자에게 아무것도 보여 주지 않는 처리는 하지 않는다.
- 성공도 알린다: 저장 · 삭제가 끝나면 `Toast`(type "success") 또는 목록 갱신으로 결과가 보이게 한다.
- 저장 버튼은 요청 중 `disabled`로 막아 중복 제출을 막는다 (`mutation.isPending`).

### Query key

- 형식: `["도메인", ...식별자]` — 예: `["admin-user", page]`, `["admin-user", id]`. 값은 string · number만 넣는다.
- 저장 · 삭제 뒤에는 관련 목록을 갱신한다.

```tsx
const queryClient = useQueryClient();
mutation.mutate(payload, {
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-user"] }),
});
```

## 상태 관리

- 서버 상태: TanStack Query (위 훅)
- 로컬 상태: `useState`
- 전역 클라이언트 상태: context (`context/`)
- 로그인 사용자
  - client: `const { user, isLoading, setUser } = useAuth();` (`@/hooks/common/useAuth`)
  - admin: `useAuth`는 client 사용자만 담는다. admin 정보는 `parseUserInfo("admin")` (`@/hooks/common/getCookie`)
  - 반환 타입 `UserInfo = { auth_type, id, user_nickname, created_at }` — 이메일 · 권한은 쿠키에 없다
- 테마: `const { theme, toggleTheme } = useTheme();` — `html`의 `dark` 클래스와 localStorage를 바꾼다.

## 색상 토큰 — Tailwind

색은 `tailwind.config.js`의 토큰만 쓴다. hex 값이나 `gray-100` 같은 기본 팔레트를 직접 쓰지 않는다. 모든 토큰은 `index.css`의 CSS 변수를 가리켜서 다크모드(`darkMode: "class"`)에서 자동으로 바뀐다.

| 용도 | 토큰 |
| ---- | ---- |
| 버튼 배경 | `main`, `sub1`, `sub2` (+ `-hover`, `-active`) |
| 브랜드 | `primary`, `primary-light`, `primary-dark` |
| 배경 | `bg`, `bg-card`, `bg-sub`, `bg-hover`, `bg-active`, `bg-disabled` |
| 글자 | `text-main`, `text-sub`, `text-disabled`, `text-placeholder`, `text-inverse` |
| 테두리 | `line`, `line-strong`, `line-focus` |
| 입력창 | `input-bg`, `input-border` |
| 상태 | `success`, `error`, `warning`, `info` (+ `-bg`) |
| 기타 | `overlay`, `surface-raised`, `skeleton-base`, `skeleton-shine`, `point-{green,red,amber,blue}` |

클래스로 쓸 때는 접두사를 붙인다: `bg-bg-card`, `text-text-sub`, `border-line`, `bg-main hover:bg-main-hover`.

- **`text-main`과 `text-text-main`은 다르다.** `text-main`은 버튼 색(`main` 토큰)을 글자에 칠하는 것이고, 본문 글자색은 `text-text-main`이다.
- `overlay` 토큰은 알파가 1이라 그대로 쓰면 불투명한 검정이 된다. 모달 · 로딩 배경은 `bg-overlay/40`처럼 알파를 붙인다.
- 테마와 상관없이 항상 어두운 영역(admin 사이드바, 로그인 비주얼 패널)과 카카오 로그인 버튼(브랜드 색 `#FEE500`)은 의도적으로 고정 색을 쓴다. 고정색 예외는 이 세 곳뿐이다.
- 아이콘은 lucide-react. 버튼 밖에서는 `h-4 w-4`.

## 화면 품질

화면을 만들거나 고치면 아래를 확인한다.

- **상태 네 가지**를 모두 그린다: 로딩(`PageSkeleton` · `Skeleton`), 데이터 있음, **빈 목록**(`EmptyState`), **에러**(`ErrorState` + 다시 시도). 저장 · 삭제의 성공 · 실패도 Toast로 알린다 ("에러 처리" 참고).
- **반응형**: 360px · 768px · 1280px 폭에서 깨지지 않는지. 표는 좁은 폭에서 가로 스크롤을 허용한다.
- **접근성**
  - 버튼 · 링크는 `<button>` · `<a>`로 만들고, 아이콘만 있는 버튼에는 `aria-label`을 단다.
  - 키보드(Tab · Enter · Esc)로 조작할 수 있어야 한다. 공통 Modal은 Esc로 닫힌다.
  - **색만으로 상태를 전달하지 않는다.** 에러는 빨간 테두리와 함께 문구(`errorMessage`)를 보여 준다.
- **다크모드**: 토큰만 썼다면 자동으로 대응한다. 고정색을 썼다면 다크모드에서 한 번 확인한다.
- 사용자 입력 문구는 짧고 구체적으로. 에러 문구는 "무엇이 잘못됐고 어떻게 하면 되는지"를 담는다.
