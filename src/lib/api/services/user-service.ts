import { apiClient } from "../api-client";
import {
  User,
  CreateUserRequest,
  UpdateUserRequest,
  UserFilters,
} from "../types/users";

class UserService {
  private BASE_URL = "/users";

  async getAll(
    filters?: UserFilters
  ): Promise<{ docs: User[]; total: number }> {
    return await apiClient.get<{ docs: User[]; total: number }>(this.BASE_URL, {
      params: filters,
    });
  }

  async getById(id: string): Promise<User> {
    return await apiClient.get<User>(`${this.BASE_URL}/${id}`);
  }

  async getByEmail(email: string): Promise<User> {
    return await apiClient.get<User>(`${this.BASE_URL}/email/${email}`);
  }

  async create(data: CreateUserRequest): Promise<User> {
    return await apiClient.post<User>(this.BASE_URL, data);
  }

  async update(id: string, data: UpdateUserRequest): Promise<User> {
    return await apiClient.put<User>(`${this.BASE_URL}/${id}`, data);
  }

  async delete(id: string): Promise<void> {
    await apiClient.delete<void>(`${this.BASE_URL}/${id}`);
  }

  async updateRole(id: string, role: string): Promise<User> {
    return await apiClient.patch<User>(`${this.BASE_URL}/${id}/role`, { role });
  }
}

export const userService = new UserService();
