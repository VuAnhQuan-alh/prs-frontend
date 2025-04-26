import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
} from "axios";

// Error class for API errors
export class ApiError extends Error {
  public statusCode: number;
  public data?: unknown;

  constructor(statusCode: number, message: string, data?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.data = data;
    this.name = "ApiError";
  }
}

// Interface for API response format
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  metadata?: {
    timestamp: string;
    requestId: string;
  };
}

// Creating the Axios client instance
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Request interceptor
    this.client.interceptors.request.use((config) => {
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("auth_token")
          : null;

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      return config;
    });

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response) {
          const status = error.response.status;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const data = error.response.data as any;

          // Handle 401 Unauthorized or token expiration
          if (status === 401) {
            // Clear local storage
            if (typeof window !== "undefined") {
              localStorage.removeItem("auth_token");
            }

            // Redirect to login page if client-side
            if (typeof window !== "undefined") {
              window.location.href = "/auth/register";
            }
          }

          const message = data?.error?.message || "Something went wrong";
          return Promise.reject(new ApiError(status, message, data));
        }

        return Promise.reject(
          new ApiError(500, error.message || "Network error")
        );
      }
    );
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<ApiResponse<T>>(url, config);
    return this.handleResponse<T>(response);
  }

  async post<T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response = await this.client.post<ApiResponse<T>>(url, data, config);
    return this.handleResponse<T>(response);
  }

  async put<T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response = await this.client.put<ApiResponse<T>>(url, data, config);
    return this.handleResponse<T>(response);
  }

  async patch<T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response = await this.client.patch<ApiResponse<T>>(url, data, config);
    return this.handleResponse<T>(response);
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete<ApiResponse<T>>(url, config);
    return this.handleResponse<T>(response);
  }

  private handleResponse<T>(response: AxiosResponse<ApiResponse<T>>): T {
    const apiResponse = response.data;

    if (!apiResponse.success) {
      throw new ApiError(
        response.status,
        apiResponse.error?.message || "Request failed",
        apiResponse.error
      );
    }

    return apiResponse.data as T;
  }
}

export const apiClient = new ApiClient();
