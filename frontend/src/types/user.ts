// user_info 토큰 타입
// 백엔드 auth_token.py 가 {user_|admin_}user_info 쿠키에 담는 값
export interface UserInfo {
  auth_type: "user" | "admin";
  id: number;
  user_nickname: string;
  created_at: string | null;
}

// /me 호출 시 넘어오는 데이터 
export interface UserDetail {
  name: string;
  profile_image: string;
}
