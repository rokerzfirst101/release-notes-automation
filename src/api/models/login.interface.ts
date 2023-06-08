export interface LoginRequest {
  name: string
  email: string
  profileUrl: string
  token: string
  timezone: string
  domain: string
}

export interface LoginResponse {
  token: string
}
