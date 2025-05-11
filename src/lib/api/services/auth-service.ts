import { apiClient } from "../api-client";
import {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  AuthUser,
} from "../types/auth";

class AuthService {
  private BASE_URL = "/auth";

  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>(
      `${this.BASE_URL}/login`,
      data
    );

    if (response.accessToken && typeof window !== "undefined") {
      localStorage.setItem("auth_token", response.accessToken);
    }

    return response;
  }

  async register(data: RegisterRequest): Promise<AuthUser> {
    return await apiClient.post<AuthUser>(`${this.BASE_URL}/register`, data);
  }

  async getCurrentUser(): Promise<AuthUser> {
    return await apiClient.get<AuthUser>(`${this.BASE_URL}/me`);
  }

  async logout(): Promise<void> {
    await apiClient.post(`${this.BASE_URL}/logout`);

    if (typeof window !== "undefined") {
      localStorage.removeItem("auth_token");
    }
  }

  isAuthenticated(): boolean {
    if (typeof window !== "undefined") {
      return !!localStorage.getItem("auth_token");
    }
    return false;
  }

  async forgotPassword(email: string): Promise<void> {
    await apiClient.post("/auth/forgot-password", { email });
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    await apiClient.post("/auth/reset-password", { token, newPassword });
  }
}

export const authService = new AuthService();
