import { apiClient } from "../api-client";
import {
  CreateSessionRequest,
  ISession as Session,
  SessionFilters,
  UpdateSessionRequest,
} from "../types/sessions";

class SessionService {
  private BASE_URL = "/sessions";

  async getAll(filters?: SessionFilters): Promise<Session[]> {
    return await apiClient.get<Session[]>(this.BASE_URL, { params: filters });
  }

  async getById(id: string): Promise<Session> {
    return await apiClient.get<Session>(`${this.BASE_URL}/${id}`);
  }

  async create(data: CreateSessionRequest): Promise<Session> {
    return await apiClient.post<Session>(this.BASE_URL, data);
  }

  async update(id: string, data: UpdateSessionRequest): Promise<Session> {
    return await apiClient.patch<Session>(`${this.BASE_URL}/${id}`, data);
  }

  async end(id: string): Promise<Session> {
    return await apiClient.put<Session>(`${this.BASE_URL}/${id}/end`, {});
  }

  async getActiveSession(): Promise<Session | null> {
    try {
      return await apiClient.get<Session>(`${this.BASE_URL}/active`);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      // If no active session is found, return null
      return null;
    }
  }
}

export const sessionService = new SessionService();
