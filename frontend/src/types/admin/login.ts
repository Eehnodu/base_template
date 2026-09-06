export interface LoginRequest {
  email: string;
  password: string;
  type: string;
}

export interface LoginResponse {
  code: string;
  message: string;
}
