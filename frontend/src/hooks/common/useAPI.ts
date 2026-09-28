import { useMutation, useQuery, keepPreviousData } from "@tanstack/react-query";
import { useRef } from "react";

// baseURL 설정
export const hostname = window.location.hostname;

export const baseURL = import.meta.env.VITE_APP_PUBLIC_BASE_URL;

// 세션 갱신까지 실패했을 때 보낼 곳 — admin 화면이면 admin 로그인, 아니면 메인
const defaultFallback = () =>
  window.location.pathname.startsWith("/admin") ? "/admin/login" : "/";

// 공통 응답 타입
export interface BaseResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errorCode: string | null;
}

/**
 * API 실패 시 모든 훅이 던지는 에러
 *
 * - status: HTTP 상태 코드 (세션 만료는 401)
 * - message: 서버가 보낸 message (사용자에게 보여 줄 문구)
 * - errorCode: 서버가 보낸 errorCode (예: "USER_NOT_FOUND") — 에러 종류별 분기에 쓴다
 */
export class ApiError extends Error {
  status: number;
  errorCode: string | null;

  constructor(status: number, message: string, errorCode: string | null = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errorCode = errorCode;
  }
}

// 실패 응답 본문(BaseResponse)을 읽어 ApiError 로 만든다. 본문이 JSON 이 아니어도 동작한다
const toApiError = async (response: Response): Promise<ApiError> => {
  const text = await response.text().catch(() => "");
  let body: Partial<BaseResponse<unknown>> | null = null;
  try {
    body = JSON.parse(text);
  } catch {
    body = null;
  }
  return new ApiError(
    response.status,
    body?.message || "요청을 처리하지 못했습니다.",
    body?.errorCode ?? null,
  );
};

const sessionExpired = () =>
  new ApiError(401, "세션이 만료되었습니다. 다시 로그인해 주세요.", "SESSION_EXPIRED");

/**
 * Refresh Token을 사용해 세션을 갱신하는 함수
 *
 * 현재 경로가 `/admin`으로 시작하면 admin refresh API를,
 * 그 외에는 user refresh API를 호출합니다.
 *
 * 쿠키 기반(refresh_token)를 사용하며,
 * credentials: "include"로 요청됩니다.
 *
 * ⚠️ 주의
 * - refresh API가 401을 반환해도 throw 하지 않습니다.
 * - 항상 true를 반환합니다.
 * - redirect / logout 처리는 호출 측에서 판단해야 합니다.
 *
 * @returns {() => Promise<boolean>}
 * refresh 요청을 수행하는 비동기 함수
 *
 * @example
 * const refreshToken = useRefreshToken();
 * await refreshToken();
 */
export const useRefreshToken = () => {
  const { pathname } = window.location;

  const refreshUrl = pathname.startsWith("/admin")
    ? "api/auth/refresh_token_admin"
    : "api/auth/refresh_token";

  const refresh = async () => {
    const response = await fetch(`${baseURL}/${refreshUrl}`, {
      method: "POST",
      credentials: "include",
    });

    if (response.status === 401) {
      return false;
    }

    return true;
  };

  return refresh;
};

/**
 * React Query 기반 GET 요청 훅
 *
 * 자동으로 401 응답 시 refreshToken()을 호출하고,
 * 재시도까지 해주는 fetch 래퍼입니다.
 *
 * @template T 응답 데이터의 타입
 *
 * @param url API endpoint
 * @param key React Query의 queryKey (배열 형태, 직렬화 가능한 값만 가능)
 * @param enabled 쿼리 실행 여부 (기본값: true)
 * @param fallback refresh token 갱신 실패 시 돌아갈 url
 * @example
 * const { data, isLoading, error } = useGet<User[]>("/users", ["users"]);
 */
export const useGet = <T>(
  url: string,
  key: (string | number)[],
  enabled: boolean = true,
  fallback: string = defaultFallback(),
) => {
  const refreshToken = useRefreshToken();

  return useQuery<T, ApiError>({
    queryKey: key,
    enabled,
    queryFn: async () => {
      const makeRequest = async () => {
        return await fetch(`${baseURL}/${url}`, {
          credentials: "include",
        });
      };

      let response = await makeRequest();

      if (response.status === 401) {
        const ok = await refreshToken();
        if (!ok) {
          window.location.href = fallback;
          throw sessionExpired();
        }
        response = await makeRequest();
      }

      if (!response.ok) throw await toApiError(response);

      const json = (await response.json()) as BaseResponse<T>;

      if (!json.success) {
        throw new ApiError(response.status, json.message, json.errorCode);
      }

      return json.data;
    },
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    staleTime: 1000 * 60 * 5,
    placeholderData: keepPreviousData,
  });
};

