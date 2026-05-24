export interface LoginResponse {
  token: string;
  displayName: string;
  expiresAt: string;
}

export interface UserInfoResponse {
  id: string;
  username: string;
  displayName: string;
}
