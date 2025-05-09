export enum Role {
  ADMIN = "ADMIN",
  TABLE = "TABLE",
  USER = "USER",
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  firstName?: string;
  lastName?: string;
  role: Role;
  createdAt: string;
  updatedAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  name: string;
  password: string;
  firstName?: string;
  lastName?: string;
  role?: Role;
}

export interface AuthResponse {
  accessToken: string;
  user: AuthUser;
}

export interface Manager {
  id: string;
  name: string;
  email: string;
  role: string;
}