/**
 * React Query 기반 POST 요청 훅
 *
 * 자동으로 401 응답 시 refreshToken()을 호출하고,
 * 재시도까지 해주는 fetch 래퍼입니다.
 *
 * @template TRequest 요청 바디 타입 (object, FormData, void)
 * @template TResponse 응답 데이터 타입
 * @template TError 에러 타입 (기본: ApiError — status · message · errorCode)
 *
 * @param url API endpoint
 * @param fallback refresh token 갱신 실패 시 돌아갈 url
 *
 * @example
 * // JSON Body 요청
 * const createUser = usePost<{ name: string; email: string }, UserResponse>("api/users");
 * createUser.mutate({ name: "홍길동", email: "hong@example.com" });
 *
 * @example
 * // FormData 요청 (파일 업로드)
 * const uploadFile = usePost<FormData, { url: string }>("api/upload");
 * const fd = new FormData();
 * fd.append("file", fileInput.files[0]);
 * uploadFile.mutate(fd);
 *
 * @example
 * // 바디 없는 POST (예: 로그아웃)
 * const logout = usePost<void, void>("/auth/logout");
 * logout.mutate();
 */
export const usePost = <
  TRequest extends object | FormData | void,
  TResponse,
  TError = ApiError,
>(
  url: string,
  fallback: string = defaultFallback(),
) => {
  const refreshToken = useRefreshToken();

  return useMutation<TResponse, TError, TRequest>({
    mutationFn: async (body: TRequest) => {
      // 헤더 조건부
      const headers: HeadersInit = {};
      let fetchBody: BodyInit;

      if (body instanceof FormData) {
        fetchBody = body;
        // FormData면 Content-Type 자동 설정 (headers에 아무것도 안 넣음)
      } else {
        fetchBody = JSON.stringify(body);
        headers["Content-Type"] = "application/json";
      }

      const makeRequest = async () => {
        return await fetch(`${baseURL}/${url}`, {
          method: "POST",
          headers,
          credentials: "include",
          body: fetchBody,
        });
      };

      let response = await makeRequest();

      if (response.status === 401) {
        const ok = await refreshToken();
        if (!ok) {
          window.location.href = fallback;
          throw sessionExpired();
        }
        response = await makeRequest();
      }

      if (!response.ok) throw await toApiError(response);

      // 204, 205 등 No Content 응답일 경우 안전하게 처리
      if (response.status === 204 || response.status === 205) {
        return null as unknown as TResponse;
      }

      const json = (await response.json()) as BaseResponse<TResponse>;

      if (!json.success) {
        throw new ApiError(response.status, json.message, json.errorCode);
      }

      return json.data;
    },
  });
};

export const usePatch = <
  TResponse,
  TRequest extends object | void = void,
  TError = ApiError,
>(
  url: string,
  fallback: string = defaultFallback(),
) => {
  const refreshToken = useRefreshToken();

  return useMutation<TResponse, TError, TRequest>({
    mutationFn: async (body: TRequest) => {
      const makeRequest = async () =>
        fetch(`${baseURL}/${url}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(body),
        });

      let response = await makeRequest();

      if (response.status === 401) {
        const ok = await refreshToken();
        if (!ok) { window.location.href = fallback; throw sessionExpired(); }
        response = await makeRequest();
      }

      if (!response.ok) throw await toApiError(response);

      if (response.status === 204) return null as unknown as TResponse;
      const json = (await response.json()) as BaseResponse<TResponse>;
      if (!json.success) throw new ApiError(response.status, json.message, json.errorCode);
      return json.data;
    },
  });
};

export const useDelete = <
  TResponse = void,
  TError = ApiError,
>(
  url: string,
  fallback: string = defaultFallback(),
) => {
  const refreshToken = useRefreshToken();

  return useMutation<TResponse, TError, void>({
    mutationFn: async () => {
      const makeRequest = async () =>
        fetch(`${baseURL}/${url}`, {
          method: "DELETE",
          credentials: "include",
        });

      let response = await makeRequest();

      if (response.status === 401) {
        const ok = await refreshToken();
        if (!ok) { window.location.href = fallback; throw sessionExpired(); }
        response = await makeRequest();
      }

      if (!response.ok) throw await toApiError(response);

      if (response.status === 204) return null as unknown as TResponse;
      const json = (await response.json()) as BaseResponse<TResponse>;
      if (!json.success) throw new ApiError(response.status, json.message, json.errorCode);
      return json.data;
    },
  });
};


export const useChatStream = <TRequest extends object>(url: string) => {
  const refreshToken = useRefreshToken();
  const controllerRef = useRef<AbortController | null>(null);

  const sendMessage = async (
    body: TRequest,
    onChunk: (chunk: string) => void,
  ) => {
    const controller = new AbortController();
    controllerRef.current = controller;

    const makeRequest = async () =>
      fetch(`${baseURL}/${url}`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

    let response = await makeRequest();

    if (response.status === 401) {
      await refreshToken();
      response = await makeRequest();
    }

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Chat API Error ${response.status}: ${text}`);
    }

    if (!response.body) throw new Error("No stream body");

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          onChunk(chunk);
        }
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        console.log("Chat stream aborted");
      } else {
        throw err;
      }
    } finally {
      controllerRef.current = null;
    }
  };

  const abort = () => {
    controllerRef.current?.abort();
  };

  return { sendMessage, abort };
};
