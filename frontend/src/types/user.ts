// user_info 쿠키(base64 JSON)를 디코드한 형태. 서버 AuthToken.create_jwt_token 의 session_info 와 맞춘다
export interface UserInfo {
  auth_type: string;
  id: number;
  name: string;
  created_at: string;
}

// /me 호출 시 넘어오는 데이터
export interface UserDetail {
  name: string;
  profile_image: string;
}
