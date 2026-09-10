// 역할: fetch 래퍼 훅 모음. 모든 요청에 쿠키를 싣고, 401 이면 refresh 후 같은 요청을 한 번 재시도한다
import { useMutation, useQuery, keepPreviousData } from "@tanstack/react-query";
import { useRef } from "react";

// baseURL 설정
export const hostname = window.location.hostname;

export const baseURL = import.meta.env.VITE_APP_PUBLIC_BASE_URL;

// 공통 응답 타입
export interface BaseResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errorCode: string;
}

/**
 * Refresh Token을 사용해 세션을 갱신하는 함수
 *
 * 현재 경로가 `/admin`으로 시작하면 admin refresh API를,
 * 그 외에는 user refresh API를 호출합니다.
 *
 * 쿠키 기반(refresh_token)를 사용하며,
 * credentials: "include"로 요청됩니다.
 *
 * 주의
 * - refresh API가 401을 반환해도 throw 하지 않습니다.
 * - 401이면 false, 그 외에는 true를 반환합니다.
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
    // 토큰은 httponly 쿠키에 있으므로 Authorization 헤더가 아니라 credentials 로 보낸다
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
  fallback: string = "/",
) => {
  const refreshToken = useRefreshToken();

  return useQuery<T>({
    queryKey: key,
    enabled,
    queryFn: async () => {
      const makeRequest = async () => {
        return await fetch(`${baseURL}/${url}`, {
          credentials: "include",
        });
      };

      let response = await makeRequest();

      // access 만료(401) → refresh → 같은 요청 1회 재시도.
      // refresh 도 실패하면 세션이 끝난 것이므로 fallback 으로 보낸다
      if (response.status === 401) {
        const ok = await refreshToken();
        if (!ok) {
          window.location.href = fallback;
          return;
        }
        response = await makeRequest();
      }

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`API 오류 ${response.status}: ${text}`);
      }
      const json = (await response.json()) as BaseResponse<T>;

      if (!json.success) {
        throw new Error(json.message || "API Error");
      }

      return json.data;
    },
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    // 5분간은 캐시를 신선한 것으로 보고 재요청하지 않는다.
    // 페이지·필터 전환 시 이전 데이터를 유지해 깜빡임을 줄인다(keepPreviousData)
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
 * @template TResponse 응답 데이터 타입
 * @template TRequest 요청 바디 타입 (object, FormData, void)
 * @template TError 에러 타입 (기본: { status?: number; message?: string })
 *
 * @param url API endpoint
 * @param fallback refresh token 갱신 실패 시 돌아갈 url
 *
 * @example
 * // JSON Body 요청
 * const createUser = usePost<UserResponse, { name: string; email: string }>("/users");
 * createUser.mutate({ name: "홍길동", email: "hong@example.com" });
 *
 * @example
 * // FormData 요청 (파일 업로드)
 * const uploadFile = usePost<{ url: string }, FormData>("/upload");
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
  TError = { status?: number; message?: string },
>(
  url: string,
  fallback: string = "/",
) => {
  const refreshToken = useRefreshToken();

  return useMutation<TResponse, TError, TRequest>({
    mutationFn: async (body: TRequest) => {
      const headers: HeadersInit = {};
      let fetchBody: BodyInit;

      if (body instanceof FormData) {
        // FormData 는 브라우저가 boundary 포함 Content-Type 을 직접 넣어야 하므로 헤더를 비워 둔다
        fetchBody = body;
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
          throw new Error("세션 만료");
        }
        response = await makeRequest();
      }

      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = null;
        }
        throw {
          status: response.status,
          message: errorData?.message || errorText || "Something went wrong",
        } as TError;
      }

      // 204, 205 등 No Content 응답일 경우 안전하게 처리
      if (response.status === 204 || response.status === 205) {
        return null as unknown as TResponse;
      }

      const json = (await response.json()) as BaseResponse<TResponse>;

      if (!json.success) {
        throw {
          status: response.status,
          message: json.message || "API Error",
        } as TError;
      }

      return json.data;
    },
  });
};

/** PATCH 요청 훅. 401 갱신·재시도 동작은 usePost 와 같다 */
export const usePatch = <
  TResponse,
  TRequest extends object | void = void,
  TError = { status?: number; message?: string },
>(
  url: string,
  fallback: string = "/",
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
        if (!ok) { window.location.href = fallback; throw new Error("세션 만료"); }
        response = await makeRequest();
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw { status: response.status, message: errorData?.message || "Error" } as TError;
      }

      if (response.status === 204) return null as unknown as TResponse;
      const json = (await response.json()) as BaseResponse<TResponse>;
      if (!json.success) throw { status: response.status, message: json.message } as TError;
      return json.data;
    },
  });
};

/** DELETE 요청 훅. 401 갱신·재시도 동작은 usePost 와 같다 */
export const useDelete = <
  TResponse = void,
  TError = { status?: number; message?: string },
>(
  url: string,
  fallback: string = "/",
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
        if (!ok) { window.location.href = fallback; throw new Error("세션 만료"); }
        response = await makeRequest();
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw { status: response.status, message: errorData?.message || "Error" } as TError;
      }

      if (response.status === 204) return null as unknown as TResponse;
      const json = (await response.json()) as BaseResponse<TResponse>;
      if (!json.success) throw { status: response.status, message: json.message } as TError;
      return json.data;
    },
  });
};

/**
 * 스트리밍 응답(chunked text)을 읽어 onChunk 로 조각을 넘기는 훅.
 * AbortController 로 진행 중인 스트림을 중간에 끊을 수 있다
 */
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
      if (err.name === "AbortError") {
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
